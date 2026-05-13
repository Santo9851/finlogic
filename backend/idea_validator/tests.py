from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from core.models import User
from .models import IdeaValidationSession, IdeaValidatorQuota

class IdeaValidatorIntegrationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='entrepreneur',
            email='test@test.com',
            password='password123',
            roles='entrepreneur'
        )
        self.superadmin = User.objects.create_user(
            username='admin',
            email='admin@finlogic.com',
            password='password123',
            roles='super_admin'
        )
        # Quota is created automatically via signal
        self.quota = IdeaValidatorQuota.objects.get(user=self.user)
        self.quota.remaining_validations = 1
        self.quota.last_reset_quarter = IdeaValidatorQuota.get_current_quarter_string()
        self.quota.save()

    def test_quota_deduction_on_submission(self):
        self.client.force_authenticate(user=self.user)
        session = IdeaValidationSession.objects.create(user=self.user)
        
        # Mocking the questions response might be needed if the view calls it, 
        # but here we test the submission endpoint
        url = reverse('validation-session-submit', kwargs={'pk': session.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.quota.refresh_from_db()
        self.assertEqual(self.quota.remaining_validations, 0)

    def test_zero_quota_blocks_submission(self):
        self.quota.remaining_validations = 0
        self.quota.save()
        
        self.client.force_authenticate(user=self.user)
        session = IdeaValidationSession.objects.create(user=self.user)
        url = reverse('validation-session-submit', kwargs={'pk': session.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Insufficient quota", response.data['detail'])

    def test_red_team_access_restriction(self):
        session = IdeaValidationSession.objects.create(
            user=self.user, 
            status=IdeaValidationSession.Status.COMPLETED,
            red_team_report="Dangerous idea detected."
        )
        
        # Entrepreneur cannot see red team report (via standard session endpoint)
        self.client.force_authenticate(user=self.user)
        url = f'/api/idea-validator/sessions/{session.id}/red-team-report/'
        response = self.client.get(url)
        # Note: If this reverse fails, I'll just use the hardcoded URL
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Super admin can see it via superadmin validations endpoint
        self.client.force_authenticate(user=self.superadmin)
        url = reverse('superadmin-validations-detail', kwargs={'pk': session.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['red_team_report'], "Dangerous idea detected.")

    def test_public_share_route(self):
        session = IdeaValidationSession.objects.create(
            user=self.user,
            status=IdeaValidationSession.Status.COMPLETED,
            verdict="VIABLE",
            polished_report="This is a great idea."
        )
        
        url = f'/api/idea-validator/sessions/{session.id}/share/'
        # Unauthenticated request
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['verdict'], "VIABLE")
        self.assertIn("This is a great idea", response.data['excerpt'])
        # Ensure red_team_report is NOT in public share
        self.assertNotIn('red_team_report', response.data)
