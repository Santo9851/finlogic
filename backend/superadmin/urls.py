from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SuperAdminUserViewSet, SuperAdminFundViewSet

router = DefaultRouter()
router.register(r'users', SuperAdminUserViewSet, basename='superadmin-users')
router.register(r'funds', SuperAdminFundViewSet, basename='superadmin-funds')

urlpatterns = [
    path('', include(router.urls)),
]
