from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IdeaValidationSessionViewSet, IdeaValidatorQuotaViewSet

router = DefaultRouter()
router.register(r'sessions', IdeaValidationSessionViewSet, basename='validation-session')
router.register(r'quota', IdeaValidatorQuotaViewSet, basename='validation-quota')

urlpatterns = [
    path('', include(router.urls)),
]
