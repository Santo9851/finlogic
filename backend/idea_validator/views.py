from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import IdeaValidationSession, ValidationAnswer, IdeaValidatorQuota, QuotaAdjustmentLog
from .serializers import (
    IdeaValidationSessionSerializer, 
    ValidationAnswerSerializer, 
    IdeaValidatorQuotaSerializer
)
from .logic import get_or_init_quota, adjust_quota
from .constants import FINLO_QUESTIONS, FINLO_PILLARS, QUESTION_PILLAR_MAPPING

class IdeaValidatorQuotaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = IdeaValidatorQuotaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return IdeaValidatorQuota.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        quota = get_or_init_quota(request.user)
        serializer = self.get_serializer(quota)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='adjust-user-quota')
    def superadmin_adjust_quota(self, request):
        """Super-admin only: adjust a user's quota with a mandatory note."""
        if not request.user.has_role('super_admin'):
            raise PermissionDenied("Only Super Admins can adjust quotas.")
        
        user_id = request.data.get('user_id')
        change_amount = request.data.get('change_amount')
        note = request.data.get('note')
        
        if not all([user_id, change_amount is not None, note]):
            return Response(
                {"detail": "user_id, change_amount, and note are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from core.models import User
        target_user = get_object_or_404(User, id=user_id)
        
        quota = adjust_quota(target_user, int(change_amount), request.user, note)
        return Response(IdeaValidatorQuotaSerializer(quota).data)

class IdeaValidationSessionViewSet(viewsets.ModelViewSet):
    serializer_class = IdeaValidationSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = IdeaValidationSession.objects.all()
        
        # Filtering for Super Admin List All
        if user.has_role('super_admin'):
            user_id = self.request.query_params.get('user_id')
            status_filter = self.request.query_params.get('status')
            verdict_filter = self.request.query_params.get('verdict')
            date_filter = self.request.query_params.get('date') # YYYY-MM-DD
            
            if user_id: queryset = queryset.filter(user_id=user_id)
            if status_filter: queryset = queryset.filter(status=status_filter)
            if verdict_filter: queryset = queryset.filter(verdict=verdict_filter)
            if date_filter: queryset = queryset.filter(created_at__date=date_filter)
            
            return queryset.order_by('-created_at')
            
        # Regular users only see their own
        return queryset.filter(user=user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        """Requirement 1: Start a validation."""
        quota = get_or_init_quota(request.user)
        if quota.remaining_validations <= 0:
            return Response(
                {"detail": "You have no validation credits remaining. Please contact Finlogic to purchase more validation credits."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Note: Quota is deducted on submission, not creation, as per requirement 3.
        session = IdeaValidationSession.objects.create(
            user=request.user,
            status=IdeaValidationSession.Status.DRAFT,
            current_step=1,
            form_step_completed=0
        )
        serializer = self.get_serializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='save-step')
    def save_step(self, request, pk=None):
        """Requirement 2: Save a form step (1-5)."""
        session = self.get_object()
        if session.status != IdeaValidationSession.Status.DRAFT:
            return Response(
                {"detail": "Cannot modify a session that is already submitted or completed."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        step_number = request.data.get('step_number')
        answers_data = request.data.get('answers', []) # List of {question_number, selected_option, other_text, free_text_response}
        
        if not step_number or not (1 <= int(step_number) <= 5):
            return Response({"detail": "Valid step_number (1-5) required."}, status=status.HTTP_400_BAD_REQUEST)
        
        step_number = int(step_number)
        
        with transaction.atomic():
            for ans in answers_data:
                q_num = ans.get('question_number')
                if q_num is None: continue
                
                try:
                    q_num = int(q_num)
                except (ValueError, TypeError):
                    continue

                # Validate question number belongs to this step
                q_pillar = QUESTION_PILLAR_MAPPING.get(q_num)
                if q_pillar != list(FINLO_PILLARS.keys())[step_number-1]:
                    continue # Skip questions outside this step's range
                
                ValidationAnswer.objects.update_or_create(
                    session=session,
                    question_number=q_num,
                    defaults={
                        'selected_option': ans.get('selected_option'),
                        'other_text': ans.get('other_text'),
                        'free_text_response': ans.get('free_text_response'),
                    }
                )
            
            # Update progress
            session.current_step = step_number
            if step_number > session.form_step_completed:
                session.form_step_completed = step_number
            session.save()
            
        return Response({"status": "step saved", "form_step_completed": session.form_step_completed})

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Requirement 3: Submit for analysis."""
        session = self.get_object()
        if session.status != IdeaValidationSession.Status.DRAFT:
            return Response({"detail": "Already submitted."}, status=status.HTTP_400_BAD_REQUEST)
        
        quota = get_or_init_quota(request.user)
        if quota.remaining_validations <= 0:
            return Response({"detail": "Insufficient quota."}, status=status.HTTP_403_FORBIDDEN)
        
        with transaction.atomic():
            # Deduct quota on submission
            quota.remaining_validations -= 1
            quota.save()
            
            session.status = IdeaValidationSession.Status.SUBMITTED
            session.progress_text = "Analysis queued"
            session.save()
            
            # Log submission
            from .models import ValidationSubmissionLog
            ValidationSubmissionLog.objects.create(session=session)
            
            # Trigger Asynchronous AI Analysis (Requirement: Automatic)
            from .tasks import process_polished_report
            process_polished_report.delay(session.id)

            # Log submission
            from .logic import log_audit_event
            from deals.models import ImmutableAuditEvent
            log_audit_event(
                ImmutableAuditEvent.EventType.VALIDATION_SUBMITTED,
                session,
                actor=request.user,
                request=request
            )
        
        return Response({
            "status": "submitted", 
            "detail": "Processing has started. You can poll for results."
        })

    @action(detail=True, methods=['get'])
    def poll_status(self, request, pk=None):
        """Requirement 4: Poll analysis status."""
        session = self.get_object()
        return Response({
            "status": session.status,
            "progress_text": session.progress_text or "Initializing..."
        })

    @action(detail=True, methods=['get'], url_path='polished-report')
    def get_polished_report(self, request, pk=None):
        """Requirement 5: Get polished report."""
        session = self.get_object()
        
        # Visibility check is already handled by get_queryset + detail=True (owner or super_admin)
        if session.status != IdeaValidationSession.Status.COMPLETED:
            return Response({"detail": "Report is not ready yet."}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            "report": session.polished_report,
            "verdict": session.verdict
        })

    @action(detail=True, methods=['get'], url_path='red-team-report')
    def get_red_team_report(self, request, pk=None):
        """Requirement 6: Get raw red-team report (Super-admin only)."""
        if not request.user.has_role('super_admin'):
            raise PermissionDenied("Only Super Admins can access Red Team reports.")
        
        session = self.get_object()

        # Log access to adversarial report
        from .logic import log_audit_event
        from deals.models import ImmutableAuditEvent
        log_audit_event(
            ImmutableAuditEvent.EventType.RED_TEAM_REPORT_ACCESSED,
            session,
            actor=request.user,
            request=request
        )

        return Response({
            "report": session.red_team_report
        })

    @action(detail=True, methods=['post'], url_path='generate-red-team')
    def generate_red_team(self, request, pk=None):
        """Requirement: Manual (super-admin on-demand) red-team analysis."""
        if not request.user.has_role('super_admin'):
            raise PermissionDenied("Only Super Admins can trigger Red Team reports.")
        
        session = self.get_object()
        
        # Trigger Asynchronous Red Team Analysis
        from .tasks import process_red_team_report
        process_red_team_report.delay(session.id)
        
        # Log trigger
        from .logic import log_audit_event
        from deals.models import ImmutableAuditEvent
        log_audit_event(
            ImmutableAuditEvent.EventType.RED_TEAM_REPORT_TRIGGERED,
            session,
            actor=request.user,
            request=request
        )

        return Response({
            "status": "triggered",
            "detail": "Red Team adversarial analysis has been queued."
        })

    @action(detail=False, methods=['get'])
    def questions(self, request):
        """Returns the full set of questions formatted for the frontend, from DB."""
        from .models import Question
        from .serializers import QuestionSerializer
        
        db_questions = Question.objects.filter(is_active=True).prefetch_related('options_list').order_by('order')
        serializer = QuestionSerializer(db_questions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='share', permission_classes=[permissions.AllowAny])
    def public_share(self, request, pk=None):
        """Minimal branded share data for public viewing."""
        session = get_object_or_404(IdeaValidationSession, id=pk)
        
        if session.status != IdeaValidationSession.Status.COMPLETED:
            return Response({"detail": "This validation is not yet public."}, status=status.HTTP_404_NOT_FOUND)
            
        # Return only safe, branded excerpt fields
        return Response({
            "id": session.id,
            "verdict": session.verdict,
            "created_at": session.created_at,
            "excerpt": session.polished_report[:500] if session.polished_report else ""
        })
