from django.core.management.base import BaseCommand
from django.utils import timezone
from deals.models import GPInvestorMeeting
from core.models import User

class Command(BaseCommand):
    help = 'Seed private meetings for GP Investors'

    def handle(self, *args, **options):
        self.stdout.write("Seeding GP Investor Meetings...")
        
        user = User.objects.filter(roles__contains='gp_investor').first()
        if not user:
            user = User.objects.first()

        # 1. Upcoming Meeting
        meeting1, created = GPInvestorMeeting.objects.get_or_create(
            title='Q1 2081/82 Performance Briefing',
            defaults={
                'description': 'Institutional review of Q1 performance and strategic allocation.',
                'speaker': 'Sagar Rana (Managing Partner)',
                'scheduled_at': timezone.now() + timezone.timedelta(days=2),
                'duration_minutes': 90,
                'meeting_type': 'VIDEO_PROTOCOL',
                'meeting_link': 'https://zoom.us/j/placeholder',
                'is_published': True
            }
        )
        if created:
            self.stdout.write(f"Created upcoming meeting: {meeting1.title}")

        # 2. Past Meeting (Recording)
        meeting2, created = GPInvestorMeeting.objects.get_or_create(
            title='Annual Shareholder Meeting FY 2080/81',
            defaults={
                'description': 'Review of previous fiscal year and dividend approval.',
                'speaker': 'Bikash Koirala (Director)',
                'scheduled_at': timezone.now() - timezone.timedelta(days=15),
                'duration_minutes': 120,
                'meeting_type': 'BOARD_SESSION',
                'recording_url': 'https://vimeo.com/placeholder',
                'is_published': True
            }
        )
        if created:
            self.stdout.write(f"Created past meeting recording: {meeting2.title}")

        self.stdout.write(self.style.SUCCESS("GP Investor Meetings seeded successfully."))
