"""
deals/views.py
DRF API views for the PE Deals app.

URL namespace: api/deals/  (GP & public)
              api/entrepreneur/  (Entrepreneur portal)
              api/lp/            (LP portal)
              api/gp-investor/   (GP Investor portal)
"""
import logging
import mimetypes
from datetime import date, timedelta
from decimal import Decimal
from django.db import transaction

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from django.http import FileResponse
from django.urls import reverse
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.mail import send_mail
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt
from rest_framework import generics, permissions, status, viewsets, parsers
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action

from deals.b2_utils import generate_presigned_upload_url, generate_presigned_download_url
from deals.models import (
    Fund,
    FundDocument,
    CapitalCall,
    Distribution,
    ImmutableAuditEvent,
    LPDocumentAccess,
    LPFundCommitment,
    LPProfile,
    LPKYCDocument,
    PEFormTemplate,
    PEInvestment,
    PEProject,
    PEProjectDocument,
    PEProjectFormResponse,
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
    EntrepreneurKYBDocument,
    GovernanceProposal,
    ProposalVote,
    ManagementFeeAccrual,
    IRDocument,
    GPShareholder,
    WaterfallModel,
    WaterfallRun,
    ValuationRecord,
    ExitScenario,
    ExtractedFinancials,
    QoEReport,
    TermSheet,
    SPADraft,
    LPSupportRequest,
)






from deals.permissions import (
    IsEntrepreneurRole,
    IsGPInvestorRole,
    IsGPStaff,
    IsLPRole,
    IsDealAccessible,
    IsSuperAdminRole,
)
from deals.signals import _log_audit_event
from deals.serializers import (
    DocumentUploadRequestSerializer,
    FundDocumentSerializer,
    FundSerializer,
    GPInviteSerializer,
    GPInvestorDashboardSerializer,
    ImmutableAuditEventSerializer,
    LPDashboardFundSerializer,
    LPFundCommitmentSerializer,
    LPPortfolioSerializer,
    LPProfileSerializer,
    LPKYCDocumentSerializer,
    PEFormTemplateSerializer,
    PEInvestmentSerializer,
    PEProjectDetailSerializer,
    PEProjectDocumentSerializer,
    PEProjectFormResponseSerializer,
    PEProjectListSerializer,
    PEProjectStatusUpdateSerializer,
    ExtractedFinancialsSerializer,
    QoEReportSerializer,
    CommercialAnalysisSerializer,
    OperationalAnalysisSerializer,
    RedFlagFindingSerializer,
    ScoringRunSerializer,
    CriterionScoreSerializer,
    ComplianceGateSerializer,
    ValuationModelSerializer,
    DCFAssumptionsSerializer,
    LBOAssumptionsSerializer,
    RegulatoryChecklistSerializer,
    SEBONFilingDeadlineSerializer,
    DealMemoSerializer,
    PortfolioKPIReportSerializer,
    WaterfallModelSerializer,
    WaterfallRunSerializer,
    ValuationRecordSerializer,
    ExitScenarioSerializer,
    IPOEligibilitySerializer,
    EntrepreneurKYBDocumentSerializer,
    IRDocumentSerializer,
    GovernanceProposalSerializer,
    ProposalVoteSerializer,
    TermSheetSerializer,
    SPADraftSerializer,
    CapitalCallSerializer,
    LPSupportRequestSerializer,
)

from deals.valuation import calculate_dcf, calculate_lbo
from deals.ipo_eligibility import check_ipo_eligibility


from deals.tasks import (

    extract_financials_from_document, 
    run_qoe_analysis,
    run_commercial_analysis,
    run_operational_analysis,
    run_nepal_compliance_check,
    generate_memo_draft,
    run_finlo_scoring,
    scan_legal_document,
    run_full_analysis
)


# ---------------------------------------------------------------------------
# LP Performance Helpers
# ---------------------------------------------------------------------------

from .helpers import get_deal_for_user

from deals.tasks import generate_ai_valuation


class GPProjectExtractFinancialsView(APIView):
    """
    POST /api/deals/projects/<uuid>/extract-financials/
    Triggers AI extraction for a specific document.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk):
        document_id = request.data.get('document_id')
        if not document_id:
            raise ValidationError("document_id is required.")
        
        # Trigger Celery Task
        task = extract_financials_from_document.delay(document_id)
        
        return Response({
            "status": "Task triggered",
            "task_id": task.id
        }, status=status.HTTP_202_ACCEPTED)



class GPProjectExtractedFinancialsView(generics.ListCreateAPIView):
    """
    GET /api/deals/projects/<uuid>/extracted-financials/
    POST /api/deals/projects/<uuid>/extracted-financials/ (Manual Entry)
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = ExtractedFinancialsSerializer

    def get_queryset(self):
        return ExtractedFinancials.objects.filter(project_id=self.kwargs['pk'])

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs['pk'])



class GPProjectQoEAnalysisView(APIView):
    """
    GET /api/deals/projects/<uuid>/qoe-analysis/
    Returns latest report or triggers a new one if requested.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        
        # Check if they want to trigger a new analysis
        if request.query_params.get('trigger') == 'true':
            task = run_qoe_analysis.delay(str(project.pk))
            return Response({"status": "Analysis triggered", "task_id": task.id}, status=status.HTTP_202_ACCEPTED)

        report = project.qoe_reports.first()
        if not report:
            return Response({"detail": "No QoE report found for this project."}, status=status.HTTP_404_NOT_FOUND)
            
        return Response(QoEReportSerializer(report).data)


class GPProjectQoEUpdateView(generics.RetrieveUpdateAPIView):
    """
    PATCH /api/deals/projects/<uuid>/qoe-analysis/<id>/
    Manual edit of the QoE report by GP.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = QoEReportSerializer
    lookup_url_kwarg = 'report_id'

    def get_queryset(self):
        return QoEReport.objects.filter(project_id=self.kwargs['pk'])

    def perform_update(self, serializer):
        instance = serializer.save()
        _log_audit_event(
            event_type='QOE_REPORT_EDITED',
            actor=self.request.user,
            obj=instance,
            payload=self.request.data,
            request=self.request
        )



class GPExtractedFinancialsUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """
    PATCH /api/deals/projects/<uuid>/extracted-financials/<id>/
    DELETE /api/deals/projects/<uuid>/extracted-financials/<id>/
    GP manually overrides or deletes the extracted financial data.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = ExtractedFinancialsSerializer
    lookup_url_kwarg = 'fin_id'

    def get_queryset(self):
        return ExtractedFinancials.objects.filter(project_id=self.kwargs['pk'])

    def perform_update(self, serializer):
        instance = serializer.save()
        _log_audit_event(
            event_type='FINANCIAL_OVERRIDE',
            actor=self.request.user,
            obj=instance,
            payload=self.request.data,
            request=self.request
        )



class GPExtractedFinancialsVerifyView(APIView):
    """
    PATCH /api/deals/projects/<uuid>/extracted-financials/<id>/verify/
    GP verifies (and optionally updates) the extracted financial data.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def patch(self, request, pk, fin_id):
        financial = get_object_or_404(ExtractedFinancials, pk=fin_id, project_id=pk)
        
        # If data is provided, update before verifying
        if request.data:
            serializer = ExtractedFinancialsSerializer(financial, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            financial = serializer.save()

        financial.is_verified_by_gp = True
        financial.verified_by = request.user
        financial.verified_at = timezone.now()
        financial.save()
        
        return Response(ExtractedFinancialsSerializer(financial).data)



class GPProjectCommercialAnalysisView(APIView):
    """
    POST /api/deals/projects/<uuid>/run-commercial-analysis/
    GET /api/deals/projects/<uuid>/commercial-analysis/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        task = run_commercial_analysis.delay(str(project.pk))
        return Response({"status": "Commercial analysis triggered", "task_id": task.id}, status=status.HTTP_202_ACCEPTED)

    def get(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        analysis = project.commercial_analyses.first()
        if not analysis:
            return Response({"detail": "No commercial analysis found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CommercialAnalysisSerializer(analysis).data)

    def patch(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        analysis = project.commercial_analyses.first()
        if not analysis:
            return Response({"detail": "No commercial analysis found to update."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = CommercialAnalysisSerializer(analysis, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class GPProjectOperationalAnalysisView(APIView):
    """
    POST /api/deals/projects/<uuid>/run-operational-analysis/
    GET /api/deals/projects/<uuid>/operational-analysis/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        manual_context = request.data.get('manual_context', '')
        task = run_operational_analysis.delay(str(project.pk), manual_context=manual_context)
        return Response({"status": "Operational analysis triggered", "task_id": task.id}, status=status.HTTP_202_ACCEPTED)

    def get(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        analysis = project.operational_analyses.first()
        if not analysis:
            return Response({"detail": "No operational analysis found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(OperationalAnalysisSerializer(analysis).data)

    def patch(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        analysis = project.operational_analyses.first()
        if not analysis:
            return Response({"detail": "No operational analysis found to update."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = OperationalAnalysisSerializer(analysis, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class GPLegalScannerView(APIView):
    """
    POST /api/deals/projects/<uuid>/documents/<id>/scan-legal/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk, doc_id):
        get_deal_for_user(self.request, pk=pk)
        doc = get_object_or_404(PEProjectDocument, pk=doc_id, project_id=pk)
        
        task = scan_legal_document.delay(str(doc.id))
        return Response({"status": "Legal scan triggered", "task_id": task.id}, status=status.HTTP_202_ACCEPTED)



class GPProjectRedFlagsView(generics.ListAPIView):
    """
    GET /api/deals/projects/<uuid>/red-flags/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = RedFlagFindingSerializer

    def get_queryset(self):
        return RedFlagFinding.objects.filter(project_id=self.kwargs['pk'])



class GPRedFlagReviewView(APIView):
    """
    PATCH /api/deals/red-flags/<id>/review/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def patch(self, request, pk):
        finding = get_object_or_404(RedFlagFinding, pk=pk)
        finding.is_reviewed_by_gp = True
        finding.reviewed_by = request.user
        finding.reviewed_at = timezone.now()
        finding.save()
        return Response(RedFlagFindingSerializer(finding).data)



class GPTriggerScoringView(APIView):
    """
    POST /api/deals/projects/<uuid:project_id>/trigger-scoring/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        task = run_finlo_scoring.delay(str(project.id), request.user.id)
        return Response({"status": "FINLO scoring triggered", "task_id": task.id}, status=status.HTTP_202_ACCEPTED)



class GPProjectLatestScoringView(APIView):
    """
    GET /api/deals/projects/<uuid:project_id>/scoring/latest/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        run = project.scoring_runs.first()
        if not run:
            return Response({"detail": "No scoring run found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ScoringRunSerializer(run).data)



class GPCriterionOverrideView(APIView):
    """
    PATCH /api/deals/projects/<uuid:project_id>/scoring/criteria/<uuid:score_id>/override/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def patch(self, request, pk, score_id):
        score = get_object_or_404(CriterionScore, pk=score_id, scoring_run__project_id=pk)
        old_val = score.gp_score or score.ai_score
        new_val = request.data.get('gp_score')
        notes = request.data.get('gp_notes', '')

        if new_val is None:
            return Response({"detail": "gp_score is required"}, status=status.HTTP_400_BAD_REQUEST)

        score.gp_score = new_val
        score.gp_notes = notes
        score.overridden_by = request.user
        score.overridden_at = timezone.now()
        score.save()

        # Log Audit Event
        _log_audit_event(
            event_type='SCORING_OVERRIDE',
            actor=request.user,
            obj=score,
            payload={
                "criterion": score.criterion_id,
                "old_value": old_val,
                "new_value": new_val,
                "notes": notes
            },
            request=request
        )


class GPClearComplianceGateView(APIView):
    """
    POST /api/deals/projects/<uuid:project_id>/scoring/gates/<str:gate_id>/clear/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk, gate_id):
        run = ScoringRun.objects.filter(project_id=pk).first()
        if not run:
            return Response({"detail": "No scoring run found"}, status=status.HTTP_404_NOT_FOUND)
        
        gate = get_object_or_404(ComplianceGate, scoring_run=run, gate_id=gate_id)
        gate.status = 'CLEARED'
        gate.cleared_by = request.user
        gate.cleared_at = timezone.now()
        gate.notes = request.data.get('notes', '')
        gate.save()

        # Handle documents if provided
        doc_ids = request.data.get('document_ids', [])
        single_doc = request.data.get('document_id')
        if single_doc:
            doc_ids.append(single_doc)
            
        if doc_ids:
            gate.documents.set(doc_ids)

        _log_audit_event(
            event_type='COMPLIANCE_CLEARED',
            actor=request.user,
            obj=gate,
            payload={"gate": gate_id},
            request=request
        )

        return Response(ComplianceGateSerializer(gate).data)



class GPResetComplianceGateView(APIView):
    """
    POST /api/deals/projects/<uuid:project_id>/scoring/gates/<str:gate_id>/reset/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk, gate_id):
        run = ScoringRun.objects.filter(project_id=pk).first()
        if not run:
            return Response({"detail": "No scoring run found"}, status=status.HTTP_404_NOT_FOUND)
        
        gate = get_object_or_404(ComplianceGate, scoring_run=run, gate_id=gate_id)
        gate.status = 'PENDING'
        gate.cleared_by = None
        gate.cleared_at = None
        gate.notes = ""
        gate.documents.clear()
        gate.save()

        _log_audit_event(
            event_type='COMPLIANCE_RESET',
            actor=request.user,
            obj=gate,
            payload={"gate": gate_id},
            request=request
        )

        return Response(ComplianceGateSerializer(gate).data)




class GPDCFValuationView(APIView):
    """
    POST /api/deals/projects/<uuid:pk>/valuation/dcf/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        assumptions = request.data.get('assumptions', {})
        
        # Calculate
        outputs = calculate_dcf(assumptions)
        
        # Save
        val = ValuationModel.objects.create(
            project=project,
            model_type='DCF',
            assumptions=assumptions,
            outputs=outputs,
            created_by=request.user
        )
        
        # Save structured assumptions
        DCFAssumptions.objects.create(
            valuation=val,
            projection_years=assumptions.get('projection_years', 5),
            revenue_growth_rate=assumptions.get('revenue_growth_rate', 0),
            ebitda_margin=assumptions.get('ebitda_margin', 0),
            tax_rate=assumptions.get('tax_rate', 0.25),
            wacc=assumptions.get('wacc', 0.1),
            terminal_growth_rate=assumptions.get('terminal_growth_rate', 0.03)
        )
        
        return Response(ValuationModelSerializer(val).data, status=status.HTTP_201_CREATED)



class GPLBOValuationView(APIView):
    """
    POST /api/deals/projects/<uuid:pk>/valuation/lbo/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        assumptions = request.data.get('assumptions', {})
        
        # Calculate
        outputs = calculate_lbo(assumptions)
        
        # Save
        val = ValuationModel.objects.create(
            project=project,
            model_type='LBO',
            assumptions=assumptions,
            outputs=outputs,
            created_by=request.user
        )
        
        # Save structured assumptions
        LBOAssumptions.objects.create(
            valuation=val,
            entry_ebitda=assumptions.get('entry_ebitda', 0),
            purchase_multiple=assumptions.get('entry_multiple', 0),
            debt_financing=assumptions.get('debt_financing', []),
            exit_year=assumptions.get('exit_year', 5),
            exit_multiple=assumptions.get('exit_multiple', 0)
        )
        
        return Response(ValuationModelSerializer(val).data, status=status.HTTP_201_CREATED)



class GPValuationDetailView(generics.RetrieveAPIView):
    """
    GET /api/deals/projects/<uuid:pk>/valuation/<uuid:model_id>/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = ValuationModelSerializer
    lookup_url_kwarg = 'model_id'

    def get_queryset(self):
        return ValuationModel.objects.filter(project_id=self.kwargs['pk'])



class GPValuationSensitivityView(APIView):
    """
    POST /api/deals/projects/<uuid:pk>/valuation/<uuid:model_id>/sensitivity/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk, model_id):
        val_model = get_object_or_404(ValuationModel, pk=model_id, project_id=pk)
        
        # Sensitivity inputs: e.g. wacc_range, terminal_growth_range for DCF
        # Or entry_multiple_range, exit_multiple_range for LBO
        sensitivity_config = request.data # { "x_axis": "wacc", "y_axis": "terminal_growth", "x_range": [...], "y_range": [...] }
        
        results = []
        base_assumptions = val_model.assumptions.copy()
        
        x_field = sensitivity_config.get('x_axis')
        y_field = sensitivity_config.get('y_axis')
        x_range = sensitivity_config.get('x_range', [])
        y_range = sensitivity_config.get('y_range', [])
        
        for y_val in y_range:
            row = []
            for x_val in x_range:
                temp_assumptions = base_assumptions.copy()
                temp_assumptions[x_field] = x_val
                temp_assumptions[y_field] = y_val
                
                if val_model.model_type == 'DCF':
                    out = calculate_dcf(temp_assumptions)
                    row.append(out['equity_value'])
                else:
                    out = calculate_lbo(temp_assumptions)
                    row.append(out['irr'])
            results.append({"y_val": y_val, "row": row})
            
        return Response({
            "x_axis": x_field,
            "y_axis": y_field,
            "x_range": x_range,
            "y_range": y_range,
            "results": results
        })



class GPFullAnalysisView(APIView):
    """
    POST /api/deals/projects/<uuid:pk>/run-full-analysis/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        run_full_analysis.delay(project.id, user_id=request.user.id)
        return Response({"status": "Full AI analysis pipeline triggered"}, status=status.HTTP_202_ACCEPTED)




class WaterfallCalculateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request):
        investment_id = request.data.get('investment_id')
        exit_proceeds = request.data.get('exit_proceeds')
        fund_id = request.data.get('fund_id')
        
        if not investment_id or not exit_proceeds:
            return Response({'detail': 'investment_id and exit_proceeds are required.'}, status=400)
            
        try:
            outputs, run = calculate_distribution(investment_id, exit_proceeds, fund_id)
            
            # Log Audit Event
            _log_audit_event(
                event_type='WATERFALL_CALCULATED',
                actor=request.user,
                obj=run,
                payload={
                    "investment_id": str(investment_id),
                    "exit_proceeds": float(exit_proceeds),
                    "irr": outputs.get('irr')
                },
                request=request
            )
            
            return Response(WaterfallRunSerializer(run).data, status=200)
        except Exception as e:
            return Response({'detail': str(e)}, status=400)



class WaterfallHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = WaterfallRunSerializer

    def get_queryset(self):
        qs = WaterfallRun.objects.all().order_by('-created_at')
        fund_id = self.request.query_params.get('fund_id')
        if fund_id:
            qs = qs.filter(investment__fund_id=fund_id)
        return qs



class MonteCarloSimulationView(APIView):
    """
    POST /api/deals/portfolio/monte-carlo/
    Runs a Monte Carlo simulation for a specific investment.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request):
        investment_id = request.data.get('investment_id')
        num_simulations = request.data.get('num_simulations', 10000)
        custom_assumptions = request.data.get('assumptions', {})
        
        if not investment_id:
            return Response({"error": "investment_id is required"}, status=400)
            
        results = run_monte_carlo(
            investment_id=investment_id,
            num_simulations=int(num_simulations),
            custom_assumptions=custom_assumptions
        )
        
        if "error" in results:
            return Response(results, status=404)
            
        # Log Audit Event
        _log_audit_event(
            event_type='MONTE_CARLO_RUN',
            actor=request.user,
            payload={
                "investment_id": str(investment_id),
                "simulations": num_simulations,
                "median_irr": results.get('median_irr')
            },
            request=request
        )
            
        return Response(results)



class ValuationRecordViewSet(viewsets.ModelViewSet):
    """
    CRUD for investment valuations.
    GP staff only. Investors see restricted info via a separate endpoint/serializer.
    """
    queryset = ValuationRecord.objects.all()
    serializer_class = ValuationRecordSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        inv_id = self.kwargs.get('investment_id')
        if inv_id:
            qs = qs.filter(investment_id=inv_id)
        return qs

    def get_permissions(self):
        if self.action == 'destroy':
            return [permissions.IsAuthenticated(), IsGPStaff()]
        return [permissions.IsAuthenticated(), IsGPStaff()]

    def perform_create(self, serializer):
        investment_id = self.kwargs.get('investment_id') or self.request.data.get('investment')
        investment = get_object_or_404(PEInvestment, id=investment_id)
        
        # Auto-populate previous valuation
        prev = ValuationRecord.objects.filter(investment=investment).order_by('-valuation_date').first()
        prev_val = prev.fair_value_npr if prev else None
        
        val_record = serializer.save(
            valuer=self.request.user,
            previous_valuation_npr=prev_val
        )
        
        _log_audit_event(
            event_type='VALUATION_CREATED',
            obj=val_record,
            actor=self.request.user,
            payload={
                "investment_id": str(investment.id),
                "valuation_id": str(val_record.id),
                "fair_value": str(val_record.fair_value_npr)
            }
        )

    def perform_update(self, serializer):
        val_record = serializer.save()
        _log_audit_event(
            event_type='VALUATION_UPDATED',
            obj=val_record,
            actor=self.request.user,
            payload={"valuation_id": str(val_record.id)}
        )

    def perform_destroy(self, instance):
        if not self.request.user.has_role('super_admin'):
            raise PermissionDenied("Only super admins can delete valuations.")
        
        _log_audit_event(
            event_type='VALUATION_DELETED',
            obj=instance,
            actor=self.request.user,
            payload={"valuation_id": str(instance.id), "fair_value": str(instance.fair_value_npr)}
        )
        instance.delete()



class ExitScenarioViewSet(viewsets.ModelViewSet):
    queryset = ExitScenario.objects.all()
    serializer_class = ExitScenarioSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get_queryset(self):
        qs = super().get_queryset()
        inv_id = self.kwargs.get('investment_id')
        if inv_id:
            qs = qs.filter(investment_id=inv_id)
        return qs

    def perform_create(self, serializer):
        investment_id = self.kwargs.get('investment_id') or self.request.data.get('investment')
        investment = get_object_or_404(PEInvestment, id=investment_id)
        
        # Handle base case uniqueness
        is_base = self.request.data.get('is_base_case', False)
        if is_base:
            ExitScenario.objects.filter(investment=investment, is_base_case=True).update(is_base_case=False)
            
        scenario = serializer.save(created_by=self.request.user)
        
        # IPO Eligibility check
        if scenario.exit_type == 'IPO':
            report = check_ipo_eligibility(investment.project, investment)
            scenario.ipo_is_eligible = report['is_eligible']
            scenario.ipo_eligibility_notes = report['overall_requirements']
            scenario.save()
            
        _log_audit_event(
            event_type='EXIT_SCENARIO_CREATED',
            obj=scenario,
            actor=self.request.user,
            payload={"scenario_id": str(scenario.id), "name": scenario.name}
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if not request.user.has_role('super_admin'):
            raise PermissionDenied("Only super admins can approve exit scenarios.")
        
        scenario = self.get_object()
        scenario.is_approved_by_ic = True
        scenario.save()
        
        _log_audit_event(
            event_type='EXIT_SCENARIO_APPROVED',
            obj=scenario,
            actor=request.user,
            payload={"scenario_id": str(scenario.id)}
        )
        return Response({"status": "approved"})



class IPOEligibilityView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request, investment_id):
        investment = get_object_or_404(PEInvestment, id=investment_id)
        report = check_ipo_eligibility(investment.project, investment)
        
        _log_audit_event(
            event_type='IPO_ELIGIBILITY_CHECKED',
            obj=investment,
            actor=request.user,
            payload={"investment_id": str(investment_id)}
        )
        return Response(report)



class ExitSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request):
        fund_id = request.query_params.get('fund_id')
        scenarios = ExitScenario.objects.filter(is_base_case=True)
        if fund_id:
            scenarios = scenarios.filter(investment__fund_id=fund_id)
            
        total_exit_value = scenarios.aggregate(Sum('expected_exit_value_npr'))['expected_exit_value_npr__sum'] or 0
        
        # Aggregations
        exit_types = scenarios.values('exit_type').annotate(count=models.Count('id'), total_value=Sum('expected_exit_value_npr'))
        
        return Response({
            "total_projected_exit_value_npr": total_exit_value,
            "scenario_count": scenarios.count(),
            "exit_type_distribution": list(exit_types)
        })


# ---------------------------------------------------------------------------
# Phase 2: AI Valuation, IC Signed Upload, Term Sheet, SPA Draft Views
# ---------------------------------------------------------------------------


class GPGenerateAIValuationView(APIView):
    """
    POST /api/deals/projects/<uuid:pk>/generate-ai-valuation/
    Triggers Gemini-powered DCF/LBO assumption generation.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)

        if project.status not in [PEProject.Status.IC_REVIEW, PEProject.Status.TERM_SHEET]:
            return Response({"detail": "AI valuation is only available during IC_REVIEW or TERM_SHEET stage."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Set progress to processing immediately to avoid race condition in polling
        progress = project.analysis_progress or {}
        progress['Valuation'] = 'processing'
        project.analysis_progress = progress
        project.save()

        from deals.tasks import generate_ai_valuation
        generate_ai_valuation.delay(str(project.id), str(request.user.id))

        return Response({"status": "AI valuation generation started."})



class GPValuationOverrideView(APIView):
    """
    PATCH /api/deals/projects/<uuid:pk>/valuations/<uuid:val_id>/override/
    Override a specific field in a valuation model. Logged to immutable audit.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def patch(self, request, pk, val_id):
        project = get_deal_for_user(self.request, pk=pk)
        val = get_object_or_404(ValuationModel, pk=val_id, project=project)

        field_path = request.data.get('field')  # e.g., "assumptions.wacc" or "outputs.equity_value"
        new_value = request.data.get('value')
        remarks = request.data.get('remarks', '')

        if not field_path or new_value is None:
            return Response({"detail": "'field' and 'value' are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Split field path into target dict and key
        parts = field_path.split('.')
        if len(parts) != 2 or parts[0] not in ('assumptions', 'outputs'):
            return Response({"detail": "Field path must be 'assumptions.<key>' or 'outputs.<key>'."}, status=status.HTTP_400_BAD_REQUEST)

        target_dict_name, key = parts
        target_dict = val.assumptions if target_dict_name == 'assumptions' else val.outputs
        old_value = target_dict.get(key)

        target_dict[key] = new_value
        if target_dict_name == 'assumptions':
            val.assumptions = target_dict
        else:
            val.outputs = target_dict
        val.save()

        # Audit log
        ImmutableAuditEvent.objects.create(
            event_type='VALUATION_OVERRIDE',
            actor=request.user,
            object_id=project.id,
            object_repr=str(project),
            content_type_label='deals.ValuationModel',
            payload={
                'valuation_id': str(val.id),
                'model_type': val.model_type,
                'field': field_path,
                'old_value': old_value,
                'new_value': new_value,
                'remarks': remarks,
            }
        )

        return Response({"status": "Override applied", "field": field_path, "old": old_value, "new": new_value})


