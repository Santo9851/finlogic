"""
deals/urls.py
URL routing for the PE Deals app.

Mount in finlogic_api/urls.py:
    path('api/', include('deals.urls')),
    path('api/', include('core.urls')),
"""
from django.urls import path

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
)

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
]
