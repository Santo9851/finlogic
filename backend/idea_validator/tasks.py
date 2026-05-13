import logging
from celery import shared_task
from django.utils import timezone
from .models import IdeaValidationSession
from .ai import ValidatorAIClient, build_answer_context

logger = logging.getLogger('django')

@shared_task(name="idea_validator.process_polished_report")
def process_polished_report(session_id):
    """Automatic task to generate the polished report."""
    try:
        session = IdeaValidationSession.objects.get(id=session_id)
        session.status = IdeaValidationSession.Status.PROCESSING
        session.progress_text = "Analyzing market dynamics..."
        session.save()
        
        context = build_answer_context(session)
        ai_client = ValidatorAIClient()
        
        # Fetch prompts from DB (with fallback)
        system_prompt, user_prompt_template = ai_client.get_prompts('polished_report')
        
        session.progress_text = "Architecting your report..."
        session.save()
        
        user_prompt = user_prompt_template.replace("[[CONTEXT]]", context)
        report_text = ai_client.call_gemini(system_prompt, user_prompt)
        
        # Extract Verdict
        verdict = "PIVOT REQUIRED"
        if "VIABLE" in report_text[:1000].upper(): verdict = "VIABLE"
        elif "DEAD ON ARRIVAL" in report_text[:1000].upper(): verdict = "DEAD ON ARRIVAL"
        
        session.polished_report = report_text
        session.verdict = verdict
        session.status = IdeaValidationSession.Status.COMPLETED
        session.progress_text = "Analysis complete"
        session.save()
        
        from .notifications import notify_validation_complete
        notify_validation_complete(session)
        
    except Exception as e:
        logger.error(f"Error in polished report task: {str(e)}")
        try:
            session = IdeaValidationSession.objects.get(id=session_id)
            session.status = IdeaValidationSession.Status.FAILED
            session.progress_text = f"Error: {str(e)}"
            session.save()
        except:
            pass

@shared_task(name="idea_validator.process_red_team_report")
def process_red_team_report(session_id):
    """Manual task triggered by admin to generate red-team report."""
    try:
        session = IdeaValidationSession.objects.get(id=session_id)
        context = build_answer_context(session)
        ai_client = ValidatorAIClient()
        
        # Fetch prompts from DB (with fallback)
        system_prompt, user_prompt_template = ai_client.get_prompts('red_team_report')
        
        user_prompt = user_prompt_template.replace("[[CONTEXT]]", context)
        report_text = ai_client.call_deepseek_r1(system_prompt, user_prompt)
        
        session.red_team_report = report_text
        session.save()
        
    except Exception as e:
        logger.error(f"Error in red-team report task: {str(e)}")
