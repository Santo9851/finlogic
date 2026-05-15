import os
import json
import base64
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from .models import Issue, Subscriber, UnsubscribeToken
from . import service

@csrf_exempt
def subscribe_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            first_name = data.get('first_name')
            segment = data.get('segment', 'general')
            
            if not email:
                return JsonResponse({'success': False, 'message': 'Email is required'}, status=400)
            
            # Get client IP
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')
                
            subscriber, created = service.subscribe(
                email=email,
                first_name=first_name,
                segment=segment,
                source='website',
                ip_address=ip
            )
            
            message = 'Successfully subscribed' if created else 'Subscription updated'
            return JsonResponse({'success': True, 'message': message})
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=500)
    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

def unsubscribe_view(request, token):
    success = service.unsubscribe_by_token(token)
    
    bg_color = "#100226"
    accent_color = "#F59F01"
    
    if success:
        message = "<h1>You have been unsubscribed.</h1><p>We're sorry to see you go.</p>"
    else:
        message = "<h1>Invalid or expired link.</h1><p>Please contact support if you continue to receive emails.</p>"
        
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Unsubscribe - Finlogic Capital</title>
        <style>
            body {{ background-color: {bg_color}; color: #ffffff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; text-align: center; }}
            .card {{ padding: 40px; border-top: 5px solid {accent_color}; background: rgba(255,255,255,0.05); border-radius: 8px; }}
            h1 {{ color: {accent_color}; margin-bottom: 20px; }}
            p {{ color: #ccc; }}
            .logo {{ font-weight: bold; font-size: 24px; margin-bottom: 30px; letter-spacing: 2px; }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="logo">FINLOGIC CAPITAL</div>
            {message}
            <br>
            <a href="https://finlogiccapital.com" style="color: {accent_color}; text-decoration: none; font-weight: bold;">Back to Site</a>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html)

def track_open_view(request, token):
    service.record_open(token)
    
    # 1x1 transparent GIF
    pixel_data = base64.b64decode("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
    return HttpResponse(pixel_data, content_type="image/gif")

@csrf_exempt
def brevo_webhook_view(request):
    if request.method == 'POST':
        # Security: Check for a shared secret if configured
        webhook_key = os.environ.get('BREVO_WEBHOOK_KEY')
        if webhook_key:
            auth_header = request.META.get('HTTP_X_BREVO_WEBHOOK_KEY')
            if auth_header != webhook_key:
                return HttpResponse("unauthorized", status=401)

        try:
            data = json.loads(request.body)
            event_type = data.get('event')
            email = data.get('email')
            
            if event_type and email:
                service.handle_brevo_webhook(event_type, email)
                
            return HttpResponse("ok")
        except json.JSONDecodeError:
            return HttpResponse("invalid json", status=400)
    return HttpResponse("method not allowed", status=405)

def archive_list_view(request):
    issues = Issue.objects.filter(status='sent').order_by('-issue_number')
    data = []
    for issue in issues:
        data.append({
            'issue_number': issue.issue_number,
            'title': issue.title,
            'slug': issue.slug,
            'deck': issue.deck,
            'sent_at': issue.sent_at.isoformat() if issue.sent_at else None
        })
    return JsonResponse({'issues': data})

def issue_detail_view(request, slug):
    issue = get_object_or_404(Issue, slug=slug)
    data = {
        'issue_number': issue.issue_number,
        'title': issue.title,
        'slug': issue.slug,
        'deck': issue.deck,
        'subject_line': issue.subject_line,
        'section_signal': issue.section_signal,
        'section_thesis': issue.section_thesis,
        'section_founders': issue.section_founders,
        'section_lp': issue.section_lp,
        'section_data': issue.section_data,
        'section_question': issue.section_question,
        'sent_at': issue.sent_at.isoformat() if issue.sent_at else None
    }
    return JsonResponse(data)
