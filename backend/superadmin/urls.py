from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SuperAdminUserViewSet, 
    SuperAdminFundViewSet, 
    SuperAdminPromptViewSet, 
    SuperAdminAuditLogViewSet,
    SuperAdminSEBONDeadlineViewSet,
    SuperAdminRegulatoryChecklistViewSet,
    SuperAdminConflictOfInterestViewSet,
    SuperAdminAnalyticsViewSet,
    SuperAdminDealViewSet,
    SuperAdminValidationViewSet
)

router = DefaultRouter()
router.register(r'users', SuperAdminUserViewSet, basename='superadmin-users')
router.register(r'funds', SuperAdminFundViewSet, basename='superadmin-funds')
router.register(r'prompts', SuperAdminPromptViewSet, basename='superadmin-prompts')
router.register(r'audit-logs', SuperAdminAuditLogViewSet, basename='superadmin-audit-logs')
router.register(r'sebon-deadlines', SuperAdminSEBONDeadlineViewSet, basename='superadmin-sebon')
router.register(r'regulatory-checklists', SuperAdminRegulatoryChecklistViewSet, basename='superadmin-checklists')
router.register(r'conflicts-of-interest', SuperAdminConflictOfInterestViewSet, basename='superadmin-conflicts')
router.register(r'analytics', SuperAdminAnalyticsViewSet, basename='superadmin-analytics')
router.register(r'deals', SuperAdminDealViewSet, basename='superadmin-deals')
router.register(r'validations', SuperAdminValidationViewSet, basename='superadmin-validations')

urlpatterns = [
    path('', include(router.urls)),
]
