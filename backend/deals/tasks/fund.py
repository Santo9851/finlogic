import json
import logging
import time
import fitz  # PyMuPDF
import requests
from celery import shared_task, chain
import os
from django.conf import settings

from django.db import models
from django.utils import timezone
from deals.models import (
    PEProject, 
    PEProjectDocument, 
    ExtractedFinancials, 
    QoEReport,
    CommercialAnalysis,
    OperationalAnalysis,
    AICallLog,
    RedFlagPattern,
    RedFlagFinding,
    ScoringRun,
    CriterionScore,
    ComplianceGate,
    RegulatoryChecklist,
    DealMemo,
    Fund,
    LPFundCommitment,
    LPProfile,
    FundDocument,
    ValuationModel,
    TermSheet,
    SPADraft,
    ImmutableAuditEvent,
)
from deals.pdf_utils import generate_capital_account_pdf, upload_pdf_to_b2
from deals.mail_utils import send_statement_notification, send_capital_call_notification
from deals.signals import _log_audit_event



import re


from deals.ai_client import AIModelClient
from deals.b2_utils import generate_presigned_download_url

logger = logging.getLogger(__name__)

from deals.models import CapitalCall


@shared_task(name='deals.tasks.generate_lp_statements')
def generate_lp_statements(fund_id, quarter, year, lpprofile_id=None, gp_user_id=None):
    """
    Generate capital account statements for one or all LPs in a fund.
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    try:
        fund = Fund.objects.get(id=fund_id)
        gp_user = User.objects.get(id=gp_user_id) if gp_user_id else None
        
        # Determine LPs to process
        if lpprofile_id:
            commitments = LPFundCommitment.objects.filter(fund=fund, lp_profile_id=lpprofile_id)
        else:
            commitments = LPFundCommitment.objects.filter(fund=fund)
            
        count = 0
        for lp_commitment in commitments:
            lp_profile = lp_commitment.lp_profile
            file_name = f"Statement_{fund.name.replace(' ', '_')}_{quarter}_{year}_{lp_profile.id}"
            
            # 1. Generate PDF
            pdf_bytes = generate_capital_account_pdf(lp_commitment, quarter, year)
            
            # 2. Upload to B2 and create record
            upload_pdf_to_b2(pdf_bytes, file_name, fund, lp_commitment, quarter, year, gp_user)
            
            # 3. Send email notification
            send_statement_notification(lp_profile, fund, quarter, year)
            
            count += 1
            
        return {
            "status": "success",
            "message": f"Generated {count} statements for {fund.name} ({quarter} {year})",
            "count": count
        }
    except Exception as e:
        logger.error(f"Error in generate_lp_statements: {e}")
        return {
            "status": "error",
            "message": str(e)
        }





@shared_task(name='deals.tasks.batch_send_capital_call_emails')
def batch_send_capital_call_emails(call_ids):
    """
    Task to send capital call emails in the background.
    """
    from deals.models import CapitalCall
    for call_id in call_ids:
        try:
            call = CapitalCall.objects.select_related('lp_commitment__lp_profile__user', 'fund', 'project').get(id=call_id)
            lp_profile = call.lp_commitment.lp_profile
            if lp_profile and lp_profile.user.email:
                send_capital_call_notification(
                    lp_profile=lp_profile,
                    fund=call.fund,
                    project=call.project,
                    amount_npr=float(call.amount_npr),
                    due_date=str(call.due_date)
                )
                # Update notice_sent_at
                call.notice_sent_at = timezone.now()
                call.save(update_fields=['notice_sent_at'])
        except Exception as e:
            logger.error(f"Failed to send email for capital call {call_id}: {e}")


@shared_task(name='deals.tasks.generate_management_fee_accruals')
def generate_management_fee_accruals():
    """
    Quarterly task to generate management fee accruals for all active funds.
    """
    from deals.models import Fund
    from deals.fee_utils import generate_accruals_for_fund
    
    funds = Fund.objects.filter(status__in=[Fund.Status.INVESTING, Fund.Status.HARVESTING])
    accrual_count = 0
    
    for fund in funds:
        created = generate_accruals_for_fund(fund)
        accrual_count += created
        
    return f"Generated {accrual_count} fee accruals across {funds.count()} funds."
