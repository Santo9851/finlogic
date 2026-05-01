"""
deals/urls.py
URL routing for the PE Deals app.

Mount in finlogic_api/urls.py:
    path('api/', include('deals.urls')),
    path('api/', include('core.urls')),
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    # Funds
    FundListCreateView,
    FundDetailView,
    # GP invite & project management
    GPCreateInviteView,
    GPProjectListView,
    GPProjectDetailView,
    GPProjectUpdateView,
    GPProjectDocumentsView,
    GPProjectFormResponsesView,
    # Entrepreneur token-auth flow
    EntrepreneurInviteDetailView,
    EntrepreneurSubmitStepView,
    EntrepreneurGetUploadURLView,
    GPGetUploadURLView,
    DocumentConfirmView,
    EntrepreneurFinalizeView,
    DocumentDownloadURLView,
    DocumentDeleteView,
    # Entrepreneur dashboard (JWT-auth)
    EntrepreneurSubmissionsListView,
    EntrepreneurSubmissionDetailView,
    EntrepreneurAuthSubmitStepView,
    EntrepreneurAuthFinalizeView,
    EntrepreneurAuthGetUploadURLView,
    # LP portal
    LPDashboardView,
    LPFundDetailView,
    # GP Investor portal
    GPInvestorDashboardView,
    # LP Profile
    LPProfileListCreateView,
    LPProfileDetailView,
    LPProfileSelfView,
    LPKYCUploadView,
    # Form Templates
    PEFormTemplateListView,
    PEFormTemplateDetailView,
    # Fund Document Management
    GPFundDocumentView,
    GPFundDocumentDetailView,
    GPFundGetUploadURLView,
    LPDocumentListView,
    LPDocumentDownloadView,
    LPDocumentAcknowledgeView,
    LPPortfolioView,
    # AI Financials
    GPProjectExtractFinancialsView,
    GPProjectExtractedFinancialsView,
    GPProjectQoEAnalysisView,
    GPExtractedFinancialsVerifyView,
    GPProjectCommercialAnalysisView,
    GPProjectOperationalAnalysisView,
    GPLegalScannerView,
    GPProjectRedFlagsView,
    GPRedFlagReviewView,
    GPTriggerScoringView,
    GPProjectLatestScoringView,
    GPCriterionOverrideView,
    GPClearComplianceGateView,
    GPApproveForLPView,
    GPDCFValuationView,
    GPLBOValuationView,
    GPValuationDetailView,
    GPValuationSensitivityView,
    GPRegulatoryChecklistView,
    GPSEBONFilingDeadlineListView,
    GPGenerateMemoView,
    GPMemoDetailView,
    GPMemoFinalizeView,
    GPFullAnalysisView,
    PortfolioKPIReportListView,
    PortfolioKPIReportDetailView,
    # New Stakeholder views
    GPInvestorIRListView,
    GPInvestorGovernanceListView,
    GPInvestorVoteView,
    GPIRDocumentViewSet,
    GPGovernanceProposalViewSet,
    EntrepreneurKYBUploadView,
    EntrepreneurKYBListView,
    WaterfallCalculateView,
    WaterfallHistoryView,
    DistributionCreateView,
    LPDistributionListView,
    LPStatementGenerateView,
    LPStatementListView,
    LPStatementDownloadView,
    GPFundLPsView,
    MonteCarloSimulationView,
    ValuationRecordViewSet,
    ExitScenarioViewSet,
    IPOEligibilityView,
    ExitSummaryView,
)

router = DefaultRouter()
router.register(r'admin/ir-documents', GPIRDocumentViewSet, basename='admin-ir-docs')
router.register(r'governance-proposals', GPGovernanceProposalViewSet, basename='gp-governance-proposal')
router.register(r'valuations', ValuationRecordViewSet, basename='valuation-record')
router.register(r'exit-scenarios', ExitScenarioViewSet, basename='exit-scenario')









app_name = 'deals'

urlpatterns = [
    # ── Funds ──────────────────────────────────────────────────────────────
    path('deals/funds/', FundListCreateView.as_view(), name='fund-list-create'),
    path('deals/funds/<uuid:pk>/', FundDetailView.as_view(), name='fund-detail'),

    # ── GP Project Management ───────────────────────────────────────────────
    # IMPORTANT: specific routes before generic {id} routes
    path(
        'deals/projects/invite/',
        GPCreateInviteView.as_view(),
        name='gp-create-invite',
    ),
    path(
        'deals/projects/',
        GPProjectListView.as_view(),
        name='gp-project-list',
    ),
    path(
        'deals/projects/<uuid:pk>/',
        GPProjectDetailView.as_view(),
        name='gp-project-detail',
    ),
    path(
        'deals/projects/<uuid:pk>/update/',
        GPProjectUpdateView.as_view(),
        name='gp-project-update',
    ),
    path(
        'deals/projects/<uuid:pk>/documents/',
        GPProjectDocumentsView.as_view(),
        name='gp-project-documents',
    ),
    path(
        'deals/projects/<uuid:pk>/form-responses/',
        GPProjectFormResponsesView.as_view(),
        name='gp-project-form-responses',
    ),
    path(
        'deals/projects/<uuid:pk>/extract-financials/',
        GPProjectExtractFinancialsView.as_view(),
        name='gp-project-extract-financials',
    ),
    path(
        'deals/projects/<uuid:pk>/extracted-financials/',
        GPProjectExtractedFinancialsView.as_view(),
        name='gp-project-extracted-financials',
    ),
    path(
        'deals/projects/<uuid:pk>/extracted-financials/<uuid:fin_id>/verify/',
        GPExtractedFinancialsVerifyView.as_view(),
        name='gp-project-extracted-financials-verify',
    ),
    path(
        'deals/projects/<uuid:pk>/qoe-analysis/',
        GPProjectQoEAnalysisView.as_view(),
        name='gp-project-qoe-analysis',
    ),
    path(
        'deals/projects/<uuid:pk>/run-commercial-analysis/',
        GPProjectCommercialAnalysisView.as_view(),
        name='gp-project-run-commercial-analysis',
    ),
    path(
        'deals/projects/<uuid:pk>/commercial-analysis/',
        GPProjectCommercialAnalysisView.as_view(),
        name='gp-project-commercial-analysis',
    ),
    path(
        'deals/projects/<uuid:pk>/run-operational-analysis/',
        GPProjectOperationalAnalysisView.as_view(),
        name='gp-project-run-operational-analysis',
    ),
    path(
        'deals/projects/<uuid:pk>/operational-analysis/',
        GPProjectOperationalAnalysisView.as_view(),
        name='gp-project-operational-analysis',
    ),
    path(
        'deals/projects/<uuid:pk>/documents/<uuid:doc_id>/scan-legal/',
        GPLegalScannerView.as_view(),
        name='gp-project-scan-legal',
    ),
    path(
        'deals/projects/<uuid:pk>/red-flags/',
        GPProjectRedFlagsView.as_view(),
        name='gp-project-red-flags',
    ),
    path(
        'deals/projects/<uuid:pk>/trigger-scoring/',
        GPTriggerScoringView.as_view(),
        name='gp-project-trigger-scoring',
    ),
    path(
        'deals/projects/<uuid:pk>/scoring/latest/',
        GPProjectLatestScoringView.as_view(),
        name='gp-project-scoring-latest',
    ),
    path(
        'deals/projects/<uuid:pk>/scoring/criteria/<uuid:score_id>/override/',
        GPCriterionOverrideView.as_view(),
        name='gp-scoring-criterion-override',
    ),
    path(
        'deals/projects/<uuid:pk>/scoring/gates/<str:gate_id>/clear/',
        GPClearComplianceGateView.as_view(),
        name='gp-scoring-gate-clear',
    ),
    path(
        'deals/projects/<uuid:pk>/approve-for-lp/',
        GPApproveForLPView.as_view(),
        name='gp-project-approve-for-lp',
    ),
    path(
        'deals/projects/<uuid:pk>/valuation/dcf/',
        GPDCFValuationView.as_view(),
        name='gp-project-valuation-dcf',
    ),
    path(
        'deals/projects/<uuid:pk>/valuation/lbo/',
        GPLBOValuationView.as_view(),
        name='gp-project-valuation-lbo',
    ),
    path(
        'deals/projects/<uuid:pk>/valuation/<uuid:model_id>/',
        GPValuationDetailView.as_view(),
        name='gp-project-valuation-detail',
    ),
    path(
        'deals/projects/<uuid:pk>/valuation/<uuid:model_id>/sensitivity/',
        GPValuationSensitivityView.as_view(),
        name='gp-project-valuation-sensitivity',
    ),
    path(
        'deals/projects/<uuid:pk>/regulatory-checklist/',
        GPRegulatoryChecklistView.as_view(),
        name='gp-project-regulatory-checklist',
    ),
    path(
        'compliance/sebon-deadlines/',
        GPSEBONFilingDeadlineListView.as_view(),
        name='gp-sebon-deadlines',
    ),
    path(
        'deals/projects/<uuid:pk>/generate-memo/',
        GPGenerateMemoView.as_view(),
        name='gp-project-generate-memo',
    ),
    path(
        'deals/projects/<uuid:pk>/memos/latest/',
        GPMemoDetailView.as_view(),
        name='gp-project-memo-latest',
    ),
    path(
        'deals/projects/<uuid:pk>/memos/<uuid:memo_id>/',
        GPMemoDetailView.as_view(),
        name='gp-project-memo-detail',
    ),
    path(
        'deals/projects/<uuid:pk>/memos/<uuid:memo_id>/finalize/',
        GPMemoFinalizeView.as_view(),
        name='gp-project-memo-finalize',
    ),
    path(
        'portfolio/kpi-reports/',
        PortfolioKPIReportListView.as_view(),
        name='portfolio-kpi-list',
    ),
    path(
        'portfolio/projects/<uuid:pk>/kpi-reports/',
        PortfolioKPIReportListView.as_view(),
        name='portfolio-project-kpi-create',
    ),
    path(
        'portfolio/kpi-reports/<uuid:pk>/',
        PortfolioKPIReportDetailView.as_view(),
        name='portfolio-kpi-detail',
    ),
    path(
        'deals/projects/<uuid:pk>/run-full-analysis/',
        GPFullAnalysisView.as_view(),
        name='gp-project-run-full-analysis',
    ),
    path(
        'portfolio/waterfall/calculate/',
        WaterfallCalculateView.as_view(),
        name='waterfall-calculate',
    ),
    path(
        'portfolio/waterfall/history/',
        WaterfallHistoryView.as_view(),
        name='waterfall-history',
    ),
    path(
        'portfolio/distributions/',
        DistributionCreateView.as_view(),
        name='distribution-create',
    ),






    path(
        'deals/red-flags/<uuid:pk>/review/',
        GPRedFlagReviewView.as_view(),
        name='gp-red-flag-review',
    ),




    # ── Entrepreneur Token-Auth Flow (public – token is the credential) ────
    path(
        'deals/projects/invite/<uuid:token>/',
        EntrepreneurInviteDetailView.as_view(),
        name='entrepreneur-invite-detail',
    ),
    path(
        'deals/projects/invite/<uuid:token>/step/<str:step_name>/',
        EntrepreneurSubmitStepView.as_view(),
        name='entrepreneur-submit-step',
    ),
    path(
        'deals/projects/invite/<uuid:token>/get-upload-url/',
        EntrepreneurGetUploadURLView.as_view(),
        name='entrepreneur-get-upload-url',
    ),
    path(
        'deals/projects/invite/<uuid:token>/documents/<uuid:doc_id>/confirm/',
        DocumentConfirmView.as_view(),
        name='entrepreneur-document-confirm',
    ),
    path(
        'deals/projects/<uuid:project_id>/get-upload-url/',
        GPGetUploadURLView.as_view(),
        name='gp-get-upload-url',
    ),
    path(
        'deals/projects/<uuid:project_id>/documents/<uuid:doc_id>/confirm/',
        DocumentConfirmView.as_view(),
        name='gp-document-confirm',
    ),
    path(
        'deals/projects/invite/<uuid:token>/submit/',
        EntrepreneurFinalizeView.as_view(),
        name='entrepreneur-finalize',
    ),

    # ── Entrepreneur Dashboard (JWT-authenticated) ─────────────────────────
    path(
        'entrepreneur/submissions/',
        EntrepreneurSubmissionsListView.as_view(),
        name='entrepreneur-submissions-list',
    ),
    path(
        'entrepreneur/submissions/<uuid:pk>/',
        EntrepreneurSubmissionDetailView.as_view(),
        name='entrepreneur-submission-detail',
    ),
    path(
        'entrepreneur/submissions/<uuid:project_id>/step/<str:step_name>/',
        EntrepreneurAuthSubmitStepView.as_view(),
        name='entrepreneur-auth-submit-step',
    ),
    path(
        'entrepreneur/submissions/<uuid:project_id>/finalize/',
        EntrepreneurAuthFinalizeView.as_view(),
        name='entrepreneur-auth-finalize',
    ),
    path(
        'entrepreneur/submissions/<uuid:project_id>/get-upload-url/',
        EntrepreneurAuthGetUploadURLView.as_view(),
        name='entrepreneur-auth-get-upload-url',
    ),

    # ── LP Portal ──────────────────────────────────────────────────────────
    path(
        'deals/lp/dashboard/',
        LPDashboardView.as_view(),
        name='lp-dashboard',
    ),
    path(
        'deals/lp/fund/<uuid:fund_id>/',
        LPFundDetailView.as_view(),
        name='lp-fund-detail',
    ),

    # ── Fund Document Management ──────────────────────────────────────────
    path(
        'deals/funds/<uuid:fund_id>/documents/',
        GPFundDocumentView.as_view(),
        name='gp-fund-documents',
    ),
    path(
        'deals/funds/<uuid:fund_id>/lps/',
        GPFundLPsView.as_view(),
        name='gp-fund-lps',
    ),
    path(
        'deals/funds/documents/<uuid:doc_id>/',
        GPFundDocumentDetailView.as_view(),
        name='gp-fund-document-detail',
    ),
    path(
        'deals/funds/<uuid:fund_id>/get-upload-url/',
        GPFundGetUploadURLView.as_view(),
        name='gp-fund-get-upload-url',
    ),
    
    path(
        'lp/documents/',
        LPDocumentListView.as_view(),
        name='lp-document-list',
    ),
    path(
        'lp/documents/<uuid:doc_id>/download/',
        LPDocumentDownloadView.as_view(),
        name='lp-document-download',
    ),
    path(
        'lp/documents/<uuid:doc_id>/acknowledge/',
        LPDocumentAcknowledgeView.as_view(),
        name='lp-document-acknowledge',
    ),
    path(
        'lp/portfolio/',
        LPPortfolioView.as_view(),
        name='lp-portfolio',
    ),
    path(
        'lp/profile/',
        LPProfileSelfView.as_view(),
        name='lp-profile-self',
    ),
    path(
        'lp/kyc/upload/',
        LPKYCUploadView.as_view(),
        name='lp-kyc-upload',
    ),
    path(
        'lp/distributions/',
        LPDistributionListView.as_view(),
        name='lp-distribution-list',
    ),
    path(
        'lp/generate-statement/',
        LPStatementGenerateView.as_view(),
        name='lp-generate-statement',
    ),
    path(
        'lp/me/statements/',
        LPStatementListView.as_view(),
        name='lp-me-statements',
    ),
    path(
        'lp/me/statements/<uuid:doc_id>/download/',
        LPStatementDownloadView.as_view(),
        name='lp-me-statement-download',
    ),
    path('portfolio/monte-carlo/', MonteCarloSimulationView.as_view(), name='monte-carlo'),
    
    # Valuation & Exit Planning
    path('portfolio/investments/<uuid:investment_id>/valuations/', ValuationRecordViewSet.as_view({'get': 'list', 'post': 'create'}), name='investment-valuations'),
    path('portfolio/investments/<uuid:investment_id>/exit-scenarios/', ExitScenarioViewSet.as_view({'get': 'list', 'post': 'create'}), name='investment-exit-scenarios'),
    path('portfolio/investments/<uuid:investment_id>/ipo-eligibility/', IPOEligibilityView.as_view(), name='ipo-eligibility'),
    path('portfolio/exit-summary/', ExitSummaryView.as_view(), name='exit-summary'),

    # ── GP Investor Portal ─────────────────────────────────────────────────
    path(
        'deals/gp-investor/dashboard/',
        GPInvestorDashboardView.as_view(),
        name='gp-investor-dashboard',
    ),

    # ── LP Profile Management (GP-only) ───────────────────────────────────
    path(
        'deals/lp-profiles/',
        LPProfileListCreateView.as_view(),
        name='lp-profile-list-create',
    ),
    path(
        'deals/lp-profiles/<int:pk>/',
        LPProfileDetailView.as_view(),
        name='lp-profile-detail',
    ),

    # ── Form Template Management (GP-only) ────────────────────────────────
    path(
        'deals/form-templates/',
        PEFormTemplateListView.as_view(),
        name='form-template-list',
    ),
    path(
        'deals/form-templates/<uuid:pk>/',
        PEFormTemplateDetailView.as_view(),
        name='form-template-detail',
    ),
    path(
        'deals/documents/download-url/',
        DocumentDownloadURLView.as_view(),
        name='document-download-url',
    ),
    path(
        'deals/documents/<uuid:pk>/',
        DocumentDeleteView.as_view(),
        name='document-delete',
    ),
    
    # ── Entrepreneur KYB ───────────────────────────────────────────────────
    path('deals/entrepreneur/kyc/upload/', EntrepreneurKYBUploadView.as_view(), name='entrepreneur-kyc-upload'),
    path('deals/entrepreneur/kyc/', EntrepreneurKYBListView.as_view(), name='entrepreneur-kyc-list'),

    # ── GP Investor Portal Extensions ──────────────────────────────────────
    path('deals/gp-investor/dashboard/', GPInvestorDashboardView.as_view(), name='gp-investor-dashboard'),
    path('deals/gp-investor/ir-documents/', GPInvestorIRListView.as_view(), name='gp-invest-ir-list'),
    path('deals/gp-investor/governance/proposals/', GPInvestorGovernanceListView.as_view(), name='gp-invest-gov-props'),
    path('deals/gp-investor/governance/vote/', GPInvestorVoteView.as_view(), name='gp-invest-vote'),

    # ── Admin Viewsets ─────────────────────────────────────────────────────
    path('deals/', include(router.urls)),
]
