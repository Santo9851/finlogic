import subprocess
import shlex
import sys
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Runs Celery worker and beat for development'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('--- Starting Celery Infrastructure ---'))
        self.stdout.write(self.style.WARNING('Note: Use this for development only.'))
        
        # Determine platform-specific command if necessary
        # For Windows/Linux compatibility:
        cmd = 'celery -A finlogic_api worker --loglevel=info --beat'
        
        try:
            # We use subprocess.run which is synchronous for this command
            subprocess.run(shlex.split(cmd), check=True)
        except KeyboardInterrupt:
            self.stdout.write(self.style.SUCCESS('\nCelery stopped.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error starting Celery: {str(e)}'))
            sys.exit(1)
