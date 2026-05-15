import csv
from django.contrib import admin, messages
from django.utils.html import format_html
from django.urls import path, reverse
from django.shortcuts import redirect, render
from django.http import HttpResponse
from django.utils.safestring import mark_safe
from .models import Subscriber, Issue, SendEvent, UnsubscribeToken
from . import service
from .template import render_issue_email

@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'segment', 'status', 'created_at')
    list_filter = ('status', 'segment')
    search_fields = ('email', 'first_name')
    actions = ['export_to_csv']

    @admin.action(description="Export selected subscribers to CSV")
    def export_to_csv(self, request, queryset):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="subscribers_export.csv"'
        writer = csv.writer(response)
        
        writer.writerow(['Email', 'First Name', 'Segment', 'Status', 'Source', 'IP', 'Created At'])
        for sub in queryset:
            writer.writerow([
                sub.email, sub.first_name, sub.segment, sub.status,
                sub.source, sub.ip_address, sub.created_at
            ])
        return response

@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ('issue_number', 'title', 'status_badge', 'open_rate_display', 'admin_actions')
    search_fields = ('title', 'subject_line')
    
    readonly_fields = ('stats_panel', 'sent_at', 'sent_count')

    fieldsets = (
        ('Identity', {
            'fields': ('issue_number', 'title', 'slug', 'deck', 'subject_line', 'target_segment')
        }),
        ('Six Sections', {
            'fields': (
                'section_signal', 'section_thesis', 'section_founders',
                'section_lp', 'section_data', 'section_question'
            )
        }),
        ('HTML Override', {
            'classes': ('collapse',),
            'fields': ('body_html',),
        }),
        ('Send Controls', {
            'fields': ('status', 'scheduled_at', 'sent_at', 'sent_count'),
        }),
        ('Stats (Read-only)', {
            'fields': ('stats_panel',),
        }),
    )

    @admin.display(description="Status")
    def status_badge(self, obj):
        colors = {
            'sent': '#16c784',    # green
            'scheduled': '#F59F01', # amber
            'draft': '#999',       # grey
        }
        color = colors.get(obj.status, '#999')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 10px; border-radius: 12px; font-weight: bold; text-transform: uppercase; font-size: 10px;">{}</span>',
            color, obj.status
        )

    @admin.display(description="Open Rate")
    def open_rate_display(self, obj):
        if obj.status != 'sent' or obj.sent_count == 0:
            return "—"
        
        stats = service.get_issue_stats(obj)
        rate = stats['open_rate']
        
        if rate > 35:
            color = '#16c784' # green
        elif rate > 20:
            color = '#F59F01' # amber
        else:
            color = '#ea3943' # red
            
        return format_html(
            '<strong style="color: {};">{}%</strong>',
            color, rate
        )

    @admin.display(description="Actions")
    def admin_actions(self, obj):
        send_url = reverse('admin:newsletter-issue-send', args=[obj.pk])
        preview_url = reverse('admin:newsletter-issue-preview', args=[obj.pk])
        
        active_subs = Subscriber.objects.filter(status='active')
        if obj.target_segment != 'general':
            active_subs = active_subs.filter(segment=obj.target_segment)
        sub_count = active_subs.count()

        send_btn = format_html(
            '<a class="button" href="{}" onclick="return confirm(\'Send Issue {} to {} active subscribers?\')">Send</a>&nbsp;',
            send_url, obj.issue_number, sub_count
        ) if obj.status != 'sent' else ""
        
        preview_btn = format_html(
            '<a class="button" style="background: #3A3153;" href="{}" target="_blank">Preview</a>',
            preview_url
        )
        
        return mark_safe(f"{send_btn}{preview_btn}")

    @admin.display(description="Engagement Stats")
    def stats_panel(self, obj):
        if obj.status != 'sent' or obj.sent_count == 0:
            return "Stats will be available after sending."
        
        stats = service.get_issue_stats(obj)
        html = f"""
        <table style="width: 100%; border-collapse: collapse; background: #100226; color: white; border-radius: 8px; overflow: hidden;">
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <th style="padding: 12px; text-align: left;">Metric</th>
                <th style="padding: 12px; text-align: right;">Value</th>
            </tr>
            <tr>
                <td style="padding: 10px 12px;">Total Sent</td>
                <td style="padding: 10px 12px; text-align: right; font-weight: bold;">{stats['total_sent']}</td>
            </tr>
            <tr>
                <td style="padding: 10px 12px;">Open Rate</td>
                <td style="padding: 10px 12px; text-align: right; font-weight: bold; color: #F59F01;">{stats['open_rate']}%</td>
            </tr>
            <tr>
                <td style="padding: 10px 12px;">Click Rate</td>
                <td style="padding: 10px 12px; text-align: right; font-weight: bold; color: #F59F01;">{stats['click_rate']}%</td>
            </tr>
            <tr>
                <td style="padding: 10px 12px;">Bounces</td>
                <td style="padding: 10px 12px; text-align: right; font-weight: bold; color: #ea3943;">{stats['bounces']}</td>
            </tr>
        </table>
        """
        return mark_safe(html)

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<int:pk>/send/', self.admin_site.admin_view(self.send_issue_view), name='newsletter-issue-send'),
            path('<int:pk>/preview/', self.admin_site.admin_view(self.preview_issue_view), name='newsletter-issue-preview'),
        ]
        return custom_urls + urls

    def send_issue_view(self, request, pk):
        issue = self.get_object(request, pk)
        if issue:
            count = service.send_issue(issue)
            messages.success(request, f"Successfully sent issue {issue.issue_number} to {count} subscribers.")
        return redirect(reverse('admin:newsletter_issue_changelist'))

    def preview_issue_view(self, request, pk):
        issue = self.get_object(request, pk)
        if not issue:
            return HttpResponse("Issue not found", status=404)
        
        # Mock subscriber and event for preview
        import uuid
        mock_sub = Subscriber(email="preview@finlogic.com", first_name="Preview")
        mock_event = SendEvent(tracking_token=uuid.UUID("00000000-0000-0000-0000-000000000000"))
        
        html = render_issue_email(issue, mock_sub, mock_event)
        return HttpResponse(html)

@admin.register(SendEvent)
class SendEventAdmin(admin.ModelAdmin):
    list_display = ('issue', 'subscriber_email', 'sent_at', 'opened', 'clicked', 'bounced')
    readonly_fields = ('issue', 'subscriber', 'sent_at', 'opened', 'opened_at', 'open_count', 
                       'clicked', 'clicked_at', 'click_count', 'bounced', 'bounce_type', 'tracking_token')
    
    @admin.display(description="Subscriber")
    def subscriber_email(self, obj):
        return obj.subscriber.email

    def has_add_permission(self, request):
        return False
