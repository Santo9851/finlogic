import uuid
from django.db import models
from django.conf import settings
from core.models import BaseModel
from django.utils import timezone

class IdeaValidatorQuota(models.Model):
    """
    Tracks the remaining validations for a user.
    Each user receives 1 free validation per calendar quarter by default.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='idea_validator_quota'
    )
    remaining_validations = models.IntegerField(default=1)
    last_reset_quarter = models.CharField(
        max_length=10, 
        help_text="Format: YYYY-QN (e.g., 2026-Q2)"
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'idea_validator_quotas'
        verbose_name = "Idea Validator Quota"
        verbose_name_plural = "Idea Validator Quotas"

    def __str__(self):
        return f"{self.user.email} - Remaining: {self.remaining_validations}"

    @staticmethod
    def get_current_quarter_string():
        now = timezone.now()
        quarter = (now.month - 1) // 3 + 1
        return f"{now.year}-Q{quarter}"

class QuotaAdjustmentLog(models.Model):
    """
    Audit log for manual quota adjustments by super-admins.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='quota_adjustments'
    )
    adjusted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='performed_quota_adjustments'
    )
    old_value = models.IntegerField()
    new_value = models.IntegerField()
    change_amount = models.IntegerField()
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'idea_validator_quota_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"Adjustment for {self.user.email}: {self.change_amount} by {self.adjusted_by.email if self.adjusted_by else 'System'}"

class IdeaValidationSession(BaseModel):
    """
    A single idea validation session.
    Isolated from PE deal pipeline.
    """
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SUBMITTED = 'submitted', 'Submitted'
        PROCESSING = 'processing', 'Processing'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='validation_sessions'
    )
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.DRAFT
    )
    current_step = models.IntegerField(default=1, help_text="Current step being worked on (1-5)")
    form_step_completed = models.IntegerField(default=0, help_text="Highest step completed")
    progress_text = models.CharField(max_length=255, blank=True, null=True, help_text="Progress description (e.g., 'Phase 3 of 8')")
    verdict = models.CharField(max_length=50, blank=True, null=True, help_text="AI generated verdict (Pass/Fail/etc.)")
    
    # AI Reports
    polished_report = models.TextField(
        blank=True, 
        null=True, 
        help_text="Rich text report visible to user and super-admins."
    )
    red_team_report = models.TextField(
        blank=True, 
        null=True, 
        help_text="Rich text report visible ONLY to super-admins."
    )

    class Meta:
        db_table = 'idea_validation_sessions'
        verbose_name = "Idea Validation Session"
        verbose_name_plural = "Idea Validation Sessions"

    def __str__(self):
        return f"Session {self.id} - {self.user.email} ({self.status})"

class ValidationAnswer(models.Model):
    """
    Answers to the 25 FINLO questions.
    """
    session = models.ForeignKey(
        IdeaValidationSession, 
        on_delete=models.CASCADE, 
        related_name='answers'
    )
    question_number = models.IntegerField(help_text="1 to 25")
    selected_option = models.TextField(blank=True, null=True)
    other_text = models.TextField(blank=True, null=True)
    free_text_response = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'idea_validation_answers'
        unique_together = ('session', 'question_number')
        ordering = ['question_number']

    def __str__(self):
        return f"Session {self.session.id} - Q{self.question_number}"

class ValidatorPrompt(models.Model):
    """Central repository for Validator AI prompts."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task_type = models.CharField(max_length=50, unique=True, help_text="e.g., 'polished_report' or 'red_team_report'")
    system_prompt = models.TextField()
    user_prompt_template = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'validator_prompts'
        verbose_name = 'Validator Prompt'
        verbose_name_plural = 'Validator Prompts'

    def __str__(self):
        return f"Prompt: {self.task_type} (Active: {self.is_active})"

class ValidationSubmissionLog(models.Model):
    """
    Audit log for validation submissions.
    """
    session = models.OneToOneField(
        IdeaValidationSession, 
        on_delete=models.CASCADE, 
        related_name='submission_log'
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = 'idea_validator_submission_logs'

    def __str__(self):
        return f"Submission log for {self.session.id}"

class Question(models.Model):
    """
    Dynamic validator questions.
    """
    order = models.IntegerField(unique=True, help_text="Question number (1-25)")
    pillar = models.CharField(max_length=1, choices=[('F', 'Foresight'), ('I', 'Insight'), ('N', 'Nexus'), ('L', 'Logic'), ('O', 'Odyssey')])
    title_en = models.CharField(max_length=255)
    title_ne = models.CharField(max_length=255)
    question_en = models.TextField()
    question_ne = models.TextField()
    hint_en = models.TextField(blank=True, null=True)
    hint_ne = models.TextField(blank=True, null=True)
    allow_other = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'idea_validator_questions'
        ordering = ['order']

    def __str__(self):
        return f"Q{self.order}: {self.title_en}"

class Option(models.Model):
    """
    Options for a specific question.
    """
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options_list')
    text_en = models.TextField()
    text_ne = models.TextField()
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'idea_validator_options'
        ordering = ['order']

    def __str__(self):
        return f"{self.question.order} - {self.text_en[:30]}"
