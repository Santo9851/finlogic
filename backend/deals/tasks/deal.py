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


@shared_task(name='deals.tasks.generate_memo_draft')
def generate_memo_draft(project_id):
    """
    Gathers all project data and uses DeepSeek R1 to draft a professional investment memo.
    """
    project = PEProject.objects.get(id=project_id)
    
    # Update progress
    progress = project.analysis_progress or {}
    progress['Memo'] = 'processing'
    project.analysis_progress = progress
    project.save()
    
    # 1. Gather Context
    financials = list(project.financials.values())
    scoring = project.scoring_runs.first()
    red_flags = list(project.red_flags.values('pattern__name', 'severity', 'ai_analysis'))
    commercial = project.commercial_analyses.first()
    operational = project.operational_analyses.first()
    regulatory = getattr(project, 'regulatory_checklist', None)
    
    # Get latest valuation models
    latest_dcf = project.valuations.filter(model_type='DCF').order_by('-created_at').first()
    latest_lbo = project.valuations.filter(model_type='LBO').order_by('-created_at').first()
    
    context_data = {
        "project_name": project.legal_name,
        "sector": project.sector,
        "deal_type": project.deal_type,
        "financials": financials,
        "dcf": latest_dcf.outputs if latest_dcf else {},
        "lbo": latest_lbo.outputs if latest_lbo else {},
        "lbo_assumptions": latest_lbo.assumptions if latest_lbo else {},
        "scoring_summary": {
            "total_score": scoring.total_deal_score if scoring else "N/A",
            "pillars": list(scoring.criteria_scores.values('pillar', 'criterion_id', 'gp_score', 'ai_score')) if scoring else []
        },
        "red_flags": red_flags,
        "commercial_analysis": {
            "top_customers": commercial.top_customer_names if commercial else [],
            "market_notes": commercial.market_positioning_notes if commercial else ""
        } if commercial else None,
        "operational_analysis": {
            "risks": operational.operational_red_flags if operational else [],
            "tech_stack": operational.technology_stack if operational else {}
        } if operational else None,
        "regulatory": {
            "fitta": regulatory.fitta_approval_required if regulatory else False,
            "nrb": regulatory.nrb_approval_required if regulatory else False
        } if regulatory else None
    }
    
    # 2. Call AI Client (Routing to DeepSeek R1 for memo drafting)
    client = AIModelClient()
    raw_json = client.execute_task("memo_draft", context_data, project=project)
    
    # 3. Parse and Save
    try:
        # Clean JSON if AI wrapped it in markdown
        if "```json" in raw_json:
            raw_json = raw_json.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_json:
            raw_json = raw_json.split("```")[1].split("```")[0].strip()
            
        data = json.loads(raw_json)
        
        # Ensure we have a version number
        latest_memo = project.memos.order_by('-version').first()
        new_version = (latest_memo.version + 1) if latest_memo else 1
        
        memo = DealMemo.objects.create(
            project=project,
            content=data,
            status='DRAFT',
            version=new_version
        )
        
        # Finalize progress
        progress = project.analysis_progress or {}
        progress['Memo'] = 'completed'
        project.analysis_progress = progress
        project.save()
        
        return f"Memo v{new_version} drafted for {project.legal_name}"
        
    except Exception as e:
        logger.error(f"Failed to parse memo draft JSON: {str(e)}")
        raise e



@shared_task(name='deals.tasks.move_project_documents_to_b2')
def move_project_documents_to_b2(project_id):
    """
    Moves all locally stored documents for a project to Backblaze B2.
    """
    from deals.b2_utils import upload_local_file_to_b2
    project = PEProject.objects.get(id=project_id)
    docs = project.documents.filter(local_file__isnull=False)
    
    count = 0
    for doc in docs:
        try:
            local_path = doc.local_file.path
            upload_local_file_to_b2(
                local_path=local_path,
                b2_key=doc.file_key,
                content_type=doc.mime_type
            )
            # Update doc to reflect it's now on B2 (clear local_file)
            doc.local_file = None
            doc.is_confirmed = True
            doc.save()
            count += 1
        except Exception as e:
            logger.error(f"Failed to move document {doc.id} to B2: {e}")
            
    return f"Moved {count} documents to B2 for project {project.legal_name}"


# ---------------------------------------------------------------------------
# Phase 2: AI Valuation, Term Sheet, SPA Draft Tasks
# ---------------------------------------------------------------------------


@shared_task(name='deals.tasks.generate_ai_term_sheet')
def generate_ai_term_sheet(project_id, user_id=None):
    """
    Uses Gemini to generate an initial term sheet based on valuation models,
    scoring results, and deal context.
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    try:
        project = PEProject.objects.get(id=project_id)
        project.refresh_from_db() # Get latest valuation metrics
        
        user = User.objects.get(id=user_id) if user_id else None
        client = AIModelClient()

        # 1. Gather context
        dcf = project.valuations.filter(model_type='DCF').first()
        lbo = project.valuations.filter(model_type='LBO').first()
        scoring = project.scoring_runs.order_by('-created_at').first()
        fund = project.fund
        memo = project.memos.order_by('-version').first()

        # 1. Update Progress
        progress = project.analysis_progress or {}
        progress['Term Sheet'] = 'processing'
        project.analysis_progress = progress
        project.save(update_fields=['analysis_progress'])

        context_data = {
            "project_name": project.legal_name,
            "sector": project.get_sector_display(),
            "business_description": project.business_description,
            "investment_memo_summary": memo.content.get('executive_summary', 'N/A') if memo and memo.content else "N/A",
            "dcf_enterprise_value": str(dcf.outputs.get("enterprise_value", "N/A")) if dcf else "N/A",
            "dcf_equity_value": str(dcf.outputs.get("equity_value", "N/A")) if dcf else "N/A",
            "lbo_irr": str(lbo.outputs.get("irr", "N/A")) if lbo else "N/A",
            "lbo_moic": str(lbo.outputs.get("moic", "N/A")) if lbo else "N/A",
            "scoring_total": str(scoring.total_deal_score) if scoring else "N/A",
            "fund_name": fund.name,
            "fund_target_size": str(fund.target_size_npr),
            "investment_range_min": str(project.investment_range_min_npr or "N/A"),
            "investment_range_max": str(project.investment_range_max_npr or "N/A"),
            "nepal_context": "Nepal PE market. Currency: NPR. Standard PE terms for growth capital.",
        }
        
        logger.info(f"Generating AI Term Sheet for {project.legal_name} with context: {context_data}")

        # 2. Call AI
        raw_json = client.execute_task("term_sheet_draft", context_data, project=project)

        # 3. Parse
        clean = raw_json or ""
        if "```json" in clean:
            clean = clean.split("```json")[1].split("```")[0].strip()
        elif "```" in clean:
            parts = clean.split("```")
            if len(parts) > 2:
                clean = parts[1].strip()
            
        try:
            if not clean:
                raise ValueError("AI returned an empty response.")
            data = json.loads(clean)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse term sheet JSON. Raw response: {raw_json[:500]}...")
            raise ValueError(f"AI returned malformed JSON. Raw: {raw_json[:500]}") from e

        # 4. Get version
        latest = project.term_sheets.order_by('-version').first()
        new_version = (latest.version + 1) if latest else 1

        # 5. Save
        term_sheet = TermSheet.objects.create(
            project=project,
            terms=data,
            ai_generated_terms=data,
            version=new_version,
            status='DRAFT',
            created_by=user,
        )

        logger.info(f"AI Term Sheet v{new_version} generated for {project.legal_name}")
        
        # Clear progress
        progress = project.analysis_progress or {}
        if 'Term Sheet' in progress:
            del progress['Term Sheet']
        project.analysis_progress = progress
        project.save(update_fields=['analysis_progress'])
        
        return {"term_sheet_id": str(term_sheet.id), "version": new_version}

    except Exception as e:
        logger.error(f"Error in generate_ai_term_sheet: {str(e)}")
        # Clear progress on error
        progress = project.analysis_progress or {}
        if 'Term Sheet' in progress:
            del progress['Term Sheet']
        project.analysis_progress = progress
        project.save(update_fields=['analysis_progress'])
        raise e



@shared_task(name='deals.tasks.generate_ai_spa_draft')
def generate_ai_spa_draft(project_id, user_id=None):
    """
    Uses Gemini to generate an initial SPA (Share Purchase Agreement) draft
    based on term sheet, regulatory context, and deal details.
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    try:
        project = PEProject.objects.get(id=project_id)
        user = User.objects.get(id=user_id) if user_id else None
        client = AIModelClient()

        # 1. Gather context
        term_sheet = project.term_sheets.order_by('-version').first()
        regulatory = getattr(project, 'regulatory_checklist', None)
        fund = project.fund

        context_data = {
            "project_name": project.legal_name,
            "sector": project.get_sector_display(),
            "deal_type": project.get_deal_type_display(),
            "term_sheet_terms": json.dumps(term_sheet.terms if term_sheet else {}, default=str),
            "fund_name": fund.name,
            "fitta_required": str(regulatory.fitta_approval_required) if regulatory else "Unknown",
            "nrb_required": str(regulatory.nrb_approval_required) if regulatory else "Unknown",
            "nepal_context": (
                "Nepal jurisdiction. Governing law: Nepal Contract Act 2056. "
                "Company Act 2063 applies. Securities Act 2063 for listed entities. "
                "Foreign Investment and Technology Transfer Act (FITTA) 2075 for FDI."
            ),
        }

        # 2. Call AI
        raw_json = client.execute_task("spa_draft", context_data, project=project)

        # 3. Parse
        clean = raw_json
        if "```json" in clean:
            clean = clean.split("```json")[1].split("```")[0].strip()
        elif "```" in clean:
            clean = clean.split("```")[1].split("```")[0].strip()

        data = json.loads(clean)



        # 4. Get version
        latest = project.spa_drafts.order_by('-version').first()
        new_version = (latest.version + 1) if latest else 1

        # 5. Save
        spa = SPADraft.objects.create(
            project=project,
            sections=data,
            ai_generated_sections=data,
            version=new_version,
            status='DRAFT',
            created_by=user,
        )

        logger.info(f"AI SPA Draft v{new_version} generated for {project.legal_name}")
        
        # Clear progress
        progress = project.analysis_progress or {}
        if 'SPA Draft' in progress:
            del progress['SPA Draft']
        project.analysis_progress = progress
        project.save(update_fields=['analysis_progress'])

        return {"spa_draft_id": str(spa.id), "version": new_version}

    except Exception as e:
        logger.error(f"Error in generate_ai_spa_draft: {str(e)}")
        # Clear progress on error
        progress = project.analysis_progress or {}
        if 'SPA Draft' in progress:
            del progress['SPA Draft']
        project.analysis_progress = progress
        project.save(update_fields=['analysis_progress'])
        raise e


