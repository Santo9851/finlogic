from celery import shared_task
from .models import PEInvestment, PortfolioKPIReport
from django.utils import timezone
from datetime import date
import logging

logger = logging.getLogger(__name__)

@shared_task
def trigger_quarterly_monitoring():
    """
    Periodic task to check if quarterly reports are due for portfolio companies.
    Usually run on the 1st of every quarter.
    """
    today = date.today()
    # Determine Quarter and Year (e.g. if today is April 1, we need Q1 reports)
    # Simple logic for now
    if today.month in [1, 4, 7, 10]:
        quarter = (today.month - 1) // 3
        if quarter == 0:
            quarter = 4
            year = today.year - 1
        else:
            year = today.year
            
        investments = PEInvestment.objects.filter(is_active=True)
        
        for inv in investments:
            # For reporting_period, we'll use the first day of the quarter
            q_start_date = date(year, (quarter-1)*3 + 1, 1)
            
            # Check if report already exists for this quarter start date
            exists = PortfolioKPIReport.objects.filter(
                project=inv.project,
                reporting_period=q_start_date
            ).exists()
            
            if not exists:
                # Create a placeholder or notify entrepreneur
                logger.info(f"Triggering quarterly report request for {inv.project.legal_name} (Q{quarter} {year})")
                # inv.project.notify_entrepreneur_for_report(quarter, year) 
                # (We can implement notification logic later)
                
    return "Quarterly monitoring check completed"
