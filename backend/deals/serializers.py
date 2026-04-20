"""
deals/serializers.py
DRF serializers for all PE Deals models.
"""
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import serializers

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
    FundDocument,
    LPDocumentAccess,
)

User = get_user_model()


# ---------------------------------------------------------------------------
# Minimal User serializer (read-only)
# ---------------------------------------------------------------------------

class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'roles')
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Component Serializers (Required for nested relations)
# ---------------------------------------------------------------------------

class PEProjectDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_detail = UserMiniSerializer(source='uploaded_by', read_only=True)
    category_display = serializers.CharField(
        source='get_category_display', read_only=True
    )

    class Meta:
        model = PEProjectDocument
        fields = (
            'id', 'project', 'file_key', 'filename', 'file_size',
            'mime_type', 'category', 'category_display',
            'uploaded_by', 'uploaded_by_detail', 'uploaded_at',
        )
        read_only_fields = ('id', 'uploaded_at')
        extra_kwargs = {
            'project': {'write_only': True},
            'uploaded_by': {'write_only': True, 'required': False},
        }


class PEProjectFormResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = PEProjectFormResponse
        fields = (
            'id', 'project', 'template', 'step_index', 'step_name',
            'response_data', 'submitted_at', 'updated_at',
        )
        read_only_fields = ('id', 'submitted_at', 'updated_at')


class ImmutableAuditEventSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source='actor.email', read_only=True)
    event_type_display = serializers.CharField(
        source='get_event_type_display', read_only=True
    )

    class Meta:
        model = ImmutableAuditEvent
        fields = (
            'id', 'event_type', 'event_type_display', 'actor', 'actor_email',
            'object_id', 'object_repr', 'content_type_label',
            'payload', 'ip_address', 'created_at',
        )
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Fund
# ---------------------------------------------------------------------------

class FundSerializer(serializers.ModelSerializer):
    uncalled_capital_npr = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Fund
        fields = (
            'id', 'name', 'vintage_year',
            'target_size_npr', 'committed_capital_npr', 'uncalled_capital_npr',
            'status', 'status_display',
            'preferred_return_pct', 'carry_pct',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


# ---------------------------------------------------------------------------
# PEProject
# ---------------------------------------------------------------------------

class PEProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    fund_name = serializers.CharField(source='fund.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    deal_type_display = serializers.CharField(source='get_deal_type_display', read_only=True)
    data_room_completeness = serializers.IntegerField(read_only=True)

    class Meta:
        model = PEProject
        fields = (
            'id', 'legal_name', 'fund', 'fund_name', 'deal_type',
            'deal_type_display', 'sector', 'status', 'status_display',
            'submission_type', 'form_step_completed', 'submitted_at',
            'data_room_completeness', 'created_at',
        )
        read_only_fields = ('id', 'created_at', 'data_room_completeness')


class PEProjectDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail / create / update views."""
    fund_detail = FundSerializer(source='fund', read_only=True)
    entrepreneur_detail = UserMiniSerializer(source='entrepreneur_user', read_only=True)
    created_by_detail = UserMiniSerializer(source='created_by', read_only=True)
    data_room_completeness = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    deal_type_display = serializers.CharField(source='get_deal_type_display', read_only=True)
    is_invitation_valid = serializers.BooleanField(read_only=True)
    
    # Nested relations (required component serializers to be defined above)
    documents = PEProjectDocumentSerializer(many=True, read_only=True)
    form_responses = PEProjectFormResponseSerializer(many=True, read_only=True)
    audit_events = serializers.SerializerMethodField()

    class Meta:
        model = PEProject
        fields = (
            'id', 'fund', 'fund_detail',
            'legal_name', 'ocr_registration_number',
            'deal_type', 'deal_type_display', 'sector',
            'investment_range_min_npr', 'investment_range_max_npr',
            'status', 'status_display', 'submission_type',
            'entrepreneur_user', 'entrepreneur_detail',
            'invitation_token', 'invitation_sent_at', 'invitation_expires_at',
            'is_invitation_valid', 'form_step_completed', 'submitted_at',
            'data_room_completeness', 'documents', 'form_responses', 'audit_events',
            'created_by', 'created_by_detail', 'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'invitation_token', 'invitation_sent_at', 'invitation_expires_at',
            'is_invitation_valid', 'data_room_completeness',
            'created_at', 'updated_at',
        )
        extra_kwargs = {
            'entrepreneur_user': {'write_only': True, 'required': False},
            'created_by': {'write_only': True, 'required': False},
        }

    def get_audit_events(self, obj):
        events = ImmutableAuditEvent.objects.filter(object_id=obj.id).order_by('-created_at')[:20]
        return ImmutableAuditEventSerializer(events, many=True).data


class PEProjectStatusUpdateSerializer(serializers.ModelSerializer):
    """GP-only: update status (and a few other workflow fields)."""
    class Meta:
        model = PEProject
        fields = ('status', 'form_step_completed')


# ---------------------------------------------------------------------------
# GP Invite (input only)
# ---------------------------------------------------------------------------

class GPInviteSerializer(serializers.Serializer):
    fund_id = serializers.UUIDField()
    legal_name = serializers.CharField(max_length=200)
    ocr_registration_number = serializers.CharField(max_length=50)
    entrepreneur_email = serializers.EmailField()
    deal_type = serializers.ChoiceField(choices=PEProject.DealType.choices)
    sector = serializers.ChoiceField(choices=PEProject.Sector.choices, required=False)
    investment_range_min_npr = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False, allow_null=True
    )
    investment_range_max_npr = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False, allow_null=True
    )

    def validate_fund_id(self, value):
        try:
            return Fund.objects.get(pk=value)
        except Fund.DoesNotExist:
            raise serializers.ValidationError("Fund not found.")


# ---------------------------------------------------------------------------
# Document Upload Request (input only)
# ---------------------------------------------------------------------------

class DocumentUploadRequestSerializer(serializers.Serializer):
    """Input for requesting a pre-signed B2 upload URL."""
    filename = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=100, required=False)
    category = serializers.ChoiceField(choices=PEProjectDocument.Category.choices)
    file_size = serializers.IntegerField(min_value=1)


# ---------------------------------------------------------------------------
# LPProfile
# ---------------------------------------------------------------------------

class LPProfileSerializer(serializers.ModelSerializer):
    user_detail = UserMiniSerializer(source='user', read_only=True)

    class Meta:
        model = LPProfile
        fields = (
            'id', 'user', 'user_detail',
            'full_name', 'organization', 'country', 'accredited_status',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
        extra_kwargs = {'user': {'write_only': True}}


# ---------------------------------------------------------------------------
# LPFundCommitment
# ---------------------------------------------------------------------------

class LPFundCommitmentSerializer(serializers.ModelSerializer):
    lp_profile_detail = LPProfileSerializer(source='lp_profile', read_only=True)
    fund_detail = FundSerializer(source='fund', read_only=True)
    uncalled_amount_npr = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )

    class Meta:
        model = LPFundCommitment
        fields = (
            'id', 'lp_profile', 'lp_profile_detail',
            'fund', 'fund_detail',
            'committed_amount_npr', 'called_amount_npr', 'uncalled_amount_npr',
            'commitment_date', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
        extra_kwargs = {
            'lp_profile': {'write_only': True},
            'fund': {'write_only': True},
        }


# ---------------------------------------------------------------------------
# PEInvestment
# ---------------------------------------------------------------------------

class PEInvestmentSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.legal_name', read_only=True)
    fund_name = serializers.CharField(source='fund.name', read_only=True)
    moic = serializers.FloatField(read_only=True)
    exit_type_display = serializers.CharField(
        source='get_exit_type_display', read_only=True
    )

    class Meta:
        model = PEInvestment
        fields = (
            'id', 'project', 'project_name', 'fund', 'fund_name',
            'investment_date', 'investment_amount_npr', 'ownership_pct',
            'valuation_at_entry_npr',
            'exit_date', 'exit_value_npr', 'exit_type', 'exit_type_display', 'moic',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'moic', 'created_at', 'updated_at')
        extra_kwargs = {
            'project': {'write_only': True},
            'fund': {'write_only': True},
        }


# ---------------------------------------------------------------------------
# CapitalCall
# ---------------------------------------------------------------------------

class CapitalCallSerializer(serializers.ModelSerializer):
    fund_name = serializers.CharField(source='fund.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = CapitalCall
        fields = (
            'id', 'fund', 'fund_name', 'lp_commitment',
            'call_date', 'due_date', 'amount_npr', 'status', 'status_display',
            'notice_sent_at', 'received_at', 'notes',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


# ---------------------------------------------------------------------------
# Distribution
# ---------------------------------------------------------------------------

class DistributionSerializer(serializers.ModelSerializer):
    fund_name = serializers.CharField(source='fund.name', read_only=True)
    distribution_type_display = serializers.CharField(
        source='get_distribution_type_display', read_only=True
    )

    class Meta:
        model = Distribution
        fields = (
            'id', 'fund', 'fund_name', 'lp_commitment',
            'distribution_date', 'amount_npr',
            'distribution_type', 'distribution_type_display',
            'notes', 'created_at',
        )
        read_only_fields = ('id', 'created_at')


# ---------------------------------------------------------------------------
# PEFormTemplate
# ---------------------------------------------------------------------------

class PEFormTemplateSerializer(serializers.ModelSerializer):
    form_type_display = serializers.CharField(
        source='get_form_type_display', read_only=True
    )

    class Meta:
        model = PEFormTemplate
        fields = (
            'id', 'form_type', 'form_type_display', 'version', 'is_active',
            'steps', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


# ---------------------------------------------------------------------------
# LP Dashboard
# ---------------------------------------------------------------------------

class CapitalCallSerializer(serializers.ModelSerializer):
    class Meta:
        model = CapitalCall
        fields = ('id', 'call_date', 'due_date', 'amount_npr', 'status', 'received_at')

class DistributionSerializer(serializers.ModelSerializer):
    distribution_type_display = serializers.CharField(source='get_distribution_type_display', read_only=True)
    class Meta:
        model = Distribution
        fields = ('id', 'distribution_date', 'amount_npr', 'distribution_type', 'distribution_type_display')

class LPDashboardFundSerializer(serializers.ModelSerializer):
    """Fund data enriched with the LP's commitment summary."""
    my_commitment = serializers.SerializerMethodField()
    approved_deals_count = serializers.SerializerMethodField()
    total_documents_count = serializers.SerializerMethodField()
    pending_action_count = serializers.SerializerMethodField()

    class Meta:
        model = Fund
        fields = (
            'id', 'name', 'vintage_year', 'status',
            'target_size_npr', 'committed_capital_npr',
            'preferred_return_pct', 'carry_pct',
            'my_commitment', 'approved_deals_count',
            'total_documents_count', 'pending_action_count',
        )

    def get_my_commitment(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        try:
            lp = request.user.lp_profile
            commitment = lp.fund_commitments.get(fund=obj)
            return LPFundCommitmentSerializer(commitment).data
        except Exception:
            return None

    def get_approved_deals_count(self, obj):
        return obj.pe_projects.filter(
            status__in=[PEProject.Status.GP_APPROVED, PEProject.Status.CLOSED]
        ).count()

    def get_total_documents_count(self, obj):
        return obj.documents.filter(is_published=True).count()

    def get_pending_action_count(self, obj):
        request = self.context.get('request')
        if not request or not hasattr(request.user, 'lp_profile'):
            return 0
        
        # Docs that require ack but aren't in LPDocumentAccess with acknowledged_at
        lp_profile = request.user.lp_profile
        docs_requiring_ack = obj.documents.filter(is_published=True, requires_acknowledgment=True)
        
        acknowledged_ids = LPDocumentAccess.objects.filter(
            lp_profile=lp_profile,
            document__in=docs_requiring_ack,
            acknowledged_at__isnull=False
        ).values_list('document_id', flat=True)
        
        return docs_requiring_ack.exclude(id__in=acknowledged_ids).count()


# ---------------------------------------------------------------------------
# GP Investor Dashboard
# ---------------------------------------------------------------------------

class GPInvestorDashboardSerializer(serializers.Serializer):
    """Read-only summary for GP Investor portal."""
    total_committed_npr = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_called_npr = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_distributed_npr = serializers.DecimalField(max_digits=15, decimal_places=2)
    investments = PEInvestmentSerializer(many=True, read_only=True)
    funds = FundSerializer(many=True, read_only=True)


# ---------------------------------------------------------------------------
# Fund Document Management
# ---------------------------------------------------------------------------

class FundDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_detail = UserMiniSerializer(source='uploaded_by', read_only=True)
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    fund_name = serializers.CharField(source='fund.name', read_only=True)
    download_url = serializers.SerializerMethodField()
    has_acknowledged = serializers.SerializerMethodField()

    class Meta:
        model = FundDocument
        fields = (
            'id', 'fund', 'fund_name', 'title', 'description', 'document_type',
            'document_type_display', 'file_name', 'file_size', 'mime_type',
            'file_key', 'is_published', 'publish_date', 'requires_acknowledgment',
            'capital_call_amount', 'capital_call_due_date',
            'uploaded_by_detail', 'uploaded_at', 'download_url',
            'has_acknowledged'
        )
        read_only_fields = ('fund', 'uploaded_at', 'uploaded_by_detail', 'publish_date')

    def get_download_url(self, obj):
        # We don't want to sign every URL in a list view (perf)
        # But if specifically requested or for a single object, we can.
        # Usually handled by a separate download endpoint.
        return None

    def get_has_acknowledged(self, obj):
        request = self.context.get('request')
        if not request or not hasattr(request.user, 'lp_profile'):
            return False
        return obj.access_logs.filter(
            lp_profile=request.user.lp_profile,
            acknowledged_at__isnull=False
        ).exists()


class LPPortfolioSerializer(serializers.ModelSerializer):
    """Anonymized project data for LP portfolio view."""
    anonymized_name = serializers.SerializerMethodField()
    sector_display = serializers.CharField(source='get_sector_display', read_only=True)
    
    class Meta:
        model = PEProject
        fields = (
            'id', 'anonymized_name', 'sector', 'sector_display',
            'status', 'investment_range_min_npr', 'investment_range_max_npr'
        )

    def get_anonymized_name(self, obj):
        # SEBON-compliant anonymization
        return f"{obj.get_sector_display()} Project {str(obj.id)[:4].upper()}"
