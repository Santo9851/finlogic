"""
deals/admin.py
Django Admin registrations for all PE Deals models.
"""
from django.contrib import admin
from django.utils.html import format_html

from .models import (
    Fund,
    PEProject,
    PEProjectDocument,
    LPProfile,
    LPFundCommitment,
    PEInvestment,
    CapitalCall,
    Distribution,
    PEFormTemplate,
    PEProjectFormResponse,
    ImmutableAuditEvent,
    GPShareholder,
    GPDividend,
    FundDocument,
)


# ---------------------------------------------------------------------------
# Fund
# ---------------------------------------------------------------------------

@admin.register(Fund)
class FundAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'legal_name', 'vintage_year', 'status',
        'target_size_npr', 'committed_capital_npr',
        'preferred_return_pct', 'carry_pct',
    )
    list_filter = ('status', 'vintage_year')
    search_fields = ('name', 'legal_name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    fieldsets = (
        ('Identity', {
            'fields': ('id', 'name', 'legal_name', 'vintage_year', 'status'),
        }),
        ('Capital', {
            'fields': (
                'target_size_npr', 'committed_capital_npr',
                'preferred_return_pct', 'carry_pct',
            ),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )


# ---------------------------------------------------------------------------
# PEProject
# ---------------------------------------------------------------------------

class PEProjectDocumentInline(admin.TabularInline):
    model = PEProjectDocument
    extra = 0
    readonly_fields = ('id', 'uploaded_at', 'file_size', 'mime_type')
    fields = ('category', 'filename', 'file_key', 'file_size', 'uploaded_by', 'uploaded_at')


class PEProjectFormResponseInline(admin.TabularInline):
    model = PEProjectFormResponse
    extra = 0
    readonly_fields = ('id', 'submitted_at', 'updated_at')
    fields = ('step_index', 'step_name', 'submitted_at')


@admin.register(PEProject)
class PEProjectAdmin(admin.ModelAdmin):
    list_display = (
        'legal_name', 'fund', 'deal_type', 'sector', 'status',
        'submission_type', 'form_step_completed', 'submitted_at',
        'data_room_completeness_display',
    )
    list_filter = ('status', 'deal_type', 'sector', 'submission_type', 'fund')
    search_fields = ('legal_name', 'ocr_registration_number')
    readonly_fields = (
        'id', 'invitation_token', 'created_at', 'updated_at',
        'data_room_completeness_display',
    )
    raw_id_fields = ('fund', 'entrepreneur_user', 'created_by')
    inlines = [PEProjectDocumentInline, PEProjectFormResponseInline]
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Identity', {
            'fields': (
                'id', 'fund', 'legal_name', 'ocr_registration_number',
                'deal_type', 'sector',
            ),
        }),
        ('Investment Range (NPR)', {
            'fields': ('investment_range_min_npr', 'investment_range_max_npr'),
        }),
        ('Workflow', {
            'fields': (
                'status', 'submission_type', 'form_step_completed',
                'submitted_at',
            ),
        }),
        ('Entrepreneur Invite', {
            'fields': (
                'entrepreneur_user', 'invitation_token',
                'invitation_sent_at', 'invitation_expires_at',
            ),
            'classes': ('collapse',),
        }),
        ('Data Room', {
            'fields': ('data_room_completeness_display',),
        }),
        ('Meta', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Data Room %')
    def data_room_completeness_display(self, obj):
        pct = obj.data_room_completeness
        colour = '#2ecc71' if pct == 100 else '#e67e22' if pct >= 50 else '#e74c3c'
        return format_html(
            '<strong style="color:{}">{} %</strong>', colour, pct
        )


# ---------------------------------------------------------------------------
# PEProjectDocument
# ---------------------------------------------------------------------------

@admin.register(PEProjectDocument)
class PEProjectDocumentAdmin(admin.ModelAdmin):
    list_display = (
        'filename', 'project', 'category', 'mime_type',
        'file_size', 'uploaded_by', 'uploaded_at',
    )
    list_filter = ('category',)
    search_fields = ('filename', 'file_key', 'project__legal_name')
    readonly_fields = ('id', 'uploaded_at')
    raw_id_fields = ('project', 'uploaded_by')


# ---------------------------------------------------------------------------
# LPProfile
# ---------------------------------------------------------------------------

@admin.register(LPProfile)
class LPProfileAdmin(admin.ModelAdmin):
    list_display = (
        'full_name', 'user', 'organization', 'country', 'accredited_status',
    )
    list_filter = ('accredited_status', 'country')
    search_fields = ('full_name', 'user__email', 'organization')
    raw_id_fields = ('user',)
    readonly_fields = ('created_at', 'updated_at')


# ---------------------------------------------------------------------------
# LPFundCommitment
# ---------------------------------------------------------------------------

@admin.register(LPFundCommitment)
class LPFundCommitmentAdmin(admin.ModelAdmin):
    list_display = (
        'lp_profile', 'fund', 'committed_amount_npr',
        'called_amount_npr', 'commitment_date',
    )
    list_filter = ('fund',)
    search_fields = ('lp_profile__full_name', 'fund__name')
    raw_id_fields = ('lp_profile', 'fund')
    readonly_fields = ('id', 'created_at', 'updated_at')


# ---------------------------------------------------------------------------
# PEInvestment
# ---------------------------------------------------------------------------

@admin.register(PEInvestment)
class PEInvestmentAdmin(admin.ModelAdmin):
    list_display = (
        'project', 'fund', 'investment_date', 'investment_amount_npr',
        'ownership_pct', 'exit_type', 'exit_date',
    )
    list_filter = ('fund', 'exit_type')
    search_fields = ('project__legal_name', 'fund__name')
    raw_id_fields = ('project', 'fund')
    readonly_fields = ('id', 'created_at', 'updated_at')


# ---------------------------------------------------------------------------
# CapitalCall
# ---------------------------------------------------------------------------

@admin.register(CapitalCall)
class CapitalCallAdmin(admin.ModelAdmin):
    list_display = (
        'fund', 'call_date', 'due_date', 'amount_npr', 'status',
    )
    list_filter = ('status', 'fund')
    search_fields = ('fund__name',)
    raw_id_fields = ('fund', 'lp_commitment')
    readonly_fields = ('id', 'created_at', 'updated_at')


# ---------------------------------------------------------------------------
# Distribution
# ---------------------------------------------------------------------------

@admin.register(Distribution)
class DistributionAdmin(admin.ModelAdmin):
    list_display = (
        'fund', 'distribution_date', 'amount_npr', 'distribution_type',
    )
    list_filter = ('distribution_type', 'fund')
    search_fields = ('fund__name',)
    raw_id_fields = ('fund', 'lp_commitment')
    readonly_fields = ('id', 'created_at')


# ---------------------------------------------------------------------------
# PEFormTemplate
# ---------------------------------------------------------------------------

@admin.register(PEFormTemplate)
class PEFormTemplateAdmin(admin.ModelAdmin):
    list_display = ('form_type', 'version', 'is_active', 'created_at')
    list_filter = ('form_type', 'is_active')
    readonly_fields = ('id', 'created_at', 'updated_at')


# ---------------------------------------------------------------------------
# PEProjectFormResponse
# ---------------------------------------------------------------------------

@admin.register(PEProjectFormResponse)
class PEProjectFormResponseAdmin(admin.ModelAdmin):
    list_display = (
        'project', 'step_index', 'step_name', 'submitted_at',
    )
    list_filter = ('step_name',)
    search_fields = ('project__legal_name',)
    raw_id_fields = ('project', 'template')
    readonly_fields = ('id', 'submitted_at', 'updated_at')


# ---------------------------------------------------------------------------
# ImmutableAuditEvent
# ---------------------------------------------------------------------------

@admin.register(ImmutableAuditEvent)
class ImmutableAuditEventAdmin(admin.ModelAdmin):
    list_display = (
        'event_type', 'actor', 'content_type_label',
        'object_repr', 'ip_address', 'created_at',
    )
    list_filter = ('event_type', 'content_type_label')
    search_fields = ('actor__email', 'object_repr')
    readonly_fields = (
        'id', 'event_type', 'actor', 'object_id', 'object_repr',
        'content_type_label', 'payload', 'ip_address', 'created_at',
    )
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


# ---------------------------------------------------------------------------
# GP Shareholder & Dividend Accounting
# ---------------------------------------------------------------------------

class GPDividendInline(admin.TabularInline):
    model = GPDividend
    extra = 1
    fields = ('amount_npr', 'payment_date', 'fiscal_year', 'status')


@admin.register(GPShareholder)
class GPShareholderAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'shares_held', 'ownership_percentage', 'vesting_status', 'updated_at'
    )
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    raw_id_fields = ('user',)
    inlines = [GPDividendInline]


@admin.register(GPDividend)
class GPDividendAdmin(admin.ModelAdmin):
    list_display = (
        'shareholder', 'amount_npr', 'payment_date', 'fiscal_year', 'status'
    )
    list_filter = ('fiscal_year', 'status')
    search_fields = ('shareholder__user__email',)
    raw_id_fields = ('shareholder',)


@admin.register(FundDocument)
class FundDocumentAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'fund', 'document_type', 'is_published', 'publish_date'
    )
    list_filter = ('document_type', 'is_published', 'fund')
    search_fields = ('title', 'file_name')
    raw_id_fields = ('fund',)
    readonly_fields = ('id',)
