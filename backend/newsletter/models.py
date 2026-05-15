import uuid
from django.db import models
from django.utils.text import slugify
from django.utils import timezone

class Subscriber(models.Model):
    SEGMENT_CHOICES = [
        ('founder', 'Founder'),
        ('lp', 'LP'),
        ('international', 'International'),
        ('general', 'General'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('unsub', 'Unsubscribed'),
        ('bounced', 'Bounced'),
    ]

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100, blank=True)
    segment = models.CharField(max_length=20, choices=SEGMENT_CHOICES, default='general')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    source = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email

    def unsubscribe(self):
        self.status = 'unsub'
        self.unsubscribed_at = timezone.now()
        self.save()

class Issue(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('sent', 'Sent'),
    ]

    issue_number = models.PositiveIntegerField(unique=True)
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    deck = models.TextField(blank=True, help_text="One-line summary or 'deck' for the issue")
    subject_line = models.CharField(max_length=255, blank=True)
    
    # Six sections
    section_signal = models.TextField(blank=True)
    section_thesis = models.TextField(blank=True)
    section_founders = models.TextField(blank=True)
    section_lp = models.TextField(blank=True)
    section_data = models.TextField(blank=True)
    section_question = models.TextField(blank=True)
    
    body_html = models.TextField(blank=True, help_text="Override field for custom HTML if needed")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    target_segment = models.CharField(max_length=20, choices=Subscriber.SEGMENT_CHOICES, default='general')
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    sent_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Issue {self.issue_number}: {self.title}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.issue_number}-{self.title}")
        if not self.subject_line:
            self.subject_line = f"Capital Lines · Issue {self.issue_number} — {self.title}"
        super().save(*args, **kwargs)

class SendEvent(models.Model):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='send_events')
    subscriber = models.ForeignKey(Subscriber, on_delete=models.CASCADE, related_name='send_events')
    sent_at = models.DateTimeField(auto_now_add=True)
    
    opened = models.BooleanField(default=False)
    opened_at = models.DateTimeField(null=True, blank=True)
    open_count = models.PositiveIntegerField(default=0)
    
    clicked = models.BooleanField(default=False)
    clicked_at = models.DateTimeField(null=True, blank=True)
    click_count = models.PositiveIntegerField(default=0)
    
    bounced = models.BooleanField(default=False)
    bounce_type = models.CharField(max_length=50, blank=True)
    
    tracking_token = models.UUIDField(default=uuid.uuid4, db_index=True, unique=True)

    class Meta:
        unique_together = ('issue', 'subscriber')

    def __str__(self):
        return f"{self.issue.issue_number} -> {self.subscriber.email}"

    def record_open(self):
        self.opened = True
        self.opened_at = timezone.now()
        self.open_count += 1
        self.save()

    def record_click(self):
        self.clicked = True
        self.clicked_at = timezone.now()
        self.click_count += 1
        self.save()

class UnsubscribeToken(models.Model):
    subscriber = models.OneToOneField(Subscriber, on_delete=models.CASCADE, related_name='unsub_token')
    token = models.UUIDField(default=uuid.uuid4, unique=True)

    def __str__(self):
        return f"Token for {self.subscriber.email}"
