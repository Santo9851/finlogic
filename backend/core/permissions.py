from rest_framework import permissions

class IsEntrepreneur(permissions.BasePermission):
    """
    Object-level permission to only allow users with the 'entrepreneur' role.
    """
    message = "You must be an entrepreneur to access this resource."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.has_role('entrepreneur'))


class IsInvestor(permissions.BasePermission):
    """
    Object-level permission to only allow users with the 'investor' role.
    """
    message = "You must be an investor to access this resource."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.has_role('investor'))


class IsAdminRole(permissions.BasePermission):
    """
    Object-level permission to only allow users with the 'admin' or 'super_admin' roles.
    """
    message = "You must be an admin to access this resource."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return any(role in ['admin', 'super_admin'] for role in request.user.role_list)


class CanViewProject(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to view/edit it,
    OR admins to view all.
    Investors can only view if status is approved/shortlisted (handled in queryset).
    """

    def has_object_permission(self, request, view, obj):
        # Admins can do anything
        if any(role in ['admin', 'super_admin'] for role in request.user.role_list):
            return True
        
        # Write permissions are only allowed to the owner
        if request.method not in permissions.SAFE_METHODS:
            return obj.user == request.user

        # Read permissions: owner can read their own
        if obj.user == request.user:
            return True
            
        # Investors can read if approved/shortlisted
        if request.user.has_role('investor') and obj.status in ['approved', 'shortlisted']:
            return True

        return False
