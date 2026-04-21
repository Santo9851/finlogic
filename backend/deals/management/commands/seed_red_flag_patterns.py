from django.core.management.base import BaseCommand
from deals.models import RedFlagPattern

class Command(BaseCommand):
    help = 'Seeds common legal red flag patterns for PE due diligence in Nepal context'

    def handle(self, *args, **options):
        patterns = [
            {
                "name": "Change of Control",
                "pattern_regex": r"(change of control|assignment|transfer of ownership)",
                "severity": "CRITICAL",
                "description": "Restrictions on company ownership changes, which could block exits or IPOs.",
                "nepal_context_note": "Crucial for FITTA compliance if foreign investors are involved."
            },
            {
                "name": "Unlimited Guarantee",
                "pattern_regex": r"(unlimited guarantee|personal guarantee|joint and several liability)",
                "severity": "CRITICAL",
                "description": "Founders or directors personally liable without limit.",
                "nepal_context_note": "Common in Nepali bank loans; highly risky for institutional investors."
            },
            {
                "name": "Cross Default",
                "pattern_regex": r"(cross default|default under any other agreement)",
                "severity": "WARNING",
                "description": "Default on one loan triggers default on all others.",
                "nepal_context_note": "Standard in NRB-regulated loan agreements but requires monitoring."
            },
            {
                "name": "Drag Along Rights",
                "pattern_regex": r"(drag along|compel to sell|force a sale)",
                "severity": "WARNING",
                "description": "Majority shareholders can force minority shareholders to sell.",
                "nepal_context_note": "Important for ensuring clean exit pathways for GPs."
            },
            {
                "name": "Pending Litigation",
                "pattern_regex": r"(litigation|lawsuit|legal proceedings|dispute|arbitration)",
                "severity": "CRITICAL",
                "description": "Ongoing legal battles that could create massive liabilities.",
                "nepal_context_note": "Check specifically for labor court or tax tribunal cases in Nepal."
            },
            {
                "name": "FITTA Requirement",
                "pattern_regex": r"(FITTA|Foreign Investment and Technology Transfer Act|Department of Industry approval)",
                "severity": "CRITICAL",
                "description": "Requires regulatory approval for foreign investment/divestment.",
                "nepal_context_note": "Non-compliance can lead to inability to repatriate funds."
            },
            {
                "name": "SEBON Approval",
                "pattern_regex": r"(SEBON|Securities Board of Nepal|listing requirement|IPO approval)",
                "severity": "WARNING",
                "description": "Requires SEBON nod for public issuance or share transfers in public companies.",
                "nepal_context_note": "Public limited companies must adhere to strict SEBON disclosure rules."
            },
            {
                "name": "Restrictive Covenants",
                "pattern_regex": r"(non-compete|non-solicit|exclusivity|restriction on business)",
                "severity": "WARNING",
                "description": "Limits the company's or founder's ability to operate other businesses.",
                "nepal_context_note": "Ensures founders are 'all-in' on the target company."
            },
            {
                "name": "Liquidation Preference",
                "pattern_regex": r"(liquidation preference|pari passu|seniority|preference shares)",
                "severity": "INFO",
                "description": "Defines who gets paid first during a company wind-up.",
                "nepal_context_note": "Verify against Nepal's Companies Act regarding priority of payments."
            },
            {
                "name": "Negative Pledge",
                "pattern_regex": r"(negative pledge|not to create any lien|restriction on encumbrance)",
                "severity": "WARNING",
                "description": "Prevents the company from using assets as collateral for other loans.",
                "nepal_context_note": "Common in Nepali debt instruments."
            },
            {
                "name": "Pre-emptive Rights",
                "pattern_regex": r"(pre-emptive right|right of first refusal|ROFR|ROFO)",
                "severity": "INFO",
                "description": "Existing shareholders' right to buy new shares before outsiders.",
                "nepal_context_note": "Standard protection for PE investors to avoid dilution."
            },
            {
                "name": "Indemnity",
                "pattern_regex": r"(indemnity|hold harmless|indemnification)",
                "severity": "WARNING",
                "description": "Provisions for compensating parties for losses/damages.",
                "nepal_context_note": "Critical for protecting the PE fund from legacy liabilities."
            },
            {
                "name": "Governing Law",
                "pattern_regex": r"(governing law|jurisdiction|courts of)",
                "severity": "INFO",
                "description": "Determines which country's laws apply to the contract.",
                "nepal_context_note": "Usually Laws of Nepal for local entities."
            },
            {
                "name": "Termination for Convenience",
                "pattern_regex": r"(terminate without cause|termination for convenience)",
                "severity": "WARNING",
                "description": "Allows a party to end a contract without a specific reason.",
                "nepal_context_note": "Can be risky in key supply or customer contracts."
            },
            {
                "name": "Tag Along Rights",
                "pattern_regex": r"(tag along|co-sale right)",
                "severity": "INFO",
                "description": "Minority shareholders can join a sale initiated by majority shareholders.",
                "nepal_context_note": "Standard protection for PE funds."
            }
        ]

        for p in patterns:
            obj, created = RedFlagPattern.objects.get_or_create(
                name=p["name"],
                defaults=p
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created pattern: {p["name"]}'))
            else:
                self.stdout.write(f'Pattern already exists: {p["name"]}')
