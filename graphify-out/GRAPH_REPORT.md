# Graph Report - .  (2026-05-01)

## Corpus Check
- Large corpus: 208 files · ~904,227 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 1270 nodes · 16562 edges · 65 communities detected
- Extraction: 8% EXTRACTED · 92% INFERRED · 0% AMBIGUOUS · INFERRED: 15259 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Core Backend Infrastructure|Core Backend Infrastructure]]
- [[_COMMUNITY_Deals & AI Integration|Deals & AI Integration]]
- [[_COMMUNITY_Deal Lifecycle & API|Deal Lifecycle & API]]
- [[_COMMUNITY_GP Administration|GP Administration]]
- [[_COMMUNITY_Frontend & Auth|Frontend & Auth]]
- [[_COMMUNITY_Permissions & Fund Access|Permissions & Fund Access]]
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
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
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
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 135|Community 135]]
- [[_COMMUNITY_Community 136|Community 136]]
- [[_COMMUNITY_Community 140|Community 140]]
- [[_COMMUNITY_Community 141|Community 141]]
- [[_COMMUNITY_Community 155|Community 155]]

## God Nodes (most connected - your core abstractions)
1. `Fund` - 307 edges
2. `PEProject` - 230 edges
3. `PEProjectDocument` - 226 edges
4. `ImmutableAuditEvent` - 222 edges
5. `PEInvestment` - 220 edges
6. `CapitalCall` - 220 edges
7. `Distribution` - 220 edges
8. `EntrepreneurKYBDocument` - 217 edges
9. `GPShareholder` - 217 edges
10. `GovernanceProposal` - 217 edges

## Surprising Connections (you probably didn't know these)
- `Command` --uses--> `User`  [INFERRED]
  backend\deals\management\commands\seed_phase3.py → backend\core\models.py
- `Converts 1-10 score to 0-100 for compatibility with legacy ProjectScore.score fi` --uses--> `Project`  [INFERRED]
  backend\core\utils\scoring.py → backend\core\models.py
- `Converts 1-10 score to 0-100 for compatibility with legacy ProjectScore.score fi` --uses--> `ProjectScore`  [INFERRED]
  backend\core\utils\scoring.py → backend\core\models.py
- `HealthCheckView` --uses--> `FundSerializer`  [INFERRED]
  backend\core\views.py → backend\deals\serializers.py
- `EntrepreneurDashboardView` --uses--> `FundSerializer`  [INFERRED]
  backend\core\views.py → backend\deals\serializers.py

## Communities

### Community 0 - "Core Backend Infrastructure"
Cohesion: 0.06
Nodes (198): AbstractUser, BaseUserAdmin, ArticleAdmin, AuditLogAdmin, ContactAdmin, ContactInteractionAdmin, CourseAdmin, CourseModuleAdmin (+190 more)

### Community 1 - "Deals & AI Integration"
Cohesion: 0.03
Nodes (102): BaseCommand, Command, Command, Command, AIBudgetGuard, AIModelClient, can_make_call(), get_current_spend() (+94 more)

### Community 2 - "Deal Lifecycle & API"
Cohesion: 0.28
Nodes (130): APIView, ComplianceGate, CriterionScore, DCFAssumptions, DealMemo, LBOAssumptions, LPDocumentAccess, LPKYCDocument (+122 more)

### Community 3 - "GP Administration"
Cohesion: 0.15
Nodes (71): CapitalCallAdmin, DistributionAdmin, EntrepreneurKYBDocumentAdmin, FundAdmin, FundDocumentAdmin, GovernanceProposalAdmin, GPDividendAdmin, GPDividendInline (+63 more)

### Community 4 - "Frontend & Auth"
Cohesion: 0.05
Nodes (15): AuthGuard(), Header(), EntrepreneurLayout(), GPInvestorLayout(), GPSidebarFooter(), useAuth(), LoginContent(), LPLayout() (+7 more)

### Community 5 - "Permissions & Fund Access"
Cohesion: 0.18
Nodes (21): IsEntrepreneurRole, IsGPInvestorRole, IsGPStaff, IsLPRole, Grant access only to users with 'admin' or 'super_admin' in their roles.     The, Grant access only to users with 'entrepreneur' role., Grant access only to Limited Partners ('investor' role)., Grant access only to GP Investors ('gp_investor' role). (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.22
Nodes (16): LPFundCommitment, Tracks an LP's capital commitment to a fund., ImmutableAuditEventSerializer, PEProjectDetailSerializer, RegulatoryChecklistSerializer, ScoringRunSerializer, EntrepreneurInviteDetailView, GPGovernanceProposalViewSet (+8 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (14): AIScoreResult, AIScoringAssistant, build_ai_scored_payload(), CriterionAIScore, NepalPEPromptBuilder, core/utils/ai_scoring.py  AI-assisted scoring layer for Nepal PE/VC deal evaluat, Builds the system and user prompts for AI scoring.     Nepal-specific context is, Calls Claude to generate AI-assisted 1-10 scores for all 20 criteria.      One A (+6 more)

### Community 9 - "Community 9"
Cohesion: 0.24
Nodes (10): dispatch_styled_email(), notify_entrepreneur_submission(), notify_gp_dividend(), notify_gp_document_upload(), notify_gp_ir_document(), notify_gp_proposal(), notify_investors_document(), notify_lps_new_deal() (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.39
Nodes (7): CapitalCall, A drawdown of LP committed capital for investment purposes., GovernanceProposalSerializer, GPInvestorDashboardView, GET /api/gp-investor/dashboard/     Shareholding, fund performance, IR data., GET /api/gp-investor/dashboard/, GP management of documents for a specific fund.     POST /api/deals/funds/<fund

### Community 11 - "Community 11"
Cohesion: 0.25
Nodes (4): LPDashboardFundSerializer, GPProjectExtractedFinancialsView, GET /api/deals/projects/<uuid>/extracted-financials/, GET /api/deals/projects/<uuid:project_id>/scoring/latest/

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (5): IsGPStaffOrReadOnly, IsOwnerEntrepreneur, deals/permissions.py Custom DRF permissions for the PE Deals app.  Role strings, GP staff get full CRUD; all other authenticated users get read-only., Object-level: the entrepreneur_user on the PEProject must be request.user.

### Community 15 - "Community 15"
Cohesion: 0.25
Nodes (8): AI Deal Memo Generation, GP Review Workspace, Investor Dashboard, User Model, Data Room Document, Private Equity Fund, PE Deal (Project), SEBON SIF Rules 2075

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (4): OperationalAnalysisSerializer, EntrepreneurKYBListView, POST /api/deals/projects/<uuid:pk>/generate-memo/, GET /api/entrepreneur/kyc/

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (4): FundDocumentSerializer, GPRegulatoryChecklistView, GET /api/deals/projects/<uuid:pk>/regulatory-checklist/     PATCH /api/deals/pr, POST /api/deals/projects/invite/{token}/step/{step_name}/     Saves form respon

### Community 18 - "Community 18"
Cohesion: 0.29
Nodes (3): AppConfig, CoreConfig, DealsConfig

### Community 19 - "Community 19"
Cohesion: 0.38
Nodes (4): generatePageMeta(), generateMetadata(), getArticle(), getCourse()

### Community 20 - "Community 20"
Cohesion: 0.4
Nodes (4): QoEReportSerializer, GPInvestorGovernanceListView, GET /api/gp-investor/governance/proposals/, POST /api/deals/projects/{pk}/get-upload-url/     Permission: IsGPStaff

### Community 22 - "Community 22"
Cohesion: 0.6
Nodes (3): RedFlagFindingSerializer, GPRedFlagReviewView, PATCH /api/deals/red-flags/<id>/review/

### Community 23 - "Community 23"
Cohesion: 0.6
Nodes (3): CommercialAnalysisSerializer, GPProjectCommercialAnalysisView, POST /api/deals/projects/<uuid>/run-commercial-analysis/     GET /api/deals/pro

### Community 24 - "Community 24"
Cohesion: 0.6
Nodes (3): ExtractedFinancialsSerializer, GPExtractedFinancialsVerifyView, PATCH /api/deals/projects/<uuid>/extracted-financials/<id>/verify/     GP verif

### Community 25 - "Community 25"
Cohesion: 0.4
Nodes (2): Migration, deals/migrations/0002_default_pe_form_template.py Data migration: creates the de

### Community 30 - "Community 30"
Cohesion: 0.83
Nodes (3): getRoles(), middleware(), parseJwtPayload()

### Community 33 - "Community 33"
Cohesion: 0.5
Nodes (1): LPPortfolioPage()

### Community 37 - "Community 37"
Cohesion: 0.67
Nodes (2): main(), Run administrative tasks.

### Community 38 - "Community 38"
Cohesion: 0.67
Nodes (1): Migration

### Community 39 - "Community 39"
Cohesion: 0.67
Nodes (2): GPProjectRedFlagsView, GET /api/deals/projects/<uuid>/red-flags/

### Community 40 - "Community 40"
Cohesion: 0.67
Nodes (1): Migration

### Community 41 - "Community 41"
Cohesion: 0.67
Nodes (1): Migration

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (2): fetchSlugs(), sitemap()

### Community 49 - "Community 49"
Cohesion: 0.67
Nodes (1): GPInvestorMeetingsPage()

### Community 50 - "Community 50"
Cohesion: 0.67
Nodes (1): LPDocumentsPage()

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
Nodes (1): Migration

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (1): Migration

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (1): Migration

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (1): Enforce immutability: new records only, no updates.

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (1): _notify_gp_submission()

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
Nodes (1): Migration

### Community 81 - "Community 81"
Cohesion: 1.0
Nodes (1): ASGI config for finlogic_api project.  It exposes the ASGI callable as a modul

### Community 82 - "Community 82"
Cohesion: 1.0
Nodes (1): Django settings for finlogic_api project.  Generated by 'django-admin startpro

### Community 83 - "Community 83"
Cohesion: 1.0
Nodes (1): WSGI config for finlogic_api project.  It exposes the WSGI callable as a modul

### Community 135 - "Community 135"
Cohesion: 1.0
Nodes (1): Persist an evaluation from ScoringEngine.evaluate_and_memo() output.          Ar

### Community 136 - "Community 136"
Cohesion: 1.0
Nodes (1): Returns the best available image URL: uploaded file > URL field.

### Community 140 - "Community 140"
Cohesion: 1.0
Nodes (1): Percentage of required document categories present in the data room.         Re

### Community 141 - "Community 141"
Cohesion: 1.0
Nodes (1): Money-On-Invested-Capital (only meaningful post-exit).

### Community 155 - "Community 155"
Cohesion: 1.0
Nodes (1): Project Model

## Knowledge Gaps
- **160 isolated node(s):** `Run administrative tasks.`, `Meta`, `Role`, `Status`, `ProfileType` (+155 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 25`** (5 nodes): `0002_default_pe_form_template.py`, `create_default_form_template()`, `Migration`, `deals/migrations/0002_default_pe_form_template.py Data migration: creates the de`, `reverse_default_form_template()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (4 nodes): `page.jsx`, `page.jsx`, `LPPortfolioPage()`, `MetricCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (3 nodes): `main()`, `manage.py`, `Run administrative tasks.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (3 nodes): `0001_initial.py`, `0001_initial.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (3 nodes): `GPProjectRedFlagsView`, `.get_queryset()`, `GET /api/deals/projects/<uuid>/red-flags/`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (3 nodes): `0008_auto_20260420_0851.py`, `Migration`, `seed_prompts()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (3 nodes): `0011_add_commercial_ops_prompts.py`, `Migration`, `seed_prompts()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (3 nodes): `fetchSlugs()`, `sitemap()`, `sitemap.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (3 nodes): `page.jsx`, `page.jsx`, `GPInvestorMeetingsPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (3 nodes): `LPDocumentsPage()`, `page.jsx`, `page.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (2 nodes): `0002_auditlog_contact_contactinteraction_coursemodule_and_more.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (2 nodes): `0003_rolerequest_remove_user_idx_users_role_and_more.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (2 nodes): `0004_investorcommitment_notes_investorcommitment_project_and_more.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (2 nodes): `0005_projectevaluation.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (2 nodes): `0006_user_is_approved.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (2 nodes): `0007_add_article_image_upload.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (2 nodes): `.save()`, `Enforce immutability: new records only, no updates.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (2 nodes): `.post()`, `_notify_gp_submission()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (2 nodes): `0003_peprojectdocument_is_confirmed.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (2 nodes): `0004_peprojectdocument_is_lp_visible.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (2 nodes): `0005_remove_peprojectdocument_is_lp_visible_funddocument_and_more.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (2 nodes): `0006_alter_funddocument_document_type_gpshareholder_and_more.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (2 nodes): `0007_aicalllog_promptlibrary.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (2 nodes): `0009_qoereport_extractedfinancials.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (2 nodes): `0010_commercialanalysis_operationalanalysis.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (2 nodes): `0012_redflagpattern_redflagfinding.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (2 nodes): `0013_scoringrun_criterionscore_compliancegate.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (2 nodes): `0014_valuationmodel_lboassumptions_dcfassumptions.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (2 nodes): `0015_regulatorychecklist_sebonfilingdeadline.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (2 nodes): `0016_dealmemo.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (2 nodes): `0017_portfoliokpireport.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (2 nodes): `0018_lpkycdocument.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (2 nodes): `0019_entrepreneurkybdocument_governanceproposal_and_more.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 79`** (2 nodes): `0020_lpprofile_wants_notifications.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (2 nodes): `0021_alter_funddocument_document_type.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 81`** (2 nodes): `asgi.py`, `ASGI config for finlogic_api project.  It exposes the ASGI callable as a modul`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (2 nodes): `settings.py`, `Django settings for finlogic_api project.  Generated by 'django-admin startpro`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (2 nodes): `wsgi.py`, `WSGI config for finlogic_api project.  It exposes the WSGI callable as a modul`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 135`** (1 nodes): `Persist an evaluation from ScoringEngine.evaluate_and_memo() output.          Ar`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 136`** (1 nodes): `Returns the best available image URL: uploaded file > URL field.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 140`** (1 nodes): `Percentage of required document categories present in the data room.         Re`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 141`** (1 nodes): `Money-On-Invested-Capital (only meaningful post-exit).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 155`** (1 nodes): `Project Model`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Fund` connect `Core Backend Infrastructure` to `Deals & AI Integration`, `Deal Lifecycle & API`, `GP Administration`, `Permissions & Fund Access`, `Community 7`, `Community 39`, `Community 10`, `Community 11`, `Community 16`, `Community 17`, `Community 20`, `Community 22`, `Community 23`, `Community 24`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `FundSerializer` connect `Deal Lifecycle & API` to `Core Backend Infrastructure`, `Deals & AI Integration`, `GP Administration`, `Permissions & Fund Access`, `Community 7`, `Community 39`, `Community 10`, `Community 11`, `Community 16`, `Community 17`, `Community 20`, `Community 22`, `Community 23`, `Community 24`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Are the 304 inferred relationships involving `Fund` (e.g. with `UserProfileInline` and `UserAdmin`) actually correct?**
  _`Fund` has 304 INFERRED edges - model-reasoned connections that need verification._
- **Are the 227 inferred relationships involving `PEProject` (e.g. with `FundAdmin` and `PEProjectDocumentInline`) actually correct?**
  _`PEProject` has 227 INFERRED edges - model-reasoned connections that need verification._
- **Are the 223 inferred relationships involving `PEProjectDocument` (e.g. with `FundAdmin` and `PEProjectDocumentInline`) actually correct?**
  _`PEProjectDocument` has 223 INFERRED edges - model-reasoned connections that need verification._
- **Are the 217 inferred relationships involving `ImmutableAuditEvent` (e.g. with `FundAdmin` and `PEProjectDocumentInline`) actually correct?**
  _`ImmutableAuditEvent` has 217 INFERRED edges - model-reasoned connections that need verification._
- **Are the 217 inferred relationships involving `PEInvestment` (e.g. with `FundAdmin` and `PEProjectDocumentInline`) actually correct?**
  _`PEInvestment` has 217 INFERRED edges - model-reasoned connections that need verification._