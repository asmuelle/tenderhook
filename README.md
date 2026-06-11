# Tenderhook

> Procurement radar for SMB government contractors: a daily agent over SAM.gov, state/local portals, and buyer budget documents maintains living dossiers per agency and opportunity — semantically matching tenders to your real capabilities, red-lining every amendment, and flagging incumbent contracts expiring 6-12 months out.

**Category:** LLM wiki / auto-research (living documents + delta alerts, à la Karpathy) · **Status:** ✅ Tier 1 — survived the platform-risk attack (defensible)

## Scorecard

| Metric                          | Score    |
| ------------------------------- | -------- |
| Rank (of 12 finalists)          | #2       |
| Combined score                  | 5.6      |
| Monetization potential (1-10)   | 7        |
| Feasibility (1-10)              | 6        |
| Defensible vs platform features | Yes      |
| Skeptic verdict                 | weakened |

## Concept

Procurement radar for SMB government contractors: a daily agent over SAM.gov, state/local portals, and buyer budget documents maintains living dossiers per agency and opportunity — semantically matching tenders to your real capabilities, red-lining every amendment, and flagging incumbent contracts expiring 6-12 months out.

## Target User & Payer

BD leads at SMB government contractors, IT services, construction/engineering firms, and agencies (5-200 employees) selling to federal, state, and local government, plus grant-seeking nonprofits. The most quantifiable ROI in the set: a missed addendum or late-discovered RFP is a directly lost six-or-seven-figure contract.

## Auto-Research Mechanic (the living document + delta engine)

Daily monitoring of SAM.gov APIs, state and major-city procurement portals, EU TED, grants.gov — plus the pre-RFP layer incumbents ignore at this price: agency budget documents, board/council minutes, capital-improvement plans that telegraph solicitations months early, and award databases revealing incumbent contracts nearing expiration. Capability profiles (NAICS codes + natural-language description of what the firm actually does) drive cheap-model semantic matching far beyond keywords ('cloud migration under an IT modernization umbrella' matches when keywords don't). Living dossier per tracked opportunity — every amendment red-lined against the prior version, Q&A addenda summarized — and per target agency (buying history, incumbent map, upcoming expirations). All sources are public government documents: deep-linked, verifiable, free of the AI-crawler-blocking problem.

## Product Surface

Email digest first (morning opportunity review is the BD ritual in this industry) + web SaaS for the pipeline board, agency dossiers, and amendment red-lines + Slack alerts for deadline changes on tracked bids.

## Why Now (2026 timing)

GovWin and Bloomberg Government are enterprise quote-only with no self-serve tier. Government data is structured, public, and explicitly crawl-permitted — the one large corpus where 2026's publisher-blocking wall doesn't apply, so an always-on agent runs at full fidelity and near-zero legal risk. LLM semantic matching finally beats the keyword alerts that make small contractors miss winnable bids.

## Proposed Monetization

$149/mo Solo (3 capability profiles, 50 tracked buyers, amendment tracking), $349/mo Team (10 profiles, pre-RFP radar with incumbent-expiration alerts, pipeline board, 5 seats), $699/mo Capture (auto-drafted capture briefs, API/CRM export). Sits in the void between free keyword portal alerts and Deltek GovWin IQ at $5-30K+/yr quote-only.

## Competition & Gap

Deltek GovWin IQ ($5-30K+/yr), Bloomberg Government ($10K+), GovSpend, free portal alerts, keyword-spam bid-match newsletters. None maintain living opportunity dossiers with amendment diffs, none do pre-RFP incumbent-expiration radar at SMB price, none semantically match capability profiles.

## Claimed Moat

(1) Portal-adapter grind: 50 states plus hundreds of municipal systems, each with its own formats — exactly the unglamorous vertical work OpenAI/Perplexity will never do for a niche, and a multi-year head start for whoever does. (2) The award-history and incumbent-expiration graph compounds into the best pre-RFP signal in the market. (3) Amendment-diff reliability becomes reputational trust in a community where one missed addendum disqualifies a bid. (4) Capture-workflow embedding (pipeline board, bid/no-bid records, capture briefs) makes it the BD system of record — a generic scheduled-research feature can surface an RFP but can't hold the living record of an agency relationship.

---

# Evaluation (multi-agent adversarial review)

## Monetization Analysis — score 7/10

Tenderhook scores well on the single most important monetization test: the target payer demonstrably already pays for inferior alternatives. SMB government contractors today pay $1,800-$6,000/yr for keyword-based tools (GovTribe, EZGovOpps) and $12K-$42K/yr for GovWin IQ — so the proposed $1,788-$8,388/yr price ladder sits squarely inside proven willingness-to-pay, and the ROI story (one missed addendum = a lost six-figure contract) is unusually concrete for a monitoring product. Churn risk is structurally lower than typical 'monitoring' tools because BD pipelines never reach a 'caught up' state — new solicitations, amendments, and expiring incumbent contracts flow continuously, and the pipeline-board/capture-brief layer creates system-of-record stickiness. However, two factors cap the score below 8-9. First, the claimed 'void between free alerts and GovWin' is no longer empty in 2026: SamSearch starts at $99/mo with federal+SLED coverage, Sweetspot (YC, CMMC L2/SOC 2) and GovSignals (FedRAMP High) are funded AI-native entrants, Procurement Sciences raised a $30M Series B, and HigherGov already offers expiring-contract/incumbent data at low prices — so the pitch's 'none do X' claims are overstated and the wedge must be won on execution (amendment-diff reliability, SLED portal coverage depth, budget-doc pre-RFP mining) rather than category absence. Second, the customer base has churn-adjacent fragility: small-business participation in federal contracting has declined ~49% since FY2010, and SMB contractors that lose bids or exit the market cancel. Expansion dynamics are real but bounded (seat counts at 5-200-employee firms cap out; expansion comes mostly from tier upgrades and SLED/coverage add-ons rather than unbounded usage). Net: large proven payer pool (~85K small businesses win a federal contract each year; 612K SAM-registered entities; $1.5T additional SLED spend), clear ACV ladder, genuine differentiation in the pre-RFP and amendment-diff layer, but a contested wedge against multiple funded 2024-2026 entrants — a strong 7.

## Recommended Revenue Model

Keep the three-tier structure but anchor on annual contracts (the industry norm — EZGovOpps and GovTribe sell annually), with Team as the center of gravity: Solo $149/mo ($1,490/yr annual, deliberately just below GovTribe's ~$1,800/yr fed+SLED entry), Team $349/mo ($3,490/yr annual — undercutting EZGovOpps Gold at $4,700/yr for 3 users while adding the pre-RFP radar they lack), Capture $699/mo ($6,990/yr — below EZGovOpps Platinum $6K only slightly above, and ~40-70% below the cheapest real GovWin quote of ~$12K). Differentiate the Solo tier from SamSearch's $99/mo by leading with amendment red-lining and incumbent-expiration alerts rather than search. Expansion levers: (1) per-seat add-ons beyond tier caps ($49/seat/mo), (2) SLED state-pack add-ons (e.g., +$50/mo per additional state cluster) which monetizes the portal-adapter moat directly, (3) tier upgrades driven by gating pre-RFP radar at Team and capture briefs/CRM export at Capture. Unit math: blended ~$300/mo ACV means 850 customers (1% of the ~85K annually-winning small businesses) = ~$3.1M ARR; 2,500-3,000 customers = ~$10M ARR, a plausible 4-5 year target in a category where the incumbent (Deltek) is quote-only and disliked on price. Offer a 14-day trial seeded with the prospect's own NAICS/capability profile so the first email digest demonstrates a real missed opportunity — the strongest conversion mechanic available given the loss-aversion framing.

## Market Evidence (live web research, June 2026)

Verified via web search (June 2026): GovWin IQ real-world quotes run ~$12K/yr single-seat to $42K+/yr enterprise, quote-only with $5K-$50K implementation (fed-spend.com, itqlick.com) — confirming the expensive-incumbent anchor. Mid-market comps confirm SMB willingness-to-pay at exactly Tenderhook's price band: GovTribe $100-$300/mo federal-only, ~$1,800/yr fed+SLED, $5,250 for 5 seats; EZGovOpps $2,700/yr single user to $6,000/yr for 6 users (iquasar.com, samsearch.co). Market size: ~612,000 entities registered on SAM.gov, ~85,000 small businesses win at least one federal contract annually, $160B+/yr federal dollars reserved for small business, and SLED governments spend another ~$1.5T across 100,000+ agencies (sledai.com, sba.gov); GovCon software market estimated at ~$1.09B in 2025 growing at 9.3% CAGR to ~$2.0B by 2032 (openpr.com). Competitive crowding confirmed: SamSearch from $99/mo with plain-English federal+SLED search; Sweetspot (YC-backed, CMMC L2/SOC 2); GovDash (custom pricing, explicitly targets $10M+ revenue contractors — leaving the sub-$10M segment open); GovSignals (FedRAMP High); Procurement Sciences/Awarded AI raised a $30M Series B (executivebiz.com). Headwind noted: small-business participation in federal contracting down ~49% since FY2010 (deltek.com blog). Sources: https://fed-spend.com/blog/govwin-iq-pricing-2026-deltek-cost-alternatives, https://www.itqlick.com/govwin-from-deltek/pricing, https://iquasar.com/blog/5-government-contract-opportunity-search-tools/, https://www.sledai.com/blog/government-contracting-statistics/, https://www.executivebiz.com/articles/procurement-sciences-funding-govcon-ai-platform, https://samsearch.co/, https://www.govdash.com/blog/govdash-vs-samsearch, https://www.openpr.com/news/4411726/government-contracting-software-market-report-the-global

## Comparables

- Deltek GovWin IQ — quote-only incumbent; real 2026 quotes ~$12,000/yr (single-seat starter) to $42,000+/yr (enterprise w/ Federal Industry Analysis); ~$200/user/mo entry; +$5K-$50K implementation (fed-spend.com, itqlick.com)
- GovTribe — $100-$300/mo federal-only; ~$1,800/yr federal+state/local; $5,250/yr for 5-seat license (iquasar.com)
- EZGovOpps — $2,700/yr single user; $4,700/yr Gold (3 users); $6,000/yr Platinum (6 users); cheapest of the legacy mid-market platforms (iquasar.com)
- SamSearch — AI-native entrant from $99/mo, federal + state/local/education plain-English search; direct low-end pressure on Tenderhook's Solo tier (samsearch.co)
- GovDash — AI 'BD operating system', custom quote pricing, explicitly targets contractors with $10M+ revenue, leaving the sub-$10M SMB segment underserved (govdash.com)
- Sweetspot — YC-backed AI GovCon platform (capture + pipeline + proposals), CMMC L2/SOC 2, pricing not public (sweetspot.so, ycombinator.com)
- Procurement Sciences / Awarded AI — $30M Series B raised for AI GovCon platform; validates investor conviction in the category (executivebiz.com)
- Bloomberg Government — enterprise quote-only, ~$10K+/yr per the candidate brief; no self-serve tier
- HigherGov — low-cost market-intelligence platform with awards/expiring-contract data; pricing not published in search results but positioned well below GovWin (g2.com, trustradius.com)

## Adversarial Review — strongest case AGAINST (verdict: weakened)

The pitch's foundational market claim — an empty void between free keyword alerts and $5-30K/yr GovWin — was false before the first line of code. HigherGov has sold self-serve since 2022 at $500-5,000/yr with federal + SLED coverage across 60,000+ agencies in all 50 states plus award-history and expiring-contract (incumbent) data, and was acquired by Procurement Sciences in May 2026 to form the largest AI-powered govcon growth platform; Sweetspot, GovDash, and GovSignals all sell AI semantic opportunity matching to SMBs at self-serve prices, bundled with the proposal-drafting layer where willingness-to-pay and retention actually concentrate. Tenderhook enters as roughly the sixth funded AI-native player while its pitch deck pretends the cohort doesn't exist. Its claimed moats mostly evaporate on inspection: the award/incumbent-expiration graph is rebuilt from public FPDS/USASpending data anyone can ingest (HigherGov already productized it), the portal-adapter grind has already been done by mdf commerce/BidNet, PlanetBids/Vendorline, Public Bid Tracker, and HigherGov (for Tenderhook it's a catch-up cost, not a head start), and the pipeline board is the most commoditized surface in the category. The one genuinely differentiated feature — deterministic amendment red-lining — depends on solicitation documents that on many SLED portals (Bonfire, BidNet Direct, Periscope, PlanetBids, DemandStar) sit behind vendor-registration logins, puncturing the 'all public, zero legal risk, no crawler walls' story: credentialed mass-scraping violates portal ToS, and per-customer credentials destroy the shared-crawl cost model. That same feature carries a near-100% recall requirement by the pitch's own admission ('one missed addendum disqualifies a bid'); a single miss that costs a customer a seven-figure bid is reputational kill in a community wired together by APEX/PTAC accelerators. The pre-RFP radar (board minutes, CIPs, budget docs) is low-signal-density LLM burn across thousands of long-tail municipal PDF sources — defensible as garnish, fatal as the headline. And the Solo tier serves the segment with the worst retention in the industry: SMB hopefuls who go 6-9 months without a win cut BD subscriptions first (bid-match-newsletter churn dynamics, expect 4-7%/mo logo churn), while Tenderhook deliberately stops short of proposal drafting — ceding the stickiest workflow to competitors who already do everything else it does. Platform risk from frontier labs is the weakest attack (nobody at OpenAI will maintain 500 SLED scrapers), but surviving ChatGPT is the wrong bar; surviving Procurement Sciences + HigherGov post-merger is the real one, and there Tenderhook has no data head start, no distribution, and one copyable feature.

## Recommended Tech Stack & Unit Economics

Ingestion: SAM.gov daily extracts + Get Opportunities API via non-federal system account (1,000 req/day tier; 10/day without a role — extracts are the real backbone), FPDS-NG/USASpending bulk downloads for the award + incumbent-expiration graph, grants.gov XML extract, EU TED API; SLED via per-platform adapters (Playwright workers with platform-level adapters for Bonfire, BidNet Direct, Periscope S2G, OpenGov, Ionwave, PlanetBids covers ~70% of volume; long tail is bespoke scrapers), Granicus/Legistar APIs for council minutes and agendas. Storage/diffing: Postgres + pgvector, S3 document store with content-hash versioning per solicitation; amendment detection is deterministic (poll source-of-record, checksum, pdf-to-text via Docling/Reducto, structural text diff) with LLM used only to summarize changed hunks — never to decide whether something changed. Models: embeddings (voyage-3 or text-embedding-3-large) for candidate retrieval, Haiku 4.5 / Gemini Flash-class for match scoring and digest copy, Sonnet 4.6-class only for capture briefs and agency dossier synthesis on the top tier. Citation grounding: every digest claim deep-links to source doc + page anchor; quoted text string-verified against extracted text before send (no unverifiable quotes shipped). Orchestration: boring queue workers (Temporal or SQS + cron) for the daily batch — no agent framework needed; agentic browsing reserved for credentialed portal retrieval. Unit economics: marginal LLM + embedding COGS ~$10-40/user/mo (embeddings-first filtering keeps cheap-model calls to ~200-500 candidate evals/day/user; amendment summarization is trivial token volume); fixed costs dominate — crawl/proxy/parse fleet $3-10K/mo plus 2-3 permanent FTEs babysitting adapters that break weekly. Gross margin 75-85% at $149-699/mo once past ~300 customers; underwater on fixed costs below ~75 customers. Viable margins, but the same math is available to every incumbent already in the category.

---

_Generated 2026-06-10 from a multi-agent research pipeline: 4/5 live-web research agents (product landscape, B2B intel market, tech economics, demand signals; the Karpathy-quotes agent stalled), 3-lens ideation (B2B radars, living wikis, prosumer auto-research), shortlist, then per-candidate monetization analyst + platform-risk skeptic. Market figures are agent-researched estimates — verify before committing capital._
