from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from . import views

# ---------------------------------------------------------------------------
# Router — ViewSet-based endpoints
# ---------------------------------------------------------------------------

router = DefaultRouter()
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(r'project-files', views.ProjectFileViewSet, basename='project-file')
router.register(r'insights/articles', views.ArticleViewSet, basename='article')
router.register(r'insights/series', views.SeriesViewSet, basename='series')
router.register(r'insights/courses', views.CourseViewSet, basename='course')
router.register(r'insights/webinars', views.WebinarViewSet, basename='webinar')
router.register(r'investor/funds', views.InvestorFundViewSet, basename='investor-fund')
router.register(r'investor/commitments', views.InvestorCommitmentViewSet, basename='investor-commitment')

# ---------------------------------------------------------------------------
# URL patterns
# ---------------------------------------------------------------------------

urlpatterns = [
    # Health check
    path('health/', views.HealthCheckView.as_view(), name='health-check'),

    # Dashboard
    path('dashboard/entrepreneur/', views.EntrepreneurDashboardView.as_view(), name='dashboard-entrepreneur'),
    path('dashboard/investor/', views.InvestorDashboardView.as_view(), name='dashboard-investor'),

    # Auth
    path('auth/register/', views.RegisterView.as_view(), name='auth-register'),
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='auth-login'),
    path('auth/login/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('auth/profile/', views.ProfileView.as_view(), name='auth-profile'),
    path('auth/forgot-password/', views.ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('auth/reset-password/', views.ResetPasswordView.as_view(), name='auth-reset-password'),

    # Contact
    path('contact/', views.ContactCreateView.as_view(), name='contact-create'),

    # Wisdom Hub Data
    path('wisdom-hub/dashboard/', views.WisdomHubDashboardView.as_view(), name='wisdom-hub-dashboard'),

    # Evaluation endpoints — must be declared BEFORE include(router.urls) so the
    # router's /projects/<pk>/ pattern does not shadow them.
    path(
        'projects/<uuid:project_id>/evaluate/draft/',
        views.EvaluationDraftView.as_view(),
        name='project-evaluate-draft',
    ),
    path(
        'projects/<uuid:project_id>/evaluate/',
        views.ProjectEvaluateView.as_view(),
        name='project-evaluate',
    ),

    # Router URLs (projects, insights, investor)
    path('', include(router.urls)),
]
