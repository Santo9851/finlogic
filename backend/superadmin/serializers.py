from rest_framework import serializers
from core.models import User, AuditLog
from deals.models import Fund, PromptLibrary

class SuperAdminUserSerializer(serializers.ModelSerializer):
    role_list = serializers.ListField(child=serializers.CharField(), read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone', 
            'roles', 'role_list', 'is_active', 'is_approved', 
            'email_verified_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'email_verified_at', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Default password for newly created users by superadmin
        # In a real app, this would trigger an email to set a password
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            **validated_data
        )
        return user


class SuperAdminFundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fund
        fields = '__all__'


class SuperAdminPromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromptLibrary
        fields = '__all__'


class SuperAdminAuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source='user.email', read_only=True)
    actor_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'table_name', 'record_id', 'user', 'actor_email', 
            'actor_name', 'action', 'old_data', 'new_data', 'created_at'
        ]
