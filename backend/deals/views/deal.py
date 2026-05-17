"""
deals/views.py
DRF API views for the PE Deals app.

URL namespace: api/deals/  (GP & public)
              api/entrepreneur/  (Entrepreneur portal)
              api/lp/            (LP portal)
              api/gp-investor/   (GP Investor portal)
"""
import logging
import mimetypes
from datetime import date, timedelta
from decimal import Decimal
from django.db import transaction

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from django.http import FileResponse
from django.urls import reverse
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.mail import send_mail
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt
from rest_framework import generics, permissions, status, viewsets, parsers
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action

from deals.b2_utils import generate_presigned_upload_url, generate_presigned_download_url
from deals.models import (
    Fund,
    FundDocument,
    CapitalCall,
    Distribution,
    ImmutableAuditEvent,
    LPDocumentAccess,
    LPFundCommitment,
    LPProfile,
    LPKYCDocument,
    PEFormTemplate,
    PEInvestment,
    PEProject,
    PEProjectDocument,
    PEProjectFormResponse,
    RedFlagFinding,
    ScoringRun,
    CriterionScore,
    ComplianceGate,
    ValuationModel,
    DCFAssumptions,
    LBOAssumptions,
    RegulatoryChecklist,
    SEBONFilingDeadline,
    DealMemo,
    PortfolioKPIReport,
    EntrepreneurKYBDocument,
    GovernanceProposal,
    ProposalVote,
    ManagementFeeAccrual,
    IRDocument,
    GPShareholder,
    WaterfallModel,
    WaterfallRun,
    ValuationRecord,
    ExitScenario,
    ExtractedFinancials,
    QoEReport,
    TermSheet,
    SPADraft,
    LPSupportRequest,
)






from deals.permissions import (
    IsEntrepreneurRole,
    IsGPInvestorRole,
    IsGPStaff,
    IsLPRole,
    IsDealAccessible,
    IsSuperAdminRole,
)
from deals.signals import _log_audit_event
from deals.serializers import (
    DocumentUploadRequestSerializer,
    FundDocumentSerializer,
    FundSerializer,
    GPInviteSerializer,
    GPInvestorDashboardSerializer,
    ImmutableAuditEventSerializer,
    LPDashboardFundSerializer,
    LPFundCommitmentSerializer,
    LPPortfolioSerializer,
    LPProfileSerializer,
    LPKYCDocumentSerializer,
    PEFormTemplateSerializer,
    PEInvestmentSerializer,
    PEProjectDetailSerializer,
    PEProjectDocumentSerializer,
    PEProjectFormResponseSerializer,
    PEProjectListSerializer,
    PEProjectStatusUpdateSerializer,
    ExtractedFinancialsSerializer,
    QoEReportSerializer,
    CommercialAnalysisSerializer,
    OperationalAnalysisSerializer,
    RedFlagFindingSerializer,
    ScoringRunSerializer,
    CriterionScoreSerializer,
    ComplianceGateSerializer,
    ValuationModelSerializer,
    DCFAssumptionsSerializer,
    LBOAssumptionsSerializer,
    RegulatoryChecklistSerializer,
    SEBONFilingDeadlineSerializer,
    DealMemoSerializer,
    PortfolioKPIReportSerializer,
    WaterfallModelSerializer,
    WaterfallRunSerializer,
    ValuationRecordSerializer,
    ExitScenarioSerializer,
    IPOEligibilitySerializer,
    EntrepreneurKYBDocumentSerializer,
    IRDocumentSerializer,
    GovernanceProposalSerializer,
    ProposalVoteSerializer,
    TermSheetSerializer,
    SPADraftSerializer,
    CapitalCallSerializer,
    LPSupportRequestSerializer,
)

from deals.valuation import calculate_dcf, calculate_lbo
from deals.ipo_eligibility import check_ipo_eligibility


from deals.tasks import (

    extract_financials_from_document, 
    run_qoe_analysis,
    run_commercial_analysis,
    run_operational_analysis,
    run_nepal_compliance_check,
    generate_memo_draft,
    run_finlo_scoring,
    scan_legal_document,
    run_full_analysis
)


# ---------------------------------------------------------------------------
# LP Performance Helpers
# ---------------------------------------------------------------------------

from .helpers import _get_client_ip, get_deal_for_user

from deals.tasks import generate_ai_spa_draft, generate_ai_term_sheet

User = get_user_model()

def _get_or_create_entrepreneur(email: str) -> tuple[User, bool]:
    """
    Return (user, created). If user doesn't exist, create with entrepreneur role.
    A random unusable password is set; they must use invite flow to set password.
    """
    try:
        user = User.objects.get(email=email)
        # Ensure entrepreneur role is present
        role_list = user.role_list
        if 'entrepreneur' not in role_list:
            role_list.append('entrepreneur')
            user.roles = ','.join(role_list)
            user.save(update_fields=['roles'])
        return user, False
    except User.DoesNotExist:
        username = email.split('@')[0]
        base = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f'{base}{counter}'
            counter += 1
        user = User.objects.create_user(
            username=username,
            email=email,
            roles='entrepreneur',
            is_active=True,
        )
        user.set_unusable_password()
        user.save()
        return user, True


def sync_project_fields_from_responses(project):
    """
    Syncs key form response fields (like sector, deal_type, and investment amounts)
    from the multi-step responses back to the core PEProject model fields so they
    are saved in the database and visible in the GP overview.
    """
    try:
        overview_resp = project.form_responses.filter(step_name='deal_overview').first()
        if overview_resp:
            data = overview_resp.response_data
            dirty = False
            
            sector_val = data.get('sector')
            if sector_val:
                project.sector = sector_val
                dirty = True
                
            deal_type_val = data.get('deal_type')
            if deal_type_val:
                project.deal_type = deal_type_val
                dirty = True
                
            min_val = data.get('investment_amount_min_npr')
            if min_val is not None:
                try:
                    project.investment_range_min_npr = Decimal(str(min_val))
                    dirty = True
                except:
                    pass
                
            max_val = data.get('investment_amount_max_npr')
            if max_val is not None:
                try:
                    project.investment_range_max_npr = Decimal(str(max_val))
                    dirty = True
                except:
                    pass
                
            if dirty:
                project.save()
    except Exception as e:
        import logging
        logging.getLogger('django').error(f"Error syncing project fields: {e}")


# ---------------------------------------------------------------------------
# 1. GP – Create Entrepreneur Invitation
# ---------------------------------------------------------------------------


class GPCreateInviteView(APIView):
    """
    POST /api/deals/projects/invite/
    GP creates a PEProject and sends an invitation to an entrepreneur.
    Permission: IsGPStaff
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request):
        logger.info(f"Invite request received: {request.data}")
        serializer = GPInviteSerializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Invite validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data

        fund: Fund = data['fund_id']  # already the Fund instance (validated)
        entrepreneur_email: str = data['entrepreneur_email']

        # Get or create entrepreneur user
        entrepreneur, _created = _get_or_create_entrepreneur(entrepreneur_email)

        # Get or create the PE project based on registration number
        project, created = PEProject.objects.get_or_create(
            ocr_registration_number=data['ocr_registration_number'],
            defaults={
                'fund': fund,
                'legal_name': data['legal_name'],
                'deal_type': data['deal_type'],
                'sector': data.get('sector', PEProject.Sector.OTHER),
                'investment_range_min_npr': data.get('investment_range_min_npr'),
                'investment_range_max_npr': data.get('investment_range_max_npr'),
                # Start in PENDING_SUBMISSION — flips to SUBMITTED only when
                # the entrepreneur completes and finalizes the form.
                'status': PEProject.Status.PENDING_SUBMISSION,
                'submission_type': PEProject.SubmissionType.ENTREPRENEUR_INVITED,
                'entrepreneur_user': entrepreneur,
                'created_by': request.user,
            }
        )

        if not created:
            # Update fields if it already exists to ensure it's now an invited project
            project.entrepreneur_user = entrepreneur
            project.submission_type = PEProject.SubmissionType.ENTREPRENEUR_INVITED
            # We might also want to update the fund or other details if they changed
            project.fund = fund
            project.legal_name = data['legal_name']
            project.deal_type = data['deal_type']
            project.save()
        
        # Signal handles token generation + email sending

        return Response(
            PEProjectDetailSerializer(project).data,
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# GP Fund Document Management
# ---------------------------------------------------------------------------


class GPFundDocumentView(generics.ListCreateAPIView):
    """
    GP management of documents for a specific fund.
    POST /api/deals/funds/<fund_id>/documents/
    GET /api/deals/funds/<fund_id>/documents/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = FundDocumentSerializer

    def get_queryset(self):
        fund_id = self.kwargs.get('fund_id')
        return FundDocument.objects.filter(fund_id=fund_id)

    def perform_create(self, serializer):
        fund = get_object_or_404(Fund, pk=self.kwargs.get('fund_id'))
        doc = serializer.save(fund=fund, uploaded_by=self.request.user)
        
        _log_audit_event(
            ImmutableAuditEvent.EventType.DOCUMENT_UPLOADED,
            doc,
            actor=self.request.user,
            payload={'fund': str(fund.pk), 'type': doc.document_type}
        )



class GPFundGetUploadURLView(APIView):
    """
    POST /api/deals/funds/{fund_id}/get-upload-url/
    Permission: IsGPStaff
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, fund_id):
        get_object_or_404(Fund, pk=fund_id)
        serializer = DocumentUploadRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            # We use a 'funds' prefix in B2 for organization
            presign = generate_presigned_upload_url(
                project_id=f"funds/{fund_id}",
                filename=d['filename'],
                content_type=d.get('content_type'),
            )
            return Response({
                'url': presign['url'],
                'file_key': presign['file_key'],
                'content_type': presign['content_type'],
            })
        except Exception as exc:
            return Response({'detail': str(exc)}, status=502)



class GPFundUploadLocalView(APIView):
    """
    POST /api/deals/funds/{fund_id}/upload-local/
    Direct multipart upload to local storage for GP staff (Funds).
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, fund_id):
        fund = get_object_or_404(Fund, pk=fund_id)
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response({'detail': 'No file uploaded.'}, status=400)
        
        # 50MB Size Limit for fund documents
        if file_obj.size > 50 * 1024 * 1024:
            return Response({'detail': 'File size exceeds the 50MB limit.'}, status=400)

        # Save the file to Django's standard media storage under 'fund_docs/' folder
        from django.core.files.storage import default_storage
        file_name = default_storage.save(f'fund_docs/{fund_id}/{file_obj.name}', file_obj)
        file_url = default_storage.url(file_name)

        return Response({
            'file_key': file_name,
            'file_name': file_obj.name,
            'file_size': file_obj.size,
            'content_type': file_obj.content_type,
            'url': file_url
        }, status=status.HTTP_201_CREATED)




class GPFundDocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Update/Delete specific fund document.
    PATCH /api/deals/funds/documents/<doc_id>/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = FundDocumentSerializer
    queryset = FundDocument.objects.all()
    lookup_url_kwarg = 'doc_id'

    def perform_update(self, serializer):
        is_publishing = 'is_published' in self.request.data and self.request.data['is_published']
        if is_publishing:
            serializer.save(publish_date=timezone.now())
        else:
            serializer.save()


# ---------------------------------------------------------------------------
# LP Portal - Documents & Portfolio
# ---------------------------------------------------------------------------


class LPDocumentListView(generics.ListAPIView):
    """
    List published documents for all funds the LP is committed to.
    GET /api/lp/documents/
    """
    permission_classes = [permissions.IsAuthenticated, IsLPRole]
    serializer_class = FundDocumentSerializer

    def get_queryset(self):
        try:
            lp_profile = self.request.user.lp_profile
        except AttributeError:
            return FundDocument.objects.none()
        except LPProfile.DoesNotExist:
            return FundDocument.objects.none()
            
        fund_ids = lp_profile.fund_commitments.values_list('fund_id', flat=True)
        return FundDocument.objects.filter(
            fund_id__in=fund_ids,
            is_published=True
        ).order_by('-publish_date')



class LPDocumentDownloadView(APIView):
    """
    Generate pre-signed download URL for a fund document.
    GET /api/lp/documents/<doc_id>/download/
    """
    permission_classes = [permissions.IsAuthenticated, IsLPRole]

    def get(self, request, doc_id):
        lp_profile = request.user.lp_profile
        doc = get_object_or_404(FundDocument, pk=doc_id, is_published=True)
        
        # Verify access: LP must be committed to this fund
        if not lp_profile.fund_commitments.filter(fund=doc.fund).exists():
            raise PermissionDenied("You do not have access to this fund's documents.")

        # Log access
        LPDocumentAccess.objects.update_or_create(
            lp_profile=lp_profile,
            document=doc,
            defaults={'ip_address': _get_client_ip(request)}
        )

        url = generate_presigned_download_url(file_key=doc.file_key, filename=doc.file_name)
        return Response({'url': url})



class LPDocumentAcknowledgeView(APIView):
    """
    Acknowledge receipt/reading of a document.
    POST /api/lp/documents/<doc_id>/acknowledge/
    """
    permission_classes = [permissions.IsAuthenticated, IsLPRole]

    def post(self, request, doc_id):
        lp_profile = request.user.lp_profile
        doc = get_object_or_404(FundDocument, pk=doc_id, is_published=True)
        
        access, _ = LPDocumentAccess.objects.get_or_create(
            lp_profile=lp_profile,
            document=doc
        )
        access.acknowledged_at = timezone.now()
        access.ip_address = _get_client_ip(request)
        access.save()

        return Response({'status': 'acknowledged'})



class DocumentDownloadURLView(APIView):
    """
    GET /api/deals/documents/download-url/?key=...
    Permission: IsGPStaff or Entrepreneur (if they own it)
    """
    def get(self, request):
        file_key = request.query_params.get('key')
        if not file_key:
            return Response({'detail': 'Missing key'}, status=400)
        
        # Security check: ensure user has access to this project
        try:
            # Look up the document to see if it's local or B2
            doc = PEProjectDocument.objects.filter(file_key=file_key).first()
            if doc and doc.local_file:
                # Return the local serve URL instead of the raw media URL
                return Response({'url': request.build_absolute_uri(reverse('deals:document-serve', args=[doc.id]))})
            
            # Fallback to B2 presigned URL
            url = generate_presigned_download_url(file_key)
            return Response({'url': url})
        except Exception as exc:
            return Response({'detail': str(exc)}, status=500)



@method_decorator(xframe_options_exempt, name='dispatch')
class DocumentServeView(APIView):
    """
    GET /api/deals/documents/{id}/serve/
    Streams a local document. Handles PDF/Images inline and Office files as attachments.
    """
    permission_classes = [permissions.IsAuthenticated] # Adjust to IsGPStaff if needed

    def get(self, request, pk):
        from deals.permissions import IsGPStaff, IsDealAccessible
        doc = get_object_or_404(PEProjectDocument, pk=pk)
        
        # Security: check if user has access to the parent project
        project = doc.project
        if not (request.user.has_role('super_admin') or 
                project.created_by == request.user or 
                project.collaborators.filter(id=request.user.id).exists()):
             return Response({'detail': 'Access denied to this document.'}, status=403)

        # Determine MIME type
        mime_type = doc.mime_type
        if not mime_type and doc.local_file:
            mime_type, _ = mimetypes.guess_type(doc.local_file.path)
        mime_type = mime_type or 'application/octet-stream'

        # Hybrid Logic: PDF/Images inline, others (Office) as attachment
        inline_types = ['application/pdf', 'text/plain']
        is_inline = mime_type.startswith('image/') or mime_type in inline_types

        try:
            return FileResponse(
                doc.local_file.open('rb'),
                content_type=mime_type,
                as_attachment=not is_inline,
                filename=doc.filename
            )
        except Exception as e:
            return Response({'detail': str(e)}, status=404)



class DocumentDeleteView(APIView):
    """
    DELETE /api/deals/documents/{id}/
    Permission: IsGPStaff
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def delete(self, request, pk):
        from deals.b2_utils import delete_b2_object
        doc = get_object_or_404(PEProjectDocument, pk=pk)
        try:
            delete_b2_object(doc.file_key)
        except Exception:
            pass # Continue to delete record even if B2 delete fails (or log error)
        
        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# 2. Entrepreneur – Access via Invitation Token (public)
# ---------------------------------------------------------------------------


class EntrepreneurInviteDetailView(APIView):
    """
    GET /api/deals/projects/invite/{token}/
    Returns project info + current step form schema.
    No authentication required (token is the credential).
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        project = get_object_or_404(
            PEProject,
            invitation_token=token,
        )
        if not project.is_invitation_valid:
            return Response(
                {'detail': 'This invitation link has expired or is invalid.'},
                status=status.HTTP_410_GONE,
            )

        # Fetch the active form template
        template = PEFormTemplate.objects.filter(
            form_type=PEFormTemplate.FormType.DEAL_SUBMISSION,
            is_active=True,
        ).order_by('-version').first()

        next_step = None
        if template:
            steps = template.steps
            completed_index = project.form_step_completed
            if completed_index < len(steps):
                next_step = steps[completed_index]

        return Response({
            'project': PEProjectDetailSerializer(project).data,
            'template': PEFormTemplateSerializer(template).data if template else None,
            'next_step': next_step,
        })


# ---------------------------------------------------------------------------
# 3. Entrepreneur – Submit Form Step (token auth)
# ---------------------------------------------------------------------------


class EntrepreneurSubmitStepView(APIView):
    """
    POST /api/deals/projects/invite/{token}/step/{step_name}/
    Saves form response for the given step and advances form_step_completed.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, token, step_name):
        project = get_object_or_404(PEProject, invitation_token=token)
        if not project.is_invitation_valid:
            return Response(
                {'detail': 'Invitation expired.'},
                status=status.HTTP_410_GONE,
            )

        template = PEFormTemplate.objects.filter(
            form_type=PEFormTemplate.FormType.DEAL_SUBMISSION,
            is_active=True,
        ).order_by('-version').first()

        if not template:
            return Response(
                {'detail': 'No active form template found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Identify the step
        step_def = next(
            (s for s in template.steps if s.get('step_name') == step_name),
            None,
        )
        if not step_def:
            return Response(
                {'detail': f"Step '{step_name}' not found in template."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        step_index = step_def['step_index']

        required_fields = [f for f in step_def.get('fields', []) if f.get('required', False)]
        missing_required = []

        for field in required_fields:
            field_name = field.get('name')
            field_type = field.get('type')
            value = request.data.get(field_name)

            if field_type == 'file_upload':
                if not value or (isinstance(value, str) and not value.strip()):
                    missing_required.append(field.get('label', field_name))
            elif field_type in ('checkbox', 'bool'):
                if not value:
                    missing_required.append(field.get('label', field_name))
            elif value is None or (isinstance(value, str) and not value.strip()):
                missing_required.append(field.get('label', field_name))

        step_advancement_blocked = False
        if missing_required and project.form_step_completed <= step_index:
            step_advancement_blocked = True

        response_obj, _ = PEProjectFormResponse.objects.update_or_create(
            project=project,
            step_index=step_index,
            defaults={
                'step_name': step_name,
                'template': template,
                'response_data': request.data,
            },
        )

        sync_project_fields_from_responses(project)

        can_advance = not step_advancement_blocked
        if can_advance and project.form_step_completed < step_index:
            project.form_step_completed = step_index
            project.save(update_fields=['form_step_completed'])

        _log_audit_event(
            ImmutableAuditEvent.EventType.FORM_STEP_SAVED,
            project,
            actor=project.entrepreneur_user,
            payload={'step_name': step_name, 'step_index': step_index},
            request=request,
        )

        return Response({
            'status': 'saved',
            'step_completed': project.form_step_completed,
            'can_advance': can_advance,
            'missing_required': missing_required if step_advancement_blocked else []
        })


# ---------------------------------------------------------------------------
# 4. Entrepreneur – Document Upload (token auth)
# ---------------------------------------------------------------------------


class EntrepreneurGetUploadURLView(APIView):
    """
    POST /api/deals/projects/invite/{token}/get-upload-url/
    Returns a pre-signed B2 upload URL and creates a pending document record.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, token):
        project = get_object_or_404(PEProject, invitation_token=token)
        if not project.is_invitation_valid:
            return Response(
                {'detail': 'Invitation expired.'},
                status=status.HTTP_410_GONE,
            )

        serializer = DocumentUploadRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            presign = generate_presigned_upload_url(
                project_id=str(project.pk),
                filename=d['filename'],
                content_type=d.get('content_type'),
            )
        except Exception as exc:
            logger.error("B2 presign failed: %s", exc)
            return Response(
                {'detail': 'Could not generate upload URL.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Create a pending document record
        doc = PEProjectDocument.objects.create(
            project=project,
            file_key=presign['file_key'],
            filename=d['filename'],
            file_size=d['file_size'],
            mime_type=d.get('content_type', 'application/octet-stream'),
            category=d['category'],
            uploaded_by=project.entrepreneur_user,
            is_confirmed=False,
        )

        return Response({
            'url': presign['url'],
            'file_key': presign['file_key'],
            'document_id': doc.id,
            'content_type': presign['content_type'],
        }, status=status.HTTP_201_CREATED)



class EntrepreneurInviteUploadLocalView(APIView):
    """
    POST /api/deals/projects/invite/{token}/upload-local/
    Direct multipart upload to local storage for public invite flow.
    """
    permission_classes = [permissions.AllowAny]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, token):
        project = get_object_or_404(PEProject, invitation_token=token)
        if not project.is_invitation_valid:
            return Response({'detail': 'Invitation expired.'}, status=status.HTTP_410_GONE)
            
        file_obj = request.FILES.get('file')
        category = request.data.get('document_type', 'OTHER')

        if not file_obj:
            return Response({'detail': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if file_obj.size > 3 * 1024 * 1024:
            return Response({'detail': 'File size exceeds 3MB limit.'}, status=status.HTTP_400_BAD_REQUEST)

        doc = PEProjectDocument.objects.create(
            project=project,
            category=category,
            filename=file_obj.name,
            file_key=f"local/{project.id}/{file_obj.name}",
            mime_type=file_obj.content_type,
            file_size=file_obj.size,
            local_file=file_obj,
            uploaded_by=project.entrepreneur_user,
            is_confirmed=True,
        )

        return Response({
            'document_id': doc.id,
            'filename': doc.filename,
            'url': doc.local_file.url
        }, status=status.HTTP_201_CREATED)



class DocumentConfirmView(APIView):
    """
    POST /api/deals/projects/.../documents/{id}/confirm/
    Marks a document as successfully uploaded.
    """
    def post(self, request, *args, **kwargs):
        doc_id = kwargs.get('doc_id')
        token = kwargs.get('token')
        project_id = kwargs.get('project_id')

        if token:
            project = get_object_or_404(PEProject, invitation_token=token)
            doc = get_object_or_404(PEProjectDocument, pk=doc_id, project=project)
        else:
            project = get_deal_for_user(request, pk=project_id)
            # Permission check: Either GP Staff or the project's entrepreneur
            is_gp = any(r in ('admin', 'super_admin') for r in request.user.role_list)
            is_owner = (project.entrepreneur_user == request.user)
            
            if not (is_gp or is_owner):
                 raise PermissionDenied()
            
            doc = get_object_or_404(PEProjectDocument, pk=doc_id, project=project)

        doc.is_confirmed = True
        doc.save(update_fields=['is_confirmed'])

        _log_audit_event(
            ImmutableAuditEvent.EventType.DOCUMENT_UPLOADED,
            doc,
            actor=request.user if request.user.is_authenticated else project.entrepreneur_user,
            payload={
                'filename': doc.filename,
                'category': doc.category,
                'file_key': doc.file_key,
            },
            request=request,
        )

        return Response({'status': 'confirmed'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# 5. Entrepreneur – Finalize / Submit
# ---------------------------------------------------------------------------


class EntrepreneurFinalizeView(APIView):
    """
    POST /api/deals/projects/invite/{token}/submit/
    Sets submitted_at, status=SUBMITTED, notifies GP.
    Validates all required fields before allowing final submission.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, token):
        project = get_object_or_404(PEProject, invitation_token=token)
        if not project.is_invitation_valid:
            return Response(
                {'detail': 'Invitation expired.'},
                status=status.HTTP_410_GONE,
            )
        if project.submitted_at:
            return Response(
                {'detail': 'This project has already been submitted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        template = PEFormTemplate.objects.filter(
            form_type=PEFormTemplate.FormType.DEAL_SUBMISSION,
            is_active=True,
        ).order_by('-version').first()

        if not template:
            return Response({'detail': 'No active form template found.'}, status=404)

        saved_responses = {
            r.step_index: r.response_data
            for r in PEProjectFormResponse.objects.filter(project=project)
        }

        all_missing = []

        for step in template.steps:
            step_index = step.get('step_index')
            step_data = saved_responses.get(step_index, {})

            for field in step.get('fields', []):
                if not field.get('required', False):
                    continue

                field_name = field.get('name')
                field_type = field.get('type')
                field_label = field.get('label', field_name)
                value = step_data.get(field_name)

                is_missing = False
                if field_type == 'file_upload':
                    if not value or (isinstance(value, str) and not value.strip()):
                        is_missing = True
                elif field_type in ('checkbox', 'bool'):
                    if not value:
                        is_missing = True
                elif value is None or (isinstance(value, str) and not value.strip()):
                    is_missing = True

                if is_missing:
                    all_missing.append({
                        'step': step.get('title'),
                        'step_index': step_index,
                        'field': field_name,
                        'label': field_label,
                        'type': field_type
                    })

        if all_missing:
            return Response({
                'detail': 'Please complete all required fields before finalizing.',
                'missing_required': all_missing,
            }, status=400)

        sync_project_fields_from_responses(project)
        project.submitted_at = timezone.now()
        project.status = PEProject.Status.SUBMITTED
        project.save(update_fields=['submitted_at', 'status', 'updated_at'])

        try:
            _notify_gp_submission(project)
        except Exception as exc:
            logger.warning("GP notification failed: %s", exc)

        return Response(
            {'detail': 'Project submitted successfully.', 'submitted_at': project.submitted_at},
            status=status.HTTP_200_OK,
        )



def _notify_gp_submission(project: PEProject):
    """Send email to all admin/super_admin users when a project is submitted."""
    from django.core.mail import send_mail

    gp_emails = list(
        User.objects.filter(
            is_active=True,
            roles__in=['admin', 'super_admin'],
        ).values_list('email', flat=True)
    )
    # roles is comma-separated, so filter differently
    all_admins = User.objects.filter(is_active=True)
    gp_emails = [
        u.email for u in all_admins
        if any(r in ('admin', 'super_admin') for r in u.role_list)
    ]

    if gp_emails:
        send_mail(
            subject=f'[Finlogic PE] New deal submitted: {project.legal_name}',
            message=(
                f'The deal "{project.legal_name}" has been submitted by '
                f'{project.entrepreneur_user.email if project.entrepreneur_user else "an entrepreneur"}.\n\n'
                f'Review it in the admin: {getattr(settings, "FRONTEND_BASE_URL", "")}/gp/deals/{project.pk}/'
            ),
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@finlogiccapital.com'),
            recipient_list=gp_emails,
            fail_silently=True,
        )


# ---------------------------------------------------------------------------
# 6. Entrepreneur Dashboard
# ---------------------------------------------------------------------------


class EntrepreneurSubmissionsListView(generics.ListAPIView):
    """
    GET /api/entrepreneur/submissions/
    Lists PEProjects where entrepreneur_user == request.user.
    Permission: IsEntrepreneurRole
    """
    serializer_class = PEProjectListSerializer
    permission_classes = [permissions.IsAuthenticated, IsEntrepreneurRole]

    def get_queryset(self):
        return PEProject.objects.filter(
            entrepreneur_user=self.request.user
        ).select_related('fund')



class EntrepreneurSubmissionDetailView(generics.RetrieveAPIView):
    """
    GET /api/entrepreneur/submissions/{id}/
    Detail with form responses and document progress.
    Permission: IsEntrepreneurRole (own projects only)
    """
    serializer_class = PEProjectDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsEntrepreneurRole]

    def get_queryset(self):
        return PEProject.objects.filter(
            entrepreneur_user=self.request.user
        ).select_related('fund', 'entrepreneur_user', 'created_by')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        project_data = self.get_serializer(instance).data

        # Attach active template first (needed for field type lookup below)
        template = PEFormTemplate.objects.filter(
            form_type=PEFormTemplate.FormType.DEAL_SUBMISSION,
            is_active=True,
        ).order_by('-version').first()
        project_data['active_template'] = PEFormTemplateSerializer(template).data if template else None

        # Load raw DB form responses
        responses = PEProjectFormResponse.objects.filter(project=instance).order_by('step_index')
        form_responses_data = list(PEProjectFormResponseSerializer(responses, many=True).data)

        # ── Step 1: Scrub stale doc IDs ─────────────────────────────────────
        # Build the set of doc IDs that actually exist and are confirmed on this
        # project. Any file_upload field value that isn't in this set is stale
        # (e.g. from a deleted/overwritten upload) and must be cleared so the
        # FileUploader shows "idle" instead of a false "Upload Complete".
        confirmed_doc_ids_str = set(
            str(doc_id) for doc_id in
            PEProjectDocument.objects
            .filter(project=instance, is_confirmed=True)
            .values_list('id', flat=True)
        )

        if template:
            # Build field_name → type lookup across ALL steps
            field_type_map = {}
            for step in template.steps:
                for field in step.get('fields', []):
                    field_type_map[field['name']] = field.get('type')

            for resp in form_responses_data:
                cleaned = {}
                for key, val in resp.get('response_data', {}).items():
                    if field_type_map.get(key) == 'file_upload':
                        # Only keep the value if the document truly exists & confirmed
                        if val and str(val).strip() in confirmed_doc_ids_str:
                            cleaned[key] = val
                        # Stale ID → omit the key (field treated as empty)
                    else:
                        cleaned[key] = val
                resp['response_data'] = cleaned

        project_data['form_responses'] = form_responses_data

        # ── Step 2: Recalculate form_step_completed ──────────────────────────
        # The DB value may be inflated from before stricter validation was added.
        # We recompute based on cleaned response_data and update the DB if wrong.
        if template:
            cleaned_by_index = {r['step_index']: r['response_data'] for r in form_responses_data}
            effective_completed = 0

            for step in sorted(template.steps, key=lambda s: s.get('step_index', 0)):
                step_index = step.get('step_index', 0)
                
                # If there's no response record for this step, it means the user hasn't
                # explicitly completed it yet (even if all its fields are optional).
                if step_index not in cleaned_by_index:
                    break
                    
                step_data = cleaned_by_index.get(step_index, {})
                step_ok = True

                for field in step.get('fields', []):
                    if not field.get('required', False):
                        continue
                    field_name = field.get('name')
                    field_type = field.get('type')
                    value = step_data.get(field_name)

                    if field_type == 'file_upload':
                        if not value or str(value).strip() not in confirmed_doc_ids_str:
                            step_ok = False
                            break
                    elif field_type in ('checkbox', 'bool'):
                        if not value:
                            step_ok = False
                            break
                    elif value is None or (isinstance(value, str) and not value.strip()):
                        step_ok = False
                        break

                if step_ok:
                    effective_completed = step_index
                else:
                    # Stop at the first incomplete step
                    break

            # Persist the correction if the DB is out of sync
            if instance.form_step_completed != effective_completed:
                PEProject.objects.filter(pk=instance.pk).update(
                    form_step_completed=effective_completed
                )
                project_data['form_step_completed'] = effective_completed

        # ── Step 3: Auto-populate empty document fields ──────────────────────
        # Only fills fields that have NO DB-saved value, using only confirmed docs.
        # This gives a helpful pre-fill for brand-new sessions without faking state.
        if template:
            doc_step = next((s for s in template.steps if s.get('step_name') == 'documents'), None)
            if doc_step:
                idx = doc_step['step_index']
                resp_list = project_data['form_responses']
                existing_resp = next((r for r in resp_list if r['step_index'] == idx), None)

                db_saved_data = (existing_resp['response_data'] if existing_resp else {})
                suggested_data = db_saved_data.copy()
                all_confirmed_docs = instance.documents.filter(is_confirmed=True)

                changed = False
                for field in doc_step.get('fields', []):
                    f_name = field['name']
                    if not db_saved_data.get(f_name):
                        cat = field.get('category')
                        search_cats = [cat]
                        if cat == 'FINANCIAL': search_cats.append('FINANCIALS')
                        elif cat == 'FINANCIALS': search_cats.append('FINANCIAL')

                        match = all_confirmed_docs.filter(
                            category__in=search_cats
                        ).order_by('-uploaded_at').first()
                        if match:
                            suggested_data[f_name] = str(match.id)
                            changed = True

                if changed:
                    if existing_resp:
                        existing_resp['response_data'] = suggested_data
                    else:
                        resp_list.append({
                            'step_index': idx,
                            'step_name': 'documents',
                            'response_data': suggested_data
                        })

        return Response(project_data)



# ---------------------------------------------------------------------------
# 7. GP Endpoints
# ---------------------------------------------------------------------------


class GPProjectListView(generics.ListCreateAPIView):
    """
    GET /api/deals/projects/  - List deals
    POST /api/deals/projects/ - Create a manual deal
    Permission: IsGPStaff
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PEProjectDetailSerializer
        return PEProjectListSerializer

    def get_queryset(self):
        qs = PEProject.objects.select_related(
            'fund', 'entrepreneur_user', 'created_by'
        ).order_by('-created_at')

        # Filters
        params = self.request.query_params
        if status_filter := params.get('status'):
            if ',' in status_filter:
                qs = qs.filter(status__in=status_filter.split(','))
            else:
                qs = qs.filter(status=status_filter)
        if fund_id := params.get('fund_id'):
            qs = qs.filter(fund_id=fund_id)
        if deal_type := params.get('deal_type'):
            qs = qs.filter(deal_type=deal_type)
        if sector := params.get('sector'):
            qs = qs.filter(sector=sector)
        if search := params.get('search'):
            qs = qs.filter(legal_name__icontains=search)
        return qs

    def perform_create(self, serializer):
        # When GP creates manually, we set submission_type to MANUAL_GP
        serializer.save(
            created_by=self.request.user,
            submission_type=PEProject.SubmissionType.MANUAL_GP
        )



class GPProjectDetailView(generics.RetrieveUpdateAPIView):
    """
    GET /api/deals/projects/{id}/
    PATCH /api/deals/projects/{id}/
    Full project detail / Update workflow fields.
    Permission: IsGPStaff, IsDealAccessible
    """
    serializer_class = PEProjectDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff, IsDealAccessible]
    queryset = PEProject.objects.select_related('fund', 'entrepreneur_user', 'created_by')

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance = serializer.save()
        if old_status != instance.status:
            _log_audit_event(
                ImmutableAuditEvent.EventType.PROJECT_STATUS_CHANGED,
                instance,
                actor=self.request.user,
                payload={'old_status': old_status, 'new_status': instance.status},
                request=self.request,
            )



class GPProjectUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/deals/projects/{id}/
    Update status and other workflow fields.
    Permission: IsGPStaff, IsDealAccessible
    """
    serializer_class = PEProjectDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff, IsDealAccessible]
    queryset = PEProject.objects.all()
    http_method_names = ['patch']

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance = serializer.save()
        if old_status != instance.status:
            _log_audit_event(
                ImmutableAuditEvent.EventType.PROJECT_STATUS_CHANGED,
                instance,
                actor=self.request.user,
                payload={'old_status': old_status, 'new_status': instance.status},
                request=self.request,
            )



class GPProjectDocumentsView(generics.ListAPIView):
    """
    GET /api/deals/projects/{id}/documents/
    Permission: IsGPStaff
    """
    serializer_class = PEProjectDocumentSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get_queryset(self):
        project = get_deal_for_user(self.request, pk=self.kwargs['pk'])
        return PEProjectDocument.objects.filter(project=project, is_confirmed=True).order_by('-uploaded_at')



class GPProjectFormResponsesView(generics.ListAPIView):
    """
    GET /api/deals/projects/{id}/form-responses/
    Permission: IsGPStaff
    """
    serializer_class = PEProjectFormResponseSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get_queryset(self):
        project = get_deal_for_user(self.request, pk=self.kwargs['pk'])
        return PEProjectFormResponse.objects.filter(project=project).order_by('step_index')



class GPGetUploadURLView(APIView):
    """
    POST /api/deals/projects/{pk}/get-upload-url/
    Permission: IsGPStaff
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, project_id):
        project = get_deal_for_user(request, pk=project_id)
        serializer = DocumentUploadRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            presign = generate_presigned_upload_url(
                project_id=str(project.pk),
                filename=d['filename'],
                content_type=d.get('content_type'),
            )
        except Exception as exc:
            return Response({'detail': str(exc)}, status=502)

        doc = PEProjectDocument.objects.create(
            project=project,
            file_key=presign['file_key'],
            filename=d['filename'],
            file_size=d['file_size'],
            mime_type=d.get('content_type', 'application/octet-stream'),
            category=d['category'],
            uploaded_by=request.user,
            is_confirmed=False,
        )

        return Response({
            'url': presign['url'],
            'file_key': presign['file_key'],
            'document_id': doc.id,
            'content_type': presign['content_type'],
        })


# ---------------------------------------------------------------------------
# 8. LP Endpoints
# ---------------------------------------------------------------------------


class PEFormTemplateListView(generics.ListCreateAPIView):
    """GET/POST /api/deals/form-templates/"""
    serializer_class = PEFormTemplateSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    queryset = PEFormTemplate.objects.all()



class PEFormTemplateDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/deals/form-templates/{id}/"""
    serializer_class = PEFormTemplateSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    queryset = PEFormTemplate.objects.all()


# ---------------------------------------------------------------------------
# Authenticated Entrepreneur Form Submission (using Project ID instead of Token)
# ---------------------------------------------------------------------------


class EntrepreneurAuthSubmitStepView(APIView):
    """
    POST /api/entrepreneur/submissions/{project_id}/step/{step_name}/
    Saves form response for an authenticated entrepreneur.
    """
    permission_classes = [permissions.IsAuthenticated, IsEntrepreneurRole]

    def post(self, request, project_id, step_name):
        from django.utils import timezone
        project = get_deal_for_user(self.request, pk=project_id, entrepreneur_user=request.user)
        
        template = PEFormTemplate.objects.filter(
            form_type=PEFormTemplate.FormType.DEAL_SUBMISSION,
            is_active=True,
        ).order_by('-version').first()

        if not template:
            return Response({'detail': 'No active form template found.'}, status=404)

        step_def = next((s for s in template.steps if s.get('step_name') == step_name), None)
        if not step_def:
            return Response({'detail': f"Step '{step_name}' not found."}, status=400)

        required_fields = [f for f in step_def.get('fields', []) if f.get('required', False)]
        missing_required = []

        for field in required_fields:
            field_name = field.get('name')
            field_type = field.get('type')
            value = request.data.get(field_name)

            if field_type == 'file_upload':
                # Verify the document actually exists in the DB and is confirmed.
                # A non-empty string that doesn't match a real document is treated
                # as missing — this prevents stale IDs from bypassing validation.
                doc_valid = False
                if value and isinstance(value, str) and value.strip():
                    doc_valid = PEProjectDocument.objects.filter(
                        pk=value.strip(),
                        project=project,
                        is_confirmed=True,
                    ).exists()
                if not doc_valid:
                    missing_required.append(field.get('label', field_name))
            elif field_type in ('checkbox', 'bool'):
                if not value:
                    missing_required.append(field.get('label', field_name))
            elif value is None or (isinstance(value, str) and not value.strip()):
                missing_required.append(field.get('label', field_name))

        # Always block advancement when required fields are missing.
        step_advancement_blocked = bool(missing_required)

        response_obj, _ = PEProjectFormResponse.objects.update_or_create(
            project=project,
            step_index=step_def['step_index'],
            defaults={
                'step_name': step_name,
                'template': template,
                'response_data': request.data,
            }
        )

        can_advance = not step_advancement_blocked
        if can_advance and project.form_step_completed < step_def['step_index']:
            project.form_step_completed = step_def['step_index']
            project.save(update_fields=['form_step_completed'])
        elif step_advancement_blocked and project.form_step_completed >= step_def['step_index']:
            # Step was previously marked complete but now fails validation (e.g. stale doc IDs).
            # Roll back form_step_completed so the user cannot skip to later steps.
            project.form_step_completed = step_def['step_index'] - 1
            project.save(update_fields=['form_step_completed'])

        return Response({
            'status': 'saved',
            'step_completed': project.form_step_completed,
            'can_advance': can_advance,
            'missing_required': missing_required,
        })



class EntrepreneurAuthFinalizeView(APIView):
    """
    POST /api/entrepreneur/submissions/{project_id}/finalize/
    Finalizes the submission for an authenticated entrepreneur.
    Validates all required fields across all steps before allowing final submission.
    """
    permission_classes = [permissions.IsAuthenticated, IsEntrepreneurRole]

    def post(self, request, project_id):
        from django.utils import timezone
        project = get_deal_for_user(self.request, pk=project_id, entrepreneur_user=request.user)

        template = PEFormTemplate.objects.filter(
            form_type=PEFormTemplate.FormType.DEAL_SUBMISSION,
            is_active=True,
        ).order_by('-version').first()

        if not template:
            return Response({'detail': 'No active form template found.'}, status=404)

        saved_responses = {
            r.step_index: r.response_data
            for r in PEProjectFormResponse.objects.filter(project=project)
        }

        # Pre-fetch all confirmed document IDs for this project to avoid N+1 queries.
        confirmed_doc_ids = set(
            PEProjectDocument.objects
            .filter(project=project, is_confirmed=True)
            .values_list('id', flat=True)
        )
        # Convert UUIDs to strings for easy comparison with response_data values.
        confirmed_doc_ids_str = {str(doc_id) for doc_id in confirmed_doc_ids}

        all_missing = []

        for step in template.steps:
            step_index = step.get('step_index')
            step_data = saved_responses.get(step_index, {})

            for field in step.get('fields', []):
                if not field.get('required', False):
                    continue

                field_name = field.get('name')
                field_type = field.get('type')
                field_label = field.get('label', field_name)
                value = step_data.get(field_name)

                is_missing = False
                if field_type == 'file_upload':
                    # A field is only valid if the doc ID resolves to a real,
                    # confirmed document on this project. Stale / orphaned IDs
                    # from prior sessions are treated as missing.
                    if not value or str(value).strip() not in confirmed_doc_ids_str:
                        is_missing = True
                elif field_type in ('checkbox', 'bool'):
                    if not value:
                        is_missing = True
                elif value is None or (isinstance(value, str) and not value.strip()):
                    is_missing = True

                if is_missing:
                    all_missing.append({
                        'step': step.get('title'),
                        'step_index': step_index,
                        'field': field_name,
                        'label': field_label,
                        'type': field_type
                    })

        if all_missing:
            return Response({
                'detail': 'Please complete all required fields before finalizing.',
                'missing_required': all_missing,
            }, status=400)

        project.status = PEProject.Status.SUBMITTED
        project.submitted_at = timezone.now()
        project.save(update_fields=['status', 'submitted_at'])
        return Response({'status': 'finalized'})



class EntrepreneurAuthGetUploadURLView(APIView):
    """
    GET /api/entrepreneur/submissions/{project_id}/get-upload-url/?category=...&filename=...
    Get B2 presigned URL for an authenticated entrepreneur.
    """
    permission_classes = [permissions.IsAuthenticated, IsEntrepreneurRole]

    def post(self, request, project_id):
        from deals.b2_utils import generate_presigned_upload_url
        project = get_deal_for_user(self.request, pk=project_id, entrepreneur_user=request.user)
        
        serializer = DocumentUploadRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            presign = generate_presigned_upload_url(
                project_id=str(project.pk),
                filename=d['filename'],
                content_type=d.get('content_type'),
            )
        except Exception as exc:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Upload URL Generation Error: {exc}", exc_info=True)
            return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        
        doc = PEProjectDocument.objects.create(
            project=project,
            category=d['category'],
            filename=d['filename'],
            file_key=presign['file_key'],
            mime_type=presign['content_type'],
            file_size=d.get('file_size', 0),
            uploaded_by=request.user,
            is_confirmed=False,
        )

        return Response({
            'url': presign['url'],
            'file_key': presign['file_key'],
            'document_id': doc.id,
            'content_type': presign['content_type'],
        })



class EntrepreneurAuthUploadLocalView(APIView):
    """
    POST /api/entrepreneur/submissions/{project_id}/upload-local/
    Direct multipart upload to local storage.
    Used for initial entrepreneur submissions to avoid B2/CORS issues.
    """
    permission_classes = [permissions.IsAuthenticated, IsEntrepreneurRole]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, project_id):
        project = get_deal_for_user(self.request, pk=project_id, entrepreneur_user=request.user)
        file_obj = request.FILES.get('file')
        category = request.data.get('document_type', 'OTHER')

        if not file_obj:
            return Response({'detail': 'No file uploaded.'}, status=400)
        
        # 3MB Size Limit
        if file_obj.size > 3 * 1024 * 1024:
            return Response({'detail': 'File size exceeds the 3MB limit.'}, status=400)

        doc = PEProjectDocument.objects.create(
            project=project,
            category=category,
            filename=file_obj.name,
            file_key=f"local/{project.id}/{file_obj.name}",
            mime_type=file_obj.content_type,
            file_size=file_obj.size,
            local_file=file_obj,
            uploaded_by=request.user,
            is_confirmed=True, # Locally uploaded is immediately confirmed
        )

        return Response({
            'document_id': doc.id,
            'filename': doc.filename,
            'url': doc.local_file.url
        }, status=201)


# ---------------------------------------------------------------------------
# 15. AI Financials & QoE Endpoints
# ---------------------------------------------------------------------------


class GPProjectUploadLocalView(APIView):
    """
    POST /api/deals/projects/{project_id}/upload-local/
    Direct multipart upload to local storage for GP staff.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        file_obj = request.FILES.get('file')
        category = request.data.get('document_type', 'OTHER')

        if not file_obj:
            return Response({'detail': 'No file uploaded.'}, status=400)
        
        # 3MB Size Limit
        if file_obj.size > 3 * 1024 * 1024:
            return Response({'detail': 'File size exceeds the 3MB limit.'}, status=400)

        doc = PEProjectDocument.objects.create(
            project=project,
            category=category,
            filename=file_obj.name,
            file_key=f"local/gp/{project.id}/{file_obj.name}",
            mime_type=file_obj.content_type,
            file_size=file_obj.size,
            local_file=file_obj,
            uploaded_by=request.user,
            is_confirmed=True,
        )

        return Response({
            'document_id': doc.id,
            'filename': doc.filename,
            'category': doc.category,
            'url': doc.url
        }, status=status.HTTP_201_CREATED)



class GPGenerateMemoView(APIView):
    """
    POST /api/deals/projects/<uuid:pk>/generate-memo/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        
        # Force immediate processing state
        progress = project.analysis_progress or {}
        progress['Memo'] = 'processing'
        project.analysis_progress = progress
        project.save()
        
        from deals.tasks import generate_memo_draft
        generate_memo_draft.delay(project.id)
        return Response({"status": "AI memo generation triggered"}, status=status.HTTP_202_ACCEPTED)



class GPMemoDetailView(generics.RetrieveUpdateAPIView):
    """
    GET /api/deals/projects/<uuid:pk>/memos/latest/
    PATCH /api/deals/projects/<uuid:pk>/memos/<uuid:memo_id>/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = DealMemoSerializer

    def get_object(self):
        project = get_deal_for_user(self.request, pk=self.kwargs['pk'])
        if 'memo_id' in self.kwargs:
            return get_object_or_404(DealMemo, pk=self.kwargs['memo_id'], project=project)
        return project.memos.order_by('-version', '-created_at').first()



class GPMemoFinalizeView(APIView):
    """
    POST /api/deals/projects/<uuid:pk>/memos/<uuid:memo_id>/finalize/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk, memo_id):
        from deals.pdf_utils import render_pdf
        from django.utils import timezone
        
        project = get_deal_for_user(request, pk=pk)
        memo = get_object_or_404(DealMemo, pk=memo_id, project=project)
        
        ic_notes = request.data.get('ic_notes', '')
        
        # 1. Update Memo
        memo.status = 'FINAL'
        memo.ic_notes = ic_notes
        memo.save()
        
        # 2. Generate PDF
        context = {
            'project': project,
            'memo': memo,
            'ic_notes': ic_notes,
            'date': timezone.now().date(),
            'gp_name': request.user.get_full_name() or request.user.email,
            'investment_amount': request.data.get('investment_amount', '')
        }
        
        try:
            pdf_bytes = render_pdf('deals/ic_memo_template.html', context)
        except Exception as e:
            return Response({"detail": f"PDF Generation failed: {str(e)}"}, status=500)
            
        # 3. Create Document (Local Storage)
        file_name = f"IC_Memo_{project.legal_name.replace(' ', '_')}_v{memo.version}.pdf"
        
        from django.core.files.base import ContentFile
        
        try:
            doc = PEProjectDocument.objects.create(
                project=project,
                filename=file_name,
                file_size=len(pdf_bytes),
                mime_type='application/pdf',
                category='LEGAL',
                uploaded_by=request.user,
                local_file=ContentFile(pdf_bytes, name=file_name),
                is_confirmed=True
            )
            
            # Note: Project status stays in IC_REVIEW. Signed IC memo upload advances to TERM_SHEET.
            
            # 5. Log Audit Event
            ImmutableAuditEvent.objects.create(
                event_type='MEMO_FINALIZED',
                actor=request.user,
                object_id=project.id,
                object_repr=str(project),
                content_type_label='deals.PEProject',
                payload={'memo_id': str(memo.id), 'document_id': str(doc.id)}
            )
            
            return Response({
                "status": "Memo finalized and IC approved",
                "document_id": str(doc.id)
            })
            
        except Exception as e:
            return Response({"detail": f"Local save failed: {str(e)}"}, status=500)



class GPUploadSignedICMemoView(APIView):
    """
    POST /api/deals/projects/<uuid:pk>/upload-signed-ic-memo/
    Upload a physically signed IC memo document. Advances deal to TERM_SHEET.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, pk):
        project = get_deal_for_user(request, pk=pk)

        # Allow upload in IC_REVIEW (standard) or TERM_SHEET (re-upload)
        allowed_statuses = [PEProject.Status.IC_REVIEW, PEProject.Status.TERM_SHEET]
        if project.status not in allowed_statuses:
            return Response({
                "detail": f"Project must be in IC_REVIEW to upload signed IC memo. Current status: {project.status}"
            }, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES.get('file')
        if not file:
            return Response({"detail": "No file provided in 'file' field."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Verify a finalized memo exists
        memo = project.memos.filter(status__in=['FINAL', 'IC_SIGNED']).first()
        if not memo:
            return Response({"detail": "A finalized IC memo draft must exist before uploading a signed copy."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Save document locally
        doc = PEProjectDocument.objects.create(
            project=project,
            filename=file.name,
            file_key=f"local/gp/{project.id}/signed_{file.name}",
            category='IC_SIGNED',
            local_file=file,
            mime_type=file.content_type,
            file_size=file.size,
            uploaded_by=request.user,
            is_confirmed=True
        )

        # 3. Update memo status
        memo.status = 'IC_SIGNED'
        memo.save()

        # 4. Advance project to TERM_SHEET
        project.status = PEProject.Status.TERM_SHEET
        project.save()

        # 5. Audit
        ImmutableAuditEvent.objects.create(
            event_type='IC_MEMO_SIGNED',
            actor=request.user,
            object_id=project.id,
            object_repr=str(project),
            content_type_label='deals.PEProject',
            payload={
                'document_id': str(doc.id),
                'memo_id': str(memo.id),
                'filename': file.name,
            }
        )

        return Response({
            "status": "Signed IC memo uploaded. Deal advanced to TERM_SHEET.",
            "document_id": str(doc.id),
        })



class GPTermSheetListView(APIView):
    """
    GET  /api/deals/projects/<uuid:pk>/term-sheets/        - List all term sheets
    POST /api/deals/projects/<uuid:pk>/term-sheets/        - Trigger AI generation
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        term_sheets = project.term_sheets.all().order_by('-version', '-created_at')
        return Response(TermSheetSerializer(term_sheets, many=True).data)

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        if project.status not in [PEProject.Status.IC_REVIEW, PEProject.Status.TERM_SHEET]:
            return Response({"detail": "Term sheet generation requires IC_REVIEW or TERM_SHEET status."}, status=status.HTTP_400_BAD_REQUEST)

        # Set progress to processing immediately to avoid race condition in polling
        progress = project.analysis_progress or {}
        progress['Term Sheet'] = 'processing'
        project.analysis_progress = progress
        project.save(update_fields=['analysis_progress'])

        from deals.tasks import generate_ai_term_sheet
        generate_ai_term_sheet.delay(str(project.id), str(request.user.id))
        return Response({"status": "AI term sheet generation started."})



class GPTermSheetDetailView(APIView):
    """
    GET   /api/deals/projects/<uuid:pk>/term-sheets/<uuid:ts_id>/
    PATCH /api/deals/projects/<uuid:pk>/term-sheets/<uuid:ts_id>/   - Override fields
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request, pk, ts_id):
        project = get_deal_for_user(self.request, pk=pk)
        ts = get_object_or_404(TermSheet, pk=ts_id, project=project)
        return Response(TermSheetSerializer(ts).data)

    def patch(self, request, pk, ts_id):
        project = get_deal_for_user(self.request, pk=pk)
        ts = get_object_or_404(TermSheet, pk=ts_id, project=project)

        # Allow overriding individual terms
        overrides = request.data.get('terms', {})
        remarks = request.data.get('remarks', '')
        new_status = request.data.get('status')

        if overrides:
            old_terms = dict(ts.terms)
            ts.terms.update(overrides)
            ts.save()

            # Audit each override
            for key, new_val in overrides.items():
                ImmutableAuditEvent.objects.create(
                    event_type='TERM_OVERRIDE',
                    actor=request.user,
                    object_id=project.id,
                    object_repr=str(project),
                    content_type_label='deals.TermSheet',
                    payload={
                        'term_sheet_id': str(ts.id),
                        'field': key,
                        'old_value': old_terms.get(key),
                        'new_value': new_val,
                        'remarks': remarks,
                    }
                )

        if new_status and new_status in dict(TermSheet._meta.get_field('status').choices):
            ts.status = new_status
            ts.save()

        return Response(TermSheetSerializer(ts).data)



class GPSPADraftListView(APIView):
    """
    GET  /api/deals/projects/<uuid:pk>/spa-drafts/         - List all SPA drafts
    POST /api/deals/projects/<uuid:pk>/spa-drafts/         - Trigger AI generation
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        spa_drafts = project.spa_drafts.all().order_by('-version', '-created_at')
        return Response(SPADraftSerializer(spa_drafts, many=True).data)

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        if project.status not in [PEProject.Status.TERM_SHEET, PEProject.Status.LOI_ISSUED, PEProject.Status.CONTRACT_SIGNED]:
            return Response({"detail": "SPA draft generation requires TERM_SHEET, LOI_ISSUED or CONTRACT_SIGNED status."}, status=status.HTTP_400_BAD_REQUEST)

        # Set progress to processing immediately
        progress = project.analysis_progress or {}
        progress['SPA Draft'] = 'processing'
        project.analysis_progress = progress
        project.save(update_fields=['analysis_progress'])

        from deals.tasks import generate_ai_spa_draft
        generate_ai_spa_draft.delay(str(project.id), str(request.user.id))
        return Response({"status": "AI SPA draft generation started."})



class GPSPADraftDetailView(APIView):
    """
    GET   /api/deals/projects/<uuid:pk>/spa-drafts/<uuid:spa_id>/
    PATCH /api/deals/projects/<uuid:pk>/spa-drafts/<uuid:spa_id>/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request, pk, spa_id):
        project = get_deal_for_user(self.request, pk=pk)
        spa = get_object_or_404(SPADraft, pk=spa_id, project=project)
        return Response(SPADraftSerializer(spa).data)

    def patch(self, request, pk, spa_id):
        project = get_deal_for_user(self.request, pk=pk)
        spa = get_object_or_404(SPADraft, pk=spa_id, project=project)

        section_key = request.data.get('section_key')
        new_content = request.data.get('new_content')
        remarks = request.data.get('remarks', '')
        new_status = request.data.get('status')

        if section_key and new_content is not None:
            old_content = spa.sections.get(section_key, '')
            spa.sections[section_key] = new_content
            spa.save()

            # Audit log
            ImmutableAuditEvent.objects.create(
                event_type='SPA_CLAUSE_OVERRIDE',
                actor=request.user,
                object_id=project.id,
                object_repr=str(project),
                content_type_label='deals.SPADraft',
                payload={
                    'spa_draft_id': str(spa.id),
                    'section': section_key,
                    'old_value': old_content,
                    'new_value': new_content,
                    'remarks': remarks,
                }
            )

        if new_status:
            spa.status = new_status
            spa.save()

        return Response(SPADraftSerializer(spa).data)



class GPUploadSignedSPAView(APIView):
    """
    POST /api/deals/projects/<uuid:pk>/spa-drafts/<uuid:spa_id>/upload-signed/
    Upload the signed physical SPA. Advances status to CONTRACT_SIGNED.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, pk, spa_id):
        project = get_deal_for_user(request, pk=pk)
        spa = get_object_or_404(SPADraft, pk=spa_id, project=project)
        
        if spa.status != 'FINAL':
            return Response({"detail": "SPA must be in FINAL status before uploading signed copy."}, status=400)
            
        file_obj = request.FILES.get('signed_spa')
        if not file_obj:
            return Response({"detail": "No file uploaded."}, status=400)
            
        # 1. Archive the document
        import uuid
        doc_name = f"SIGNED_SPA_{project.legal_name.replace(' ', '_')}_{uuid.uuid4().hex[:6]}.pdf"
        doc = PEProjectDocument.objects.create(
            project=project,
            filename=doc_name,
            file_size=file_obj.size,
            mime_type=file_obj.content_type,
            category='SPA',
            uploaded_by=request.user,
            local_file=file_obj,
            is_confirmed=True
        )
        
        # 2. Advance Project Status to CONTRACT_SIGNED
        # (Drawdown/CAPITAL_CALLED is now a manual action for Superadmins)
        project.status = PEProject.Status.CONTRACT_SIGNED
        project.save(update_fields=['status'])
        
        # 3. Audit
        ImmutableAuditEvent.objects.create(
            event_type='SPA_EXECUTED',
            actor=request.user,
            object_id=project.id,
            object_repr=str(project),
            content_type_label='deals.PEProject',
            payload={
                'spa_draft_id': str(spa.id),
                'document_id': str(doc.id),
                'new_status': 'CONTRACT_SIGNED'
            }
        )

        # 4. Notify Superadmin
        try:
            from django.core.mail import send_mail
            from django.contrib.auth import get_user_model
            SuperAdmins = get_user_model().objects.filter(roles__contains='super_admin')
            admin_emails = [a.email for a in SuperAdmins if a.email]
            if admin_emails:
                send_mail(
                    subject=f"Action Required: Signed SPA Uploaded - {project.legal_name}",
                    message=f"GP Staff ({request.user.get_full_name()}) has uploaded the signed SPA for {project.legal_name}.\n\nPlease review the documents and issue the Capital Call to proceed with drawdown.",
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@finlogiccapital.com'),
                    recipient_list=admin_emails,
                    fail_silently=True
                )
        except Exception as e:
            logger.warning(f"Failed to notify superadmin of SPA upload: {e}")
        
        return Response({
            "status": "Signed SPA uploaded successfully. Project is in CONTRACT_SIGNED. Superadmin has been notified for final review and drawdown.",
            "document_id": str(doc.id)
        })



class GPDownloadSPAPDFView(APIView):
    """
    GET /api/deals/projects/<uuid:pk>/spa-drafts/<uuid:spa_id>/download/
    Generates and returns a high-fidelity PDF of the SPA draft.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request, pk, spa_id):
        from deals.pdf_utils import render_pdf
        from django.utils import timezone
        from django.http import HttpResponse

        project = get_deal_for_user(request, pk=pk)
        spa = get_object_or_404(SPADraft, pk=spa_id, project=project)

        labels = {
            'recitals': 'Recitals',
            'definitions': 'Definitions',
            'purchase_price': 'Purchase Price & Payment',
            'representations': 'Representations & Warranties',
            'conditions_precedent': 'Conditions Precedent',
            'covenants': 'Covenants',
            'indemnification': 'Indemnification',
            'governing_law': 'Governing Law & Dispute Resolution',
            'closing_conditions': 'Closing Conditions',
            'termination': 'Termination Provisions',
            'schedules': 'Schedules & Annexures',
        }

        # Context for template - use a list of objects to avoid needing custom filters
        section_list = []
        for key, label in labels.items():
            section_list.append({
                'label': label,
                'content': spa.sections.get(key, '')
            })

        context = {
            'project': project,
            'spa': spa,
            'sections': section_list,
            'date': timezone.now().date(),
        }


        try:
            pdf_bytes = render_pdf('deals/spa_pdf_template.html', context)
        except Exception as e:
            return Response({"detail": f"PDF Generation failed: {str(e)}"}, status=500)

        filename = f"SPA_{project.legal_name.replace(' ', '_')}_v{spa.version}.pdf"
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response



# ---------------------------------------------------------------------------
# Phase 3: LOI Entrepreneur Flow & Capital Calls
# ---------------------------------------------------------------------------


class EntrepreneurUploadSignedLOIView(APIView):
    """
    POST /api/entrepreneur/submissions/{id}/upload-signed-loi/
    Entrepreneur uploads the signed LOI to move the deal forward.
    """
    permission_classes = [permissions.IsAuthenticated, IsEntrepreneurRole]

    def post(self, request, pk):
        project = get_object_or_404(PEProject, pk=pk, entrepreneur_user=request.user)
        
        if project.status != PEProject.Status.LOI_ISSUED:
            return Response({"detail": "Project must be in LOI_ISSUED status to upload signed LOI."}, status=400)
            
        file = request.FILES.get('file')
        if not file:
            return Response({"detail": "No file provided."}, status=400)
            
        # 1. Create document
        doc = PEProjectDocument.objects.create(
            project=project,
            filename=file.name,
            category='LOI_SIGNED',
            local_file=file,
            mime_type=file.content_type,
            file_size=file.size,
            uploaded_by=request.user,
            is_confirmed=True
        )
        
        # 2. Log Audit
        ImmutableAuditEvent.objects.create(
            event_type='LOI_SIGNED_BY_ENTREPRENEUR',
            actor=request.user,
            object_id=project.id,
            object_repr=str(project),
            content_type_label='deals.PEProject',
            payload={
                'document_id': str(doc.id),
                'filename': file.name,
            }
        )
        
        return Response({
            "status": "Signed LOI uploaded successfully. GP staff notified.",
            "document_id": str(doc.id)
        })


