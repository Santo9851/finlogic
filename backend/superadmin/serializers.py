from rest_framework import serializers
from core.models import User
from deals.models import Fund

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
