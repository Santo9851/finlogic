"""
deals/permissions.py
Custom DRF permissions for the PE Deals app.

Role strings are stored comma-separated in core.User.roles.
Helpers rely on user.has_role() and user.role_list defined on the User model.
"""
from rest_framework import permissions


class IsGPStaff(permissions.BasePermission):
    """
    Grant access only to users with 'admin' or 'super_admin' in their roles.
    These are considered General Partner (GP) staff.
    """
    message = "You must be a GP staff member (admin or super_admin) to access this resource."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return any(role in ('admin', 'super_admin') for role in request.user.role_list)


class IsEntrepreneurRole(permissions.BasePermission):
    """Grant access only to users with 'entrepreneur' role."""
    message = "You must be an entrepreneur to access this resource."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.has_role('entrepreneur')


class IsLPRole(permissions.BasePermission):
    """Grant access only to Limited Partners ('investor' role)."""
    message = "You must be a Limited Partner (investor) to access this resource."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.has_role('investor')


class IsSuperAdminRole(permissions.BasePermission):
    """Grant access only to Superadmins."""
    message = "Only Superadmins can execute this institutional action."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.has_role('super_admin')


class IsGPInvestorRole(permissions.BasePermission):
    """Grant access only to GP Investors ('gp_investor' role)."""
    message = "You must have the gp_investor role to access this resource."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.has_role('gp_investor')


class IsGPStaffOrReadOnly(permissions.BasePermission):
    """
    GP staff get full CRUD; all other authenticated users get read-only.
    """
    message = "GP staff permission required for write operations."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return any(role in ('admin', 'super_admin') for role in request.user.role_list)


class IsOwnerEntrepreneur(permissions.BasePermission):
    """
    Object-level: the entrepreneur_user on the PEProject must be request.user.
    """
    message = "You do not have permission to access this project."

    def has_object_permission(self, request, view, obj):
        # obj is a PEProject
        return obj.entrepreneur_user == request.user

class IsDealAccessible(permissions.BasePermission):
    """
    Object-level: access allowed if user is super_admin, created_by, or in collaborators.
    """
    message = "You do not have permission to access the details of this deal."

    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.has_role('super_admin'):
            return True
        if obj.created_by == request.user:
            return True
        # If the project has collaborators and user is one of them
        if hasattr(obj, 'collaborators') and obj.collaborators.filter(id=request.user.id).exists():
            return True
        return False
