import uuid
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import User
from deals.models import GovernanceProposal, IRDocument, GPShareholder, EntrepreneurKYBDocument
from django.core.files.base import ContentFile

class Command(BaseCommand):
    help = 'Seed data for Phase 3: Governance, IR, and Entrepreneur KYB'

    def handle(self, *args, **options):
        self.stdout.write("Seeding Phase 3 data...")

        # 1. Ensure a GP Shareholder exists (using the test user)
        user = User.objects.filter(email='test@test.com').first()
        if user:
            shareholder, created = GPShareholder.objects.get_or_create(
                user=user,
                defaults={
                    'shares_held': 5000.00,
                    'ownership_percentage': 12.5,
                    'vesting_status': 'Fully Vested'
                }
            )
            if created:
                self.stdout.write(f"Created GPShareholder for {user.email}")
            else:
                shareholder.shares_held = 5000.00
                shareholder.save()
                self.stdout.write(f"Updated GPShareholder for {user.email}")
                
            # Ensure user has correct roles to see all portals
            current_roles = set(user.roles.split(',')) if user.roles else set()
            new_roles = {'admin', 'gp_investor', 'entrepreneur'}
            if not new_roles.issubset(current_roles):
                user.roles = ','.join(current_roles.union(new_roles))
                user.save()
                self.stdout.write(f"Updated roles for {user.email}: {user.roles}")
        prop, created = GovernanceProposal.objects.get_or_create(
            title="FY 2081/82 Dividend Distribution Policy",
            defaults={
                'description': "Proposed distribution of 15% of annual profits as dividends to shareholders. The remaining 85% will be reinvested into the growth fund.",
                'status': 'ACTIVE',
                'expiry_date': timezone.now() + timezone.timedelta(days=30),
                'created_by': user
            }
        )
        if created:
            self.stdout.write(f"Created active proposal: {prop.title}")

        # 3. Seed IR Document
        ir_doc, created = IRDocument.objects.get_or_create(
            title="Q1 2026 Shareholder Performance Report",
            defaults={
                'category': 'FINANCIAL',
                'is_published': True,
                'uploaded_by': user
            }
        )
        if created:
            # Add a mock file
            ir_doc.file.save('mock_report.pdf', ContentFile(b"Mock PDF Content"))
            self.stdout.write(f"Created IR Document: {ir_doc.title}")

        # 4. Seed Entrepreneur KYB (for test user as well or separate founder)
        kyb_doc, created = EntrepreneurKYBDocument.objects.get_or_create(
            user=user,
            document_type="Registration Certificate",
            defaults={
                'status': 'VERIFIED'
            }
        )
        if created:
            kyb_doc.file.save('registration.pdf', ContentFile(b"Mock Registration"))
            self.stdout.write(f"Created KYB Document for {user.email}")

        self.stdout.write(self.style.SUCCESS("Phase 3 seeding completed successfully."))
