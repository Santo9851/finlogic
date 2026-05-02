from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import datetime
import json
import csv
from django.http import HttpResponse

from core.models import User, AuditLog, Article
from deals.models import (
    Fund, PromptLibrary, SEBONFilingDeadline, RegulatoryChecklist, 
    ConflictOfInterest, FilingTypeConfig, AICallLog, FundDocument, 
    PEProjectDocument, ImmutableAuditEvent, LPFundCommitment, 
    PEInvestment, ValuationRecord, Distribution, PEProject
)
from core.permissions import IsSuperAdmin
from deals.ai_client import AIModelClient

from .serializers import (
    SuperAdminUserSerializer, 
    SuperAdminFundSerializer,
    SuperAdminPromptSerializer,
    SuperAdminAuditLogSerializer
)
from deals.serializers import (
    SEBONFilingDeadlineSerializer,
    RegulatoryChecklistSerializer,
    ConflictOfInterestSerializer,
    FilingTypeConfigSerializer,
    ImmutableAuditEventSerializer
)

def log_admin_action(user, event_type, obj, payload=None):
    """Helper to log superadmin actions to ImmutableAuditEvent."""
    try:
        ImmutableAuditEvent.objects.create(
            event_type=event_type,
            actor=user,
            object_id=getattr(obj, 'id', None),
            object_repr=str(obj),
            content_type_label=f"{obj._meta.app_label}.{obj._meta.model_name}",
            payload=payload or {}
        )
    except Exception as e:
        # Don't fail the primary action if logging fails, but maybe log to console
        print(f"Failed to log admin action: {e}")

class SuperAdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = SuperAdminUserSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name', 'roles']
    ordering_fields = ['created_at', 'email', 'last_name']

    def perform_create(self, serializer):
        user = serializer.save()
        log_admin_action(self.request.user, ImmutableAuditEvent.EventType.USER_MANAGEMENT, user, {"action": "create"})

    def perform_update(self, serializer):
        user = serializer.save()
        log_admin_action(self.request.user, ImmutableAuditEvent.EventType.USER_MANAGEMENT, user, {"action": "update"})

    def perform_destroy(self, instance):
        log_admin_action(self.request.user, ImmutableAuditEvent.EventType.USER_MANAGEMENT, instance, {"action": "delete"})
        instance.delete()

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        user = self.get_object()
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
            log_admin_action(request.user, ImmutableAuditEvent.EventType.USER_MANAGEMENT, user, {"action": "password_reset_email_sent"})
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

    def perform_create(self, serializer):
        fund = serializer.save()
        log_admin_action(self.request.user, ImmutableAuditEvent.EventType.FUND_MANAGEMENT, fund, {"action": "create"})

    def perform_update(self, serializer):
        fund = serializer.save()
        log_admin_action(self.request.user, ImmutableAuditEvent.EventType.FUND_MANAGEMENT, fund, {"action": "update"})

    def perform_destroy(self, instance):
        log_admin_action(self.request.user, ImmutableAuditEvent.EventType.FUND_MANAGEMENT, instance, {"action": "delete"})
        instance.delete()


class SuperAdminPromptViewSet(viewsets.ModelViewSet):
    queryset = PromptLibrary.objects.all()
    serializer_class = SuperAdminPromptSerializer
    permission_classes = [IsSuperAdmin]

    def perform_create(self, serializer):
        prompt = serializer.save()
        log_admin_action(self.request.user, ImmutableAuditEvent.EventType.PROMPT_MANAGEMENT, prompt, {"action": "create"})

    def perform_update(self, serializer):
        prompt = serializer.save()
        log_admin_action(self.request.user, ImmutableAuditEvent.EventType.PROMPT_MANAGEMENT, prompt, {"action": "update"})

    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        prompt_obj = self.get_object()
        context_data = request.data.get('context', {})
        
        log_admin_action(request.user, ImmutableAuditEvent.EventType.PROMPT_MANAGEMENT, prompt_obj, {"action": "test_execution", "context": context_data})

        try:
            # Format user prompt
            user_prompt = prompt_obj.user_prompt_template.format(**context_data)
            
            client = AIModelClient()
            model_name = client.get_model_for_task(prompt_obj.task_type)
            
            if "gemini" in model_name:
                text, p_tokens, c_tokens, latency, cost = client._call_gemini(
                    model_name, prompt_obj.system_prompt, user_prompt
                )
            else:
                text, p_tokens, c_tokens, latency, cost = client._call_deepseek(
                    model_name, prompt_obj.system_prompt, user_prompt
                )
            
            return Response({
                "status": "SUCCESS",
                "output": text,
                "metrics": {
                    "latency_ms": latency,
                    "tokens": p_tokens + c_tokens,
                    "cost_usd": float(cost)
                }
            })
        except Exception as e:
            return Response({
                "status": "ERROR",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class SuperAdminAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsSuperAdmin]

    def get_serializer_class(self):
        source = self.request.query_params.get('source', 'compliance')
        if source == 'data':
            return SuperAdminAuditLogSerializer
        return SuperAdminImmutableAuditEventSerializer

    def get_queryset(self):
        source = self.request.query_params.get('source', 'compliance')
        
        if source == 'data':
            qs = AuditLog.objects.all().order_by('-created_at')
            actor = self.request.query_params.get('actor')
            action = self.request.query_params.get('event_type') # Map frontend param
            table = self.request.query_params.get('table')
            
            if actor: qs = qs.filter(user__email__icontains=actor)
            if action: qs = qs.filter(action=action)
            if table: qs = qs.filter(table_name=table)
            return qs
        else:
            # Institutional Compliance Logs (ImmutableAuditEvent)
            qs = ImmutableAuditEvent.objects.all().order_by('-created_at')
            actor = self.request.query_params.get('actor')
            event_type = self.request.query_params.get('event_type')
            project_id = self.request.query_params.get('project_id')
            
            if actor: qs = qs.filter(actor__email__icontains=actor)
            if event_type: qs = qs.filter(event_type=event_type)
            if project_id: qs = qs.filter(project_id=project_id)
            return qs


# --- SEBON COMPLIANCE HUB ---

class SuperAdminSEBONDeadlineViewSet(viewsets.ModelViewSet):
    queryset = SEBONFilingDeadline.objects.all().order_by('due_date')
    serializer_class = SEBONFilingDeadlineSerializer
    permission_classes = [IsSuperAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        fund_id = self.request.query_params.get('fund_id')
        status_param = self.request.query_params.get('status')
        filing_type = self.request.query_params.get('filing_type')
        date_start = self.request.query_params.get('due_date__gte')
        date_end = self.request.query_params.get('due_date__lte')

        if fund_id: qs = qs.filter(fund_id=fund_id)
        if status_param: qs = qs.filter(status=status_param)
        if filing_type: qs = qs.filter(filing_type=filing_type)
        if date_start: qs = qs.filter(due_date__gte=date_start)
        if date_end: qs = qs.filter(due_date__lte=date_end)

        # Business Logic: Auto-OVERDUE
        today = timezone.now().date()
        qs_to_update = qs.filter(status='PENDING', due_date__lt=today)
        if qs_to_update.exists():
            qs_to_update.update(status='OVERDUE')
            # Fetch fresh from DB
            qs = super().get_queryset()
            
        return qs

    def perform_create(self, serializer):
        period_end_date = self.request.data.get('period_end_date')
        filing_type = self.request.data.get('filing_type')
        
        due_date = self.request.data.get('due_date')
        
        if period_end_date and filing_type and not due_date:
            # Auto-calculate due date based on config
            try:
                config = FilingTypeConfig.objects.get(filing_type=filing_type)
                period_date = datetime.datetime.strptime(period_end_date, '%Y-%m-%d').date()
                due_date = period_date + datetime.timedelta(days=config.default_days_offset)
            except FilingTypeConfig.DoesNotExist:
                pass

        obj = serializer.save(due_date=due_date)
        log_admin_action(self.request.user, ImmutableAuditEvent.EventType.COMPLIANCE_REVIEW, obj, {"action": "create_deadline"})

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        deadline = self.get_object()
        document_id = request.data.get('document_id')
        
        deadline.status = 'SUBMITTED'
        deadline.submitted_at = timezone.now()
        deadline.submitted_by = request.user
        if document_id:
            deadline.document_id = document_id
        deadline.save()

        # Log Immutable Audit Event
        log_admin_action(
            request.user, 
            ImmutableAuditEvent.EventType.SEBON_FILING_SUBMITTED, 
            deadline, 
            {
                "title": deadline.title,
                "fund": str(deadline.fund),
                "document_id": str(document_id) if document_id else None
            }
        )

        return Response(self.get_serializer(deadline).data)

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        deadlines = self.get_queryset()
        # Group by month
        calendar_data = {}
        for d in deadlines:
            month_key = d.due_date.strftime('%Y-%m')
            if month_key not in calendar_data:
                calendar_data[month_key] = []
            calendar_data[month_key].append(self.get_serializer(d).data)
        
        return Response(calendar_data)

    @action(detail=False, methods=['post'], url_path='generate-for-fund')
    def generate_for_fund(self, request):
        fund_id = request.data.get('fund_id')
        year = int(request.data.get('year', timezone.now().year))
        fund = get_object_or_404(Fund, id=fund_id)
        
        configs = FilingTypeConfig.objects.all()
        created_count = 0
        
        # Simple logic: create annual/quarterly reporting placeholders
        for config in configs:
            # For simplicity, we create one major deadline per type for the year
            # In a real app, you'd iterate through quarters for QUARTERLY_REPORT
            due_date = datetime.date(year, 7, 15) + datetime.timedelta(days=config.default_days_offset)
            
            obj, created = SEBONFilingDeadline.objects.get_or_create(
                fund=fund,
                filing_type=config.filing_type,
                title=f"{config.name} - FY {year}",
                defaults={
                    "due_date": due_date,
                    "regulatory_basis": config.regulatory_basis,
                    "status": 'PENDING'
                }
            )
            if created: created_count += 1
            
        log_admin_action(request.user, ImmutableAuditEvent.EventType.COMPLIANCE_REVIEW, fund, {"action": "generate_filings", "count": created_count})
        return Response({"detail": f"Generated {created_count} filings for {fund.name}"})

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        today = timezone.now().date()
        warning_threshold = today + datetime.timedelta(days=14)
        
        funds = Fund.objects.all()
        summary_list = []
        
        for f in funds:
            qs = SEBONFilingDeadline.objects.filter(fund=f)
            overdue_count = qs.filter(status='OVERDUE').count()
            amber_count = qs.filter(status='PENDING', due_date__lte=warning_threshold).count()
            
            rag = 'green'
            if overdue_count > 0: rag = 'red'
            elif amber_count > 0: rag = 'amber'
            
            summary_list.append({
                "fund_id": f.id,
                "fund_name": f.name,
                "overdue_count": overdue_count,
                "amber_count": amber_count,
                "rag_status": rag
            })
            
        return Response(summary_list)


class SuperAdminRegulatoryChecklistViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RegulatoryChecklist.objects.all()
    serializer_class = RegulatoryChecklistSerializer
    permission_classes = [IsSuperAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        project_id = self.request.query_params.get('project')
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs

    @action(detail=False, methods=['post'], url_path='sync-projects')
    def sync_projects(self, request):
        """Creates missing checklists for all existing projects."""
        projects = PEProject.objects.all()
        created_count = 0
        for p in projects:
            obj, created = RegulatoryChecklist.objects.get_or_create(
                project=p,
                defaults={"notes": "Auto-generated checklist matrix."}
            )
            if created: created_count += 1
        
        return Response({"detail": f"Synced {created_count} checklists."})

    @action(detail=True, methods=['patch'])
    def review(self, request, pk=None):
        checklist = self.get_object()
        serializer = self.get_serializer(checklist, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(
            last_reviewed_by=request.user,
            last_reviewed_at=timezone.now()
        )
        log_admin_action(request.user, ImmutableAuditEvent.EventType.COMPLIANCE_REVIEW, obj, {"action": "checklist_review"})
        return Response(serializer.data)


class SuperAdminConflictOfInterestViewSet(viewsets.ModelViewSet):
    queryset = ConflictOfInterest.objects.all().order_by('-declaration_date')
    serializer_class = ConflictOfInterestSerializer
    permission_classes = [IsSuperAdmin]

    def perform_create(self, serializer):
        obj = serializer.save()
        log_admin_action(self.request.user, ImmutableAuditEvent.EventType.COMPLIANCE_REVIEW, obj, {"action": "create_coi"})

    def perform_update(self, serializer):
        obj = serializer.save()
        log_admin_action(self.request.user, ImmutableAuditEvent.EventType.COMPLIANCE_REVIEW, obj, {"action": "update_coi"})

    @action(detail=False, methods=['get'])
    def summary(self, request):
        periods = ConflictOfInterest.objects.values('declaration_period').annotate(
            total=Count('id'),
            submitted=Count('id', filter=Q(is_submitted=True)),
            pending=Count('id', filter=Q(is_submitted=False))
        )
        return Response(periods)


# --- PLATFORM ANALYTICS ---

class SuperAdminAnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsSuperAdmin]

    def list(self, request):
        now = timezone.now()
        this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # 1. Funds & Capital
        total_funds_count = Fund.objects.count()
        commitments = LPFundCommitment.objects.aggregate(
            committed=Sum('committed_amount_npr'),
            called=Sum('called_amount_npr')
        )
        total_committed = commitments['committed'] or 0
        total_called = commitments['called'] or 0
        
        # AUM: Sum of active investment amounts
        total_aum = PEInvestment.objects.filter(exit_date__isnull=True).aggregate(Sum('investment_amount_npr'))['investment_amount_npr__sum'] or 0
        total_distributed = Distribution.objects.aggregate(Sum('amount_npr'))['amount_npr__sum'] or 0
        
        funds_list = []
        for f in Fund.objects.all()[:10]:
            f_commitments = f.lp_commitments.aggregate(Sum('committed_amount_npr'), Sum('called_amount_npr'))
            funds_list.append({
                "id": f.id,
                "name": f.name,
                "committed": float(f_commitments['committed_amount_npr__sum'] or 0),
                "called": float(f_commitments['called_amount_npr__sum'] or 0),
                "status": f.status
            })

        # 2. Deals Pipeline
        deals_by_status = PEProject.objects.values('status').annotate(count=Count('id'))
        status_map = {s[0]: 0 for s in PEProject.Status.choices}
        for item in deals_by_status:
            status_map[item['status']] = item['count']
            
        pipeline_funnel = [
            {"status": label, "count": status_map.get(val, 0)}
            for val, label in PEProject.Status.choices
        ]

        # 3. Investments
        inv_stats = PEInvestment.objects.aggregate(
            count=Count('id'),
            invested=Sum('investment_amount_npr'),
            proceeds=Sum('exit_value_npr')
        )
        
        # 4. Users & LPs
        # Simplified role counting
        users_qs = User.objects.all()
        total_unique_users = users_qs.count()
        roles_counts = {}
        for u in users_qs:
            for role in u.role_list:
                roles_counts[role] = roles_counts.get(role, 0) + 1
        
        total_lps = LPFundCommitment.objects.values('lp_profile').distinct().count()

        # 5. AI Usage
        ai_month = AICallLog.objects.filter(created_at__gte=this_month_start)
        ai_cost = ai_month.aggregate(Sum('estimated_cost_usd'))['estimated_cost_usd__sum'] or 0
        top_task = AICallLog.objects.values('task_type').annotate(count=Count('id')).order_by('-count').first()

        # 6. Documents & Storage
        total_fund_docs = FundDocument.objects.count()
        total_proj_docs = PEProjectDocument.objects.count()
        size_fund = FundDocument.objects.aggregate(Sum('file_size'))['file_size__sum'] or 0
        size_proj = PEProjectDocument.objects.aggregate(Sum('file_size'))['file_size__sum'] or 0

        # 7. Audit & Compliance
        total_audit = ImmutableAuditEvent.objects.count()
        audit_by_type = ImmutableAuditEvent.objects.values('event_type').annotate(count=Count('id'))
        recent_events = ImmutableAuditEvent.objects.order_by('-created_at')[:10]

        # 8. Content
        total_articles = Article.objects.count()
        published_articles = Article.objects.filter(is_published=True).count()

        data = {
            "funds": {
                "total_funds_count": total_funds_count,
                "total_committed_capital": float(total_committed),
                "total_called_capital": float(total_called),
                "total_AUM": float(total_aum),
                "total_distributed": float(total_distributed),
                "funds_list": funds_list
            },
            "pipeline": {
                "total_deals": PEProject.objects.count(),
                "deals_by_status": status_map,
                "pipeline_funnel": pipeline_funnel
            },
            "investments": {
                "total_count": inv_stats['count'],
                "total_invested": float(inv_stats['invested'] or 0),
                "realized_proceeds": float(inv_stats['proceeds'] or 0)
            },
            "users": {
                "total_unique_users": total_unique_users,
                "users_by_role": roles_counts,
                "total_lps": total_lps
            },
            "ai": {
                "calls_this_month": ai_month.count(),
                "cost_this_month": float(ai_cost),
                "top_task_type": top_task['task_type'] if top_task else None
            },
            "storage": {
                "total_fund_documents": total_fund_docs,
                "total_project_documents": total_proj_docs,
                "estimated_storage_bytes": int(size_fund or 0) + int(size_proj or 0)
            },
            "audit": {
                "total_events": total_audit,
                "recent_events": ImmutableAuditEventSerializer(recent_events, many=True).data
            },
            "content": {
                "total_articles": total_articles,
                "published_count": published_articles
            }
        }
        return Response(data)

    @action(detail=False, methods=['get'])
    def export(self, request):
        export_type = request.query_params.get('type', 'deals')
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="superadmin_{export_type}_export.csv"'
        writer = csv.writer(response)

        if export_type == 'deals':
            writer.writerow(['ID', 'Name', 'Fund', 'Status', 'Sector', 'Created At'])
            for obj in PEProject.objects.all():
                writer.writerow([obj.id, obj.legal_name, obj.fund.name if obj.fund else '', obj.status, obj.sector, obj.created_at])
        elif export_type == 'funds':
            writer.writerow(['ID', 'Name', 'Vintage', 'Target Size', 'Status'])
            for obj in Fund.objects.all():
                writer.writerow([obj.id, obj.name, obj.vintage_year, obj.target_size_npr, obj.status])
        else:
            writer.writerow(['Unsupported export type'])

        return response
