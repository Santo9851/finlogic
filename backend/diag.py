from django.contrib.auth import get_user_model
from deals.models import LPProfile, LPFundCommitment, PEProject

User = get_user_model()
test_user = User.objects.filter(email='test@test.com').first()

if not test_user:
    print("User test@test.com not found.")
else:
    print(f"--- User: {test_user.username} ({test_user.email}) ---")
    profile = getattr(test_user, 'lp_profile', None)
    print(f"LP Profile: {profile}")
    if profile:
        commitments = LPFundCommitment.objects.filter(lp_profile=profile)
        print(f"Commitments: {[c.fund.name for c in commitments]}")
        from deals.models import CapitalCall
        calls = CapitalCall.objects.filter(lp_commitment__in=commitments, status='CALLED')
        print(f"Active Capital Calls (status='CALLED'): {calls.count()}")
        
        for comm in commitments:
            deals = PEProject.objects.filter(fund=comm.fund)
            visible_deals = deals.filter(status__in=['LOI_ISSUED', 'CONTRACT_SIGNED', 'CAPITAL_CALLED', 'CLOSED'])
            print(f"  Fund: {comm.fund.name}")
            print(f"  Visible Deals for LP: {[d.legal_name for d in visible_deals]}")
    else:
        print("This user HAS NO LP Profile. They will see the 'Investor Profile Not Found' screen.")
