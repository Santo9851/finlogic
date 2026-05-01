from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from core.models import User
from deals.models import Fund
from core.permissions import IsSuperAdmin
from .serializers import SuperAdminUserSerializer, SuperAdminFundSerializer
from django.core.mail import send_mail
from django.conf import settings

class SuperAdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = SuperAdminUserSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name', 'roles']
    ordering_fields = ['created_at', 'email', 'last_name']

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        user = self.get_object()
        # Mocking password reset email trigger
        # In a real app, you'd use django.contrib.auth.forms.PasswordResetForm 
        # or a custom logic to send a JWT-based reset link.
        subject = "Password Reset Requested"
        message = f"Hello {user.first_name},\n\nA password reset has been requested for your account. Please follow the instructions on the platform to reset your password."
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            return Response({"detail": f"Password reset email sent to {user.email}"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SuperAdminFundViewSet(viewsets.ModelViewSet):
    queryset = Fund.objects.all().order_by('-vintage_year', 'name')
    serializer_class = SuperAdminFundSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'legal_name']
    ordering_fields = ['vintage_year', 'name', 'created_at']

    def perform_destroy(self, instance):
        # Optional soft delete logic if needed, but the model doesn't inherit SoftDeleteModel directly in deals
        # unless it was specified. Checking deals.Fund again... 
        # Actually core.models.Fund has SoftDeleteModel but deals.models.Fund does NOT.
        # So it's a hard delete unless we add soft delete to it.
        instance.delete()
