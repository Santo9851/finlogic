import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.text import slugify
from django.utils import timezone


# ---------------------------------------------------------------------------
# Abstract Base Models
# ---------------------------------------------------------------------------

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class SoftDeleteModel(models.Model):
    """Abstract model for soft delete."""
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = models.Manager()  # The default manager
    active_objects = SoftDeleteManager()  # Custom manager for non-deleted items

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        self.deleted_at = timezone.now()
        self.save()

    def hard_delete(self, using=None, keep_parents=False):
        super().delete(using=using, keep_parents=keep_parents)


class BaseModel(SoftDeleteModel):
    """All models inherit UUID primary key + timestamps + soft delete."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ---------------------------------------------------------------------------
# 2.1 User Management
# ---------------------------------------------------------------------------

class User(AbstractUser, SoftDeleteModel):
    """
    Standard: Users
    id (UUID PK), email (Unique), password_hash (TEXT), first_name (TEXT), last_name (TEXT),
    phone (TEXT), role (ENUM), is_active (BOOLEAN), email_verified_at (TIMESTAMP),
    last_login_at (TIMESTAMP), created_at (TIMESTAMP), updated_at (TIMESTAMP),
    deleted_at (TIMESTAMP)
    """
    class Role(models.TextChoices):
        ENTREPRENEUR = 'entrepreneur', 'Entrepreneur'
        INVESTOR = 'investor', 'Investor'
        ADMIN = 'admin', 'Admin'
        SUPER_ADMIN = 'super_admin', 'Super Admin'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    roles = models.CharField(
        max_length=255, 
        default='entrepreneur', 
        help_text="Comma-separated roles. Valid roles: 'entrepreneur', 'investor' (LP), 'gp_investor' (GP Shareholder), 'admin', 'super_admin'."
    )
    is_approved = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email'], name='idx_users_email'),
            models.Index(fields=['deleted_at'], name='idx_users_deleted_at'),
        ]

    def __str__(self):
        name = f'{self.first_name} {self.last_name}'.strip()
        display = name or self.username
        return f'{display} ({self.roles})'

    @property
    def role_list(self):
        return [r.strip() for r in self.roles.split(',') if r.strip()]

    def has_role(self, role):
        return role in self.role_list


class RoleRequest(models.Model):
    """
    Requested additional role for an existing user.
    """
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='role_requests')
    requested_role = models.CharField(max_length=20, choices=User.Role.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    admin_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'role_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} -> {self.requested_role} ({self.status})'


class UserProfile(BaseModel):
    """
    Standard: user_profiles
    Extension table for role-specific data.
    id (UUID PK), user_id (UUID FK), profile_type (ENUM), data (JSONB),
    created_at, updated_at
    """
    class ProfileType(models.TextChoices):
        ENTREPRENEUR = 'entrepreneur', 'Entrepreneur'
        INVESTOR = 'investor', 'Investor'
        ADMIN = 'admin', 'Admin'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='profiles')
    profile_type = models.CharField(max_length=20, choices=ProfileType.choices, default=ProfileType.ENTREPRENEUR)
    data = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'user_profiles'
        indexes = [
            models.Index(fields=['user', 'profile_type'], name='idx_up_user_type'),
        ]


class Session(models.Model):
    """
    Standard: sessions
    For tracking user logins.
    id (UUID PK), user_id (UUID FK), token (TEXT), expires_at, created_at
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    token = models.TextField(unique=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sessions'


# ---------------------------------------------------------------------------
# 2.2 Project Submissions
# ---------------------------------------------------------------------------

class Project(BaseModel):
    """
    Standard: projects
    id (UUID PK), user_id (UUID FK), title (TEXT), slug (TEXT), status (ENUM),
    submission_data (JSONB), total_score (INTEGER), final_decision_notes (TEXT),
    submitted_at, reviewed_at, created_at, updated_at, deleted_at
    """
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SUBMITTED = 'submitted', 'Submitted'
        UNDER_REVIEW = 'under_review', 'Under Review'
        SHORTLISTED = 'shortlisted', 'Shortlisted'
        DECLINED = 'declined', 'Declined'
        APPROVED = 'approved', 'Approved'
        INVESTED = 'invested', 'Invested'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    submission_data = models.JSONField(default=dict, blank=True)
    total_score = models.IntegerField(default=0)
    final_decision_notes = models.TextField(blank=True, null=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'projects'
        indexes = [
            models.Index(fields=['user'], name='idx_projects_user'),
            models.Index(fields=['status'], name='idx_projects_status'),
            models.Index(fields=['total_score'], name='idx_projects_score'),
            models.Index(fields=['slug'], name='idx_projects_slug'),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Project.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class ProjectScore(models.Model):
    """
    Standard: project_scores
    id (UUID PK), project_id (UUID FK), pillar (ENUM), score (INTEGER),
    feedback (TEXT), weight (DECIMAL), created_at
    """
    class Pillar(models.TextChoices):
        VISION = 'vision', 'Vision'
        GROWTH = 'growth', 'Growth'
        LEADERSHIP = 'leadership', 'Leadership'
        INSIGHT = 'insight', 'Insight'
        PARTNERSHIP = 'partnership', 'Partnership'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='scores')
    pillar = models.CharField(max_length=20, choices=Pillar.choices)
    score = models.IntegerField(default=0)
    feedback = models.TextField(blank=True, null=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, default=0.20)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_scores'
        indexes = [
            models.Index(fields=['project', 'pillar'], name='idx_ps_proj_pillar'),
        ]


class ProjectFile(models.Model):
    """
    Standard: project_files
    id (UUID PK), project_id (UUID FK), file_name (TEXT), file_path (TEXT),
    file_type (TEXT), file_size (INTEGER), category (ENUM), uploaded_at
    """
    class Category(models.TextChoices):
        PITCH_DECK = 'pitch_deck', 'Pitch Deck'
        FINANCIAL_MODEL = 'financial_model', 'Financial Model'
        OTHER = 'other', 'Other'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='files')
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    file_type = models.CharField(max_length=100)
    file_size = models.IntegerField()
    category = models.CharField(max_length=20, choices=Category.choices)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_files'
        indexes = [
            models.Index(fields=['project', 'category'], name='idx_pf_proj_cat'),
        ]


class ProjectComment(models.Model):
    """
    Standard: project_comments
    id (UUID PK), project_id (UUID FK), user_id (UUID FK), comment (TEXT),
    is_internal (BOOLEAN), created_at
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    comment = models.TextField()
    is_internal = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_comments'


class ProjectEvaluation(BaseModel):
    """
    Stores analyst-confirmed (AI-assisted) deal evaluations.

    score_data (JSONB): full DealScore.to_dict() dict, plus an "ai_meta" key
    containing the AIScoringAssistant metadata for auditability.

    created via ProjectEvaluation.from_scoring_result() from ProjectEvaluateView.
    NEVER written to directly — always go through from_scoring_result().
    """

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name='evaluations'
    )
    evaluated_by = models.CharField(
        max_length=255,
        help_text="Email of the analyst who submitted the final evaluation."
    )
    score_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Full DealScore.to_dict() output plus 'ai_meta' block."
    )
    total_score = models.FloatField(
        default=0.0,
        help_text="Normalised total score (0-100) from ScoringEngine."
    )
    verdict = models.CharField(
        max_length=20,
        blank=True,
        help_text="Verdict string: fast_track | watchlist | passed | blocked."
    )

    class Meta:
        db_table = 'project_evaluations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['project'], name='idx_pe_project'),
            models.Index(fields=['evaluated_by'], name='idx_pe_analyst'),
        ]

    def __str__(self):
        return f'Evaluation of {self.project_id} by {self.evaluated_by} ({self.verdict})'

    @classmethod
    def from_scoring_result(
        cls,
        project,
        user_email: str,
        scoring_result: dict,
        ai_meta: dict | None = None,
    ) -> 'ProjectEvaluation':
        """
        Persist an evaluation from ScoringEngine.evaluate_and_memo() output.

        Args:
            project:        Project model instance being evaluated.
            user_email:     Email of the authenticated analyst (from request.user).
            scoring_result: Dict returned by ScoringEngine.evaluate_and_memo()
                            e.g. {"score": DealScore.to_dict(), "memo": {...}}
            ai_meta:        Optional ai_meta block from the AI draft to store
                            inside score_data for auditability.

        Returns:
            Saved ProjectEvaluation instance.
        """
        score_dict: dict = scoring_result.get('score', {})
        total_score: float = score_dict.get('total_score', 0.0)
        verdict: str = score_dict.get('verdict', '')

        # Embed ai_meta inside score_data for a full audit trail
        score_data = dict(scoring_result)
        if ai_meta:
            score_data['ai_meta'] = ai_meta

        instance = cls(
            project=project,
            evaluated_by=user_email,
            score_data=score_data,
            total_score=total_score,
            verdict=verdict,
        )
        instance.save()
        return instance


# ---------------------------------------------------------------------------
# 2.3 Investor Relations
# ---------------------------------------------------------------------------

class Investor(models.Model):
    """
    Standard: investors
    id (UUID PK), user_id (UUID FK), organization (TEXT), investor_type (ENUM),
    country (TEXT), accredited_status (BOOLEAN), created_at
    """
    class InvestorType(models.TextChoices):
        INDIVIDUAL = 'individual', 'Individual'
        FAMILY_OFFICE = 'family_office', 'Family Office'
        INSTITUTIONAL = 'institutional', 'Institutional'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='investor_profile', null=True, blank=True)
    organization = models.CharField(max_length=255, blank=True, null=True)
    investor_type = models.CharField(max_length=20, choices=InvestorType.choices)
    country = models.CharField(max_length=100, blank=True, null=True)
    accredited_status = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'investors'


class Fund(models.Model):
    """
    Standard: funds
    id (UUID PK), name (TEXT), vintage_year (INTEGER), target_size (DECIMAL),
    committed_capital (DECIMAL), status (ENUM), created_at
    """
    class Status(models.TextChoices):
        RAISING = 'raising', 'Raising'
        CLOSED = 'closed', 'Closed'
        FULLY_INVESTED = 'fully_invested', 'Fully Invested'
        LIQUIDATING = 'liquidating', 'Liquidating'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    vintage_year = models.IntegerField(null=True, blank=True)
    target_size = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    committed_capital = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RAISING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'funds'


class InvestorCommitment(models.Model):
    """
    Standard: investor_commitments
    id (UUID PK), investor_id (UUID FK), fund_id (UUID FK), commitment_amount (DECIMAL),
    called_amount (DECIMAL), distributed_amount (DECIMAL), commitment_date (DATE),
    project_id (UUID FK), notes (TEXT), status (ENUM), created_at
    """
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        CANCELLED = 'cancelled', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    investor = models.ForeignKey(Investor, on_delete=models.CASCADE, related_name='commitments')
    fund = models.ForeignKey(Fund, on_delete=models.CASCADE, related_name='commitments', null=True, blank=True)
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, related_name='investor_interests', null=True, blank=True)
    commitment_amount = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    called_amount = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    distributed_amount = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    commitment_date = models.DateField(default=timezone.now)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'investor_commitments'


class PortfolioCompany(models.Model):
    """
    Standard: portfolio_companies
    id (UUID PK), project_id (UUID FK optional), name (TEXT), sector (TEXT),
    country (TEXT), investment_date (DATE), investment_amount (DECIMAL),
    valuation (DECIMAL), current_valuation (DECIMAL), exit_date (DATE),
    exit_type (ENUM), exit_value (DECIMAL), created_at
    """
    class ExitType(models.TextChoices):
        IPO = 'ipo', 'IPO'
        ACQUISITION = 'acquisition', 'Acquisition'
        SECONDARY = 'secondary', 'Secondary'
        WRITE_OFF = 'write_off', 'Write Off'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=255)
    sector = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    investment_date = models.DateField(default=timezone.now)
    investment_amount = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    valuation = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    current_valuation = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    exit_date = models.DateField(null=True, blank=True)
    exit_type = models.CharField(max_length=20, choices=ExitType.choices, null=True, blank=True)
    exit_value = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'portfolio_companies'


class Deal(models.Model):
    """
    Standard: deals
    id (UUID PK), portfolio_company_id (UUID FK), fund_id (UUID FK),
    round_name (TEXT), investment_date (DATE), amount_invested (DECIMAL),
    ownership_percent (DECIMAL), created_at
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    portfolio_company = models.ForeignKey(PortfolioCompany, on_delete=models.CASCADE, related_name='deals')
    fund = models.ForeignKey(Fund, on_delete=models.CASCADE, related_name='deals', null=True, blank=True)
    round_name = models.CharField(max_length=100)
    investment_date = models.DateField(default=timezone.now)
    amount_invested = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    ownership_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'deals'


# ---------------------------------------------------------------------------
# 2.4 Educational Platform
# ---------------------------------------------------------------------------

class Course(BaseModel):
    """
    Standard: courses
    id (UUID PK), title (TEXT), slug (TEXT unique), description (TEXT),
    pillar (ENUM), level (ENUM), duration_hours (DECIMAL), featured_image (TEXT),
    is_published (BOOLEAN), created_at, updated_at
    """
    class Level(models.TextChoices):
        BEGINNER = 'beginner', 'Beginner'
        INTERMEDIATE = 'intermediate', 'Intermediate'
        ADVANCED = 'advanced', 'Advanced'

    class Pillar(models.TextChoices):
        VISION = 'vision', 'Vision'
        GROWTH = 'growth', 'Growth'
        LEADERSHIP = 'leadership', 'Leadership'
        INSIGHT = 'insight', 'Insight'
        PARTNERSHIP = 'partnership', 'Partnership'

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    pillar = models.CharField(max_length=20, choices=Pillar.choices, null=True, blank=True)
    level = models.CharField(max_length=20, choices=Level.choices, default=Level.BEGINNER)
    duration_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    featured_image = models.CharField(max_length=500, blank=True, null=True)
    is_published = models.BooleanField(default=False)

    class Meta:
        db_table = 'courses'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)


class CourseModule(models.Model):
    """
    Standard: course_modules
    id (UUID PK), course_id (UUID FK), title (TEXT), position (INTEGER),
    content (TEXT), video_url (TEXT), created_at
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=255)
    position = models.IntegerField()
    content = models.TextField(blank=True, null=True)
    video_url = models.CharField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'course_modules'


class Lesson(models.Model):
    """
    Standard: lessons
    id (UUID PK), module_id (UUID FK), title (TEXT), content (TEXT),
    video_url (TEXT), position (INTEGER), created_at
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(CourseModule, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True, null=True)
    video_url = models.CharField(max_length=500, blank=True, null=True)
    position = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lessons'


class Enrollment(models.Model):
    """
    Standard: enrollments
    id (UUID PK), user_id (UUID FK), course_id (UUID FK), status (ENUM),
    progress_percent (INTEGER), completed_at, enrolled_at, last_accessed_at
    """
    class Status(models.TextChoices):
        ENROLLED = 'enrolled', 'Enrolled'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ENROLLED)
    progress_percent = models.IntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    last_accessed_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'enrollments'


class LessonCompletion(models.Model):
    """
    Standard: lesson_completions
    id (UUID PK), user_id (UUID FK), lesson_id (UUID FK), completed_at
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lesson_completions'


class Article(BaseModel):
    """
    Standard: articles
    id (UUID PK), title (TEXT), slug (TEXT), excerpt (TEXT), content (TEXT),
    author_id (UUID FK), featured_image (TEXT), pillar (ENUM), is_published (BOOLEAN),
    published_at, created_at, updated_at
    """
    class Pillar(models.TextChoices):
        VISION = 'vision', 'Vision'
        GROWTH = 'growth', 'Growth'
        LEADERSHIP = 'leadership', 'Leadership'
        INSIGHT = 'insight', 'Insight'
        PARTNERSHIP = 'partnership', 'Partnership'

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    excerpt = models.TextField(blank=True, null=True)
    content = models.TextField(blank=True, default='')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='articles')
    featured_image = models.CharField(max_length=500, blank=True, null=True,
                                      help_text="Paste a public image URL here, OR upload a file below.")
    featured_image_file = models.ImageField(
        upload_to='articles/',
        blank=True, null=True,
        help_text="Upload an image file directly (JPG/PNG/WebP, ≥1200×630 px recommended). "
                  "If both a URL and a file are provided, the uploaded file takes priority."
    )
    pillar = models.CharField(max_length=20, choices=Pillar.choices, null=True, blank=True)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'articles'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    @property
    def cover_image_url(self):
        """Returns the best available image URL: uploaded file > URL field."""
        if self.featured_image_file:
            return self.featured_image_file.url
        return self.featured_image or ''




class Webinar(BaseModel):
    """
    Standard: webinars
    id (UUID PK), title (TEXT), description (TEXT), speaker (TEXT),
    scheduled_at, duration_minutes (INTEGER), registration_url (TEXT),
    recording_url (TEXT), pillar (ENUM), is_published (BOOLEAN), created_at
    """
    class Pillar(models.TextChoices):
        VISION = 'vision', 'Vision'
        GROWTH = 'growth', 'Growth'
        LEADERSHIP = 'leadership', 'Leadership'
        INSIGHT = 'insight', 'Insight'
        PARTNERSHIP = 'partnership', 'Partnership'

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    speaker = models.CharField(max_length=255, default='')
    scheduled_at = models.DateTimeField(default=timezone.now)
    duration_minutes = models.IntegerField(default=60)
    registration_url = models.CharField(max_length=500, blank=True, null=True)
    recording_url = models.CharField(max_length=500, blank=True, null=True)
    pillar = models.CharField(max_length=20, choices=Pillar.choices, null=True, blank=True)
    is_published = models.BooleanField(default=False)

    class Meta:
        db_table = 'webinars'


class WebinarRegistration(models.Model):
    """
    Standard: webinar_registrations
    id (UUID PK), webinar_id (UUID FK), user_id (UUID FK optional),
    email (TEXT), name (TEXT), attended (BOOLEAN), registered_at
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    webinar = models.ForeignKey(Webinar, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    email = models.EmailField()
    name = models.CharField(max_length=255)
    attended = models.BooleanField(default=False)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'webinar_registrations'


# ---------------------------------------------------------------------------
# 2.5 CRM / Communication
# ---------------------------------------------------------------------------

class Contact(models.Model):
    """
    Standard: contacts
    id (UUID PK), email (TEXT), first_name (TEXT), last_name (TEXT),
    company (TEXT), source (TEXT), status (ENUM), notes (TEXT), created_at
    """
    class Status(models.TextChoices):
        LEAD = 'lead', 'Lead'
        PROSPECT = 'prospect', 'Prospect'
        CUSTOMER = 'customer', 'Customer'
        PARTNER = 'partner', 'Partner'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField()
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    company = models.CharField(max_length=255, blank=True, null=True)
    source = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'contacts'


class ContactInteraction(models.Model):
    """
    Standard: contact_interactions
    id (UUID PK), contact_id (UUID FK), user_id (UUID FK), type (ENUM),
    description (TEXT), interaction_date, created_at
    """
    class Type(models.TextChoices):
        EMAIL = 'email', 'Email'
        CALL = 'call', 'Call'
        MEETING = 'meeting', 'Meeting'
        NOTE = 'note', 'Note'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='interactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    type = models.CharField(max_length=20, choices=Type.choices)
    description = models.TextField()
    interaction_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'contact_interactions'


# ---------------------------------------------------------------------------
# 2.6 System / Audit
# ---------------------------------------------------------------------------

class AuditLog(models.Model):
    """
    Standard: audit_logs
    id (UUID PK), table_name (TEXT), record_id (UUID), user_id (UUID FK),
    action (ENUM), old_data (JSONB), new_data (JSONB), created_at
    """
    class Action(models.TextChoices):
        INSERT = 'INSERT', 'Insert'
        UPDATE = 'UPDATE', 'Update'
        DELETE = 'DELETE', 'Delete'
        SOFT_DELETE = 'SOFT_DELETE', 'Soft Delete'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    table_name = models.CharField(max_length=100)
    record_id = models.UUIDField()
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=20, choices=Action.choices)
    old_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
