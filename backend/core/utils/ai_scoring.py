"""
core/utils/ai_scoring.py

AI-assisted scoring layer for Nepal PE/VC deal evaluation.

Workflow:
  1. Entrepreneur submits Project (submission_data JSONField)
  2. AIScoringAssistant.score_project(project) calls Claude per section
  3. Returns pre-filled criteria_scores payload (1-10 per criterion)
  4. Analyst reviews/adjusts in UI → posts to /api/projects/<id>/evaluate/
  5. ScoringEngine.evaluate(payload) runs weighted aggregation as normal

This module NEVER writes to the database. It only produces a payload dict
that the analyst reviews before it is persisted via ProjectEvaluation.

Usage:
    from core.utils.ai_scoring import AIScoringAssistant
    assistant = AIScoringAssistant()
    result = assistant.score_project(project)
    # result.criteria_scores  → pass to ScoringEngine.evaluate()
    # result.rationales       → display to analyst in review UI
    # result.confidence       → flag low-confidence scores for closer review
    # result.flagged_fields   → submission fields that were missing/thin
"""

import json
import logging
import os
import time
from dataclasses import dataclass, field
from typing import Any

import google.generativeai as genai

from core.utils.scoring import SCORING_CONFIG

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

AI_SCORING_MODEL = "gemini-2.0-flash"
AI_SCORING_MAX_TOKENS = 2048

# Submission data field mapping: criterion_id → list of submission_data keys
# to pull as context. Extend this as your submission form evolves.
CRITERION_FIELD_MAP: dict[str, list[str]] = {
    # Vision section
    "problem_clarity":        ["problem_statement", "problem_description", "pain_point"],
    "market_size":            ["market_size", "tam_sam_som", "target_market", "market_data"],
    "differentiation":        ["unique_value_proposition", "competitive_advantage", "differentiation"],
    "cross_border":           ["revenue_sources", "export_plan", "foreign_partnerships", "remittance_linkage"],

    # Growth section
    "unit_economics":         ["unit_economics", "cac", "ltv", "cac_ltv_ratio", "gross_margin"],
    "scalability":            ["scalability_plan", "growth_strategy", "expansion_plan"],
    "esg_alignment":          ["esg_impact", "social_impact", "environmental_policy", "gender_inclusion"],
    "fitta_compliance":       ["foreign_investment_details", "fitta_compliance", "repatriation_plan"],

    # Leadership section
    "domain_depth":           ["founder_background", "relevant_experience", "domain_expertise"],
    "execution_track":        ["past_ventures", "milestones_achieved", "traction", "execution_history"],
    "team_completeness":      ["team_composition", "key_hires", "advisors", "org_structure"],
    "governance":             ["corporate_governance", "board_structure", "pep_disclosure", "shareholding"],

    # Insight section
    "revenue_trajectory":     ["revenue_history", "revenue_projections", "financial_summary", "mrr_arr"],
    "cac_ltv":                ["cac", "ltv", "cac_ltv_ratio", "customer_acquisition"],
    "customer_validation":    ["customer_testimonials", "pilot_results", "payment_proofs", "digital_txn_logs"],
    "risk_disclosure":        ["key_risks", "risk_mitigation", "regulatory_risks", "market_risks"],

    # Partnership section
    "advisor_quality":        ["advisors", "board_members", "strategic_partners"],
    "lp_fit":                 ["target_investors", "lp_interest", "term_sheet", "cap_table"],
    "ifc_fmo_signal":         ["development_finance", "ifc_interest", "fmo_interest", "grant_funding"],
    "sebon_mapping":          ["sebon_compliance", "securities_registration", "regulatory_approvals"],
}

# Sections grouped for batched API calls (one call per section = 5 total)
SECTION_FIELD_GROUPS: dict[str, list[str]] = {
    "vision":      ["problem_clarity", "market_size", "differentiation", "cross_border"],
    "growth":      ["unit_economics", "scalability", "esg_alignment", "fitta_compliance"],
    "leadership":  ["domain_depth", "execution_track", "team_completeness", "governance"],
    "insight":     ["revenue_trajectory", "cac_ltv", "customer_validation", "risk_disclosure"],
    "partnership": ["advisor_quality", "lp_fit", "ifc_fmo_signal", "sebon_mapping"],
}

SECTION_TITLES = {
    "vision":      "Unconventional Vision",
    "growth":      "Wisdom-Backed Growth",
    "leadership":  "Leadership Activation",
    "insight":     "Deep Insight",
    "partnership": "Harmonious Partnerships",
}

# ---------------------------------------------------------------------------
# Result dataclasses
# ---------------------------------------------------------------------------

@dataclass
class CriterionAIScore:
    criterion_id: str
    score: int                  # 1–10
    rationale: str              # 2–3 sentence explanation shown to analyst
    confidence: str             # "high" | "medium" | "low"
    evidence_quotes: list[str]  # verbatim snippets from submission used as evidence
    flags: list[str]            # e.g. ["thin_answer", "missing_data", "inconsistency"]


@dataclass
class SectionAIResult:
    section_id: str
    criteria: list[CriterionAIScore]
    section_notes: str          # overall observation for analyst
    missing_fields: list[str]   # submission fields that were empty/absent


@dataclass
class AIScoreResult:
    project_id: str
    company_name: str
    section_results: list[SectionAIResult]
    criteria_scores: dict       # ready for ScoringEngine.evaluate()
    compliance_gates: dict      # pre-filled "pending" for all gates
    rationales: dict            # criterion_id → rationale string
    confidence: dict            # criterion_id → "high"|"medium"|"low"
    flagged_fields: list[str]   # all missing/thin fields across sections
    overall_confidence: str     # "high"|"medium"|"low"
    model_used: str
    scoring_notes: str


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------

class NepalPEPromptBuilder:
    """
    Builds the system and user prompts for AI scoring.
    Nepal-specific context is baked into the system prompt so it
    doesn't need to be repeated in every criterion prompt.
    """

    SYSTEM_PROMPT = """You are a senior investment analyst at a Nepal-focused private equity fund.
Your job is to evaluate early-stage companies for investment readiness using a structured 1-10 rubric.

Nepal market context you must apply:
- GDP ~$40B, remittance-dependent economy (~25% of GDP via NRB data)
- Digital payments infrastructure: eSewa, Khalti, ConnectIPS are strong validation signals
- Regulatory bodies: SEBON (securities), NRB (central bank), IRD (tax), OAG (audit)
- Foreign investment governed by FITTA 2019 — any foreign capital requires FITTA compliance
- CBS (Central Bureau of Statistics) and NRB are the authoritative sources for TAM/SAM data
- Political risk: bandh (shutdowns), load-shedding, and federal/provincial policy shifts are real operational risks
- Strong ESG and gender-inclusion signals are important for DFI (IFC, FMO, ADB) co-investment potential

Scoring rubric (apply consistently):
10  Exceptional — best-in-class for Nepal context, specific data, no gaps
8-9 Strong — clear, credible, minor gaps
6-7 Adequate — present but vague, needs follow-up in DD
4-5 Weak — thin or generic, significant gaps
2-3 Poor — almost absent, boilerplate only
1   Missing or contradictory

Output format — you must respond ONLY with valid JSON matching this exact schema:
{
  "criteria": [
    {
      "criterion_id": "<id>",
      "score": <integer 1-10>,
      "rationale": "<2-3 sentence explanation referencing specific submission content>",
      "confidence": "<high|medium|low>",
      "evidence_quotes": ["<verbatim snippet from submission>"],
      "flags": ["<thin_answer|missing_data|inconsistency|nepal_context_gap|financial_unverified>"]
    }
  ],
  "section_notes": "<1-2 sentence overall observation for the analyst>",
  "missing_fields": ["<field names that were empty or absent>"]
}

Rules:
- Score based on QUALITY and SPECIFICITY of content, not length
- A short precise answer scores higher than a long vague one
- Always cite specific phrases from the submission in evidence_quotes
- If a field is empty or contains only a placeholder, score it 1 and flag missing_data
- Never invent data — only score what is present in the submission
- confidence=low when the submission field was absent or a single sentence
- confidence=high only when the answer contains specific, verifiable claims"""

    def build_section_prompt(
        self,
        section_id: str,
        section_config: dict,
        submission_excerpt: dict,
        company_name: str,
    ) -> str:
        criteria_block = "\n".join(
            f"  - criterion_id: \"{c['id']}\"\n"
            f"    label: \"{c['label']}\"\n"
            f"    weight: {c['weight']}\n"
            f"    description: \"{c.get('description', c['label'])}\""
            for c in section_config["criteria"]
        )

        submission_block = json.dumps(submission_excerpt, ensure_ascii=False, indent=2)

        return f"""Company: {company_name}
Section: {SECTION_TITLES[section_id]} (weight: {section_config['weight'] * 100:.0f}% of total deal score)

Criteria to score:
{criteria_block}

Relevant submission content:
{submission_block}

Score all {len(section_config['criteria'])} criteria above. Return only the JSON schema described in your instructions."""


# ---------------------------------------------------------------------------
# Main AI scoring assistant
# ---------------------------------------------------------------------------

class AIScoringAssistant:
    """
    Calls Claude to generate AI-assisted 1-10 scores for all 20 criteria.

    One API call per section (5 total). Results are returned as a payload
    ready for analyst review — nothing is written to the database here.
    """

    def __init__(self, api_key: str | None = None):
        genai.configure(api_key=api_key or os.environ.get("GEMINI_API_KEY"))
        self.client = genai.GenerativeModel(
            model_name=AI_SCORING_MODEL,
            system_instruction=NepalPEPromptBuilder.SYSTEM_PROMPT,
        )
        self.prompt_builder = NepalPEPromptBuilder()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def score_project(self, project) -> AIScoreResult:
        """
        Main entry point. Accepts a Django Project model instance.

        Returns AIScoreResult with criteria_scores ready for ScoringEngine.
        Never writes to the database.
        """
        submission_data: dict = project.submission_data or {}
        company_name: str = (
            submission_data.get("company_name")
            or submission_data.get("startup_name")
            or str(project.id)
        )

        section_results: list[SectionAIResult] = []
        all_flagged_fields: list[str] = []

        sections_config = {s["id"]: s for s in SCORING_CONFIG["sections"]}

        for section_id, criterion_ids in SECTION_FIELD_GROUPS.items():
            section_config = sections_config[section_id]
            submission_excerpt = self._extract_submission_fields(
                submission_data, criterion_ids
            )
            result = self._score_section(
                section_id=section_id,
                section_config=section_config,
                submission_excerpt=submission_excerpt,
                company_name=company_name,
            )
            section_results.append(result)
            all_flagged_fields.extend(result.missing_fields)

        criteria_scores = self._build_criteria_scores_payload(section_results)
        rationales = {
            c.criterion_id: c.rationale
            for sr in section_results
            for c in sr.criteria
        }
        confidence_map = {
            c.criterion_id: c.confidence
            for sr in section_results
            for c in sr.criteria
        }
        overall_confidence = self._compute_overall_confidence(confidence_map)

        compliance_gates = {
            g["id"]: "pending"
            for g in SCORING_CONFIG["compliance_gates"]
        }

        return AIScoreResult(
            project_id=str(project.id),
            company_name=company_name,
            section_results=section_results,
            criteria_scores=criteria_scores,
            compliance_gates=compliance_gates,
            rationales=rationales,
            confidence=confidence_map,
            flagged_fields=list(set(all_flagged_fields)),
            overall_confidence=overall_confidence,
            model_used=AI_SCORING_MODEL,
            scoring_notes=self._build_scoring_notes(section_results, overall_confidence),
        )

    # ------------------------------------------------------------------
    # Section scoring
    # ------------------------------------------------------------------

    def _score_section(
        self,
        section_id: str,
        section_config: dict,
        submission_excerpt: dict,
        company_name: str,
        retries: int = 2,
    ) -> SectionAIResult:
        user_prompt = self.prompt_builder.build_section_prompt(
            section_id=section_id,
            section_config=section_config,
            submission_excerpt=submission_excerpt,
            company_name=company_name,
        )

        for attempt in range(retries + 1):
            try:
                response = self.client.generate_content(
                    user_prompt,
                    generation_config=genai.types.GenerationConfig(
                        max_output_tokens=AI_SCORING_MAX_TOKENS,
                        temperature=0.2,
                    ),
                )
                raw_text = response.text.strip()
                parsed = self._parse_section_response(raw_text, section_id, section_config)
                return parsed

            except (Exception, json.JSONDecodeError, KeyError) as e:
                logger.warning(
                    "AI scoring attempt %d failed for section %s: %s",
                    attempt + 1, section_id, e
                )
                if attempt < retries:
                    time.sleep(1.5 * (attempt + 1))
                else:
                    logger.error("All retries exhausted for section %s — using fallback scores", section_id)
                    return self._fallback_section_result(section_id, section_config)

    def _parse_section_response(
        self,
        raw_text: str,
        section_id: str,
        section_config: dict,
    ) -> SectionAIResult:
        # Strip markdown fences if model wraps in ```json
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        data = json.loads(raw_text.strip())

        criteria_scores: list[CriterionAIScore] = []
        expected_ids = {c["id"] for c in section_config["criteria"]}

        for item in data.get("criteria", []):
            cid = item.get("criterion_id", "")
            if cid not in expected_ids:
                continue
            score = max(1, min(10, int(item.get("score", 5))))
            criteria_scores.append(CriterionAIScore(
                criterion_id=cid,
                score=score,
                rationale=item.get("rationale", ""),
                confidence=item.get("confidence", "medium"),
                evidence_quotes=item.get("evidence_quotes", []),
                flags=item.get("flags", []),
            ))

        # Fill any missing criteria with score=1 / low confidence
        scored_ids = {c.criterion_id for c in criteria_scores}
        for c in section_config["criteria"]:
            if c["id"] not in scored_ids:
                criteria_scores.append(CriterionAIScore(
                    criterion_id=c["id"],
                    score=1,
                    rationale="No submission content found for this criterion.",
                    confidence="low",
                    evidence_quotes=[],
                    flags=["missing_data"],
                ))

        return SectionAIResult(
            section_id=section_id,
            criteria=criteria_scores,
            section_notes=data.get("section_notes", ""),
            missing_fields=data.get("missing_fields", []),
        )

    def _fallback_section_result(self, section_id: str, section_config: dict) -> SectionAIResult:
        """Returns score=1 with low confidence for all criteria if API fails."""
        return SectionAIResult(
            section_id=section_id,
            criteria=[
                CriterionAIScore(
                    criterion_id=c["id"],
                    score=1,
                    rationale="AI scoring unavailable — manual scoring required.",
                    confidence="low",
                    evidence_quotes=[],
                    flags=["ai_unavailable"],
                )
                for c in section_config["criteria"]
            ],
            section_notes="AI scoring failed for this section. Please score manually.",
            missing_fields=[],
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _extract_submission_fields(
        self,
        submission_data: dict,
        criterion_ids: list[str],
    ) -> dict:
        """
        Pulls only the fields relevant to these criteria from submission_data.
        Keeps the payload small so we don't burn context on irrelevant fields.
        """
        relevant_keys: set[str] = set()
        for cid in criterion_ids:
            relevant_keys.update(CRITERION_FIELD_MAP.get(cid, []))

        excerpt = {}
        for key in relevant_keys:
            val = submission_data.get(key)
            if val not in (None, "", [], {}):
                excerpt[key] = val

        # Always include company name and sector for context
        for meta_key in ("company_name", "startup_name", "sector", "stage"):
            val = submission_data.get(meta_key)
            if val:
                excerpt[meta_key] = val

        return excerpt

    def _build_criteria_scores_payload(
        self, section_results: list[SectionAIResult]
    ) -> dict:
        """
        Builds the criteria_scores dict in the exact format ScoringEngine expects:
        { section_id: { criterion_id: score, ... }, ... }
        """
        payload: dict[str, dict[str, int]] = {}
        for sr in section_results:
            payload[sr.section_id] = {
                c.criterion_id: c.score for c in sr.criteria
            }
        return payload

    def _compute_overall_confidence(self, confidence_map: dict) -> str:
        counts = {"high": 0, "medium": 0, "low": 0}
        for v in confidence_map.values():
            counts[v] = counts.get(v, 0) + 1
        total = sum(counts.values())
        if total == 0:
            return "low"
        if counts["low"] / total > 0.4:
            return "low"
        if counts["high"] / total > 0.6:
            return "high"
        return "medium"

    def _build_scoring_notes(
        self,
        section_results: list[SectionAIResult],
        overall_confidence: str,
    ) -> str:
        missing_count = sum(len(sr.missing_fields) for sr in section_results)
        low_confidence = sum(
            1 for sr in section_results
            for c in sr.criteria
            if c.confidence == "low"
        )
        flagged = sum(
            1 for sr in section_results
            for c in sr.criteria
            if c.flags
        )
        parts = [
            f"Overall AI scoring confidence: {overall_confidence}.",
            f"{missing_count} submission fields were missing or empty.",
            f"{low_confidence}/20 criteria scored with low confidence.",
        ]
        if flagged:
            parts.append(
                f"{flagged} criteria have flags requiring analyst attention."
            )
        parts.append(
            "All scores are AI-generated suggestions. Analyst review and "
            "adjustment is required before finalising the evaluation."
        )
        return " ".join(parts)


# ---------------------------------------------------------------------------
# Django view integration helper
# ---------------------------------------------------------------------------

def build_ai_scored_payload(project) -> dict:
    """
    Convenience function for use in ProjectEvaluateView.

    Returns a payload dict ready to pass to ScoringEngine.evaluate(),
    pre-populated with AI scores and pending compliance gates.

    Example in views.py:
        from core.utils.ai_scoring import build_ai_scored_payload

        class ProjectEvaluateView(APIView):
            def post(self, request, project_id):
                project = get_object_or_404(Project, id=project_id)

                # If analyst posts their own scores, use those
                if "criteria_scores" in request.data:
                    payload = request.data.copy()
                else:
                    # Otherwise generate AI scores for analyst to review
                    ai_result = build_ai_scored_payload(project)
                    return Response({
                        "ai_draft": ai_result,
                        "message": "Review and adjust scores before finalising."
                    }, status=200)
    """
    assistant = AIScoringAssistant()
    result = assistant.score_project(project)

    submission_data = project.submission_data or {}

    return {
        "company_name": result.company_name,
        "sector": submission_data.get("sector", ""),
        "deal_id": str(project.id),
        "evaluated_by": "ai_draft",
        "criteria_scores": result.criteria_scores,
        "compliance_gates": result.compliance_gates,
        "ai_meta": {
            "model": result.model_used,
            "overall_confidence": result.overall_confidence,
            "flagged_fields": result.flagged_fields,
            "scoring_notes": result.scoring_notes,
            "rationales": result.rationales,
            "confidence": result.confidence,
        },
    }
