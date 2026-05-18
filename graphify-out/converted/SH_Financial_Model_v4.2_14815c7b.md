<!-- converted from SH_Financial_Model_v4.2.xlsx -->

## Sheet: COVER
| Silicon Himalayas |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INTEGRATED FINANCIAL MODEL  ·  v4.2  ·  MARCH 2026  ·  THREE-SCENARIO |  |  |  |  |  |  |  |  |  |  |
| SHEET INDEX |  |  |  |  |  |  |  |  |  |  |
| ASSUMPTIONS | All inputs · Scenario toggle · Sources |  |  |  |  |  |  |  |  |  |
| REVENUE | Six-vertical revenue model · linked to ASSUMPTIONS |  |  |  |  |  |  |  |  |  |
| P&L | Operating EBITDA (debt) + Carbon EBITDA (equity upside) |  |  |  |  |  |  |  |  |  |
| CAPEX | Phase II-A/B DC · Hydrogen · NVDIC · HimalLedger |  |  |  |  |  |  |  |  |  |
| CASH FLOW | Phase I monthly (2026) + Phase II annual (2027–2033) |  |  |  |  |  |  |  |  |  |
| DEBT EQUITY | Finlogic Fund I · DFI debt · covenant ratios · DSCR |  |  |  |  |  |  |  |  |  |
| DASHBOARD | Scenario comparison · KPI scorecard · Charts |  |  |  |  |  |  |  |  |  |
| KEY METRICS (BASE CASE) |  |  |  |  |  |  |  |  |  |  |
| Phase I Capital | USD 1.5–2.0M | Seed + Phase I Extension |  |  |  |  |  |  |  |  |
| Phase II-A Capital | USD 62.75–102.75M | 5MW DC + 5MW solar, IBN+IFC |  |  |  |  |  |  |  |  |
| Phase II-B Capital | USD 150–280M | 20MW net new, Finlogic Fund I |  |  |  |  |  |  |  |  |
| 2028 Operating Revenue | USD 16.85M | Excl. carbon credits |  |  |  |  |  |  |  |  |
| 2031 Operating EBITDA | USD 60.2M | Excl. carbon — for DFI underwriting |  |  |  |  |  |  |  |  |
| 2033 Operating Revenue | USD 487.7M | Excl. carbon — ten-entity ecosystem |  |  |  |  |  |  |  |  |
| Carbon EBITDA 2031 | USD 67.4M | Incl. carbon — equity upside scenario |  |  |  |  |  |  |  |  |
| EBITDA Positive | 2028 | Phase II-A colo + hydrogen pilot |  |  |  |  |  |  |  |  |
| Blended Power Target | ≤$0.07/kWh | Hydro + utility solar blended |  |  |  |  |  |  |  |  |
| H₂ Blended LCOH | $3.2–3.5/kg | Wet $2.8 / dry solar-hybrid $3.8–4.2 |  |  |  |  |  |  |  |  |
| SCENARIO GUIDE |  |  |  |  |  |  |  |  |  |  |
| WORST CASE | CSO Act voluntary-only to 2028 · Phase II-A 20% Year 1 occupancy · Carbon non-operational · DFI debt 8% · Solar delayed |  |  |  |  |  |  |  |  |  |
| BASE CASE | CSO Act Month 12 · Phase II-A 5MW M24 no pre-lease · DFI debt 6.5% · Blended power $0.065/kWh · Carbon upside separate |  |  |  |  |  |  |  |  |  |
| BEST CASE | CSO Act Month 4 (Cabinet fast-track) · Phase II-B anchor M18 · Carbon Registry 2028 · DFI debt 5.5% · Solar top irradiance |  |  |  |  |  |  |  |  |  |
| COLOUR CONVENTION |  |  |  |  |  |  |  |  |  |  |
| ■ Blue text | Hardcoded input — change to test scenarios |  |  |  |  |  |  |  |  |  |
| ■ Green text | Cross-sheet formula link |  |  |  |  |  |  |  |  |  |
| ■ Black text | Calculated formula — do not edit directly |  |  |  |  |  |  |  |  |  |
| ■ Red text | External reference or critical flag |  |  |  |  |  |  |  |  |  |
| ■ Yellow bg | Key assumption requiring verification |  |  |  |  |  |  |  |  |  |
## Sheet: ASSUMPTIONS
| SILICON HIMALAYAS — ASSUMPTIONS REGISTER  ·  v4.2 |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- |
| ACTIVE SCENARIO (change this cell) |  | Base | ← Enter: Worst / Base / Best |  |  |
| ASSUMPTION | WORST | BASE | BEST | UNITS | SOURCE / NOTES |
| A. MACRO & ENERGY |  |  |  |  |  |
| A-01  Blended power tariff (hydro+solar) | 0.075 | 0.065 | 0.055 | USD/kWh | NEA PPA public rates avg $0.087/kWh blended; large-consumer + solar target ≤$0.07/kWh. ASSUMPTION UNVERIFIED — NEA PPA negotiation required M1 |
| A-02  NEA seasonal: wet-season tariff | 0.064 | 0.05 | 0.04 | USD/kWh | Green Hydrogen Policy 2025 preferential $0.020–0.025/kWh wet season; commercial hydro NPR 8.45/kWh = ~$0.063/kWh |
| A-03  NEA seasonal: dry-season tariff | 0.095 | 0.087 | 0.07 | USD/kWh | NEA winter storage hydro NPR 14.80/kWh = ~$0.111/kWh ceiling; solar supplement reduces blended dry-season cost |
| A-04  Solar LCOE (utility-scale 5MW) | 0.06 | 0.048 | 0.038 | USD/kWh | AEPC Solar Radiation Atlas 2019 + IRENA 2024 South Asia benchmark $0.7–1.1M/MWp. UNVERIFIED (A-14) — third-party assessment required Stage 3 |
| A-05  NPR/USD exchange rate | 135 | 132 | 128 | NPR per USD | Nepal Rastra Bank reference rate March 2026. Sensitivity: each NPR 10 move affects NPR-denominated revenues ~7.5% |
| A-06  USD inflation (cost escalation) | 0.035 | 0.025 | 0.02 | %/yr | US CPI + Nepal construction cost escalation. Applied to CAPEX and OPEX from 2027 onwards |
| A-07  Nepal grid carbon intensity | 0.12 | 0.1 | 0.08 | kgCO₂e/kWh | Nepal ~95% hydro; dry-season India import raises carbon intensity. AEPC/MoFE confirmation required (A-07). UNVERIFIED |
| B. DATA CENTRE — PHASE II-A (5MW) |  |  |  |  |  |
| B-01  Phase II-A IT load commissioned | 5 | 5 | 5 | MW | 5MW no-pre-lease structure; IBN equity 30% + IFC 50% + commercial bank 20% |
| B-02  Phase II-A commissioning month | 27 | 24 | 22 | Month | Construction schedule from Month 13 site selection. Worst = 3-month seismic delay |
| B-03  Phase II-A Year 1 occupancy | 0.2 | 0.3 | 0.45 | % | No anchor pre-lease; organic ramp. Best = strong regional enterprise demand |
| B-04  Phase II-A colo rate | 85 | 90 | 100 | USD/kW/month | Singapore benchmark $90–110/kW/mo; Nepal risk-adjusted discount. UNVERIFIED — market survey required |
| B-05  Phase II-A occupancy ramp (yr/yr) | 0.15 | 0.2 | 0.25 | %/yr | Annual occupancy increase until 90% ceiling |
| B-06  Phase II-A OPEX (% of revenue) | 0.55 | 0.45 | 0.38 | % | Power, staff, maintenance, insurance, debt service. Higher at low occupancy |
| B-07  Phase II-B commissioning (MW) | 20 | 20 | 20 | MW net new | Gated on 12 months Phase II-A operational evidence + anchor pre-lease |
| B-08  Phase II-B commissioning month | 42 | 36 | 30 | Month | Phase II-B: 12 months Phase II-A ops + EPC. Worst = anchor pre-lease delayed |
| B-09  Phase II-B Year 1 occupancy | 0.35 | 0.5 | 0.65 | % | Post-evidence anchor pre-lease; higher base than Phase II-A |
| B-10  Phase II-B colo rate | 90 | 100 | 115 | USD/kW/month | Higher rate post operational track record + SOC 2 Type II |
| B-11  pPUE (annual average, measured) | 1.3 | 1.22 | 1.12 | ratio | Seasonal model: best achievable above 1,200m = 1.08–1.15. Terai-hill transition 1.20–1.35. UNVERIFIED (A-02) |
| C. HYDROGEN — HIMALARC |  |  |  |  |  |
| C-01  H₂ LCOH (wet season, hydro) | 3.2 | 2.8 | 2.5 | USD/kg | G-Philos FS 2025 at $0.025/kWh preferential. UNVERIFIED — 20MW bankable FS required |
| C-02  H₂ LCOH (dry season, solar hybrid) | 4.2 | 3.8 | 3.2 | USD/kg | Solar-powered electrolysis Dec–May; LCOE $0.038–0.055/kWh. Single EPC contract |
| C-03  H₂ LCOH (blended annual) | 3.8 | 3.35 | 2.9 | USD/kg | Weighted average: (C-01 × 7 wet months + C-02 × 5 dry months) / 12. Blended annual planning figure used throughout model. |
| C-04  H₂ offtake price (domestic/export) | 4.5 | 5 | 5.5 | USD/kg | Target FOB Kathmandu; blended domestic + export. IndianOil HoT target $4.50–5.00/kg CIF Birgunj |
| C-05  H₂ plant availability | 0.82 | 0.88 | 0.92 | %/yr | PEM stack life >80,000hrs; G-Philos PMCP maintenance optimisation |
| C-06  H₂ 20MW output (t/yr) | 3000 | 3500 | 3800 | t/yr | At 400 kg/h × 8,760 hrs × availability. Worst includes dry-season production gap |
| C-07  H₂ gross margin | 0.3 | 0.4 | 0.5 | % | After OPEX: power, water, maintenance, G-Philos PMCP licence |
| C-08  Ammonia conversion ratio | 5.56 | 5.56 | 5.56 | kg H₂ per t NH₃ | Fixed by stoichiometry: 3H₂ + N₂ → 2NH₃; 5.56 kg H₂/t NH₃ |
| C-09  Ammonia price (CIF Kolkata/Dhaka) | 400 | 480 | 560 | USD/t | ICF ICIS ammonia price range 2025. Nepal discount for new supplier premium |
| D. SI-OS SAAS PLATFORM |  |  |  |  |  |
| D-01  SaaS Beta price (pre-SOC 2 Type II) | 15000 | 25000 | 35000 | USD/yr/sub | Beta during SOC 2 Type I period (M1–M10). Full price post Type II (M10+) |
| D-02  SaaS full price (post SOC 2 Type II) | 35000 | 50000 | 65000 | USD/yr/sub | Comparable: Orbital Insight enterprise $50–75K; Nepal frontier market discount. UNVERIFIED (A-06) |
| D-03  Subscribers 2026 H2 (Beta) | 2 | 3 | 4 | subs | Anchor MOU partners invited to Beta from Month 5 |
| D-04  Subscribers 2027 | 5 | 8 | 12 | subs | Post SOC 2 Type II at Month 10; full commercial launch |
| D-05  Subscriber growth rate (2028–2032) | 0.2 | 0.3 | 0.4 | %/yr | Institutional GIS market growth + hyperscaler BD pipeline |
| D-06  Government subscriber price discount | 0.6 | 0.5 | 0.4 | % | GoN/IBN/MoCIT/NEA accounts at 40–60% discount to commercial rate |
| E. NEPALCSO REGISTRY PLATFORM |  |  |  |  |  |
| E-01  CSO Act gazette month (Base=M12) | 0 | 12 | 4 | Month | Worst=never enacted (0=voluntary only). Base=M12 Nepal legislative timeline. Best=M4 Cabinet fast-track. CRITICAL (A-13) |
| E-02  ICSO registrations Year 1 post-Act | 1500 | 5000 | 12000 | registrations | Mandatory registration trigger. Worst=voluntary only. Best=Cabinet public campaign |
| E-03  ICSO registration fee | 400 | 500 | 500 | NPR/yr | Individual CSO registration. Fee set in Act. |
| E-04  OCSO registrations (companies) | 150 | 300 | 500 | companies | Mandatory for Nepal-registered IT firms >1 CSO engagement |
| E-05  OCSO fee (tiered, small company) | 4000 | 5000 | 5000 | NPR/yr | Tier 1: <NPR 5M revenue. Higher tiers scale proportionally |
| E-06  TDS processing fee (% of transaction) | 0.004 | 0.005 | 0.005 | % | 0.5% per CSO transaction tax documentation processing |
| E-07  Annual CSO sector transaction volume | 500 | 800 | 1200 | NPR MM | Nepal IT outsourcing estimated NPR 100B+ annually; formalised share Year 1 |
| E-08  HR/payroll SaaS (USD/employee/mo) | 15 | 25 | 35 | USD/emp/mo | ICT Centre tenants + nomads. Phase II from 2027 |
| E-09  Talent placement fee (% first yr) | 0.12 | 0.18 | 0.22 | % | Of first year salary on successful placement. Nepal market norm 10–15% |
| F. NVDIC (NEPAL VALLEY DIGITAL INFRASTRUCTURE CAMPUS) |  |  |  |  |  |
| F-01  NVDIC Phase 1 open (calendar year) | 2029 | 2028 | 2028 | year | PPP concession requires CAAN Cabinet decision + 40-yr concession. CAAN decision required Q2 2026 |
| F-02  Satellite bandwidth revenue/tenant | 200 | 400 | 700 | USD/mo | Starlink Enterprise array 8+ terminals; 1–2 Gbps aggregate. Wholesale ISP resale additional |
| F-03  NVDIC campus tenants (Year 1) | 15 | 30 | 50 | tenants | BPO workstations + MNC offices + training academy + residences |
| F-04  NVDIC office/BPO lease rate | 12 | 18 | 25 | USD/sqft/yr | Pokhara market premium; satellite hub + NVDIC brand adds premium vs raw Pokhara market |
| F-05  NVDIC rooftop solar (campus OPEX offset) | 0.12 | 0.2 | 0.25 | % | 1–3MW rooftop reduces campus daytime energy cost 12–25% |
| G. CARBON CREDITS (ITMO / NHC) |  |  |  |  |  |
| G-01  Carbon credit price (NHC/ITMO) | 15 | 25 | 35 | USD/tCO₂e | Carbon Trade Regulations 2082 + Article 6.4 ITMO Pathway 4. $25/t is Nepal's published Emergent agreement rate. UNVERIFIED (A-03) |
| G-02  Nepal Carbon Registry live (year) | 2031 | 2030 | 2028 | year | Contingent on MoFE + AEPC + UNFCCC SBSTA methodology approval. Long lead time |
| G-03  DC avoided emissions factor | 10512 | 10512 | 10512 | tCO₂e/MW/yr | Based on Nepal grid 0.10 kgCO₂e/kWh × 8,760 hrs × 12 months. See A-07 |
| G-04  H₂ avoided emissions (vs grey H₂) | 9.3 | 9.3 | 9.3 | tCO₂e/t H₂ | Grey H₂ from SMR: ~11 tCO₂e/t H₂; offset credit for green H₂ displacement |
| G-05  Carbon revenue included in EBITDA | 0 | 0 | 0 | 0=NO 1=YES | ALWAYS 0 for debt underwriting. Shown as separate line per DFI requirement. DO NOT CHANGE TO 1 FOR DEBT MODELS |
| H. FINLOGIC FUND I & DEBT TERMS |  |  |  |  |  |
| H-01  DFI debt cost (ADB/IFC/FMO) | 0.08 | 0.065 | 0.055 | %/yr | ADB non-sovereign private sector window typical 5–8%. Requires pipeline registration M1. UNVERIFIED (A-08) |
| H-02  DFI debt tenor | 12 | 15 | 18 | years | Infrastructure DFI standard. Longer tenor in Best case reflects strong ESG profile |
| H-03  Phase II-A debt:equity | 0.5 | 0.6 | 0.65 | debt % | Phase II-A: IBN equity 30% + IFC 50–65% debt. No Finlogic Fund I at Phase II-A stage |
| H-04  Phase II-B debt:equity | 0.55 | 0.6 | 0.65 | debt % | Finlogic Fund I primary equity vehicle at Phase II-B. DFI debt 55–65% |
| H-05  Finlogic carry rate | 0.15 | 0.15 | 0.15 | % | 15% above 8% hurdle rate (fixed — first-time GP DFI structure) |
| H-06  Finlogic management fee | 0.0175 | 0.0175 | 0.0175 | % p.a. | 1.75% on committed capital. Fixed across scenarios |
| H-07  DSCR minimum covenant | 1.2 | 1.2 | 1.2 | ratio | ADB/IFC standard minimum DSCR 1.20x for infrastructure debt covenant |
| H-08  HimalLedger Nepal — Phase I dev cost | 400 | 550 | 720 | USD K | Smart contracts + API + W3C VC implementation + legal opinion (Nepal + international) |
## Sheet: REVENUE
| SILICON HIMALAYAS — REVENUE MODEL (ALL VERTICALS)  ·  THREE-SCENARIO  ·  USD '000 |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACTIVE SCENARIO → |  | Base |  |  |  |  |  |  |  |  |
| REVENUE LINE |  | 2026 | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033 | NOTES |
| VERTICAL 1 — SI-OS SaaS Platform |  |  |  |  |  |  |  |  |  |  |
| SI-OS SaaS Revenue | USD K | 75 | 400 | 600 | 1100 | 2100 | 3250 | 4550 | 6000 |  |
| VERTICAL 2 — Data Centre Colocation (NCILtd) |  |  |  |  |  |  |  |  |  |  |
|   Phase II-A IT Load Occupied (MW) | MW | 0 | 0 | 1.5 | 4 | 5 | 5 | 5 | 5 |  |
|   Phase II-A Colo Revenue | USD K | 0 | 0 | 1620 | 4560 | 6000 | 6600 | 6600 | 6600 |  |
|   Phase II-B IT Load Occupied (MW) | MW | 0 | 0 | 0 | 0 | 3 | 20 | 80 | 120 |  |
|   Phase II-B Colo Revenue | USD K | 0 | 0 | 0 | 0 | 3600 | 26400 | 96000 | 172800 |  |
| DATA CENTRE TOTAL | USD K | 0 | 0 | 1620 | 4560 | 9600 | 33000 | 102600 | 179400 |  |
| VERTICAL 3 — HimalArc Hydrogen (H₂ + Ammonia + Oxygen) |  |  |  |  |  |  |  |  |  |  |
|   H₂ Production (t/yr) | t/yr | 0 | 18 | 3500 | 3500 | 7000 | 35000 | 35000 | 35000 |  |
|   H₂ Direct Sales Revenue | USD K | 0 | 90 | 17500 | 17500 | 35000 | 175000 | 175000 | 175000 |  |
|   Oxygen By-Product Revenue | USD K | 0 | 0 | 875 | 875 | 1750 | 8750 | 8750 | 8750 |  |
| HYDROGEN TOTAL | USD K | 0 | 500 | 18375 | 18375 | 36750 | 183750 | 183750 | 183750 |  |
| VERTICAL 4 — Everest Peak Computing + HimalLedger ESG Certs |  |  |  |  |  |  |  |  |  |  |
|   GPU Compute Revenue | USD K | 280 | 720 | 1350 | 2300 | 4500 | 7200 | 10800 | 14400 |  |
|   HimalLedger ESG Cert Revenue | USD K | 15 | 60 | 150 | 320 | 600 | 900 | 1200 | 1600 |  |
| EVEREST PEAK + HIMALLED TOTAL | USD K | 295 | 780 | 1500 | 2620 | 5100 | 8100 | 12000 | 16000 |  |
| VERTICAL 5 — Nepal Valley Digital Infrastructure Campus (NVDIC, PPP) |  |  |  |  |  |  |  |  |  |  |
|   BPO/Office Leasing Revenue | USD K | 0 | 0 | 2400 | 6000 | 9600 | 14400 | 19200 | 25600 |  |
|   Satellite Bandwidth Revenue | USD K | 0 | 0 | 144 | 432 | 720 | 1080 | 1440 | 1800 |  |
|   Training Academy Revenue | USD K | 0 | 0 | 800 | 1600 | 2400 | 3200 | 4000 | 4800 |  |
|   Nomad Residences + Conference | USD K | 0 | 0 | 400 | 960 | 1440 | 1920 | 2400 | 2880 |  |
| NVDIC TOTAL | USD K | 0 | 0 | 3744 | 8992 | 14160 | 20600 | 27040 | 35080 |  |
| VERTICAL 6 — NepalCSO Registry Platform |  |  |  |  |  |  |  |  |  |  |
|   OCSO + ICSO Registration Fees | USD K | 13 | 80 | 380 | 700 | 1000 | 1300 | 1700 | 2200 |  |
|   IRD Data Contract (Govt SaaS) | USD K | 0 | 100 | 350 | 450 | 600 | 700 | 800 | 900 |  |
|   Tax Documentation Processing | USD K | 0 | 40 | 400 | 1000 | 1800 | 2600 | 3500 | 4500 |  |
|   HR/Payroll SaaS + Marketplace | USD K | 0 | 80 | 500 | 1200 | 2200 | 3200 | 4200 | 5500 |  |
|   HimalLedger Credential API | USD K | 0 | 20 | 80 | 200 | 400 | 600 | 800 | 1000 |  |
| NEPALCSO TOTAL | USD K | 13 | 320 | 1710 | 3550 | 6000 | 8400 | 11000 | 14100 |  |
| TOTAL OPERATING REVENUE (excl. carbon) |  | 383 | 2000 | 27549 | 39197 | 73710 | 257100 | 341990 | 434330 |  |
| Carbon Credits (ITMOs — contingent, not in debt models) |  | 0 | 0 | 493 | 1511 | 3284 | 7222 | 15759 | 24000 |  |
| TOTAL REVENUE (incl. carbon — equity upside) |  | 383 | 2000 | 28042 | 40708 | 76994 | 264322 | 357749 | 458330 |  |
## Sheet: P&L
| SILICON HIMALAYAS — P&L FORECAST  ·  TWO-LINE FORMAT  ·  USD '000 |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACTIVE SCENARIO → |  | Base |  |  |  |  |  |  |  |  |
| P&L LINE |  | 2026 | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033 | NOTES |
| OPERATING REVENUE (excl. carbon credits) |  |  |  |  |  |  |  |  |  |  |
|   SI-OS SaaS | → REVENUE!C4 | 75 | 400 | 600 | 1100 | 2100 | 3250 | 4550 | 6000 |  |
|   Data Centre Colocation | → REVENUE! DC Total | 0 | 0 | 1620 | 4560 | 9600 | 33000 | 102600 | 179400 |  |
|   Hydrogen Revenue | → REVENUE! H₂ Total | 0 | 500 | 18375 | 18375 | 36750 | 183750 | 183750 | 183750 |  |
|   NVDIC Campus | → REVENUE! NVDIC Total | 0 | 0 | 3744 | 8992 | 14160 | 20600 | 27040 | 35080 |  |
|   NepalCSO Platform | → REVENUE! NepalCSO Total | 13 | 320 | 1710 | 3550 | 6000 | 8400 | 11000 | 14100 |  |
|   Everest Peak + HimalLedger Nepal | → REVENUE! EPC+HL Total | 295 | 780 | 1500 | 2620 | 5100 | 8100 | 12000 | 16000 |  |
| TOTAL OPERATING REVENUE |  | 383 | 2000 | 27549 | 39197 | 73710 | 257100 | 341990 | 434330 |  |
| OPERATING COSTS |  |  |  |  |  |  |  |  |  |  |
|   COGS + Operating Expenses | Power, staff, maintenance, insurance, admin, partner fees | -900 | -2600 | -9200 | -21000 | -40000 | -80000 | -145000 | -195000 |  |
|   Depreciation & Amortisation | 15-yr straight-line on Phase II-A/B infrastructure; HimalLedger 3yr | -50 | -200 | -4500 | -9000 | -17000 | -27000 | -44000 | -59000 |  |
|   Debt Service (principal + interest) | DFI debt: excluded from EBITDA; shown for DSCR calculation in DEBT EQUITY sheet | 0 | 0 | -4000 | -10000 | -18000 | -28000 | -38000 | -46000 |  |
| OPERATING EBITDA (excl. carbon — FOR DEBT UNDERWRITING) |  |  |  |  |  |  |  |  |  |  |
| OPERATING EBITDA | DFI credit underwriting uses this line ONLY. Carbon excluded. | -517 | -600 | 18349 | 18197 | 33710 | 177100 | 196990 | 239330 |  |
| CARBON REVENUE (contingent — EQUITY UPSIDE ONLY) |  |  |  |  |  |  |  |  |  |  |
|   Carbon Credits — ITMOs (NHC) | Shown separately. EXCLUDED from debt service. Registry live: Worst 2031, Base 2030, Best 2028 | 0 | 0 | 493 | 1511 | 3284 | 7222 | 15759 | 24000 |  |
| TOTAL EBITDA (incl. carbon — equity upside) | For equity investor valuation only. Not used in DFI/bank debt underwriting. | -517 | -600 | 18842 | 19708 | 36994 | 184322 | 212749 | 263330 |  |
| MARGIN ANALYSIS |  |  |  |  |  |  |  |  |  |  |
|   Operating EBITDA Margin % | excl. carbon | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |  |
|   Operating Revenue YoY Growth % |  |  | 0 | 0 | 1.5 | 0.8 | 0.555555555555556 | 0.357142857142857 | 0.210526315789474 |  |
## Sheet: CAPEX
| SILICON HIMALAYAS — CAPEX SCHEDULE  ·  THREE-SCENARIO  ·  USD MILLIONS |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- |
| ACTIVE SCENARIO → |  | Base |  |  |  |
| CAPEX ITEM | WORST ($M) | BASE ($M) | BEST ($M) | TIMING | NOTES / SOURCE |
| PHASE I — SEED (2026) |  |  |  |  |  |
|   Cloud infrastructure + GIS data licences | 0.15 | 0.2 | 0.25 | M1–M3 | AWS/Azure + DHM/MiMapper/GEM licences + IBN sovereign rack |
|   Software development (SI-OS Alpha + Beta) | 0.45 | 0.6 | 0.8 | M1–M6 | 5 developers × 6 months; Nepal market rates NPR 80–130K/mo each |
|   NepalCSO MVP development | 0.25 | 0.35 | 0.45 | M2–M6 | 3 developers + PM + IRD API integration |
|   HimalLedger Nepal Phase I | 0.3 | 0.45 | 0.6 | M1–M6 | → ASSUMPTIONS!H-08. Smart contracts + W3C VC + legal opinion |
|   G-Philos PEMEC 100kW unit + commissioning | 0.12 | 0.18 | 0.22 | M1–M4 | 10-week manufacturing lead time. KU site preparation in-kind |
|   Site evaluation field investigation | 0.08 | 0.12 | 0.15 | M4–M6 | Stage 3 field investigation: geotechnical, HVAC, solar resource assessment |
|   Legal, regulatory, BD, admin (Phase I) | 0.1 | 0.15 | 0.18 | M1–M12 | Nepal law firm (HimalLedger NRB opinion) + IBN fees + BD travel |
| PHASE I TOTAL |  |  |  |  |  |
| PHASE II-A — DATA CENTRE 5MW + SOLAR (2027–2028) |  |  |  |  |  |
|   Land acquisition (5 acres Phase II-A) | 0.35 | 0.2 | 0.1 | M13–M14 | Site-dependent; licensed Nepal valuer. Range: typical Nepal industrial corridor |
|   Civil construction (building shell, perimeter) | 38 | 32 | 26 | M14–M20 | Nepal estimate $6–8M/MW × 5MW. Hill-zone +15–20% premium for earthworks |
|   Power infrastructure (EHV feeder, TX, UPS) | 16 | 13 | 10 | M14–M20 | Long-lead transformers ordered M7. Nepal import duty +15% to US benchmark |
|   Cooling systems (free-air primary; liquid GPU) | 9 | 7 | 5.5 | M16–M22 | Sized for 5MW Phase II-A; modular expansion to 20MW in Phase II-B |
|   5MW utility solar farm (adjacent DC) | 5.5 | 4.5 | 3.5 | M16–M22 | IRENA 2024: $0.7–1.1M/MWp. Commissioned simultaneously with Phase II-A DC |
|   Fiber connectivity (OPGW + IXP + OOB) | 4 | 2.5 | 1.8 | M16–M22 | NTA/NEA fiber leasing; IXP Equinix Mumbai/Singapore; NVDIC satellite OOB |
|   IT equipment (shell-only; tenants self-provide) | 1.5 | 0.8 | 0 | M20–M22 | Shell-only approach avoids IT capex. Best = fully tenant-provided |
|   EIA + permits + QS + legal | 2.5 | 1.8 | 1.2 | M6–M20 | EIA consultant 6–8 months; DoED; municipality; licensed Nepal QS |
|   Working capital (12 months pre-revenue) | 6 | 4.5 | 3.5 | M12–M24 | Pre-revenue OPEX: staff, utilities, debt service, insurance |
|   Contingency (15%) | 12.4 | 10.1 | 7.7 | Embedded | 15% on total hard costs |
| PHASE II-A TOTAL |  |  |  |  |  |
| PHASE II-A — HYDROGEN + SOLAR HYBRID (2027–2028) |  |  |  |  |  |
|   G-Philos PEMEC modules (200×100kW) + PCS | 45 | 40 | 35 | M13–M24 | G-Philos PEMEC Series II; power conversion system; compressors; DI water |
|   Solar-hydrogen supplement (2–5MW) | 5.5 | 3.5 | 1.8 | M16–M24 | Solar farm co-located with hydrogen plant; dry-season electrolyser feed |
|   Civil + land + water infrastructure | 5 | 4.5 | 4 | M13–M18 | Selected site; roads; utilities; security perimeter; water supply |
|   Engineering + commissioning + EIA | 6 | 5 | 4.5 | M8–M22 | FEED; G-Philos system integration; NEA grid connection; hydrogen safety audit |
|   Working capital + pre-operations | 4 | 3.5 | 3 | M20–M28 | Pre-revenue staff; NEA PPA deposit; solar EPC deposit; consumables |
|   Contingency (10%) | 6.5 | 5.7 | 4.8 | Embedded | 10% on total hydrogen hard costs |
| HYDROGEN + SOLAR TOTAL |  |  |  |  |  |
| PHASE II — NVDIC CAMPUS PPP (2027–2030, PPP VEHICLE) |  |  |  |  |  |
|   Satellite hub (Starlink array + Kuiper + NOC) | 4.5 | 3.5 | 2.5 | 2027–2028 | 8+ Starlink Enterprise terminals + Kuiper terminal + network ops centre |
|   NVDIC campus rooftop solar (1–3MW) | 3.2 | 2.4 | 1 | 2028–2029 | USD 0.8–1.2M/MWp campus rooftop/carport. Reduces daytime energy cost 15–25% |
|   PPP campus development (GlobeX leads) | 800 | 700 | 600 | 2027–2030 | PPP concession development capex; GlobeX as Development Manager. Financed via PPP vehicle + ADB/IFC PPP debt |
| NVDIC PPP TOTAL |  |  |  |  |  |
| PHASE II-B — DATA CENTRE 20MW NET NEW (post Phase II-A evidence, post anchor) |  |  |  |  |  |
|   Phase II-B DC + infrastructure (20MW) | 240 | 190 | 155 | 2030–2032 | Post-Phase II-A operational evidence + anchor pre-lease. Finlogic Fund I primary deployment vehicle |
| PHASE II-B TOTAL |  |  |  |  |  |
| HIMALLED NEPAL — PHASE II (2027) |  |  |  |  |  |
|   NHC tokenisation + carbon registry integration | 0.5 | 0.4 | 0.3 | 2027 | ERC-1155 on Polygon; carbon registry API; KYC/AML layer |
|   W3C VC credential infrastructure (Phase II) | 0.3 | 0.25 | 0.2 | 2027 | SSI architecture; Hyperledger Indy or Polygon ID; ZK proof privacy layer |
| HIMALLED PHASE II TOTAL |  |  |  |  |  |
## Sheet: CASH FLOW
| SILICON HIMALAYAS — CASH FLOW  ·  PHASE I MONTHLY (2026) + PHASE II ANNUAL  ·  USD '000 |  |  |  |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACTIVE SCENARIO → |  | Base |  |  |  |  |  |  |  |  |  |  |  |
| A. PHASE I MONTHLY CASH FLOW (USD '000) |  |  |  |  |  |  |  |  |  |  |  |  |  |
| LINE ITEM |  | M1 | M2 | M3 | M4 | M5 | M6 | M7 | M8 | M9 | M10 | M11 | M12 |
| Seed Capital Received |  | 1500 |  |  |  |  |  |  |  |  |  |  |  |
| SaaS + CSO Revenue |  | 0 | 0 | 0 | 0 | 25 | 45 | 70 | 90 | 110 | 140 | 165 | 200 |
| Operating Expenses |  | -120 | -140 | -160 | -180 | -170 | -175 | -160 | -150 | -140 | -150 | -145 | -150 |
| G-Philos + KU Pilot CAPEX |  | -100 | -60 | -35 | -12 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HimalLedger Phase I Dev |  | -70 | -60 | -50 | -40 | -25 | -12 | 0 | 0 | 0 | 0 | 0 | 0 |
| Site Evaluation + Legal |  | 0 | 0 | -50 | -40 | -25 | -25 | -20 | 0 | 0 | 0 | 0 | 0 |
| Transformer Deposit |  | 0 | 0 | 0 | 0 | 0 | 0 | -100 | 0 | 0 | 0 | 0 | 0 |
| Phase I Extension Capital |  | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 500 | 0 | 0 | 0 |
| NET CASH FLOW (monthly) |  | 1210 | -260 | -295 | -272 | -195 | -167 | -210 | -60 | 470 | -10 | 20 | 50 |
| CUMULATIVE CASH BALANCE |  | 1210 | 950 | 655 | 383 | 188 | 21 | -189 | -249 | 221 | 211 | 231 | 281 |
| ⚠ HARD FLOOR: USD 100K minimum at all times. Month 8 is peak stress point — buffer ~$275K above floor. Group CFO to maintain $150K emergency reserve. |  |  |  |  |  |  |  |  |  |  |  |  |  |
| B. ANNUAL CASH FLOW SUMMARY (2026–2033, USD '000) |  |  |  |  |  |  |  |  |  |  |  |  |  |
| LINE ITEM |  | 2026 | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033 | NOTES |  |  |  |
| Operating Cash Inflows (→ P&L) |  | 383 | 2000 | 27549 | 39197 | 73710 | 257100 | 341990 | 434330 |  |  |  |  |
| Operating Cash Outflows |  | -900 | -2600 | -9200 | -21000 | -40000 | -80000 | -145000 | -195000 |  |  |  |  |
| Phase I CAPEX |  | -1750 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |  |  |  |  |
| Phase II-A CAPEX (DC + Solar + H₂) |  | 0 | -20000 | -55000 | -30000 | 0 | 0 | 0 | 0 |  |  |  |  |
| Phase II-B CAPEX (20MW DC) |  | 0 | 0 | 0 | 0 | -20000 | -100000 | -50000 | -40000 |  |  |  |  |
| NVDIC PPP CAPEX (off-balance sheet) |  | 0 | -300 | -1000 | -500 | 0 | 0 | 0 | 0 |  |  |  |  |
| Debt Drawdowns (DFI + commercial) |  | 0 | 0 | 45000 | 50000 | 70000 | 130000 | 0 | 0 |  |  |  |  |
| Debt Service (principal + interest) |  | 0 | 0 | -4000 | -10000 | -18000 | -28000 | -38000 | -46000 |  |  |  |  |
| Finlogic Fund I Capital Raise |  | 0 | 0 | 0 | 0 | 40000 | 110000 | 40000 | 10000 |  |  |  |  |
| NET ANNUAL CASH FLOW |  | -2267 | -20900 | 3349 | 27697 | 105710 | 289100 | 148990 | 163330 |  |  |  |  |
| CUMULATIVE CASH BALANCE (ANNUAL) |  | -2267 | -23167 | -19818 | 7879 | 113589 | 402689 | 551679 | 715009 |  |  |  |  |
## Sheet: DEBT EQUITY
| SILICON HIMALAYAS — DEBT & EQUITY STRUCTURE  ·  FINLOGIC FUND I  ·  DFI DEBT |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACTIVE SCENARIO → |  | Base |  |  |  |  |  |  |  |
| LINE ITEM |  | 2026 | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033 |
| FINLOGIC FUND I — CAPITAL STRUCTURE |  |  |  |  |  |  |  |  |  |
|   Fund I Target Size | USD K · DFI-anchored first-time GP. ADB/IFC/FMO/AIIB/BII/CDC/DEG anchor LPs | 0 | 0 | 0 | 0 | 0 | 175000 | 175000 | 175000 |
|   Fund I First Close (cumulative) | USD K · DFI anchor LPs at first close | 0 | 0 | 0 | 0 | 0 | 80000 | 80000 | 80000 |
|   Fund I Capital Deployed (cumulative) | USD K · Phase II-B primary deployment vehicle | 0 | 0 | 0 | 0 | 40000 | 110000 | 150000 | 160000 |
|   Management Fee (annual) | USD K · 1.75% × committed capital. → ASSUMPTIONS!H-06 | 0 | 0 | 0 | 0 | 3063 | 3063 | 3063 | 3063 |
|   Carried Interest (accumulated est.) | USD K · 15% above 8% hurdle. → ASSUMPTIONS!H-05. Crystallises at exit. | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 22000 |
|   No-fault divorce clause triggered? | Triggered if Fund I deployment >12 months behind schedule with no recovery plan | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| DFI SENIOR DEBT — PHASE II-A (5MW DC + HYDROGEN) |  |  |  |  |  |  |  |  |  |
|   Phase II-A Total Debt (DFI) | USD K · IFC non-sovereign window 50–65%. ASSUMPTIONS!H-03 | 0 | 0 | 49000 | 49000 | 49000 | 49000 | 49000 | 49000 |
|   Hydrogen Debt (ADB/IFC Clean Energy) | USD K · ADB Clean Energy Facility + KEXIM Korea | 0 | 0 | 42000 | 42000 | 42000 | 42000 | 42000 | 42000 |
|   Interest Rate Applied | → ASSUMPTIONS!H-01. DFI concessional rate. UNVERIFIED — pipeline registration required M1 | 0.065 | 0.065 | 0.065 | 0.065 | 0.065 | 0.065 | 0.065 | 0.065 |
|   Annual Interest Charge ($K) | USD K · Interest on Phase II-A + Hydrogen debt combined | 0 | 0 | 5915 | 5915 | 5915 | 5915 | 5915 | 5915 |
|   Debt Maturity (year) | DFI tenor → ASSUMPTIONS!H-02 | 0 | 0 | 2041 | 0 | 0 | 0 | 0 | 0 |
| DFI SENIOR DEBT — PHASE II-B (20MW DC) |  |  |  |  |  |  |  |  |  |
|   Phase II-B Total Debt (Finlogic + DFI) | USD K · Drawn at Phase II-B construction. Finlogic Fund I equity + DFI senior debt | 0 | 0 | 0 | 0 | 20000 | 100000 | 100000 | 60000 |
|   Phase II-B Interest Charge ($K) | USD K · At scenario interest rate | 0 | 0 | 0 | 0 | 1300 | 7475 | 7475 | 4485 |
| COVENANT MONITORING — DSCR & LEVERAGE |  |  |  |  |  |  |  |  |  |
|   DSCR (Oper. EBITDA / Total Debt Service) | Minimum covenant 1.20x → ASSUMPTIONS!H-07. <1.20x triggers covenant breach review | 0 | 0 | 0.55 | 1.05 | 1.35 | 1.65 | 2.8 | 4.2 |
|   DSCR Covenant (minimum 1.20x) | ADB/IFC standard minimum DSCR. Fixed covenant threshold. | 1.2 | 1.2 | 1.2 | 1.2 | 1.2 | 1.2 | 1.2 | 1.2 |
|   ⚠ COVENANT STATUS |  | OK | OK | BREACH | BREACH | OK | OK | OK | OK |
|   Net Debt / Operating EBITDA (leverage) | Target <3.5x at steady state. DFI covenant typically <5.0x at Phase II-A peak | 0 | 0 | 3.8 | 3 | 2.4 | 1.5 | 0.9 | 0.5 |
## Sheet: DASHBOARD
| SILICON HIMALAYAS — SCENARIO COMPARISON DASHBOARD  ·  v4.2 |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| METRIC | WORST CASE |  |  | BASE CASE |  |  | BEST CASE |  |  | UNITS |
| 2026 Operating Revenue | 243 |  |  | 383 |  |  | 730 |  |  | $K |
| 2028 Operating Revenue | 15032 |  |  | 27549 |  |  | 36380 |  |  | $K |
| 2031 Operating Revenue | 49004 |  |  | 257100 |  |  | 345000 |  |  | $K |
| 2033 Operating Revenue | 250424 |  |  | 434330 |  |  | 546820 |  |  | $K |
| 2028 Operating EBITDA | -2500 |  |  | 3150 |  |  | 6200 |  |  | $K |
| 2031 Operating EBITDA | -8000 |  |  | 60200 |  |  | 90000 |  |  | $K |
| 2033 Operating EBITDA | 35000 |  |  | 211700 |  |  | 285000 |  |  | $K |
| 2028 Total EBITDA (incl. carbon) | -2500 |  |  | 3643 |  |  | 7000 |  |  | $K |
| 2031 Total EBITDA (incl. carbon) | -4400 |  |  | 67422 |  |  | 101000 |  |  | $K |
| EBITDA Positive (year) | 2031 |  |  | 2028 |  |  | 2028 |  |  | year |
| Phase II-A Commission (month) | 27 |  |  | 24 |  |  | 22 |  |  | month |
| Phase II-B Commission (month) | 42 |  |  | 36 |  |  | 30 |  |  | month |
| 2028 DC Occupancy (Phase II-A) | 20% |  |  | 30% |  |  | 45% |  |  | % |
| 2031 H₂ Production | 3000 |  |  | 35000 |  |  | 40000 |  |  | t/yr |
| 2030 NepalCSO Revenue | 2000 |  |  | 6000 |  |  | 9550 |  |  | $K |
| Blended Power Cost | $0.075 |  |  | $0.065 |  |  | $0.055 |  |  | $/kWh |
| H₂ Blended Annual LCOH | $3.80 |  |  | $3.35 |  |  | $2.90 |  |  | $/kg |
| DFI Debt Rate | 8.0% |  |  | 6.5% |  |  | 5.5% |  |  | % p.a. |
| 2031 DSCR | 1.35 |  |  | 1.65 |  |  | 2.2 |  |  | x |
| CSO Act Gazette Month | Never |  |  | M12 |  |  | M4 |  |  | month |
| Carbon Registry Live | 2031 |  |  | 2030 |  |  | 2028 |  |  | year |
| Finlogic Fund I Size | $150M |  |  | $175M |  |  | $200M |  |  | USD |
| KPI SCORECARD — BASE CASE TARGETS |  |  |  |  |  |  |  |  |  |  |
| KPI | Q4 2026 | Q4 2027 | Q4 2028 | Q4 2029 | Q4 2030 | Q4 2031 | Q4 2032 | 2033 TARGET | UNIT |  |
| SI-OS Paying Subscribers | 3 | 8 | 20 | 35 | 60 | 80 | 90 | 100+ | # |  |
| HIPs Certified (cumulative) | 15 | 25 | 40 | 60 | 80 | 100 | 120 | 150+ | # |  |
| DC IT Load Commissioned (MW) | 0 | 0 | 5 | 25 | 25 | 25 | 100 | 500+ | MW |  |
| Phase II-A Occupancy Rate | 0 | 0 | 30% | 70% | 85% | 90% | 90% | 90% | % |  |
| H₂ Production (t/yr) | 18 | 0 | 3500 | 3500 | 7000 | 35000 | 35000 | 70K+ | t/yr |  |
| NepalCSO ICSO Registered | 500 | 5000 | 20000 | 35000 | 50000 | 80000 | 100K+ | 120K+ | # |  |
| NepalCSO Tax Revenue (NPR MM) | 0 | 100 | 350 | 600 | 700 | 900 | 1,500 | 2,000+ | NPR MM |  |
| HimalLedger Nepal Revenue ($K) | 15 | 80 | 350 | 920 | 1,900 | 4,200 | 8,000 | 11,000 | $K |  |
| NVDIC Satellite Subs | 0 | 0 | 10 | 30 | 60 | 100 | 150 | 200+ | # |  |
| DSCR (oper. EBITDA / debt svc) | 0 | 0 | 0.55 | 1.05 | 1.35 | 1.65 | 2.80 | 4.20+ | x |  |
| ⚠  KEY MODEL NOTES: (1) Carbon revenue ALWAYS excluded from debt underwriting EBITDA — shown separately. (2) DSCR <1.20x triggers covenant review. (3) Phase II-A proceeds without hyperscaler pre-lease. Finlogic Fund I deploys at Phase II-B only. (4) Power tariff: blended ≤$0.07/kWh (hydro+solar). (5) Change ASSUMPTIONS!C2 to switch all model outputs between Worst / Base / Best. |  |  |  |  |  |  |  |  |  |  |