from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.shortcuts import render
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.urls import path, reverse
from django.utils import timezone
from django.db.models import Count, Q
from .utils.scoring import ScoringEngine, get_blank_payload_template

from .models import (
    User,
    RoleRequest,
    UserProfile,
    Session,
    Project,
    ProjectScore,
    ProjectFile,
    ProjectComment,
    Investor,
    Fund,
    InvestorCommitment,
    PortfolioCompany,
    Deal,
    Course,
    CourseModule,
    Lesson,
    Enrollment,
    LessonCompletion,
    Article,
    Webinar,
    WebinarRegistration,
    Contact,
    ContactInteraction,
    AuditLog,
)


# ---------------------------------------------------------------------------
# Site customisation
# ---------------------------------------------------------------------------

admin.site.site_header = "Finlogic Capital CMS"
admin.site.site_title  = "Finlogic Admin"
admin.site.index_title = "Content Management"


# ---------------------------------------------------------------------------
# Mixins & Filters
# ---------------------------------------------------------------------------

class DeletedListFilter(admin.SimpleListFilter):
    title = 'Deletion Status'
    parameter_name = 'is_deleted'

    def lookups(self, request, model_admin):
        return (
            ('no', 'Active (Non-deleted)'),
            ('yes', 'Deleted'),
            ('all', 'Show All'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'no':
            return queryset.filter(deleted_at__isnull=True)
        if self.value() == 'yes':
            # Use the underlying manager to bypass the default soft-delete filter
            return queryset.model.all_objects.filter(deleted_at__isnull=False)
        if self.value() == 'all':
            return queryset.model.all_objects.all()
        return queryset


# ---------------------------------------------------------------------------
# User & Profile
# ---------------------------------------------------------------------------

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    extra = 0


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = [UserProfileInline]
    list_display = ('email', 'username', 'roles', 'is_approved', 'is_active', 'created_at')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Platform Access', {'fields': ('is_approved', 'roles')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Platform Access', {'fields': ('is_approved', 'roles')}),
    )
    list_filter = (DeletedListFilter, 'roles', 'is_approved', 'is_active')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-created_at',)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'profile_type', 'created_at')
    list_filter = ('profile_type',)
    search_fields = ('user__email', 'user__username')


@admin.register(RoleRequest)
class RoleRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'requested_role', 'status', 'created_at')
    list_filter = ('status', 'requested_role')
    search_fields = ('user__email',)
    actions = ['approve_requests']

    @admin.action(description="Approve and add roles to users")
    def approve_requests(self, request, queryset):
        for role_request in queryset:
            if role_request.status == RoleRequest.Status.PENDING:
                user = role_request.user
                if role_request.requested_role not in user.role_list:
                    roles = user.role_list
                    roles.append(role_request.requested_role)
                    user.roles = ','.join(roles)
                    user.save()
                role_request.status = RoleRequest.Status.APPROVED
                role_request.save()
        self.message_user(request, "Selected requests approved.")


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'expires_at', 'created_at')
    raw_id_fields = ('user',)


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------

class ProjectScoreInline(admin.TabularInline):
    model = ProjectScore
    extra = 0


class ProjectFileInline(admin.TabularInline):
    model = ProjectFile
    extra = 0


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    inlines = [ProjectScoreInline, ProjectFileInline]
    list_display = ('title', 'user', 'status', 'total_score', 'submitted_at', 'ic_memo_link')
    list_filter = ('status', 'deleted_at')
    search_fields = ('title', 'user__email', 'user__username')
    prepopulated_fields = {'slug': ('title',)}
    raw_id_fields = ('user',)
    readonly_fields = ('ic_memo_link',)

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<uuid:project_id>/ic-memo/', self.admin_site.admin_view(self.ic_memo_view), name='project-ic-memo'),
        ]
        return custom_urls + urls

    def ic_memo_view(self, request, project_id):
        project = Project.objects.get(pk=project_id)
        engine = ScoringEngine()
        payload = get_blank_payload_template()
        payload["company_name"] = project.title
        payload["deal_id"] = str(project.id)
        payload["evaluated_by"] = request.user.email

        if project.submission_data:
            if "criteria_scores" in project.submission_data:
                payload["criteria_scores"] = project.submission_data["criteria_scores"]
            if "compliance_gates" in project.submission_data:
                payload["compliance_gates"] = project.submission_data["compliance_gates"]

        result = engine.evaluate_and_memo(payload)
        context = {
            **self.admin_site.each_context(request),
            'project': project,
            'memo': result['memo'],
            'score': result['score'],
            'title': f"IC Memo: {project.title}",
            'opts': self.model._meta,
        }
        return render(request, 'admin/core/project/ic_memo.html', context)

    @admin.display(description="IC Memo")
    def ic_memo_link(self, obj):
        if obj.id:
            url = reverse('admin:project-ic-memo', args=[obj.id])
            return format_html('<a class="button" href="{}">View IC Memo</a>', url)
        return ""


@admin.register(ProjectComment)
class ProjectCommentAdmin(admin.ModelAdmin):
    list_display = ('project', 'user', 'is_internal', 'created_at')
    list_filter = ('is_internal',)
    raw_id_fields = ('project', 'user')


# ---------------------------------------------------------------------------
# Investor Relations
# ---------------------------------------------------------------------------

@admin.register(Investor)
class InvestorAdmin(admin.ModelAdmin):
    list_display = ('organization', 'investor_type', 'country', 'accredited_status')
    list_filter = ('investor_type', 'accredited_status')
    raw_id_fields = ('user',)


@admin.register(Fund)
class FundAdmin(admin.ModelAdmin):
    list_display = ('name', 'vintage_year', 'status', 'target_size', 'committed_capital')
    list_filter = ('status',)


@admin.register(InvestorCommitment)
class InvestorCommitmentAdmin(admin.ModelAdmin):
    list_display = ('investor', 'fund', 'commitment_amount', 'commitment_date')
    raw_id_fields = ('investor', 'fund')


@admin.register(PortfolioCompany)
class PortfolioCompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'sector', 'country', 'investment_amount', 'exit_type')
    list_filter = ('exit_type', 'sector')


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = ('portfolio_company', 'fund', 'round_name', 'amount_invested')
    raw_id_fields = ('portfolio_company', 'fund')


# ---------------------------------------------------------------------------
# Educational Platform  ── WordPress-like CMS for Courses
# ---------------------------------------------------------------------------

class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1
    fields = ('title', 'position', 'video_url', 'content')
    ordering = ('position',)


class CourseModuleInline(admin.StackedInline):
    model = CourseModule
    extra = 1
    ordering = ('position',)
    show_change_link = True


@admin.register(CourseModule)
class CourseModuleAdmin(admin.ModelAdmin):
    inlines = [LessonInline]
    list_display = ('title', 'course', 'position')
    list_filter = ('course',)
    ordering = ('course', 'position')


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    """
    WordPress-style course editor.
    """
    inlines = [CourseModuleInline]
    list_display = (
        'thumbnail_preview', 'title', 'level', 'pillar',
        'duration_hours', 'enrollment_count', 'publish_status', 'created_at',
    )
    list_display_links = ('title',)
    list_filter  = ('level', 'pillar', 'is_published')
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('thumbnail_preview_large', 'enrollment_count', 'created_at', 'updated_at')
    actions = ['publish_courses', 'unpublish_courses']
    save_on_top = True
    ordering = ('-created_at',)

    fieldsets = (
        ('Content', {
            'fields': ('title', 'slug', 'description', 'pillar'),
        }),
        ('Media', {
            'fields': ('featured_image', 'thumbnail_preview_large'),
        }),
        ('Settings', {
            'fields': ('level', 'duration_hours', 'is_published'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Thumbnail')
    def thumbnail_preview(self, obj):
        if obj.featured_image:
            return format_html(
                '<img src="{}" style="height:48px;width:72px;object-fit:cover;border-radius:6px;" />',
                obj.featured_image,
            )
        return '—'

    @admin.display(description='Cover Image')
    def thumbnail_preview_large(self, obj):
        if obj.featured_image:
            return format_html(
                '<img src="{}" style="max-height:240px;max-width:480px;object-fit:cover;border-radius:8px;margin-top:8px;" />',
                obj.featured_image,
            )
        return '—'

    @admin.display(description='Enrollments')
    def enrollment_count(self, obj):
        return Enrollment.objects.filter(course=obj).count()

    @admin.display(description='Status', boolean=False)
    def publish_status(self, obj):
        if obj.is_published:
            return format_html('<span style="color:#16c784;font-weight:600;">● Published</span>')
        return format_html('<span style="color:#ea3943;font-weight:600;">● Draft</span>')

    @admin.action(description='Publish selected courses')
    def publish_courses(self, request, queryset):
        updated = queryset.update(is_published=True)
        self.message_user(request, f'{updated} course(s) published.')

    @admin.action(description='Unpublish selected courses (revert to draft)')
    def unpublish_courses(self, request, queryset):
        updated = queryset.update(is_published=False)
        self.message_user(request, f'{updated} course(s) moved to draft.')


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'status', 'progress_percent')
    list_filter = ('status',)
    raw_id_fields = ('user', 'course')


# ---------------------------------------------------------------------------
# Insights CMS  ── Articles  (WordPress-style)
# ---------------------------------------------------------------------------

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    """
    Rich WordPress-like editor for Articles.
    - Thumbnail preview in list view
    - Publish / Draft bulk actions
    - Reading-time estimate
    - Full fieldset layout like WP's classic editor
    """
    list_display = (
        'thumbnail_preview', 'title', 'author',
        'pillar', 'reading_time_est', 'publish_status', 'published_at',
    )
    list_display_links = ('title',)
    list_filter   = (DeletedListFilter, 'pillar', 'is_published', 'author')
    search_fields = ('title', 'excerpt', 'content', 'author__email')
    prepopulated_fields  = {'slug': ('title',)}
    raw_id_fields  = ('author',)
    date_hierarchy = 'published_at'
    ordering       = ('-published_at', '-created_at')
    actions = ['publish_articles', 'unpublish_articles']
    save_on_top = True

    readonly_fields = (
        'featured_image_preview', 'reading_time_est',
        'created_at', 'updated_at',
    )


    fieldsets = (
        ('✍  Article Content', {
            'fields': ('title', 'slug', 'excerpt', 'content'),
            'description': mark_safe(
                '<div style="background:#1a1a2e;border:1px solid #333;border-radius:8px;padding:16px;margin-bottom:16px;font-size:12px;line-height:1.6;color:#ccc;">'
                '<strong style="color:#F59F01;display:block;margin-bottom:8px;">📝 HTML Content Guide</strong>'
                '<p style="margin:0 0 6px">Use standard HTML tags: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;blockquote&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;code&gt;, &lt;img&gt;</p>'
                '<hr style="border:none;border-top:1px solid #333;margin:10px 0">'
                '<strong style="color:#F59F01;display:block;margin-bottom:8px;">✨ Special Callout Blocks — copy &amp; paste into content:</strong>'
                '<code style="display:block;background:#0d0d1a;padding:8px;border-radius:4px;color:#F59F01;margin-bottom:6px;white-space:pre">'
                '&lt;!-- Data Point (gold sidebar label) --&gt;\n'
                '&lt;div class="callout-data"&gt;&lt;p&gt;Your data or statistic here.&lt;/p&gt;&lt;/div&gt;'
                '</code>'
                '<code style="display:block;background:#0d0d1a;padding:8px;border-radius:4px;color:#16c784;margin-bottom:6px;white-space:pre">'
                '&lt;!-- Key Takeaway (green) --&gt;\n'
                '&lt;div class="callout-key"&gt;&lt;p&gt;Key point for readers.&lt;/p&gt;&lt;/div&gt;'
                '</code>'
                '<code style="display:block;background:#0d0d1a;padding:8px;border-radius:4px;color:#a855f7;margin-bottom:6px;white-space:pre">'
                '&lt;!-- Deep Insight (purple) --&gt;\n'
                '&lt;div class="callout-insight"&gt;&lt;p&gt;Analytical observation.&lt;/p&gt;&lt;/div&gt;'
                '</code>'
                '<code style="display:block;background:#0d0d1a;padding:8px;border-radius:4px;color:#f43f5e;margin-bottom:6px;white-space:pre">'
                '&lt;!-- Caution / Warning (red) --&gt;\n'
                '&lt;div class="callout-warning"&gt;&lt;p&gt;Risk or caution note.&lt;/p&gt;&lt;/div&gt;'
                '</code>'
                '<code style="display:block;background:#0d0d1a;padding:8px;border-radius:4px;color:#fff;margin-bottom:6px;white-space:pre">'
                '&lt;!-- Pull Quote (large centered) --&gt;\n'
                '&lt;div class="callout-quote"&gt;&lt;p&gt;Impactful sentence.&lt;/p&gt;&lt;/div&gt;'
                '</code>'
                '<code style="display:block;background:#0d0d1a;padding:8px;border-radius:4px;color:#F59F01;margin-bottom:6px;white-space:pre">'
                '&lt;!-- Big Statistic --&gt;\n'
                '&lt;div class="callout-stat"&gt;\n'
                '  &lt;span class="stat-number"&gt;$93.6B&lt;/span&gt;\n'
                '  &lt;span class="stat-label"&gt;Total PE Deal Value 2023&lt;/span&gt;\n'
                '  &lt;p&gt;Optional supporting text.&lt;/p&gt;\n'
                '&lt;/div&gt;'
                '</code>'
                '<code style="display:block;background:#0d0d1a;padding:8px;border-radius:4px;color:#aaa;white-space:pre">'
                '&lt;!-- TL;DR Summary box --&gt;\n'
                '&lt;div class="callout-summary"&gt;\n'
                '  &lt;ul&gt;&lt;li&gt;Point one&lt;/li&gt;&lt;li&gt;Point two&lt;/li&gt;&lt;/ul&gt;\n'
                '&lt;/div&gt;'
                '</code>'
                '</div>'
            ),
        }),
        ('Author & Classification', {
            'fields': ('author', 'pillar'),
        }),
        ('Featured Image', {
            'fields': ('featured_image_file', 'featured_image', 'featured_image_preview'),
            'description': (
                '① Upload a file directly (recommended) — drag & drop a JPG/PNG/WebP. '
                '② OR paste a public image URL in the field below. '
                'The uploaded file always takes priority over the URL.'
            ),
        }),

        ('Publishing', {
            'fields': ('is_published', 'published_at'),
        }),
        ('Metadata', {
            'fields': ('reading_time_est', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )


    # ── Custom list columns ─────────────────────────────────────────────────

    @admin.display(description='Cover')
    def thumbnail_preview(self, obj):
        if obj.featured_image:
            return format_html(
                '<img src="{}" style="height:48px;width:80px;object-fit:cover;border-radius:6px;" />',
                obj.featured_image,
            )
        return '—'

    @admin.display(description='Status')
    def publish_status(self, obj):
        if obj.is_published:
            return format_html('<span style="color:#16c784;font-weight:600;">● Live</span>')
        return format_html('<span style="color:#aaa;font-weight:600;">● Draft</span>')

    @admin.display(description='Read Time')
    def reading_time_est(self, obj):
        if not obj.content:
            return '—'
        word_count = len(obj.content.split())
        minutes = max(1, round(word_count / 200))
        return f'{minutes} min'

    # ── Inline image preview in change form ────────────────────────────────

    @admin.display(description='Preview')
    def featured_image_preview(self, obj):
        url = obj.cover_image_url if hasattr(obj, 'cover_image_url') else obj.featured_image
        if url:
            return format_html(
                '<img src="{}" style="max-height:260px;max-width:520px;object-fit:cover;border-radius:8px;margin-top:8px;" />',
                url,
            )
        return 'No image set.'


    # ── Bulk publishing actions ─────────────────────────────────────────────

    @admin.action(description='Publish selected articles')
    def publish_articles(self, request, queryset):
        now = timezone.now()
        updated = queryset.filter(is_published=False).update(
            is_published=True, published_at=now,
        )
        self.message_user(request, f'{updated} article(s) published.')

    @admin.action(description='Revert selected articles to Draft')
    def unpublish_articles(self, request, queryset):
        updated = queryset.filter(is_published=True).update(is_published=False)
        self.message_user(request, f'{updated} article(s) moved to draft.')

    # ── Auto-set published_at on first publish ─────────────────────────────

    def save_model(self, request, obj, form, change):
        if obj.is_published and not obj.published_at:
            obj.published_at = timezone.now()
        super().save_model(request, obj, form, change)


# ---------------------------------------------------------------------------
# Insights CMS  ── Webinars  (WordPress-style)
# ---------------------------------------------------------------------------

@admin.register(Webinar)
class WebinarAdmin(admin.ModelAdmin):
    """
    Full webinar management — upcoming vs past, recording URLs, publish toggle.
    """
    list_display = (
        'thumbnail_preview', 'title', 'speaker',
        'scheduled_at', 'duration_badge', 'has_recording', 'publish_status',
    )
    list_display_links = ('title',)
    list_filter   = ('is_published', 'pillar')
    search_fields = ('title', 'description', 'speaker')
    ordering      = ('-scheduled_at',)
    date_hierarchy = 'scheduled_at'
    actions = ['publish_webinars', 'unpublish_webinars']
    save_on_top = True

    readonly_fields = ('featured_image_preview', 'created_at')

    fieldsets = (
        ('Event Details', {
            'fields': ('title', 'description', 'speaker', 'pillar'),
        }),
        ('Schedule', {
            'fields': ('scheduled_at', 'duration_minutes'),
        }),
        ('Cover Image', {
            'fields': ('featured_image_preview',),
            'description': 'Add a featured_image field to the model to enable cover images.',
        }),
        ('Links', {
            'fields': ('registration_url', 'recording_url'),
            'description': 'Paste a Zoom/Google Meet link for registration and a YouTube/Vimeo link for recordings.',
        }),
        ('Publishing', {
            'fields': ('is_published',),
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Cover')
    def thumbnail_preview(self, obj):
        # Webinar model doesn't have featured_image yet; graceful fallback
        img = getattr(obj, 'featured_image', None)
        if img:
            return format_html(
                '<img src="{}" style="height:48px;width:80px;object-fit:cover;border-radius:6px;" />',
                img,
            )
        return format_html(
            '<div style="height:48px;width:80px;background:#3A3153;border-radius:6px;'
            'display:flex;align-items:center;justify-content:center;font-size:18px;">📹</div>'
        )

    @admin.display(description='Duration')
    def duration_badge(self, obj):
        h = obj.duration_minutes // 60
        m = obj.duration_minutes % 60
        if h:
            return f'{h}h {m}m' if m else f'{h}h'
        return f'{m}m'

    @admin.display(description='Recording', boolean=True)
    def has_recording(self, obj):
        return bool(obj.recording_url)

    @admin.display(description='Status')
    def publish_status(self, obj):
        if obj.is_published:
            return format_html('<span style="color:#16c784;font-weight:600;">● Live</span>')
        return format_html('<span style="color:#aaa;font-weight:600;">● Draft</span>')

    @admin.display(description='Cover Image Preview')
    def featured_image_preview(self, obj):
        return mark_safe('<p style="color:#aaa;">Add a <code>featured_image</code> URL field to the Webinar model to enable image previews.</p>')

    @admin.action(description='Publish selected webinars')
    def publish_webinars(self, request, queryset):
        updated = queryset.update(is_published=True)
        self.message_user(request, f'{updated} webinar(s) published.')

    @admin.action(description='Revert selected webinars to Draft')
    def unpublish_webinars(self, request, queryset):
        updated = queryset.update(is_published=False)
        self.message_user(request, f'{updated} webinar(s) moved to draft.')


@admin.register(WebinarRegistration)
class WebinarRegistrationAdmin(admin.ModelAdmin):
    list_display = ('webinar', 'email', 'name', 'attended', 'registered_at')
    list_filter  = ('attended', 'webinar')
    search_fields = ('email', 'name')
    raw_id_fields = ('webinar', 'user')
    date_hierarchy = 'registered_at'
    actions = ['mark_attended']

    @admin.action(description='Mark selected registrations as attended')
    def mark_attended(self, request, queryset):
        updated = queryset.update(attended=True)
        self.message_user(request, f'{updated} registration(s) marked as attended.')


# ---------------------------------------------------------------------------
# CRM & System
# ---------------------------------------------------------------------------

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'status')
    list_filter = ('status',)


@admin.register(ContactInteraction)
class ContactInteractionAdmin(admin.ModelAdmin):
    list_display = ('contact', 'user', 'type', 'interaction_date')
    list_filter = ('type',)
    raw_id_fields = ('contact', 'user')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('table_name', 'action', 'user', 'created_at')
    list_filter = ('action', 'table_name')
    readonly_fields = ('old_data', 'new_data')
