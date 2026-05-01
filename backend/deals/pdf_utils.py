import os
import io
import logging
from decimal import Decimal
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
logger = logging.getLogger(__name__)

try:
    from weasyprint import HTML
except (ImportError, OSError):
    HTML = None
    logger.warning("WeasyPrint or its dependencies (libgobject) not found. PDF generation will be unavailable.")

from .models import FundDocument, PEInvestment, PEProject, LPFundCommitment, ImmutableAuditEvent
from .b2_utils import get_b2_client

def generate_capital_account_pdf(lp_commitment, quarter, year):
    """
    Render a capital account statement PDF for a specific LP.
    """
    if HTML is None:
        raise ImportError("PDF generation dependencies are missing (WeasyPrint/libgobject).")
    
    fund = lp_commitment.fund
    lp_profile = lp_commitment.lp_profile
    period = f"{quarter} {year}"
    
    # 1. Gather Capital Summary
    committed = lp_commitment.committed_amount_npr
    called = lp_commitment.called_amount_npr
    distributed = sum(d.amount_npr for d in lp_commitment.distributions.all())
    uncalled = committed - called
    
    # Simple NAV estimation: sum of (investment * current_moic) proportionate to LP's share
    # For this implementation, we'll use a simplified model.
    # In a real system, NAV would be tracked via Valuation records.
    investments = PEInvestment.objects.filter(fund=fund)
    total_fund_invested = sum(inv.investment_amount_npr for inv in investments)
    
    # Calculate LP's share of fund (based on called capital)
    total_fund_called = sum(c.called_amount_npr for c in LPFundCommitment.objects.filter(fund=fund))
    lp_share_ratio = Decimal(called / total_fund_called) if total_fund_called > 0 else Decimal(0)
    
    # Calculate Current Value (NAV)
    # We look at approved deals and their "exit value" or "current valuation"
    current_fund_value = Decimal(0)
    portfolio_data = []
    
    for inv in investments:
        # Only show approved/closed deals
        if inv.project.status not in [PEProject.Status.GP_APPROVED, PEProject.Status.CLOSED]:
            continue
            
        # Use exit_value if exited, otherwise use investment_amount (placeholder for current valuation)
        val = inv.exit_value_npr if inv.exit_value_npr else inv.investment_amount_npr
        current_fund_value += val
        
        moic = float(val / inv.investment_amount_npr) if inv.investment_amount_npr > 0 else 1.0
        
        portfolio_data.append({
            'name': inv.project.legal_name if inv.project.status == PEProject.Status.CLOSED else f"Project {inv.project.sector}",
            'sector': inv.project.sector,
            'invested': inv.investment_amount_npr,
            'valuation': val,
            'moic': round(moic, 2)
        })

    nav_lp = current_fund_value * lp_share_ratio
    unrealized_lp = nav_lp # Simplified
    
    # 2. Performance Metrics
    dpi = distributed / called if called > 0 else 0
    rvpi = nav_lp / called if called > 0 else 0
    tvpi = dpi + rvpi
    
    # Placeholder for IRR
    irr = 18.5 # In a real implementation, we would calculate XIRR from cash flows
    
    context = {
        'lp_name': lp_profile.full_name,
        'organization': lp_profile.organization,
        'fund_name': fund.name,
        'period': period,
        'committed_npr': committed,
        'called_npr': called,
        'distributed_npr': distributed,
        'uncalled_npr': uncalled,
        'nav_npr': nav_lp,
        'unrealized_npr': unrealized_lp,
        'tvpi': round(float(tvpi), 2),
        'dpi': round(float(dpi), 2),
        'rvpi': round(float(rvpi), 2),
        'irr': irr,
        'portfolio': portfolio_data
    }
    
    html_string = render_to_string('deals/capital_account.html', context)
    pdf_file = io.BytesIO()
    HTML(string=html_string).write_pdf(target=pdf_file)
    
    return pdf_file.getvalue()

def upload_pdf_to_b2(pdf_bytes, file_name, fund, lp_commitment, quarter, year, gp_user=None):
    """
    Upload PDF bytes to B2 and create a FundDocument record.
    """
    lp_profile = lp_commitment.lp_profile
    file_key = f"statements/{fund.id}/{year}/{quarter}/{lp_profile.id}/{file_name}.pdf"
    bucket = getattr(settings, 'B2_BUCKET_NAME', '')
    
    client = get_b2_client()
    try:
        client.put_object(
            Bucket=bucket,
            Key=file_key,
            Body=pdf_bytes,
            ContentType='application/pdf'
        )
        
        # Create FundDocument record
        doc = FundDocument.objects.create(
            fund=fund,
            title=f"Capital Account Statement - {lp_profile.full_name} - {quarter} {year}",
            document_type=FundDocument.DocType.CAPITAL_ACCOUNT,
            file_key=file_key,
            file_name=f"{file_name}.pdf",
            file_size=len(pdf_bytes),
            mime_type='application/pdf',
            is_published=True,
            publish_date=timezone.now(),
            uploaded_by=gp_user
        )
        
        # Log event
        ImmutableAuditEvent.objects.create(
            event_type=ImmutableAuditEvent.EventType.DOCUMENT_UPLOADED,
            actor=gp_user,
            object_id=doc.id,
            object_repr=str(doc),
            content_type_label='deals.FundDocument',
            payload={
                'lp_profile_id': str(lp_profile.id),
                'quarter': quarter,
                'year': year
            }
        )
        
        return doc
    except Exception as e:
        logger.error(f"Error uploading PDF to B2: {e}")
        raise
