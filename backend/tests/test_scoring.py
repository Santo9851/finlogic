import os
import django
import json

# Setup Django environment
import sys
project_root = "c:/Users/poude/Documents/capital website/finlogic/backend"
if project_root not in sys.path:
    sys.path.append(project_root)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "finlogic_api.settings")
django.setup()

from core.utils.scoring import ScoringEngine, get_blank_payload_template

def run_verification():
    print("--- Starting Scoring Engine Verification ---")
    engine = ScoringEngine()
    
    # 1. Test template generation
    payload = get_blank_payload_template()
    print("Template generation: SUCCESS")
    
    # 2. Fill it with some data
    payload["company_name"] = "Verification Test Ltd"
    payload["sector"] = "AgriTech"
    payload["ticket_size_npr_cr"] = 5.5
    
    # Set some high scores
    payload["criteria_scores"]["vision"]["problem_clarity"] = 9.0
    payload["criteria_scores"]["growth"]["unit_economics"] = 8.5
    
    # Fail a hard gate
    payload["compliance_gates"]["g_fitta"] = "failed"
    
    # 3. Evaluate
    result = engine.evaluate_and_memo(payload)
    
    score_dict = result["score"]
    memo_dict = result["memo"]
    
    print(f"Total Score (0-100): {score_dict['total_score']}%")
    print(f"Verdict: {score_dict['verdict']}")
    print(f"Gates Passed: {score_dict['gates_passed']}/{score_dict['gates_total']}")
    
    # Verification assertions (manual-style printouts)
    if score_dict["verdict"] == "blocked":
        print("ASSERTION PASSED: Verdict is BLOCKED because g_fitta failed.")
    else:
        print(f"ASSERTION FAILED: Verdict should be BLOCKED, got {score_dict['verdict']}.")
        
    if "executive_summary" in memo_dict:
        print("ASSERTION PASSED: IC Memo has executive summary.")
    
    memo_path = "c:/Users/poude/Documents/capital website/finlogic/backend/tests/memo_result.json"
    with open(memo_path, "w") as f:
        json.dump(memo_dict, f, indent=2)
    print(f"\nIC Memo written to: {memo_path}")
    
    print("\nVerification Complete.")

if __name__ == "__main__":
    run_verification()
