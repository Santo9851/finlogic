from django.core.management.base import BaseCommand
from django.utils.text import slugify
from core.models import User, Series, Article
import uuid

class Command(BaseCommand):
    help = 'Seeds the database with two metered article series.'

    def handle(self, *args, **options):
        # 1. Get an admin user to be the author
        author = User.objects.filter(roles__icontains='admin').first() or User.objects.filter(is_superuser=True).first()
        if not author:
            self.stdout.write(self.style.ERROR('No admin/superuser found to assign as author.'))
            return

        series_data = [
            {
                "title": "ESG & Sustainable Finance",
                "description": "A deep dive into environmental, social, and governance factors in modern private equity.",
                "pillar": "insight",
                "total_articles": 10
            },
            {
                "title": "Private Equity Fundamentals",
                "description": "Master the core mechanics of LBOs, deal sourcing, and portfolio value creation.",
                "pillar": "growth",
                "total_articles": 10
            }
        ]

        for s_info in series_data:
            series, created = Series.objects.get_or_create(
                title=s_info["title"],
                defaults={
                    "description": s_info["description"],
                    "pillar": s_info["pillar"],
                    "total_articles": s_info["total_articles"],
                    "is_published": True
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created Series: {series.title}'))
            else:
                self.stdout.write(f'Series already exists: {series.title}')

            # Create 10 placeholder articles for each series
            for i in range(1, 11):
                article_title = f"{series.title} - Chapter {i}"
                article_slug = slugify(article_title)
                
                # Check if exists
                if Article.objects.filter(slug=article_slug).exists():
                    continue

                teaser = ""
                if i == 1:
                    teaser = "Free introductory module."
                elif i == 2:
                    teaser = "• Core frameworks overview\n• Strategic alignment basics\n• Risk mitigation strategies"
                else:
                    teaser = "• Advanced implementation guides\n• Exclusive deal case studies\n• Institutional-grade templates"

                Article.objects.create(
                    title=article_title,
                    slug=article_slug,
                    excerpt=f"This is chapter {i} of the {series.title} series.",
                    content=f"Full content for {article_title}. This would typically be institutional-grade research and analysis.",
                    author=author,
                    pillar=series.pillar,
                    series=series,
                    article_number=i,
                    teaser_text=teaser,
                    is_published=(i <= 3) # Publish first 3 by default for demo
                )
                self.stdout.write(f'  - Created Article: {article_title}')

        self.stdout.write(self.style.SUCCESS('Successfully seeded metered series data.'))
