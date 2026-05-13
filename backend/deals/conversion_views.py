from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.utils import timezone
import io
import uuid

from .models import (
    PEProject, 
    PEInvestment, 
    PEProjectDocument, 
    DealMemo, 
    ImmutableAuditEvent,
    Fund,
    CapitalCall
)
from .serializers import PEInvestmentSerializer, DealMemoSerializer
from .views import get_deal_for_user
from .permissions import IsGPStaff
from .pdf_utils import render_pdf
from django.conf import settings

class IssueLOIView(APIView):
    """
    POST /api/deals/projects/<id>/issue-loi/
    GP view to generate and issue an LOI to an entrepreneur.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, project_id):
        project = get_deal_for_user(request, pk=project_id)
        
        # 1. Capture terms and custom content from request
        terms = request.data.get('terms', {})
        custom_content = request.data.get('content', '') # From rich text editor
        
        context = {
            'project': project,
            'terms': terms,
            'content': custom_content,
            'date': timezone.now().date(),
            'gp_name': request.user.get_full_name() or request.user.email
        }
        
        # 2. Generate PDF
        try:
            # We'll create a simple template deals/loi_template.html later
            pdf_bytes = render_pdf('deals/loi_template.html', context)
        except Exception as e:
            return Response({"detail": f"PDF Generation failed: {str(e)}"}, status=500)
            
        # 3. Create Document (Local Storage)
        file_name = f"LOI_{project.legal_name.replace(' ', '_')}_{uuid.uuid4().hex[:6]}.pdf"
        
        from django.core.files.base import ContentFile
        
        try:
            doc = PEProjectDocument.objects.create(
                project=project,
                filename=file_name,
                file_size=len(pdf_bytes),
                mime_type='application/pdf',
                category='LOI',
                uploaded_by=request.user,
                local_file=ContentFile(pdf_bytes, name=file_name),
                is_confirmed=True
            )
            
            # 4. Update Project Status
            project.status = PEProject.Status.LOI_ISSUED
            project.save()
            
            # 5. Log Audit Event
            ImmutableAuditEvent.objects.create(
                event_type='LOI_ISSUED',
                actor=request.user,
                object_id=project.id,
                object_repr=str(project),
                content_type_label='deals.PEProject',
                payload={'document_id': str(doc.id), 'terms': terms}
            )
            
            return Response({
                "status": "LOI issued successfully",
                "document_id": str(doc.id)
            })
            
        except Exception as e:
            return Response({"detail": f"Local save failed: {str(e)}"}, status=500)


class SuperadminFinalizeInvestmentView(APIView):
    """
    POST /api/deals/projects/<id>/finalize-investment/
    Superadmin view to officially close a deal and create a PEInvestment record.
    Requires CAPITAL_CALLED status and all LP payments received.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, project_id):
        if not request.user.has_role('super_admin'):
            return Response({"detail": "Only Superadmins can finalize investments."}, status=403)
            
        project = get_object_or_404(PEProject, pk=project_id)
        
        # 1. Status Gate: Must be CAPITAL_CALLED
        if project.status != PEProject.Status.CAPITAL_CALLED:
            return Response({
                "detail": f"Deal must be in CAPITAL_CALLED status to finalize. Current: {project.status}"
            }, status=400)
        
        # 2. Capital Call Verification: All calls for this project must be RECEIVED
        pending_calls = CapitalCall.objects.filter(project=project).exclude(status=CapitalCall.Status.RECEIVED)
        if pending_calls.exists():
            return Response({
                "detail": f"{pending_calls.count()} capital calls still pending. "
                          "All LP payments must be received before closing."
            }, status=400)
        
        # 3. Regulatory Checklist Verification
        try:
            checklist = project.regulatory_checklist
            if checklist.fitta_approval_required and not checklist.fitta_approval_obtained:
                return Response({"detail": "FITTA approval required but not obtained."}, status=400)
            if checklist.nrb_approval_required and not checklist.nrb_approval_obtained:
                return Response({"detail": "NRB approval required but not obtained."}, status=400)
        except Exception:
            pass  # No checklist exists — skip (will be created during screening)
        
        # 4. Validation
        fund_id = request.data.get('fund_id')
        investment_amount = request.data.get('investment_amount_npr')
        ownership_pct = request.data.get('ownership_pct')
        investment_date = request.data.get('investment_date', timezone.now().date())
        
        if not all([fund_id, investment_amount, ownership_pct]):
            return Response({"detail": "Missing required investment details."}, status=400)
            
        fund = get_object_or_404(Fund, pk=fund_id)
        
        # 5. Create PEInvestment
        investment = PEInvestment.objects.create(
            project=project,
            fund=fund,
            investment_date=investment_date,
            investment_amount_npr=investment_amount,
            ownership_pct=ownership_pct,
            valuation_at_entry_npr=request.data.get('valuation_at_entry_npr')
        )
        
        # 6. Link capital calls to investment
        CapitalCall.objects.filter(project=project).update(
            notes=f"Linked to investment {investment.id}"
        )
        
        # 7. Finalize IC Memo (if exists)
        memo = project.memos.order_by('-version').first()
        if memo and memo.status != 'FINAL':
            memo.status = 'FINAL'
            memo.ic_notes = request.data.get('ic_notes', '')
            memo.save()
            
        # 8. Update Project Status
        project.status = PEProject.Status.CLOSED
        project.save()
        
        # 9. Log Audit Event
        ImmutableAuditEvent.objects.create(
            event_type='INVESTMENT_CLOSED',
            actor=request.user,
            object_id=project.id,
            object_repr=str(project),
            content_type_label='deals.PEProject',
            payload={
                'investment_id': str(investment.id),
                'fund_id': str(fund.id),
                'amount': float(investment_amount)
            }
        )
        
        return Response({
            "status": "Investment closed successfully",
            "investment_id": str(investment.id)
        })

