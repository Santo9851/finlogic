from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.shortcuts import render
from django.utils.html import format_html
from django.urls import path, reverse
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
    list_filter = ('roles', 'is_approved', 'is_active', 'deleted_at')
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
                    # Append new role
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
            'opts': self.model._meta, # So the admin breadcrumbs etc work
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
# Educational Platform
# ---------------------------------------------------------------------------

class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0


@admin.register(CourseModule)
class CourseModuleAdmin(admin.ModelAdmin):
    inlines = [LessonInline]
    list_display = ('title', 'course', 'position')
    list_filter = ('course',)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'level', 'pillar', 'is_published')
    list_filter = ('level', 'pillar', 'is_published')
    prepopulated_fields = {'slug': ('title',)}


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'status', 'progress_percent')
    list_filter = ('status',)
    raw_id_fields = ('user', 'course')


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'pillar', 'is_published', 'published_at')
    list_filter = ('pillar', 'is_published')
    prepopulated_fields = {'slug': ('title',)}
    raw_id_fields = ('author',)


@admin.register(Webinar)
class WebinarAdmin(admin.ModelAdmin):
    list_display = ('title', 'speaker', 'scheduled_at', 'is_published')
    list_filter = ('is_published', 'pillar')


@admin.register(WebinarRegistration)
class WebinarRegistrationAdmin(admin.ModelAdmin):
    list_display = ('webinar', 'email', 'name', 'attended')
    list_filter = ('attended',)
    raw_id_fields = ('webinar', 'user')


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
