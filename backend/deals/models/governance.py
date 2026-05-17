from django.contrib.auth import get_user_model
"""
deals/models.py
Private-Equity deal management models.

Deliberately isolated from core.Project (VC-focused).
All monetary amounts are in NPR (Nepalese Rupees).
"""
import uuid
import re

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone

User = settings.AUTH_USER_MODEL


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

User = get_user_model()

class GovernanceProposal(models.Model):
    """Proposals that GP Shareholders can vote on."""
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        ACTIVE = 'ACTIVE', 'Active'
        CLOSED = 'CLOSED', 'Closed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    expiry_date = models.DateTimeField()
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_proposals')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_governance_proposals'
        ordering = ['-created_at']

    def __str__(self):
        return self.title



class ProposalVote(models.Model):
    """Individual votes cast by GP Shareholders."""
    class Choice(models.TextChoices):
        FOR = 'FOR', 'For'
        AGAINST = 'AGAINST', 'Against'
        ABSTAIN = 'ABSTAIN', 'Abstain'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proposal = models.ForeignKey('GovernanceProposal', on_delete=models.CASCADE, related_name='votes')
    shareholder = models.ForeignKey('GPShareholder', on_delete=models.CASCADE, related_name='votes')
    choice = models.CharField(max_length=20, choices=Choice.choices)
    
    # Snapshot of voting weight at time of vote
    shares_at_voting = models.DecimalField(max_digits=15, decimal_places=2)
    
    voted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pe_proposal_votes'
        unique_together = ('proposal', 'shareholder')

    def __str__(self):
        return f'{self.shareholder.user.email} - {self.proposal.title} ({self.choice})'


# ---------------------------------------------------------------------------
# 14. IR Documents (Global Shareholder Relations)
# ---------------------------------------------------------------------------


class IRDocument(models.Model):
    """Global documents for GP Shareholders (Annual Reports, Notices)."""
    class Category(models.TextChoices):
        FINANCIAL = 'FINANCIAL', 'Financial Report'
        LEGAL = 'LEGAL', 'Legal/Regulatory'
        MEETING = 'MEETING', 'Board/Shareholder Meeting'
        GENERAL = 'GENERAL', 'General Announcement'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='ir_docs/%Y/%m/%d/')
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.GENERAL)
    is_published = models.BooleanField(default=False)
    
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_ir_docs')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_ir_documents'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.title} ({self.category})'



class GPInvestorMeeting(models.Model):
    """Secure strategic meetings and sessions for GP Shareholders."""
    class MeetingType(models.TextChoices):
        VIDEO_PROTOCOL = 'VIDEO_PROTOCOL', 'Secure Video Protocol'
        BOARD_SESSION = 'BOARD_SESSION', 'Board/IC Session'
        TOWN_HALL = 'TOWN_HALL', 'Shareholder Town Hall'
        STRATEGIC_REVIEW = 'STRATEGIC_REVIEW', 'Strategic Review'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    speaker = models.CharField(max_length=255, help_text="Host/Managing Partner")
    scheduled_at = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    meeting_link = models.URLField(max_length=500, blank=True, null=True)
    recording_url = models.URLField(max_length=500, blank=True, null=True)
    meeting_type = models.CharField(max_length=30, choices=MeetingType.choices, default=MeetingType.VIDEO_PROTOCOL)
    is_published = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_gp_investor_meetings'
        ordering = ['-scheduled_at']

    def __str__(self):
        return f"{self.title} - {self.scheduled_at.date()}"



class GPInvestorMeetingRequest(models.Model):
    """1-on-1 meeting requests from GP Shareholders to Managing Partners."""
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SCHEDULED = 'SCHEDULED', 'Scheduled'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gp_meeting_requests')
    preferred_date = models.DateField(null=True, blank=True)
    preferred_time = models.CharField(max_length=50, blank=True, help_text="e.g. Morning, 2 PM")
    topic = models.CharField(max_length=255)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_gp_meeting_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"Request by {self.user.email} - {self.topic}"


# ---------------------------------------------------------------------------
# 15. AI Infrastructure
# ---------------------------------------------------------------------------

