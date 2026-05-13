import os
import django
from decimal import Decimal
from django.db.models import Sum

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finlogic_api.settings')
django.setup()

from deals.models import Fund, LPFundCommitment

def check_real_data():
    funds = Fund.objects.all()
    for f in funds:
        print(f"Fund: {f.name}, Target Size: {f.target_size_npr}")
        commitments = LPFundCommitment.objects.filter(fund=f)
        total_comm = commitments.aggregate(total=Sum('committed_amount_npr'))['total'] or 0
        print(f"  Total Committed: {total_comm}")
        for c in commitments:
            print(f"    LP: {c.lp_profile.full_name}, Amount: {c.committed_amount_npr}")

if __name__ == "__main__":
    check_real_data()
