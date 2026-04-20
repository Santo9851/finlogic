from collections import defaultdict
from core.models import Project, ProjectScore

def calculate_project_score(project_id):
    """
    Calculates the score for a project based on its submission data.
    
    Weights:
    - Vision: 20%
    - Growth: 25%
    - Leadership: 20%
    - Insight: 20%
    - Partnership: 15%
    """
    try:
        project = Project.objects.get(id=project_id)
        # Clear existing scores to avoid duplicates when recalculating
        ProjectScore.objects.filter(project=project).delete()
    except Project.DoesNotExist:
        return 0

    data = project.submission_data
    if not isinstance(data, dict):
        return 0
    
    pillar_scores = defaultdict(int)
    pillar_weights = {
        ProjectScore.Pillar.VISION: 0.20,
        ProjectScore.Pillar.GROWTH: 0.25,
        ProjectScore.Pillar.LEADERSHIP: 0.20,
        ProjectScore.Pillar.INSIGHT: 0.20,
        ProjectScore.Pillar.PARTNERSHIP: 0.15,
    }

    # Helper function to assign a score based on word count/presence
    def score_field(field_value, min_words=10, max_score=100):
        if not field_value or not isinstance(field_value, str):
            if isinstance(field_value, (int, float)) and field_value > 0:
                return max_score # Full points for numerical metrics if present
            return 0
            
        words = len(field_value.split())
        if words > min_words * 3:
            return max_score
        elif words > min_words:
            return int(max_score * 0.7)
        return int(max_score * 0.3)

    # 1. Vision
    vision_keys = ['problem_solving', 'target_market', 'competitors']
    vision_score = sum(score_field(data.get(k)) for k in vision_keys) / max(1, len(vision_keys))
    pillar_scores[ProjectScore.Pillar.VISION] = int(vision_score)

    # 2. Growth
    growth_keys = ['business_model', 'scale_plan', 'social_impact']
    growth_score = sum(score_field(data.get(k)) for k in growth_keys) / max(1, len(growth_keys))
    pillar_scores[ProjectScore.Pillar.GROWTH] = int(growth_score)

    # 3. Leadership
    leadership_keys = ['background', 'team_members', 'experience']
    leadership_score = sum(score_field(data.get(k)) for k in leadership_keys) / max(1, len(leadership_keys))
    pillar_scores[ProjectScore.Pillar.LEADERSHIP] = int(leadership_score)

    # 4. Insight
    insight_keys = ['revenue_metrics', 'feedback', 'risks'] # Including numeric metrics presence
    insight_score = sum(score_field(data.get(k)) for k in insight_keys) / max(1, len(insight_keys))
    pillar_scores[ProjectScore.Pillar.INSIGHT] = int(insight_score)

    # 5. Partnership
    partnership_keys = ['existing_partners', 'supplier_relations', 'investor_expectations']
    partnership_score = sum(score_field(data.get(k)) for k in partnership_keys) / max(1, len(partnership_keys))
    pillar_scores[ProjectScore.Pillar.PARTNERSHIP] = int(partnership_score)

    # Calculate Total Score
    total_score = 0
    
    for pillar, score in pillar_scores.items():
        weight = pillar_weights.get(pillar, 0)
        total_score += score * weight
        
        # Save pillar score
        ProjectScore.objects.create(
            project=project,
            pillar=pillar,
            score=score,
            weight=weight,
            feedback=f"Calculated score based on submission length and completeness."
        )

    # Update total score
    project.total_score = int(total_score)
    project.save()

    return project.total_score


import math
import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from enum import Enum
from typing import Any
from django.db import transaction

# ═══════════════════════════════════════════════════════════════════════════
# Enums & Constants
# ═══════════════════════════════════════════════════════════════════════════

class Verdict(str, Enum):
    FAST_TRACK = "fast_track"
    WATCHLIST  = "watchlist"
    PASSED     = "passed"
    BLOCKED    = "blocked"

class GateStatus(str, Enum):
    PASSED  = "passed"
    FAILED  = "failed"
    PENDING = "pending"

class ScoringMethod(str, Enum):
    SIMPLE_AVERAGE   = "simple_average"
    WEIGHTED_AVERAGE = "weighted_average"

SCORING_CONFIG = {
    "version": "2.0.0",
    "scale": {"min": 1, "max": 10},
    "sections": [
        {
            "id": "vision",
            "title": "Unconventional Vision",
            "weight": 0.20,
            "scoring_method": ScoringMethod.WEIGHTED_AVERAGE,
            "criteria": [
                {"id": "problem_clarity",        "label": "Problem clarity & uniqueness",           "weight": 0.30},
                {"id": "market_size",             "label": "TAM validation (CBS/NRB data)",          "weight": 0.30},
                {"id": "differentiation",         "label": "Competitive differentiation",            "weight": 0.25},
                {"id": "crossborder_resilience",  "label": "Cross-border competition resilience",    "weight": 0.15},
            ],
            "minimum_pass_score": 4.0,
        },
        {
            "id": "growth",
            "title": "Wisdom-Backed Growth",
            "weight": 0.25,
            "scoring_method": ScoringMethod.WEIGHTED_AVERAGE,
            "criteria": [
                {"id": "unit_economics",   "label": "Unit economics & profitability path",  "weight": 0.30},
                {"id": "scalability",      "label": "Scalability evidence",                 "weight": 0.25},
                {"id": "esg_inclusion",    "label": "ESG baseline & inclusion",             "weight": 0.20},
                {"id": "fitta_readiness",  "label": "FITTA 2019 repatriation compliance",   "weight": 0.25},
            ],
            "minimum_pass_score": 4.0,
        },
        {
            "id": "leadership",
            "title": "Leadership Activation",
            "weight": 0.20,
            "scoring_method": ScoringMethod.WEIGHTED_AVERAGE,
            "criteria": [
                {"id": "domain_depth",      "label": "Domain depth & expertise",             "weight": 0.30},
                {"id": "execution_track",   "label": "Execution track record",               "weight": 0.30},
                {"id": "team_completeness", "label": "Team completeness",                    "weight": 0.25},
                {"id": "governance_risk",   "label": "PEP / governance risk (10=clean)",     "weight": 0.15},
            ],
            "minimum_pass_score": 4.0,
        },
        {
            "id": "insight",
            "title": "Deep Insight",
            "weight": 0.20,
            "scoring_method": ScoringMethod.WEIGHTED_AVERAGE,
            "criteria": [
                {"id": "revenue_trajectory",  "label": "Revenue trajectory & margin quality",          "weight": 0.30},
                {"id": "cac_ltv",             "label": "CAC / LTV ratio",                              "weight": 0.25},
                {"id": "customer_validation", "label": "Customer validation (eSewa/Khalti or equiv.)", "weight": 0.25},
                {"id": "risk_disclosure",     "label": "Risk disclosure & continuity plan",            "weight": 0.20},
            ],
            "minimum_pass_score": 4.0,
        },
        {
            "id": "partnership",
            "title": "Harmonious Partnerships",
            "weight": 0.15,
            "scoring_method": ScoringMethod.WEIGHTED_AVERAGE,
            "criteria": [
                {"id": "advisor_quality",  "label": "Advisor quality & institutional credibility", "weight": 0.30},
                {"id": "lp_strategic_fit", "label": "Strategic fit with LP network",               "weight": 0.30},
                {"id": "ifc_signal",       "label": "IFC / FMO / UNCDF co-invest signal",          "weight": 0.20},
                {"id": "sebon_mapping",    "label": "SEBON mapping (if public exit envisioned)",   "weight": 0.20},
            ],
            "minimum_pass_score": 3.5,
        },
    ],
    "compliance_gates": [
        {"id": "g_fitta",   "label": "FITTA 2019 compliance confirmed",                  "is_hard": True,  "section": "growth"},
        {"id": "g_ird_pan", "label": "IRD PAN registration & filing verified",            "is_hard": True,  "section": "growth"},
        {"id": "g_pep",     "label": "PEP screening completed",                           "is_hard": True,  "section": "leadership"},
        {"id": "g_fatf",    "label": "FATF / AML check on all partners",                  "is_hard": True,  "section": "partnership"},
        {"id": "g_fncci",   "label": "FNCCI/CNI/NCC reference obtained",                  "is_hard": False, "section": "leadership"},
        {"id": "g_txn",     "label": "Digital transaction logs verified",                 "is_hard": False, "section": "insight"},
        {"id": "g_bandh",   "label": "Bandh / disaster continuity plan submitted",        "is_hard": False, "section": "insight"},
        {"id": "g_tam",     "label": "TAM verified with CBS/NRB data",                    "is_hard": False, "section": "vision"},
        {"id": "g_epa",     "label": "EPA clearance status confirmed",                    "is_hard": False, "section": "growth"},
        {"id": "g_sebon",   "label": "SEBON licensing mapped (if public exit planned)",   "is_hard": False, "section": "partnership"},
    ],
}

ROUTING_THRESHOLDS = {"fast_track": 75.0, "watchlist": 55.0}
DIVERGENCE_ALERT_THRESHOLD = 2.0

# ═══════════════════════════════════════════════════════════════════════════
# Dataclasses
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class ComplianceGate:
    gate_id: str
    status: GateStatus = GateStatus.PENDING
    confirmed_by: str = ""
    confirmed_at: datetime | None = None
    notes: str = ""

    @property
    def passed(self) -> bool:
        return self.status == GateStatus.PASSED

@dataclass
class SectionResult:
    section_id: str
    section_title: str
    weight: float
    raw_score: float
    weighted_contribution: float
    flags: list[str] = field(default_factory=list)
    criterion_scores: dict[str, float] = field(default_factory=dict)
    below_minimum: bool = False

    @property
    def percentage(self) -> float:
        return round((self.raw_score - 1) / 9 * 100, 1)

    @property
    def score_0_to_100(self) -> int:
        """Converts 1-10 score to 0-100 for compatibility with legacy ProjectScore.score field."""
        return int((self.raw_score - 1) / 9 * 100)

@dataclass
class DealScore:
    deal_id: str
    company_name: str
    sector: str
    ticket_size_npr_cr: float | None
    evaluated_at: datetime
    evaluated_by: str
    total_score: float
    verdict: Verdict
    section_results: list[SectionResult]
    gate_results: list[ComplianceGate]
    flags: list[str] = field(default_factory=list)
    divergence_score: float = 0.0
    divergence_alert: bool = False
    config_version: str = ""
    raw_payload: dict[str, Any] = field(default_factory=dict)

    @property
    def gates_passed(self) -> int:
        return sum(1 for g in self.gate_results if g.passed)

    @property
    def hard_gates_failed(self) -> list[ComplianceGate]:
        hard_ids = {g["id"] for g in SCORING_CONFIG["compliance_gates"] if g["is_hard"]}
        return [g for g in self.gate_results if g.gate_id in hard_ids and not g.passed]

    def weakest_sections(self, n: int = 2) -> list[SectionResult]:
        return sorted(self.section_results, key=lambda s: s.raw_score)[:n]

    def to_dict(self) -> dict[str, Any]:
        return {
            "deal_id": self.deal_id,
            "company_name": self.company_name,
            "sector": self.sector,
            "ticket_size_npr_cr": self.ticket_size_npr_cr,
            "evaluated_at": self.evaluated_at.isoformat(),
            "evaluated_by": self.evaluated_by,
            "total_score": round(self.total_score, 2),
            "verdict": self.verdict.value,
            "config_version": self.config_version,
            "divergence_score": round(self.divergence_score, 2),
            "divergence_alert": self.divergence_alert,
            "flags": self.flags,
            "gates_passed": self.gates_passed,
            "gates_total": len(self.gate_results),
            "hard_gates_failed": [g.gate_id.split('_')[1] if '_' in g.gate_id else g.gate_id for g in self.hard_gates_failed], # Just IDs for summary
            "sections": [
                {
                    "section_id": s.section_id,
                    "section_title": s.section_title,
                    "weight": s.weight,
                    "raw_score": round(s.raw_score, 2),
                    "weighted_contribution": round(s.weighted_contribution, 2),
                    "percentage": s.percentage,
                    "score_0_to_100": s.score_0_to_100,
                    "below_minimum": s.below_minimum,
                    "flags": s.flags,
                    "criterion_scores": {k: round(v, 2) for k, v in s.criterion_scores.items()},
                }
                for s in self.section_results
            ],
            "gates": [
                {
                    "gate_id": g.gate_id,
                    "status": g.status.value,
                    "confirmed_by": g.confirmed_by,
                    "confirmed_at": g.confirmed_at.isoformat() if g.confirmed_at else None,
                    "notes": g.notes,
                }
                for g in self.gate_results
            ],
        }

# ═══════════════════════════════════════════════════════════════════════════
# Logic Classes
# ═══════════════════════════════════════════════════════════════════════════

class ICMemoGenerator:
    """Generates structured memo data for the IC from a DealScore object."""
    
    @staticmethod
    def generate(score: DealScore) -> dict[str, Any]:
        return {
            "meta": {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "config_version": score.config_version,
            },
            "header": {
                "company_name": score.company_name,
                "sector": score.sector,
                "ticket_size": f"NPR {score.ticket_size_npr_cr} Cr" if score.ticket_size_npr_cr else "TBD",
                "verdict": score.verdict.value.upper().replace("_", " "),
                "total_score": f"{round(score.total_score, 1)}%",
            },
            "executive_summary": {
                "overview": f"{score.company_name} is being evaluated for a {score.sector} investment.",
                "key_findings": score.flags,
            },
            "section_analysis": [
                {
                    "id": s.section_id,
                    "title": s.section_title,
                    "score": f"{s.percentage}%",
                    "status": "PASS" if not s.below_minimum else "WARNING",
                    "details": s.criterion_scores,
                    "red_flags": s.flags,
                }
                for s in score.section_results
            ],
            "compliance_gates": {
                "total": len(score.gate_results),
                "passed": score.gates_passed,
                "hard_gates_failed": [
                    next((gc["label"] for gc in SCORING_CONFIG["compliance_gates"] if gc["id"] == g.gate_id), g.gate_id)
                    for g in score.hard_gates_failed
                ],
                "details": [
                    {
                        "label": next((gc["label"] for gc in SCORING_CONFIG["compliance_gates"] if gc["id"] == g.gate_id), g.gate_id),
                        "status": g.status.value
                    }
                    for g in score.gate_results
                ]
            },
            "risk_flags": score.flags,
            "weakest_sections": [
                {"title": s.section_title, "score": f"{s.percentage}%"}
                for s in score.weakest_sections()
            ],
            "action_items": [
                f"Resolve {g.gate_id} compliance" for g in score.hard_gates_failed
            ] + (["Investigate divergence in scoring"] if score.divergence_alert else []),
        }

class ScoringEngine:
    """The central core that handles evaluation and memo generation."""

    def evaluate(self, payload: dict[str, Any]) -> DealScore:
        """Evaluates a raw payload and returns a DealScore object."""
        self._validate_payload(payload)
        
        evaluated_at = datetime.now(timezone.utc)
        section_results = self._score_all_sections(payload.get("criteria_scores", {}))
        gate_results = self._evaluate_gates(payload)
        
        total_score_pct = self._compute_total_score(section_results)
        verdict = self._route(total_score_pct, section_results, gate_results)
        flags = self._collect_flags(section_results, gate_results)
        
        divergence = self._compute_divergence(section_results)
        
        return DealScore(
            deal_id=payload.get("deal_id", str(uuid.uuid4())),
            company_name=payload.get("company_name", "Unknown Corp"),
            sector=payload.get("sector", "General"),
            ticket_size_npr_cr=payload.get("ticket_size_npr_cr"),
            evaluated_at=evaluated_at,
            evaluated_by=payload.get("evaluated_by", "System"),
            total_score=total_score_pct,
            verdict=verdict,
            section_results=section_results,
            gate_results=gate_results,
            flags=flags,
            divergence_score=divergence,
            divergence_alert=divergence > DIVERGENCE_ALERT_THRESHOLD,
            config_version=SCORING_CONFIG["version"],
            raw_payload=payload
        )

    def generate_ic_memo(self, deal: DealScore) -> dict[str, Any]:
        return ICMemoGenerator.generate(deal)

    def evaluate_and_memo(self, payload: dict[str, Any]) -> dict[str, Any]:
        deal = self.evaluate(payload)
        return {
            "score": deal.to_dict(),
            "memo": self.generate_ic_memo(deal)
        }

    # Internal Methods

    def _score_all_sections(self, scores: dict[str, dict[str, float]]) -> list[SectionResult]:
        results = []
        for sec_cfg in SCORING_CONFIG["sections"]:
            sec_id = sec_cfg["id"]
            sec_scores = scores.get(sec_id, {})
            
            raw_score = self._compute_section_score(sec_cfg, sec_scores)
            weighted_contrib = raw_score * sec_cfg["weight"]
            
            flags = []
            if raw_score < sec_cfg["minimum_pass_score"]:
                flags.append(f"Low {sec_cfg['title']} score")
                
            results.append(SectionResult(
                section_id=sec_id,
                section_title=sec_cfg["title"],
                weight=sec_cfg["weight"],
                raw_score=raw_score,
                weighted_contribution=weighted_contrib,
                criterion_scores=sec_scores,
                below_minimum=raw_score < sec_cfg["minimum_pass_score"],
                flags=flags
            ))
        return results

    def _compute_section_score(self, config: dict, scores: dict) -> float:
        if not scores: return 1.0
        
        if config["scoring_method"] == ScoringMethod.WEIGHTED_AVERAGE:
            total = 0.0
            total_weight = 0.0
            for crit in config["criteria"]:
                val = scores.get(crit["id"], 5.0) # Default to mid-scale
                total += val * crit["weight"]
                total_weight += crit["weight"]
            return total / total_weight if total_weight > 0 else 1.0
        
        # Simple Average fallback
        vals = [scores.get(c["id"], 5.0) for c in config["criteria"]]
        return sum(vals) / len(vals) if vals else 1.0

    def _evaluate_gates(self, payload: dict) -> list[ComplianceGate]:
        results = []
        raw_gates = payload.get("compliance_gates", {})
        gate_info = payload.get("gate_confirmations", {})
        
        for g_cfg in SCORING_CONFIG["compliance_gates"]:
            g_id = g_cfg["id"]
            status_val = raw_gates.get(g_id, "pending")
            
            # Map string to Enum
            try:
                status = GateStatus(status_val)
            except ValueError:
                status = GateStatus.PENDING
                
            results.append(ComplianceGate(
                gate_id=g_id,
                status=status,
                confirmed_by=gate_info.get(g_id, {}).get("by", ""),
                confirmed_at=None, # In real life, parse isoformat date if present
                notes=gate_info.get(g_id, {}).get("notes", "")
            ))
        return results

    def _compute_total_score(self, section_results: list[SectionResult]) -> float:
        # Sum of (raw_score * section_weight) -> Normalized to 0-100%
        # formula: (Sum(weighted) - 1) / 9 * 100
        weighted_sum = sum(s.weighted_contribution for s in section_results)
        return round((weighted_sum - 1) / 9 * 100, 2)

    def _route(self, score_pct: float, sections: list[SectionResult], gates: list[ComplianceGate]) -> Verdict:
        # Check hard gates
        hard_ids = {g["id"] for g in SCORING_CONFIG["compliance_gates"] if g["is_hard"]}
        for g in gates:
            if g.gate_id in hard_ids and not g.passed:
                return Verdict.BLOCKED
        
        # Threshold routing
        if score_pct >= ROUTING_THRESHOLDS["fast_track"]:
            return Verdict.FAST_TRACK
        if score_pct >= ROUTING_THRESHOLDS["watchlist"]:
            return Verdict.WATCHLIST
        return Verdict.PASSED

    def _collect_flags(self, sections: list[SectionResult], gates: list[ComplianceGate]) -> list[str]:
        flags = []
        for s in sections:
            flags.extend(s.flags)
        
        hard_ids = {g["id"] for g in SCORING_CONFIG["compliance_gates"] if g["is_hard"]}
        for g in gates:
            if g.gate_id in hard_ids and not g.passed:
                label = next((gc["label"] for gc in SCORING_CONFIG["compliance_gates"] if gc["id"] == g.gate_id), g.gate_id)
                flags.append(f"Hard Gate Failed: {label}")
                
        return flags

    def _compute_divergence(self, results: list[SectionResult]) -> float:
        """Measures the variance between section scores."""
        scores = [r.raw_score for r in results]
        if not scores: return 0.0
        avg = sum(scores) / len(scores)
        variance = sum((x - avg) ** 2 for x in scores) / len(scores)
        return math.sqrt(variance)

    def _validate_payload(self, payload: dict):
        # Basic validation: ensure keys exist
        if not isinstance(payload, dict):
            raise ValueError("Payload must be a dictionary")

# ═══════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════

def get_blank_payload_template() -> dict[str, Any]:
    """Returns a blank payload with all section/criterion keys pre-filled with 5."""
    template = {
        "company_name": "", 
        "sector": "", 
        "ticket_size_npr_cr": None,
        "evaluated_by": "", 
        "deal_id": "",
        "criteria_scores": {}, 
        "compliance_gates": {}, 
        "gate_confirmations": {},
    }
    for sec in SCORING_CONFIG["sections"]:
        template["criteria_scores"][sec["id"]] = {c["id"]: 5 for c in sec["criteria"]}
        
    for gate in SCORING_CONFIG["compliance_gates"]:
        template["compliance_gates"][gate["id"]] = "pending"
        
    return template
