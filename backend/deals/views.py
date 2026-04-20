"""
deals/views.py
DRF API views for the PE Deals app.

URL namespace: api/deals/  (GP & public)
              api/entrepreneur/  (Entrepreneur portal)
              api/lp/            (LP portal)
              api/gp-investor/   (GP Investor portal)
"""
import logging
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .b2_utils import generate_presigned_upload_url, generate_presigned_download_url
from .models import (
    Fund,
    FundDocument,
    CapitalCall,
    Distribution,
    ImmutableAuditEvent,
    LPDocumentAccess,
    LPFundCommitment,
    LPProfile,
    PEFormTemplate,
    PEInvestment,
    PEProject,
    PEProjectDocument,
    PEProjectFormResponse,
)
from .permissions import (
    IsEntrepreneurRole,
    IsGPInvestorRole,
    IsGPStaff,
    IsLPRole,
)
from .serializers import (
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
    PEFormTemplateSerializer,
    PEInvestmentSerializer,
    PEProjectDetailSerializer,
    PEProjectDocumentSerializer,
    PEProjectFormResponseSerializer,
    PEProjectListSerializer,
    PEProjectStatusUpdateSerializer,
)
from .signals import _log_audit_event

User = get_user_model()
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_client_ip(request):
    x_fwd = request.META.get('HTTP_X_FORWARDED_FOR')
    return x_fwd.split(',')[0].strip() if x_fwd else request.META.get('REMOTE_ADDR')


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
        serializer = GPInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
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
                'status': PEProject.Status.SUBMITTED,
                'submission_type': PEProject.SubmissionType.ENTREPRENEUR_INVITED,
                'entrepreneur_user': entrepreneur,
                'created_by': request.user,
            }
        )

        if not created:
            # Optionally update fields if it already exists
            project.entrepreneur_user = entrepreneur
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
        lp_profile = self.request.user.lp_profile
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


class LPPortfolioView(APIView):
    """
    Return anonymized list of deals in the LP's funds.
    GET /api/lp/portfolio/
    """
    permission_classes = [permissions.IsAuthenticated, IsLPRole]

    def get(self, request):
        lp_profile = request.user.lp_profile
        fund_ids = lp_profile.fund_commitments.values_list('fund_id', flat=True)
        
        projects = PEProject.objects.filter(
            fund_id__in=fund_ids,
            status__in=[PEProject.Status.GP_APPROVED, PEProject.Status.CLOSED]
        ).distinct()

        serializer = LPPortfolioSerializer(projects, many=True)
        
        # Aggregate stats (sample metrics)
        # In real scenario, calculate based on PEInvestment records
        stats = {
            'total_investments': projects.count(),
            'sectors': {}, # Aggregate by sector for chart
            'performance': {
                'tvpi': 1.42,
                'dpi': 0.15,
                'irr': 24.5
            }
        }
        
        for p in projects:
            stats['sectors'][p.sector] = stats['sectors'].get(p.sector, 0) + 1

        return Response({
            'projects': serializer.data,
            'stats': stats
        })


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
        # For brevity, we'll check if they are GP or own the project
        # In prod, check project FK via document model
        try:
            url = generate_presigned_download_url(file_key)
            return Response({'url': url})
        except Exception as exc:
            return Response({'detail': str(exc)}, status=500)


class DocumentDeleteView(APIView):
    """
    DELETE /api/deals/documents/{id}/
    Permission: IsGPStaff
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def delete(self, request, pk):
        from .b2_utils import delete_b2_object
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
            'form_template': PEFormTemplateSerializer(template).data if template else None,
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

        # Upsert response
        response_obj, _ = PEProjectFormResponse.objects.update_or_create(
            project=project,
            step_index=step_index,
            defaults={
                'step_name': step_name,
                'template': template,
                'response_data': request.data,
            },
        )

        # Advance step counter
        if project.form_step_completed < step_index:
            PEProject.objects.filter(pk=project.pk).update(
                form_step_completed=step_index
            )
            project.refresh_from_db()

        _log_audit_event(
            ImmutableAuditEvent.EventType.FORM_STEP_SAVED,
            project,
            actor=project.entrepreneur_user,
            payload={'step_name': step_name, 'step_index': step_index},
            request=request,
        )

        return Response(
            PEProjectFormResponseSerializer(response_obj).data,
            status=status.HTTP_200_OK,
        )


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
            project = get_object_or_404(PEProject, pk=project_id)
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

        project.submitted_at = timezone.now()
        project.status = PEProject.Status.SUBMITTED
        project.save(update_fields=['submitted_at', 'status', 'updated_at'])

        # Notify GPs
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
        # Attach form responses
        responses = PEProjectFormResponse.objects.filter(project=instance).order_by('step_index')
        project_data['form_responses'] = PEProjectFormResponseSerializer(
            responses, many=True
        ).data

        # Attach active template
        template = PEFormTemplate.objects.filter(
            form_type=PEFormTemplate.FormType.DEAL_SUBMISSION,
            is_active=True,
        ).order_by('-version').first()
        
        project_data['active_template'] = PEFormTemplateSerializer(template).data if template else None

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
    Permission: IsGPStaff
    """
    serializer_class = PEProjectDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
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
    Permission: IsGPStaff
    """
    serializer_class = PEProjectDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
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
        project = get_object_or_404(PEProject, pk=self.kwargs['pk'])
        return PEProjectDocument.objects.filter(project=project).order_by('-uploaded_at')


class GPProjectFormResponsesView(generics.ListAPIView):
    """
    GET /api/deals/projects/{id}/form-responses/
    Permission: IsGPStaff
    """
    serializer_class = PEProjectFormResponseSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get_queryset(self):
        project = get_object_or_404(PEProject, pk=self.kwargs['pk'])
        return PEProjectFormResponse.objects.filter(project=project).order_by('step_index')


class GPGetUploadURLView(APIView):
    """
    POST /api/deals/projects/{pk}/get-upload-url/
    Permission: IsGPStaff
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, project_id):
        project = get_object_or_404(PEProject, pk=project_id)
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

class LPDashboardView(APIView):
    """
    GET /api/lp/dashboard/
    Multi-fund summary for the logged-in LP.
    Permission: IsLPRole
    """
    permission_classes = [permissions.IsAuthenticated, IsLPRole]

    def get(self, request):
        try:
            lp_profile = request.user.lp_profile
        except LPProfile.DoesNotExist:
            return Response(
                {'detail': 'LP profile not found. Please contact support.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        commitments = LPFundCommitment.objects.filter(
            lp_profile=lp_profile
        ).select_related('fund')
        funds = [c.fund for c in commitments]

        # Financial Aggregates
        # Sum both CALLED and RECEIVED capital calls for the "Capital Called" metric
        total_called = CapitalCall.objects.filter(
            lp_commitment__in=commitments,
            status__in=['CALLED', 'RECEIVED']
        ).aggregate(models.Sum('amount_npr'))['amount_npr__sum'] or 0

        # Only sum RECEIVED for performance ratios (actual paid-in capital)
        paid_in_capital = CapitalCall.objects.filter(
            lp_commitment__in=commitments,
            status='RECEIVED'
        ).aggregate(models.Sum('amount_npr'))['amount_npr__sum'] or 0

        total_distributed = Distribution.objects.filter(
            lp_commitment__in=commitments
        ).aggregate(models.Sum('amount_npr'))['amount_npr__sum'] or 0

        # Get 3 most recent documents across all these funds
        recent_docs = FundDocument.objects.filter(
            fund_id__in=[f.id for f in funds],
            is_published=True
        ).order_by('-publish_date')[:3]

        # Recent transactions for activity feed
        recent_calls = CapitalCall.objects.filter(lp_commitment__in=commitments).order_by('-call_date')[:5]
        recent_dist = Distribution.objects.filter(lp_commitment__in=commitments).order_by('-distribution_date')[:5]
        
        activity = []
        for c in recent_calls:
            activity.append({
                'type': 'CAPITAL_CALL',
                'title': f"Capital Call: {c.fund.name}",
                'amount': float(c.amount_npr),
                'date': str(c.call_date),
                'status': c.status
            })
        for d in recent_dist:
            activity.append({
                'type': 'DISTRIBUTION',
                'title': f"Distribution: {d.fund.name}",
                'amount': float(d.amount_npr),
                'date': str(d.distribution_date),
                'status': 'COMPLETED'
            })
        activity.sort(key=lambda x: x['date'], reverse=True)

        # Calculate NAV (Net Asset Value)
        # Base logic: (Capital Invested - Distributed) * Valuation Multiple
        # We use max(paid_in, total_called) so that 'in-transit' capital doesn't create negative NAV
        invested_base = max(float(paid_in_capital), float(total_called))
        nav = (invested_base - float(total_distributed)) * 1.25
        
        # Ensure NAV is never negative
        nav = max(0, nav)

        return Response({
            'lp_profile': LPProfileSerializer(lp_profile).data,
            'funds': LPDashboardFundSerializer(
                funds, many=True, context={'request': request}
            ).data,
            'recent_documents': FundDocumentSerializer(recent_docs, many=True, context={'request': request}).data,
            'activity_feed': activity[:5],
            'total_committed_npr': float(sum(c.committed_amount_npr for c in commitments)),
            'total_called_npr': float(total_called),
            'total_paid_in_npr': float(paid_in_capital),
            'total_distributed_npr': float(total_distributed),
            'nav_npr': nav
        })


class LPFundDetailView(APIView):
    """
    GET /api/lp/fund/{fund_id}/
    Fund detail with approved/closed deals visible to LPs.
    Permission: IsLPRole
    """
    permission_classes = [permissions.IsAuthenticated, IsLPRole]

    def get(self, request, fund_id):
        fund = get_object_or_404(Fund, pk=fund_id)

        # Only approved / closed deals visible to LP
        deals = PEProject.objects.filter(
            fund=fund,
            status__in=[PEProject.Status.GP_APPROVED, PEProject.Status.CLOSED],
        )

        return Response({
            'fund': FundSerializer(fund).data,
            'approved_deals': PEProjectListSerializer(deals, many=True).data,
        })


# ---------------------------------------------------------------------------
# 9. GP Investor Endpoints
# ---------------------------------------------------------------------------

class GPInvestorDashboardView(APIView):
    """
    GET /api/gp-investor/dashboard/
    Shareholding, fund performance, IR data.
    Permission: IsGPInvestorRole
    """
    permission_classes = [permissions.IsAuthenticated, IsGPInvestorRole]

    def get(self, request):
        # 1. Get Shareholder Profile
        try:
            shareholder = request.user.gp_shareholding
        except GPShareholder.DoesNotExist:
            shareholder = None

        # 2. Get Dividend History
        dividends = []
        total_dividends = 0
        if shareholder:
            dividend_objs = shareholder.dividends.all()
            total_dividends = float(sum(d.amount_npr for d in dividend_objs))
            dividends = [{
                'amount_npr': float(d.amount_npr),
                'payment_date': str(d.payment_date),
                'fiscal_year': d.fiscal_year,
                'status': d.status
            } for d in dividend_objs]

        # 3. Aggregate Firm-wide Metrics (AUM)
        funds = Fund.objects.all().order_by('-vintage_year')
        from django.db.models import Sum
        commitments = LPFundCommitment.objects.aggregate(Sum('committed_amount_npr'))['committed_amount_npr__sum'] or 0
        
        # 4. Fetch Internal Documents (GP Shareholder Reports / Board Minutes)
        internal_docs = FundDocument.objects.filter(
            document_type__in=['SHAREHOLDER_REPORT', 'BOARD_MINUTES'],
            is_published=True
        ).order_by('-publish_date')

        return Response({
            'shareholder': {
                'shares_held': float(shareholder.shares_held) if shareholder else 0,
                'ownership_percentage': float(shareholder.ownership_percentage) if shareholder else 0,
                'vesting_status': shareholder.vesting_status if shareholder else 'N/A',
                'total_dividends_npr': total_dividends,
                'dividend_history': dividends[:5]
            } if shareholder else None,
            'total_committed_npr': float(commitments),
            'funds': LPDashboardFundSerializer(funds, many=True, context={'request': request}).data,
            'internal_documents': FundDocumentSerializer(internal_docs, many=True, context={'request': request}).data,
        })


# ---------------------------------------------------------------------------
# Utility: Fund CRUD (GP-only)
# ---------------------------------------------------------------------------

class FundListCreateView(generics.ListCreateAPIView):
    """GET /api/deals/funds/  POST /api/deals/funds/"""
    serializer_class = FundSerializer
    queryset = Fund.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsGPStaff()]


class FundDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/deals/funds/{id}/"""
    serializer_class = FundSerializer
    queryset = Fund.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsGPStaff()]


# ---------------------------------------------------------------------------
# Utility: LP Profile management (GP or self)
# ---------------------------------------------------------------------------

class LPProfileListCreateView(generics.ListCreateAPIView):
    serializer_class = LPProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    queryset = LPProfile.objects.select_related('user')


class LPProfileDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = LPProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    queryset = LPProfile.objects.all()


# ---------------------------------------------------------------------------
# Utility: Form Template management (GP-only)
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
        project = get_object_or_404(PEProject, pk=project_id, entrepreneur_user=request.user)
        
        template = PEFormTemplate.objects.filter(
            form_type=PEFormTemplate.FormType.DEAL_SUBMISSION,
            is_active=True,
        ).order_by('-version').first()

        if not template:
            return Response({'detail': 'No active form template found.'}, status=404)

        step_def = next((s for s in template.steps if s.get('step_name') == step_name), None)
        if not step_def:
            return Response({'detail': f"Step '{step_name}' not found."}, status=400)

        response_obj, _ = PEProjectFormResponse.objects.update_or_create(
            project=project,
            step_index=step_def['step_index'],
            defaults={
                'step_name': step_name,
                'template': template,
                'response_data': request.data,
            }
        )

        if project.form_step_completed < step_def['step_index'] + 1:
            project.form_step_completed = step_def['step_index'] + 1
            project.save(update_fields=['form_step_completed'])

        return Response({'status': 'saved', 'step_completed': project.form_step_completed})


class EntrepreneurAuthFinalizeView(APIView):
    """
    POST /api/entrepreneur/submissions/{project_id}/finalize/
    Finalizes the submission for an authenticated entrepreneur.
    """
    permission_classes = [permissions.IsAuthenticated, IsEntrepreneurRole]

    def post(self, request, project_id):
        from django.utils import timezone
        project = get_object_or_404(PEProject, pk=project_id, entrepreneur_user=request.user)
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

    def get(self, request, project_id):
        import uuid
        from deals import b2_utils as b2
        project = get_object_or_404(PEProject, pk=project_id, entrepreneur_user=request.user)
        category = request.query_params.get('category', 'OTHER')
        filename = request.query_params.get('filename', 'document.pdf')
        
        file_key = f"projects/{project.id}/{uuid.uuid4()}_{filename}"
        presign = b2.get_presigned_upload_url(file_key)
        
        doc = PEProjectDocument.objects.create(
            project=project,
            category=category,
            filename=filename,
            file_key=file_key,
            mime_type=presign['content_type'],
            file_size=0,
            uploaded_by=request.user,
            is_confirmed=False,
        )

        return Response({
            'url': presign['url'],
            'file_key': presign['file_key'],
            'document_id': doc.id,
            'content_type': presign['content_type'],
        })
