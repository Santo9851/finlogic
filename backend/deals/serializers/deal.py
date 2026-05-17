"""
deals/serializers.py
DRF serializers for all PE Deals models.
"""
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import serializers

from deals.models import (
    Fund,
    PEProject,
    PEProjectDocument,
    LPProfile,
    LPKYCDocument,
    EntrepreneurKYBDocument,
    GovernanceProposal,
    ProposalVote,
    IRDocument,
    GPInvestorMeeting,
    GPInvestorMeetingRequest,
    GPShareholder,
    LPFundCommitment,
    validate_ocr_number,
    PEInvestment,
    CapitalCall,
    Distribution,
    PEFormTemplate,
    PEProjectFormResponse,
    ImmutableAuditEvent,
    FundDocument,
    LPDocumentAccess,
    ExtractedFinancials,
    QoEReport,
    CommercialAnalysis,
    OperationalAnalysis,
    RedFlagPattern,
    RedFlagFinding,
    ScoringRun,
    CriterionScore,
    ComplianceGate,
    ValuationModel,
    DCFAssumptions,
    LBOAssumptions,
    RegulatoryChecklist,
    SEBONFilingDeadline,
    DealMemo,
    PortfolioKPIReport,
    WaterfallModel,
    WaterfallRun,
    ValuationRecord,
    ExitScenario,
    FilingTypeConfig,
    ConflictOfInterest,
    TermSheet,
    SPADraft,
    LPSupportRequest,
    ManagementFeeAccrual,
)








User = get_user_model()


# ---------------------------------------------------------------------------
# Minimal User serializer (read-only)
# ---------------------------------------------------------------------------

from .fund import FundSerializer, ImmutableAuditEventSerializer, UserMiniSerializer
from .analysis import CommercialAnalysisSerializer, ExtractedFinancialsSerializer, OperationalAnalysisSerializer, QoEReportSerializer, RedFlagFindingSerializer, ScoringRunSerializer, ValuationModelSerializer
from .compliance import PortfolioKPIReportSerializer, RegulatoryChecklistSerializer


class PEProjectDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_detail = UserMiniSerializer(source='uploaded_by', read_only=True)
    category_display = serializers.CharField(
        source='get_category_display', read_only=True
    )
    url = serializers.SerializerMethodField()

    class Meta:
        model = PEProjectDocument
        fields = (
            'id', 'project', 'file_key', 'filename', 'file_size',
            'mime_type', 'category', 'category_display', 'url',
            'uploaded_by', 'uploaded_by_detail', 'uploaded_at',
        )
        read_only_fields = ('id', 'uploaded_at', 'url')
        extra_kwargs = {
            'project': {'write_only': True},
            'uploaded_by': {'write_only': True, 'required': False},
        }

    def get_url(self, obj):
        request = self.context.get('request')
        url = obj.url  # This calls the @property on the model
        if url and url.startswith('/') and request:
            return request.build_absolute_uri(url)
        return url



class PEProjectFormResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = PEProjectFormResponse
        fields = (
            'id', 'project', 'template', 'step_index', 'step_name',
            'response_data', 'submitted_at', 'updated_at',
        )
        read_only_fields = ('id', 'submitted_at', 'updated_at')



class PEProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    fund_name = serializers.CharField(source='fund.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    deal_type_display = serializers.CharField(source='get_deal_type_display', read_only=True)
    data_room_completeness = serializers.IntegerField(read_only=True)
    total_steps = serializers.SerializerMethodField()
    compliance_stats = serializers.SerializerMethodField()
    can_access = serializers.SerializerMethodField()

    class Meta:
        model = PEProject
        fields = (
            'id', 'legal_name', 'fund', 'fund_name', 'deal_type',
            'deal_type_display', 'sector', 'status', 'status_display',
            'submission_type', 'form_step_completed', 'total_steps',
            'submitted_at', 'data_room_completeness', 'compliance_stats', 'can_access', 'created_at',
        )
        read_only_fields = ('id', 'created_at', 'data_room_completeness')

    def get_total_steps(self, obj):
        """Return the number of steps in the active form template."""
        template = PEFormTemplate.objects.filter(
            form_type=PEFormTemplate.FormType.DEAL_SUBMISSION,
            is_active=True,
        ).order_by('-version').values('steps').first()
        if template and template['steps']:
            return len(template['steps'])
        return 6  # safe fallback

    def get_compliance_stats(self, obj):
        """Return {cleared, total} based on the latest scoring run's gates."""
        latest_run = obj.scoring_runs.filter(status='COMPLETED').order_by('-created_at').first()
        if not latest_run:
            return {'cleared': 0, 'total': 5}
        
        gates = latest_run.compliance_gates.all()
        return {
            'cleared': gates.filter(status='CLEARED').count(),
            'total': gates.count() or 5
        }

    def get_can_access(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if request.user.has_role('super_admin'):
            return True
        if obj.created_by == request.user:
            return True
        if hasattr(obj, 'collaborators') and obj.collaborators.filter(id=request.user.id).exists():
            return True
        return False




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
    extracted_financials = serializers.SerializerMethodField()
    qoe_reports = serializers.SerializerMethodField()
    commercial_analyses = serializers.SerializerMethodField()
    operational_analyses = serializers.SerializerMethodField()
    red_flags = serializers.SerializerMethodField()
    latest_scoring = serializers.SerializerMethodField()
    valuations = serializers.SerializerMethodField()
    regulatory_checklist = serializers.SerializerMethodField()
    latest_memo = serializers.SerializerMethodField()
    kpi_reports = serializers.SerializerMethodField()
    term_sheets = serializers.SerializerMethodField()
    spa_drafts = serializers.SerializerMethodField()
    can_access = serializers.SerializerMethodField()
    collaborators_detail = UserMiniSerializer(source='collaborators', many=True, read_only=True)








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
            'analysis_progress',
            'data_room_completeness', 'documents', 'form_responses', 'audit_events',
            'extracted_financials', 'qoe_reports', 'commercial_analyses', 'operational_analyses', 'red_flags',
            'latest_scoring', 'valuations', 'regulatory_checklist', 'latest_memo', 'kpi_reports',
            'term_sheets', 'spa_drafts',
            'created_by', 'created_by_detail', 'collaborators', 'collaborators_detail', 'can_access', 'created_at', 'updated_at',





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

    def validate(self, data):
        """
        Enforce Finlogic Unified Deal Flow Prerequisites (deal-flow.md).
        Validates transitions between major statuses.
        """
        instance = self.instance
        if not instance:
            return data
            
        new_status = data.get('status')
        if not new_status or new_status == instance.status:
            return data

        # Linear status progression enforcement (optional but recommended)
        status_order = [
            'PENDING_SUBMISSION', 'SUBMITTED', 'SCREENING', 'IC_REVIEW', 
            'TERM_SHEET', 'LOI_ISSUED', 'CONTRACT_SIGNED', 'CAPITAL_CALLED', 
            'CLOSED', 'DECLINED'
        ]
        
        if new_status != 'DECLINED':
            try:
                old_idx = status_order.index(instance.status)
                new_idx = status_order.index(new_status)
                # Allow only moving forward by one step or staying (staying is already handled)
                # Some flexibility might be needed, but let's stick to the flow.
                if new_idx < old_idx:
                    raise serializers.ValidationError({"status": f"Cannot revert status from {instance.status} to {new_status}."})
            except ValueError:
                pass

        # Phase 2.4: SCREENING -> IC_REVIEW
        if new_status == 'IC_REVIEW' and instance.status == 'SCREENING':
            latest_run = instance.scoring_runs.filter(status='COMPLETED').order_by('-created_at').first()
            if not latest_run:
                raise serializers.ValidationError({"status": "A completed scoring run is required to move to IC Review."})
            
            uncleared_gates = latest_run.compliance_gates.exclude(status='CLEARED')
            if uncleared_gates.exists():
                raise serializers.ValidationError({"status": "All 5 compliance gates must be CLEARED before IC Review."})
                
            unreviewed_critical = instance.red_flags.filter(severity='CRITICAL', is_reviewed_by_gp=False)
            if unreviewed_critical.exists():
                raise serializers.ValidationError({"status": "All CRITICAL red flags must be reviewed before IC Review."})

        # Phase 3.4: IC_REVIEW -> TERM_SHEET
        if new_status == 'TERM_SHEET' and instance.status == 'IC_REVIEW':
            if not instance.valuations.exists():
                raise serializers.ValidationError({"status": "At least one Valuation Model (DCF or LBO) must exist before moving to Term Sheet."})
            
            signed_memo = instance.documents.filter(category='IC_SIGNED').exists()
            if not signed_memo:
                raise serializers.ValidationError({"status": "Signed IC Approval (Memo) must be uploaded before moving to Term Sheet."})

        # Phase 4.3: TERM_SHEET -> LOI_ISSUED
        if new_status == 'LOI_ISSUED' and instance.status == 'TERM_SHEET':
            term_sheet = instance.term_sheets.order_by('-version', '-created_at').first()
            if not term_sheet:
                raise serializers.ValidationError({"status": "A Term Sheet must be drafted and saved before issuing LOI."})
            
            # Basic field check on term sheet
            terms = term_sheet.gp_overridden_terms or term_sheet.ai_generated_terms
            if not terms.get('investment_amount_npr') or not terms.get('pre_money_valuation_npr'):
                raise serializers.ValidationError({"status": "Term Sheet must have Investment Amount and Valuation populated."})

        # Phase 5.4: LOI_ISSUED -> CONTRACT_SIGNED
        if new_status == 'CONTRACT_SIGNED' and instance.status == 'LOI_ISSUED':
            signed_loi = instance.documents.filter(category='LOI_SIGNED').exists()
            if not signed_loi:
                raise serializers.ValidationError({"status": "The entrepreneur must upload the Signed LOI before advancing to Contract Signed."})

        # Phase 6.4: CONTRACT_SIGNED -> CAPITAL_CALLED
        if new_status == 'CAPITAL_CALLED' and instance.status == 'CONTRACT_SIGNED':
            # This is strictly gated to the Superadmin Capital Call view.
            # We block it here to prevent Kanban drags from triggering it accidentally.
            if not self.context['request'].user.has_role('super_admin'):
                raise serializers.ValidationError({"status": "Institutional Authorization Required: Only Superadmins can initiate capital drawdowns."})
            
            legal_docs = instance.documents.filter(category='SPA').exists()
            if not legal_docs:
                # Allow 'LEGAL' as fallback if category was mapped differently
                legal_docs = instance.documents.filter(category='LEGAL').exists()
                
            if not legal_docs:
                raise serializers.ValidationError({"status": "Executed SPA (Signed Contract) must be uploaded to Data Room."})
            
            checklist = getattr(instance, 'regulatory_checklist', None)
            if not checklist or not checklist.all_approvals_obtained:
                raise serializers.ValidationError({"status": "All required regulatory approvals (Regulatory Checklist) must be obtained."})

        # Lock status once CAPITAL_CALLED if capital calls exist
        if instance.status == 'CAPITAL_CALLED' and new_status not in ['CLOSED', 'DECLINED']:
            from deals.models import CapitalCall
            if CapitalCall.objects.filter(project=instance).exists():
                raise serializers.ValidationError({"status": "This deal is locked. Capital drawdown has been initiated and cannot be reversed."})

        return data

    def get_can_access(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if request.user.has_role('super_admin'):
            return True
        if obj.created_by == request.user:
            return True
        if hasattr(obj, 'collaborators') and obj.collaborators.filter(id=request.user.id).exists():
            return True
        return False

    def get_audit_events(self, obj):
        events = ImmutableAuditEvent.objects.filter(object_id=obj.id).order_by('-created_at')[:20]
        return ImmutableAuditEventSerializer(events, many=True).data

    def get_extracted_financials(self, obj):
        return ExtractedFinancialsSerializer(obj.financials.all(), many=True).data

    def get_qoe_reports(self, obj):
        return QoEReportSerializer(obj.qoe_reports.all(), many=True).data

    def get_commercial_analyses(self, obj):
        return CommercialAnalysisSerializer(obj.commercial_analyses.all(), many=True).data

    def get_operational_analyses(self, obj):
        return OperationalAnalysisSerializer(obj.operational_analyses.all(), many=True).data

    def get_red_flags(self, obj):
        return RedFlagFindingSerializer(obj.red_flags.all(), many=True).data

    def get_latest_scoring(self, obj):
        run = obj.scoring_runs.first()
        if run:
            return ScoringRunSerializer(run).data
        return None

    def get_valuations(self, obj):
        return ValuationModelSerializer(obj.valuations.all(), many=True).data

    def get_regulatory_checklist(self, obj):
        try:
            return RegulatoryChecklistSerializer(obj.regulatory_checklist).data
        except:
            return None

    def get_latest_memo(self, obj):
        memo = obj.memos.order_by('-version', '-created_at').first()
        if memo:
            return DealMemoSerializer(memo).data
        return None

    def get_kpi_reports(self, obj):
        return PortfolioKPIReportSerializer(obj.kpi_reports.all(), many=True).data

    def get_term_sheets(self, obj):
        return TermSheetSerializer(obj.term_sheets.all().order_by('-version', '-created_at'), many=True).data

    def get_spa_drafts(self, obj):
        return SPADraftSerializer(obj.spa_drafts.all().order_by('-version', '-created_at'), many=True).data










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
    ocr_registration_number = serializers.CharField(max_length=50, validators=[validate_ocr_number])
    entrepreneur_email = serializers.EmailField()
    deal_type = serializers.ChoiceField(choices=PEProject.DealType.choices)
    sector = serializers.ChoiceField(choices=PEProject.Sector.choices, required=False, allow_blank=True)
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

    def validate_investment_range_min_npr(self, value):
        if value == "" or value is None:
            return None
        return value

    def validate_investment_range_max_npr(self, value):
        if value == "" or value is None:
            return None
        return value


# ---------------------------------------------------------------------------
# Document Upload Request (input only)
# ---------------------------------------------------------------------------


class DocumentUploadRequestSerializer(serializers.Serializer):
    """Input for requesting a pre-signed B2 upload URL."""
    filename = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=100, required=False)
    category = serializers.CharField(max_length=50, default='OTHER')
    file_size = serializers.IntegerField(min_value=1)


# ---------------------------------------------------------------------------
# LPProfile
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



class DealMemoSerializer(serializers.ModelSerializer):
    created_by_detail = UserMiniSerializer(source='created_by', read_only=True)
    
    class Meta:
        model = DealMemo
        fields = '__all__'


class TermSheetSerializer(serializers.ModelSerializer):
    created_by_detail = UserMiniSerializer(source='created_by', read_only=True)
    
    class Meta:
        model = TermSheet
        fields = '__all__'
        read_only_fields = ('id', 'project', 'ai_generated_terms', 'created_by', 'created_at', 'updated_at')



class SPADraftSerializer(serializers.ModelSerializer):
    created_by_detail = UserMiniSerializer(source='created_by', read_only=True)
    
    class Meta:
        model = SPADraft
        fields = '__all__'
        read_only_fields = ('id', 'project', 'ai_generated_sections', 'created_by', 'created_at', 'updated_at')


