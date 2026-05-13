import os
import django
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finlogic_api.settings')
django.setup()

from deals.models import Fund, LPProfile, LPFundCommitment

def test_validation():
    # 1. Create a Fund
    fund = Fund.objects.create(
        name="Test Fund",
        legal_name="Test Fund Legal",
        vintage_year=2024,
        target_size_npr=Decimal('1500000000000') # 1.5 Trillion
    )
    
    # 2. Create an LP
    lp = LPProfile.objects.create(full_name="Test LP")
    
    # 3. Try to create a commitment larger than fund size
    try:
        print(f"Attempting to save commitment of 7 Trillion to fund of 1.5 Trillion...")
        comm = LPFundCommitment(
            fund=fund,
            lp_profile=lp,
            committed_amount_npr=Decimal('7000000000000'), # 7 Trillion
            commitment_date="2024-01-01"
        )
        comm.save()
        print("Error: Successfully saved commitment larger than fund size!")
    except Exception as e:
        print(f"Caught expected error: {e}")

    # Cleanup
    fund.delete()
    lp.delete()

if __name__ == "__main__":
    test_validation()
