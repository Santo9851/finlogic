from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .permissions import IsInvestor, IsEntrepreneur, IsAdminRole
from .models import (
    UserProfile,
    Project,
    Article,
    Course,
    Webinar,
    Fund,
    InvestorCommitment,
    Enrollment,
    WebinarRegistration,
)


from .serializers import (
    RegisterSerializer,
    UserSerializer,
    UserProfileSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    CustomTokenObtainPairSerializer,
    ProjectSerializer,
    ProjectCreateSerializer,
    ProjectFileSerializer,
    ArticleSerializer,
    CourseSerializer,
    WebinarSerializer,
    FundSerializer,
    InvestorCommitmentSerializer,
)

User = get_user_model()

from .utils.scoring import ScoringEngine, get_blank_payload_template


# ═══════════════════════════════════════════════════════════════════════════
# Dashboard Views
# ═══════════════════════════════════════════════════════════════════════════

class EntrepreneurDashboardView(generics.GenericAPIView):
    """GET /api/dashboard/entrepreneur/"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        projects = Project.objects.filter(user=user)
        enrollments = Enrollment.objects.filter(user=user)
        
        # Recent Submissions (limit to 5)
        recent_projects = ProjectSerializer(projects.order_by('-created_at')[:5], many=True).data
        
        # Stats
        stats = {
            'total_projects': projects.count(),
            'active_projects': projects.exclude(status=Project.Status.DRAFT).count(),
            'completed_courses': enrollments.filter(status=Enrollment.Status.COMPLETED).count(),
            'average_score': projects.filter(total_score__gt=0).aggregate(models.Avg('total_score'))['total_score__avg'] or 0
        }
        
        # Next steps (simple logic for now)
        next_steps = []
        if not projects.exists():
            next_steps.append({'title': 'Submit your first project', 'link': '/entrepreneurs/submit', 'priority': 'high'})
        elif projects.filter(status=Project.Status.DRAFT).exists():
            next_steps.append({'title': 'Complete and submit your draft project', 'link': '/dashboard/entrepreneur/submissions', 'priority': 'medium'})
            
        return Response({
            'stats': stats,
            'recent_projects': recent_projects,
            'next_steps': next_steps,
            'recent_activity': [] # Future: track actual activity logs
        })

class InvestorDashboardView(generics.GenericAPIView):
    """GET /api/dashboard/investor/"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        # Investor might have multiple commitments across funds
        commitments = InvestorCommitment.objects.filter(investor__user=user)
        
        # Stats
        aggregates = commitments.aggregate(
            total_committed=models.Sum('commitment_amount'),
            total_called=models.Sum('called_amount')
        )
        total_committed = aggregates['total_committed'] or 0
        total_called = aggregates['total_called'] or 0
        
        stats = {
            'total_committed': float(total_committed),
            'total_called': float(total_called),
            'deployment_rate': (float(total_called) / float(total_committed) * 100) if total_committed > 0 else 0,
            'active_investments': commitments.count()
        }
        
        # Deal Flow (Latest projects)
        deal_flow = ProjectSerializer(
            Project.objects.filter(status__in=[Project.Status.APPROVED, Project.Status.SHORTLISTED]).order_by('-submitted_at')[:5],
            many=True
        ).data
        
        return Response({
            'stats': stats,
            'commitments': InvestorCommitmentSerializer(commitments, many=True).data,
            'deal_flow': deal_flow,
            'portfolio_performance': [
                {'month': 'Jan', 'value': 100000},
                {'month': 'Feb', 'value': 120000},
                {'month': 'Mar', 'value': 115000},
                {'month': 'Apr', 'value': 140000}, # Mock data for charts
            ]
        })


# ═══════════════════════════════════════════════════════════════════════════
# Auth
# ═══════════════════════════════════════════════════════════════════════════

class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/"""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        print(f"DEBUG: Register Request Data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"DEBUG: Register Validation Errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data.get('email')
        existing_user = User.objects.filter(email=email).first()
        
        if existing_user:
            # Serializer already checked if role exists or is pending
            # It created a RoleRequest if it was a new role for existing user.
            serializer.save()
            return Response(
                {"detail": "A request for this additional role has been submitted for admin approval."},
                status=status.HTTP_202_ACCEPTED
            )
            
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET / PATCH /api/auth/profile/"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Overrides the default view to use our CustomTokenObtainPairSerializer.
    """
    serializer_class = CustomTokenObtainPairSerializer


class ForgotPasswordView(generics.GenericAPIView):
    """
    POST /api/auth/forgot-password/
    Generates a password-reset token and prints it to the console (dev).
    In production, swap the email backend to actually send an email.
    """
    serializer_class = ForgotPasswordSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Return success anyway to prevent email enumeration
            return Response(
                {'detail': 'If that email exists, a reset link has been sent.'},
                status=status.HTTP_200_OK,
            )

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # In production, send this via email.
        # For now, the console email backend will print it.
        reset_url = f'http://localhost:3000/reset-password?uid={uid}&token={token}'
        print(f'\n[PASSWORD RESET] {user.email}\n  URL: {reset_url}\n')

        user.email_user(
            subject='Finlogic Capital — Password Reset',
            message=f'Use this link to reset your password:\n\n{reset_url}',
        )

        return Response(
            {'detail': 'If that email exists, a reset link has been sent.'},
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(generics.GenericAPIView):
    """POST /api/auth/reset-password/"""
    serializer_class = ResetPasswordSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {'detail': 'Password has been reset successfully.'},
            status=status.HTTP_200_OK,
        )


# ═══════════════════════════════════════════════════════════════════════════
# Projects
# ═══════════════════════════════════════════════════════════════════════════

from rest_framework.decorators import action

class ProjectFileViewSet(viewsets.ModelViewSet):
    """
    /api/projects/<project_id>/files/  or  /api/project_files/
    Handles file uploads for projects.
    """
    serializer_class = ProjectFileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if any(role in (User.Role.ADMIN, User.Role.SUPER_ADMIN) for role in user.role_list):
            return ProjectFile.objects.all()
        return ProjectFile.objects.filter(project__user=user)

    def create(self, request, *args, **kwargs):
        # We need to manually handle the file upload since it's multipart form data
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'detail': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)
        
        project_id = request.data.get('project')
        category = request.data.get('category')
        
        try:
            project = Project.objects.get(id=project_id, user=request.user)
        except Project.DoesNotExist:
            return Response({'detail': 'Project not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        import os
        from django.conf import settings
        from django.core.files.storage import FileSystemStorage
        
        media_root = settings.MEDIA_ROOT if hasattr(settings, 'MEDIA_ROOT') else os.path.join(settings.BASE_DIR, 'media')
        sub_dir = f'projects/{project.id}'
        upload_path = os.path.join(media_root, sub_dir)
        os.makedirs(upload_path, exist_ok=True)
        
        fs = FileSystemStorage(location=upload_path, base_url=f"/media/{sub_dir}/")
        filename = fs.save(file_obj.name, file_obj)
        file_url = fs.url(filename)
        
        project_file = ProjectFile.objects.create(
            project=project,
            file_name=filename,
            file_path=file_url,
            file_type=file_obj.content_type,
            file_size=file_obj.size,
            category=category
        )
        
        serializer = self.get_serializer(project_file)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ProjectViewSet(viewsets.ModelViewSet):
    """
    /api/projects/
    Entrepreneurs see only their own projects.
    Admins / super_admins see all.
    Investors see approved/shortlisted projects.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return ProjectCreateSerializer
        return ProjectSerializer

    def get_queryset(self):
        user = self.request.user
        if any(role in (User.Role.ADMIN, User.Role.SUPER_ADMIN) for role in user.role_list):
            return Project.objects.all()
        elif user.has_role(User.Role.INVESTOR):
            return Project.objects.filter(status__in=[Project.Status.APPROVED, Project.Status.SHORTLISTED])
        return Project.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        project = self.get_object()
        if project.status != Project.Status.DRAFT:
            return Response({'detail': 'Only draft projects can be submitted.'}, status=status.HTTP_400_BAD_REQUEST)
        
        project.status = Project.Status.SUBMITTED
        from django.utils import timezone
        project.submitted_at = timezone.now()
        project.save()
        return Response({'status': 'Project submitted successfully'})
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsInvestor])
    def express_interest(self, request, pk=None):
        project = self.get_object()
        amount = request.data.get('amount')
        notes = request.data.get('notes', '')
        
        if not amount:
            return Response({'detail': 'Amount is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        from .models import Investor, InvestorCommitment
        
        # Ensure user has an Investor profile
        investor_profile, created = Investor.objects.get_or_create(
            user=request.user,
            defaults={'investor_type': Investor.InvestorType.INDIVIDUAL}
        )
        
        commitment = InvestorCommitment.objects.create(
            investor=investor_profile,
            project=project,
            commitment_amount=amount,
            notes=notes,
            status=InvestorCommitment.Status.PENDING
        )
        
        return Response({
            'detail': 'Your interest and capital commitment have been recorded.',
            'commitment_id': commitment.id
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsAdminRole])
    def memo(self, request, pk=None):
        project = self.get_object()
        
        # Prepare payload from submission_data
        # In a real scenario, we might want to map project fields more precisely
        engine = ScoringEngine()
        payload = get_blank_payload_template()
        payload["company_name"] = project.title
        payload["deal_id"] = str(project.id)
        payload["evaluated_by"] = request.user.email
        
        # Use existing criteria_scores if they exist in submission_data
        # This assumes submission_data has the right structure
        if "criteria_scores" in project.submission_data:
            payload["criteria_scores"] = project.submission_data["criteria_scores"]
        if "compliance_gates" in project.submission_data:
            payload["compliance_gates"] = project.submission_data["compliance_gates"]

        try:
            result = engine.evaluate_and_memo(payload)
            return Response(result)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def calculate_score(self, request, pk=None):
        project = self.get_object()
        # Mock calculation for now until the utility is fully implemented
        from .utils.scoring import calculate_project_score
        total_score = calculate_project_score(project.id)
        
        return Response({'status': 'Score calculated successfully', 'total_score': total_score})


# ═══════════════════════════════════════════════════════════════════════════
# AI-Assisted Evaluation  (two-phase: AI draft → analyst submission)
# ═══════════════════════════════════════════════════════════════════════════

from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import ProjectEvaluation
from .serializers import ProjectEvaluationDetailSerializer
from .utils.ai_scoring import build_ai_scored_payload
from .utils.scoring import ScoringEngine as _ScoringEngine


def _build_ai_draft_response(project) -> dict:
    """
    Shared helper: calls Gemini to build an AI draft payload.
    Falls back to a blank template if the API is unavailable.
    Returns the full Phase 1 response dict ready to pass to Response().
    """
    try:
        ai_payload = build_ai_scored_payload(project)
        ai_draft = {
            "criteria_scores":  ai_payload.get("criteria_scores", {}),
            "compliance_gates": ai_payload.get("compliance_gates", {}),
            "ai_meta": ai_payload.get("ai_meta", {}),
        }
        return {
            "phase": "ai_draft",
            "project_id": str(project.id),
            "ai_draft": ai_draft,
        }
    except Exception:
        # Gemini unavailable — return blank template so analyst can score manually
        blank = get_blank_payload_template()
        return {
            "phase": "ai_draft",
            "project_id": str(project.id),
            "ai_unavailable": True,
            "ai_draft": {
                "criteria_scores":  blank["criteria_scores"],
                "compliance_gates": blank["compliance_gates"],
                "ai_meta": {},
            },
        }


class EvaluationDraftView(APIView):
    """
    GET /api/projects/<uuid:project_id>/evaluate/draft/

    Phase 1 — returns an AI-generated draft for analyst review.
    Nothing is persisted. If Gemini is unavailable the response contains
    a blank template with ai_unavailable=true so the analyst can score manually.
    """

    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        return Response(_build_ai_draft_response(project), status=status.HTTP_200_OK)


class ProjectEvaluateView(APIView):
    """
    POST /api/projects/<uuid:project_id>/evaluate/

    Phase 1 (no criteria_scores in body):
        Calls Gemini and returns an AI draft for analyst review.
        Nothing is persisted. Falls back to blank template if Gemini unavailable.

    Phase 2 (criteria_scores present in body):
        Analyst-confirmed scores → ScoringEngine.evaluate_and_memo() → persist
        ProjectEvaluation → returns 201 with ProjectEvaluationDetailSerializer data.

        company_name and evaluated_by are always injected server-side.
        ai_meta is optionally forwarded from the AI draft to score_data for audit.
    """

    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)

        # ── Phase 1 ── no criteria_scores → return AI draft, do NOT persist ──
        if "criteria_scores" not in request.data:
            return Response(
                _build_ai_draft_response(project),
                status=status.HTTP_200_OK,
            )

        # ── Phase 2 ── analyst has reviewed/adjusted scores, persist ────────
        submission_data: dict = project.submission_data or {}

        payload: dict = dict(request.data)

        # Server-side injection — never trust client-supplied values for these
        payload["company_name"] = (
            submission_data.get("company_name")
            or submission_data.get("startup_name")
            or project.title
        )
        payload["evaluated_by"] = request.user.email
        payload["deal_id"]      = str(project.id)
        payload["sector"]       = submission_data.get("sector", "General")

        # Strip ai_meta from payload before passing to ScoringEngine
        ai_meta = payload.pop("ai_meta", None)

        engine = _ScoringEngine()
        try:
            scoring_result = engine.evaluate_and_memo(payload)
        except Exception as exc:
            return Response(
                {"detail": f"Scoring engine error: {exc}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Persist and store ai_meta inside score_data for auditability
        evaluation = ProjectEvaluation.from_scoring_result(
            project=project,
            user_email=request.user.email,
            scoring_result=scoring_result,
            ai_meta=ai_meta,
        )

        serializer = ProjectEvaluationDetailSerializer(evaluation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ═══════════════════════════════════════════════════════════════════════════
# Insights Hub  (read-only, public for published content)
# ═══════════════════════════════════════════════════════════════════════════

class ArticleViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/insights/articles/"""
    serializer_class = ArticleSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Article.objects.filter(is_published=True)


class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/insights/courses/"""
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Course.objects.filter(is_published=True)


class WebinarViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/insights/webinars/"""
    serializer_class = WebinarSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Webinar.objects.filter(is_published=True)


# ═══════════════════════════════════════════════════════════════════════════
# Investor  (authenticated, investor sees own data)
# ═══════════════════════════════════════════════════════════════════════════

class InvestorFundViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/investor/funds/ — funds where the user has commitments."""
    serializer_class = FundSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Fund.objects.filter(
            commitments__investor__user=self.request.user,
        ).distinct()


class InvestorCommitmentViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/investor/commitments/"""
    serializer_class = InvestorCommitmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InvestorCommitment.objects.filter(
            investor__user=self.request.user,
        ).select_related('fund', 'project')
