# Graph Report - finlogic  (2026-05-01)

## Corpus Check
- 197 files · ~916,576 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1511 nodes · 25340 edges · 105 communities detected
- Extraction: 6% EXTRACTED · 94% INFERRED · 0% AMBIGUOUS · INFERRED: 23905 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 138|Community 138]]
- [[_COMMUNITY_Community 139|Community 139]]
- [[_COMMUNITY_Community 143|Community 143]]
- [[_COMMUNITY_Community 144|Community 144]]
- [[_COMMUNITY_Community 159|Community 159]]
- [[_COMMUNITY_Community 160|Community 160]]
- [[_COMMUNITY_Community 161|Community 161]]
- [[_COMMUNITY_Community 162|Community 162]]
- [[_COMMUNITY_Community 163|Community 163]]
- [[_COMMUNITY_Community 164|Community 164]]
- [[_COMMUNITY_Community 165|Community 165]]
- [[_COMMUNITY_Community 166|Community 166]]
- [[_COMMUNITY_Community 167|Community 167]]
- [[_COMMUNITY_Community 168|Community 168]]
- [[_COMMUNITY_Community 169|Community 169]]
- [[_COMMUNITY_Community 170|Community 170]]
- [[_COMMUNITY_Community 171|Community 171]]
- [[_COMMUNITY_Community 172|Community 172]]
- [[_COMMUNITY_Community 173|Community 173]]
- [[_COMMUNITY_Community 174|Community 174]]
- [[_COMMUNITY_Community 175|Community 175]]
- [[_COMMUNITY_Community 176|Community 176]]
- [[_COMMUNITY_Community 177|Community 177]]
- [[_COMMUNITY_Community 178|Community 178]]
- [[_COMMUNITY_Community 179|Community 179]]
- [[_COMMUNITY_Community 180|Community 180]]
- [[_COMMUNITY_Community 181|Community 181]]
- [[_COMMUNITY_Community 182|Community 182]]
- [[_COMMUNITY_Community 183|Community 183]]
- [[_COMMUNITY_Community 184|Community 184]]
- [[_COMMUNITY_Community 185|Community 185]]
- [[_COMMUNITY_Community 186|Community 186]]
- [[_COMMUNITY_Community 187|Community 187]]
- [[_COMMUNITY_Community 188|Community 188]]
- [[_COMMUNITY_Community 189|Community 189]]
- [[_COMMUNITY_Community 190|Community 190]]
- [[_COMMUNITY_Community 191|Community 191]]
- [[_COMMUNITY_Community 192|Community 192]]
- [[_COMMUNITY_Community 193|Community 193]]
- [[_COMMUNITY_Community 194|Community 194]]
- [[_COMMUNITY_Community 195|Community 195]]
- [[_COMMUNITY_Community 196|Community 196]]
- [[_COMMUNITY_Community 197|Community 197]]
- [[_COMMUNITY_Community 198|Community 198]]
- [[_COMMUNITY_Community 199|Community 199]]
- [[_COMMUNITY_Community 200|Community 200]]
- [[_COMMUNITY_Community 201|Community 201]]
- [[_COMMUNITY_Community 202|Community 202]]

## God Nodes (most connected - your core abstractions)
1. `Fund` - 419 edges
2. `PEProject` - 340 edges
3. `PEProjectDocument` - 333 edges
4. `LPFundCommitment` - 325 edges
5. `FundDocument` - 325 edges
6. `LPProfile` - 323 edges
7. `ImmutableAuditEvent` - 321 edges
8. `PEInvestment` - 320 edges
9. `CapitalCall` - 317 edges
10. `Distribution` - 317 edges

## Surprising Connections (you probably didn't know these)
- `PEInvestment` --uses--> `Run Monte Carlo simulation to estimate exit MOIC and IRR.          Assumptions:`  [INFERRED]
  backend\deals\models.py → backend\deals\monte_carlo.py
- `User` --uses--> `Command`  [INFERRED]
  backend\core\models.py → backend\deals\management\commands\seed_phase3.py
- `Project` --uses--> `Converts 1-10 score to 0-100 for compatibility with legacy ProjectScore.score fi`  [INFERRED]
  backend\core\models.py → backend\core\utils\scoring.py
- `ProjectScore` --uses--> `Converts 1-10 score to 0-100 for compatibility with legacy ProjectScore.score fi`  [INFERRED]
  backend\core\models.py → backend\core\utils\scoring.py
- `HealthCheckView` --uses--> `FundSerializer`  [INFERRED]
  backend\core\views.py → backend\deals\serializers.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (206): AbstractUser, BaseUserAdmin, ArticleAdmin, AuditLogAdmin, ContactAdmin, ContactInteractionAdmin, CourseAdmin, CourseModuleAdmin (+198 more)

### Community 1 - "Community 1"
Cohesion: 0.22
Nodes (152): APIView, ComplianceGate, DCFAssumptions, ExitScenario, LBOAssumptions, LPDocumentAccess, LPKYCDocument, PortfolioKPIReport (+144 more)

### Community 2 - "Community 2"
Cohesion: 0.21
Nodes (163): CapitalCallAdmin, DistributionAdmin, EntrepreneurKYBDocumentAdmin, FundAdmin, FundDocumentAdmin, GovernanceProposalAdmin, GPDividendAdmin, GPDividendInline (+155 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (111): AIBudgetGuard, AIModelClient, can_make_call(), get_current_spend(), get_monthly_key(), Main entry point for AI tasks.         Handles budget guarding, prompt retrieval, Redis-based cost tracking and circuit breaker.     Default budget: $25/month., Routes tasks to optimal models:     - Financial Extraction, Scoring, Legal Scan (+103 more)

### Community 4 - "Community 4"
Cohesion: 0.02
Nodes (45): BaseCommand, Command, Command, Command, generate_presigned_upload_url(), Generate a pre-signed PUT URL for direct browser binary uploads., check_ipo_eligibility(), deals/ipo_eligibility.py Engine to evaluate SEBON IPO requirements for NEPSE lis (+37 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (16): AuthGuard(), Header(), EntrepreneurLayout(), GPInvestorLayout(), GPSidebarFooter(), useAuth(), LoginContent(), LPLayout() (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (22): IsEntrepreneurRole, IsGPInvestorRole, IsGPStaff, IsLPRole, Grant access only to users with 'admin' or 'super_admin' in their roles.     The, Grant access only to users with 'entrepreneur' role., Grant access only to Limited Partners ('investor' role)., Grant access only to GP Investors ('gp_investor' role). (+14 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (7): PEProjectDetailSerializer, ScoringRunSerializer, GPGovernanceProposalViewSet, GPProjectLatestScoringView, GET /api/deals/projects/<uuid:project_id>/scoring/latest/, GET /api/deals/projects/<uuid:pk>/valuation/<uuid:model_id>/, Admin CRUD for Governance Proposals

### Community 9 - "Community 9"
Cohesion: 0.24
Nodes (10): dispatch_styled_email(), notify_entrepreneur_submission(), notify_gp_dividend(), notify_gp_document_upload(), notify_gp_ir_document(), notify_gp_proposal(), notify_investors_document(), notify_lps_new_deal() (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.22
Nodes (4): AppConfig, CoreConfig, DealsConfig, SuperadminConfig

### Community 11 - "Community 11"
Cohesion: 0.36
Nodes (5): OperationalAnalysisSerializer, GPProjectListView, GPProjectOperationalAnalysisView, POST /api/deals/projects/<uuid>/run-operational-analysis/     GET /api/deals/pr, GET /api/deals/projects/  - List deals     POST /api/deals/projects/ - Create a

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (5): IsGPStaffOrReadOnly, IsOwnerEntrepreneur, deals/permissions.py Custom DRF permissions for the PE Deals app.  Role strings, GP staff get full CRUD; all other authenticated users get read-only., Object-level: the entrepreneur_user on the PEProject must be request.user.

### Community 15 - "Community 15"
Cohesion: 0.43
Nodes (5): RedFlagFindingSerializer, GPInvestorIRListView, GPRedFlagReviewView, PATCH /api/deals/red-flags/<id>/review/, GET /api/gp-investor/governance/proposals/

### Community 16 - "Community 16"
Cohesion: 0.43
Nodes (5): CommercialAnalysisSerializer, GPFundDocumentDetailView, GPProjectCommercialAnalysisView, POST /api/deals/projects/<uuid>/run-commercial-analysis/     GET /api/deals/pro, Update/Delete specific fund document.     PATCH /api/deals/funds/documents/<doc

### Community 17 - "Community 17"
Cohesion: 0.43
Nodes (5): ExtractedFinancialsSerializer, EntrepreneurSubmissionDetailView, GPExtractedFinancialsVerifyView, PATCH /api/deals/projects/<uuid>/extracted-financials/<id>/verify/     GP verif, GET /api/entrepreneur/submissions/{id}/     Detail with form responses and docu

### Community 18 - "Community 18"
Cohesion: 0.38
Nodes (4): generatePageMeta(), generateMetadata(), getArticle(), getCourse()

### Community 20 - "Community 20"
Cohesion: 0.4
Nodes (2): Migration, deals/migrations/0002_default_pe_form_template.py Data migration: creates the de

### Community 25 - "Community 25"
Cohesion: 0.83
Nodes (3): getRoles(), middleware(), parseJwtPayload()

### Community 28 - "Community 28"
Cohesion: 0.5
Nodes (1): LPPortfolioPage()

### Community 32 - "Community 32"
Cohesion: 0.67
Nodes (2): main(), Run administrative tasks.

### Community 33 - "Community 33"
Cohesion: 0.67
Nodes (1): Migration

### Community 34 - "Community 34"
Cohesion: 0.67
Nodes (1): Migration

### Community 35 - "Community 35"
Cohesion: 0.67
Nodes (1): Migration

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (2): fetchSlugs(), sitemap()

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (1): GPInvestorMeetingsPage()

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (1): LPDocumentsPage()

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (1): Migration

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (1): Migration

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (1): Migration

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (1): Migration

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (1): Migration

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (1): Migration

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (1): Migration

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (1): Enforce immutability: new records only, no updates.

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (1): _notify_gp_submission()

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (1): Migration

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (1): Migration

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (1): Migration

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (1): Migration

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (1): Migration

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (1): Migration

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (1): Migration

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (1): Migration

### Community 69 - "Community 69"
Cohesion: 1.0
Nodes (1): Migration

### Community 70 - "Community 70"
Cohesion: 1.0
Nodes (1): Migration

### Community 71 - "Community 71"
Cohesion: 1.0
Nodes (1): Migration

### Community 72 - "Community 72"
Cohesion: 1.0
Nodes (1): Migration

### Community 73 - "Community 73"
Cohesion: 1.0
Nodes (1): Migration

### Community 74 - "Community 74"
Cohesion: 1.0
Nodes (1): Migration

### Community 75 - "Community 75"
Cohesion: 1.0
Nodes (1): Migration

### Community 76 - "Community 76"
Cohesion: 1.0
Nodes (1): Migration

### Community 77 - "Community 77"
Cohesion: 1.0
Nodes (1): Migration

### Community 78 - "Community 78"
Cohesion: 1.0
Nodes (1): Migration

### Community 79 - "Community 79"
Cohesion: 1.0
Nodes (1): Migration

### Community 80 - "Community 80"
Cohesion: 1.0
Nodes (1): ASGI config for finlogic_api project.  It exposes the ASGI callable as a modul

### Community 81 - "Community 81"
Cohesion: 1.0
Nodes (1): Django settings for finlogic_api project.  Generated by 'django-admin startpro

### Community 82 - "Community 82"
Cohesion: 1.0
Nodes (1): WSGI config for finlogic_api project.  It exposes the WSGI callable as a modul

### Community 138 - "Community 138"
Cohesion: 1.0
Nodes (1): Persist an evaluation from ScoringEngine.evaluate_and_memo() output.          Ar

### Community 139 - "Community 139"
Cohesion: 1.0
Nodes (1): Returns the best available image URL: uploaded file > URL field.

### Community 143 - "Community 143"
Cohesion: 1.0
Nodes (1): Percentage of required document categories present in the data room.         Re

### Community 144 - "Community 144"
Cohesion: 1.0
Nodes (1): Money-On-Invested-Capital (only meaningful post-exit).

### Community 159 - "Community 159"
Cohesion: 1.0
Nodes (1): OCR (Office of Company Registrar) Nepal format.     Accepted patterns:       -

### Community 160 - "Community 160"
Cohesion: 1.0
Nodes (1): PE Fund – tracks capital raise, commitments & fund economics.

### Community 161 - "Community 161"
Cohesion: 1.0
Nodes (1): A Private-Equity deal record.     Named PEProject to avoid collision with core.

### Community 162 - "Community 162"
Cohesion: 1.0
Nodes (1): Percentage of required document categories present in the data room.         Re

### Community 163 - "Community 163"
Cohesion: 1.0
Nodes (1): Files stored on Backblaze B2; only metadata lives here.

### Community 164 - "Community 164"
Cohesion: 1.0
Nodes (1): Limited Partner profile – extends the core User.

### Community 165 - "Community 165"
Cohesion: 1.0
Nodes (1): KYC documents uploaded by LPs for verification.     Stored locally on the Djang

### Community 166 - "Community 166"
Cohesion: 1.0
Nodes (1): KYB (Know Your Business) documents uploaded by entrepreneurs for startup verific

### Community 167 - "Community 167"
Cohesion: 1.0
Nodes (1): Tracks an LP's capital commitment to a fund.

### Community 168 - "Community 168"
Cohesion: 1.0
Nodes (1): Closed investment made from a fund into a PE project/portfolio company.

### Community 169 - "Community 169"
Cohesion: 1.0
Nodes (1): Money-On-Invested-Capital (only meaningful post-exit).

### Community 170 - "Community 170"
Cohesion: 1.0
Nodes (1): A drawdown of LP committed capital for investment purposes.

### Community 171 - "Community 171"
Cohesion: 1.0
Nodes (1): Cash / proceeds returned to LPs from a fund.

### Community 172 - "Community 172"
Cohesion: 1.0
Nodes (1): Configurable multi-step form definition (stored as JSON schema).     Each step

### Community 173 - "Community 173"
Cohesion: 1.0
Nodes (1): Stores an entrepreneur's step-by-step form responses.

### Community 174 - "Community 174"
Cohesion: 1.0
Nodes (1): Append-only audit log for key PE workflow events.     Records are NEVER updated

### Community 175 - "Community 175"
Cohesion: 1.0
Nodes (1): Enforce immutability: new records only, no updates.

### Community 176 - "Community 176"
Cohesion: 1.0
Nodes (1): Documents associated with a Fund, accessible by LPs.     Complies with SEBON SI

### Community 177 - "Community 177"
Cohesion: 1.0
Nodes (1): Tracks which LPs have viewed/acknowledged specific documents.

### Community 178 - "Community 178"
Cohesion: 1.0
Nodes (1): Tracks shares held by users in the GP Management Company.

### Community 179 - "Community 179"
Cohesion: 1.0
Nodes (1): Tracks dividend distributions to GP Shareholders.

### Community 180 - "Community 180"
Cohesion: 1.0
Nodes (1): Proposals that GP Shareholders can vote on.

### Community 181 - "Community 181"
Cohesion: 1.0
Nodes (1): Individual votes cast by GP Shareholders.

### Community 182 - "Community 182"
Cohesion: 1.0
Nodes (1): Global documents for GP Shareholders (Annual Reports, Notices).

### Community 183 - "Community 183"
Cohesion: 1.0
Nodes (1): Logs all AI requests for auditing and budget tracking.

### Community 184 - "Community 184"
Cohesion: 1.0
Nodes (1): Central repository for AI prompts with version control.

### Community 185 - "Community 185"
Cohesion: 1.0
Nodes (1): Structured financial data extracted from documents (Balance Sheets, P&L).

### Community 186 - "Community 186"
Cohesion: 1.0
Nodes (1): Quality of Earnings report generated by AI.

### Community 187 - "Community 187"
Cohesion: 1.0
Nodes (1): Commercial due diligence findings.

### Community 188 - "Community 188"
Cohesion: 1.0
Nodes (1): Operational due diligence findings.

### Community 189 - "Community 189"
Cohesion: 1.0
Nodes (1): Pre-defined patterns to look for in legal documents.

### Community 190 - "Community 190"
Cohesion: 1.0
Nodes (1): Occurrences of red flags in specific documents.

### Community 191 - "Community 191"
Cohesion: 1.0
Nodes (1): Execution instance of the FINLO scoring framework.

### Community 192 - "Community 192"
Cohesion: 1.0
Nodes (1): Score for a specific criterion within the FINLO framework.

### Community 193 - "Community 193"
Cohesion: 1.0
Nodes (1): Compliance checklists required before deal approval.

### Community 194 - "Community 194"
Cohesion: 1.0
Nodes (1): Container for DCF and LBO financial models.

### Community 195 - "Community 195"
Cohesion: 1.0
Nodes (1): Specific parameters for DCF analysis.

### Community 196 - "Community 196"
Cohesion: 1.0
Nodes (1): Specific parameters for LBO analysis.

### Community 197 - "Community 197"
Cohesion: 1.0
Nodes (1): Nepal-specific compliance checklist for PE deals.

### Community 198 - "Community 198"
Cohesion: 1.0
Nodes (1): Tracks mandatory filing deadlines with SEBON for PE funds.

### Community 199 - "Community 199"
Cohesion: 1.0
Nodes (1): Investment memo draft generated by AI and edited by GP.

### Community 200 - "Community 200"
Cohesion: 1.0
Nodes (1): Monthly performance metrics submitted by portfolio companies.

### Community 201 - "Community 201"
Cohesion: 1.0
Nodes (1): SEBON SIF Rules 2075

### Community 202 - "Community 202"
Cohesion: 1.0
Nodes (1): AI Deal Memo Generation

## Knowledge Gaps
- **209 isolated node(s):** `Run administrative tasks.`, `Meta`, `Role`, `Status`, `ProfileType` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 20`** (5 nodes): `0002_default_pe_form_template.py`, `create_default_form_template()`, `Migration`, `deals/migrations/0002_default_pe_form_template.py Data migration: creates the de`, `reverse_default_form_template()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (4 nodes): `page.jsx`, `page.jsx`, `LPPortfolioPage()`, `MetricCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (3 nodes): `main()`, `manage.py`, `Run administrative tasks.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (3 nodes): `0001_initial.py`, `0001_initial.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (3 nodes): `0008_auto_20260420_0851.py`, `Migration`, `seed_prompts()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (3 nodes): `0011_add_commercial_ops_prompts.py`, `Migration`, `seed_prompts()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (3 nodes): `fetchSlugs()`, `sitemap()`, `sitemap.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (3 nodes): `page.jsx`, `page.jsx`, `GPInvestorMeetingsPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (3 nodes): `LPDocumentsPage()`, `page.jsx`, `page.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (2 nodes): `0002_auditlog_contact_contactinteraction_coursemodule_and_more.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (2 nodes): `0003_rolerequest_remove_user_idx_users_role_and_more.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (2 nodes): `0004_investorcommitment_notes_investorcommitment_project_and_more.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (2 nodes): `0005_projectevaluation.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (2 nodes): `0006_user_is_approved.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (2 nodes): `0007_add_article_image_upload.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (2 nodes): `0008_alter_user_roles.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (2 nodes): `.save()`, `Enforce immutability: new records only, no updates.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (2 nodes): `.post()`, `_notify_gp_submission()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (2 nodes): `0003_peprojectdocument_is_confirmed.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (2 nodes): `0004_peprojectdocument_is_lp_visible.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (2 nodes): `0005_remove_peprojectdocument_is_lp_visible_funddocument_and_more.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (2 nodes): `0006_alter_funddocument_document_type_gpshareholder_and_more.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (2 nodes): `0007_aicalllog_promptlibrary.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (2 nodes): `0009_qoereport_extractedfinancials.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (2 nodes): `0010_commercialanalysis_operationalanalysis.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (2 nodes): `0012_redflagpattern_redflagfinding.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (2 nodes): `0013_scoringrun_criterionscore_compliancegate.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (2 nodes): `0014_valuationmodel_lboassumptions_dcfassumptions.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (2 nodes): `0015_regulatorychecklist_sebonfilingdeadline.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (2 nodes): `0016_dealmemo.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (2 nodes): `0017_portfoliokpireport.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (2 nodes): `0018_lpkycdocument.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (2 nodes): `0019_entrepreneurkybdocument_governanceproposal_and_more.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (2 nodes): `0020_lpprofile_wants_notifications.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (2 nodes): `0021_alter_funddocument_document_type.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (2 nodes): `0022_waterfallmodel_waterfallrun_and_more.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 79`** (2 nodes): `0023_alter_funddocument_document_type.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (2 nodes): `asgi.py`, `ASGI config for finlogic_api project.  It exposes the ASGI callable as a modul`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 81`** (2 nodes): `settings.py`, `Django settings for finlogic_api project.  Generated by 'django-admin startpro`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (2 nodes): `wsgi.py`, `WSGI config for finlogic_api project.  It exposes the WSGI callable as a modul`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 138`** (1 nodes): `Persist an evaluation from ScoringEngine.evaluate_and_memo() output.          Ar`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 139`** (1 nodes): `Returns the best available image URL: uploaded file > URL field.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 143`** (1 nodes): `Percentage of required document categories present in the data room.         Re`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 144`** (1 nodes): `Money-On-Invested-Capital (only meaningful post-exit).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 159`** (1 nodes): `OCR (Office of Company Registrar) Nepal format.     Accepted patterns:       -`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 160`** (1 nodes): `PE Fund – tracks capital raise, commitments & fund economics.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 161`** (1 nodes): `A Private-Equity deal record.     Named PEProject to avoid collision with core.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 162`** (1 nodes): `Percentage of required document categories present in the data room.         Re`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 163`** (1 nodes): `Files stored on Backblaze B2; only metadata lives here.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 164`** (1 nodes): `Limited Partner profile – extends the core User.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 165`** (1 nodes): `KYC documents uploaded by LPs for verification.     Stored locally on the Djang`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 166`** (1 nodes): `KYB (Know Your Business) documents uploaded by entrepreneurs for startup verific`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 167`** (1 nodes): `Tracks an LP's capital commitment to a fund.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 168`** (1 nodes): `Closed investment made from a fund into a PE project/portfolio company.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 169`** (1 nodes): `Money-On-Invested-Capital (only meaningful post-exit).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 170`** (1 nodes): `A drawdown of LP committed capital for investment purposes.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 171`** (1 nodes): `Cash / proceeds returned to LPs from a fund.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 172`** (1 nodes): `Configurable multi-step form definition (stored as JSON schema).     Each step`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 173`** (1 nodes): `Stores an entrepreneur's step-by-step form responses.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 174`** (1 nodes): `Append-only audit log for key PE workflow events.     Records are NEVER updated`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 175`** (1 nodes): `Enforce immutability: new records only, no updates.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 176`** (1 nodes): `Documents associated with a Fund, accessible by LPs.     Complies with SEBON SI`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 177`** (1 nodes): `Tracks which LPs have viewed/acknowledged specific documents.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 178`** (1 nodes): `Tracks shares held by users in the GP Management Company.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 179`** (1 nodes): `Tracks dividend distributions to GP Shareholders.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 180`** (1 nodes): `Proposals that GP Shareholders can vote on.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 181`** (1 nodes): `Individual votes cast by GP Shareholders.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 182`** (1 nodes): `Global documents for GP Shareholders (Annual Reports, Notices).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 183`** (1 nodes): `Logs all AI requests for auditing and budget tracking.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 184`** (1 nodes): `Central repository for AI prompts with version control.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 185`** (1 nodes): `Structured financial data extracted from documents (Balance Sheets, P&L).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 186`** (1 nodes): `Quality of Earnings report generated by AI.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 187`** (1 nodes): `Commercial due diligence findings.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 188`** (1 nodes): `Operational due diligence findings.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 189`** (1 nodes): `Pre-defined patterns to look for in legal documents.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 190`** (1 nodes): `Occurrences of red flags in specific documents.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 191`** (1 nodes): `Execution instance of the FINLO scoring framework.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 192`** (1 nodes): `Score for a specific criterion within the FINLO framework.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 193`** (1 nodes): `Compliance checklists required before deal approval.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 194`** (1 nodes): `Container for DCF and LBO financial models.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 195`** (1 nodes): `Specific parameters for DCF analysis.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 196`** (1 nodes): `Specific parameters for LBO analysis.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 197`** (1 nodes): `Nepal-specific compliance checklist for PE deals.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 198`** (1 nodes): `Tracks mandatory filing deadlines with SEBON for PE funds.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 199`** (1 nodes): `Investment memo draft generated by AI and edited by GP.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 200`** (1 nodes): `Monthly performance metrics submitted by portfolio companies.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 201`** (1 nodes): `SEBON SIF Rules 2075`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 202`** (1 nodes): `AI Deal Memo Generation`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Fund` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 7`, `Community 8`, `Community 11`, `Community 15`, `Community 16`, `Community 17`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Why does `FundSerializer` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`, `Community 7`, `Community 8`, `Community 11`, `Community 15`, `Community 16`, `Community 17`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Are the 416 inferred relationships involving `Fund` (e.g. with `UserProfileInline` and `UserAdmin`) actually correct?**
  _`Fund` has 416 INFERRED edges - model-reasoned connections that need verification._
- **Are the 337 inferred relationships involving `PEProject` (e.g. with `FundAdmin` and `PEProjectDocumentInline`) actually correct?**
  _`PEProject` has 337 INFERRED edges - model-reasoned connections that need verification._
- **Are the 330 inferred relationships involving `PEProjectDocument` (e.g. with `FundAdmin` and `PEProjectDocumentInline`) actually correct?**
  _`PEProjectDocument` has 330 INFERRED edges - model-reasoned connections that need verification._
- **Are the 322 inferred relationships involving `LPFundCommitment` (e.g. with `FundAdmin` and `PEProjectDocumentInline`) actually correct?**
  _`LPFundCommitment` has 322 INFERRED edges - model-reasoned connections that need verification._
- **Are the 322 inferred relationships involving `FundDocument` (e.g. with `FundAdmin` and `PEProjectDocumentInline`) actually correct?**
  _`FundDocument` has 322 INFERRED edges - model-reasoned connections that need verification._