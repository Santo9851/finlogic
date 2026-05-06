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
    Fund
)
from .serializers import PEInvestmentSerializer, DealMemoSerializer
from .views import get_deal_for_user
from .permissions import IsGPStaff
from .pdf_utils import render_pdf
from .b2_utils import get_b2_client
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
            
        # 3. Upload to B2
        file_name = f"LOI_{project.legal_name.replace(' ', '_')}_{uuid.uuid4().hex[:6]}.pdf"
        file_key = f"projects/{project.id}/legal/{file_name}"
        
        try:
            bucket = getattr(settings, 'B2_BUCKET_NAME', '')
            client = get_b2_client()
            client.put_object(
                Bucket=bucket,
                Key=file_key,
                Body=pdf_bytes,
                ContentType='application/pdf'
            )
            
            # Create Document record
            doc = PEProjectDocument.objects.create(
                project=project,
                file_key=file_key,
                filename=file_name,
                file_size=len(pdf_bytes),
                mime_type='application/pdf',
                category='LOI',
                uploaded_by=request.user
            )
            
            # 4. Update Project Status
            project.status = PEProject.Status.LOI_ISSUED
            project.save()
            
            # 5. Log Audit Event
            ImmutableAuditEvent.objects.create(
                event_type='LOI_ISSUED',
                project=project,
                actor=request.user,
                payload={'document_id': str(doc.id), 'terms': terms}
            )
            
            return Response({
                "status": "LOI issued successfully",
                "document_id": str(doc.id),
                "url": doc.url
            })
            
        except Exception as e:
            return Response({"detail": f"Upload failed: {str(e)}"}, status=500)


class SuperadminFinalizeInvestmentView(APIView):
    """
    POST /api/deals/projects/<id>/finalize-investment/
    Superadmin view to officially close a deal and create a PEInvestment record.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, project_id):
        if not request.user.has_role('super_admin'):
            return Response({"detail": "Only Superadmins can finalize investments."}, status=403)
            
        project = get_object_or_404(PEProject, pk=project_id)
        
        # Only allow closing if contract is signed (or override if needed, but let's be strict)
        if project.status != PEProject.Status.CONTRACT_SIGNED:
            return Response({"detail": f"Deal must be in CONTRACT_SIGNED status to finalize. Current: {project.status}"}, status=400)
        
        # 1. Validation
        fund_id = request.data.get('fund_id')
        investment_amount = request.data.get('investment_amount_npr')
        ownership_pct = request.data.get('ownership_pct')
        investment_date = request.data.get('investment_date', timezone.now().date())
        
        if not all([fund_id, investment_amount, ownership_pct]):
            return Response({"detail": "Missing required investment details."}, status=400)
            
        fund = get_object_or_404(Fund, pk=fund_id)
        
        # 2. Create PEInvestment
        investment = PEInvestment.objects.create(
            project=project,
            fund=fund,
            investment_date=investment_date,
            investment_amount_npr=investment_amount,
            ownership_pct=ownership_pct,
            valuation_at_entry_npr=request.data.get('valuation_at_entry_npr')
        )
        
        # 3. Finalize IC Memo (if exists)
        memo = project.memos.order_by('-version').first()
        if memo:
            memo.status = 'FINAL'
            memo.ic_notes = request.data.get('ic_notes', '')
            memo.save()
            
            # Generate Final IC Memo PDF (Optional but recommended)
            # ... (similar logic to LOI)
            
        # 4. Update Project Status
        project.status = PEProject.Status.CLOSED
        project.save()
        
        # 5. Log Audit Event
        ImmutableAuditEvent.objects.create(
            event_type='INVESTMENT_CLOSED',
            project=project,
            actor=request.user,
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
