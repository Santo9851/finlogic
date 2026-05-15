from django.urls import path
from . import views

urlpatterns = [
    path('subscribe/', views.subscribe_view, name='newsletter-subscribe'),
    path('unsubscribe/<uuid:token>/', views.unsubscribe_view, name='newsletter-unsubscribe'),
    path('track/open/<uuid:token>/', views.track_open_view, name='newsletter-track-open'),
    path('webhook/brevo/', views.brevo_webhook_view, name='newsletter-webhook-brevo'),
    path('api/archive/', views.archive_list_view, name='newsletter-archive-list'),
    path('api/<slug:slug>/', views.issue_detail_view, name='newsletter-issue-detail'),
]
