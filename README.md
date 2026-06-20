# Tenderhook

> Procurement radar for SMB government contractors: a daily agent over SAM.gov, state/local portals, and buyer budget documents maintains living dossiers per agency and opportunity — semantically matching tenders to your real capabilities, red-lining every amendment, and flagging incumbent contracts expiring 6-12 months out.

**Category:** LLM wiki / auto-research (living documents + delta alerts, à la Karpathy)

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

## Tech Stack & Unit Economics

Ingestion: SAM.gov daily extracts + Get Opportunities API via non-federal system account (1,000 req/day tier; 10/day without a role — extracts are the real backbone), FPDS-NG/USASpending bulk downloads for the award + incumbent-expiration graph, grants.gov XML extract, EU TED API; SLED via per-platform adapters (Playwright workers with platform-level adapters for Bonfire, BidNet Direct, Periscope S2G, OpenGov, Ionwave, PlanetBids covers ~70% of volume; long tail is bespoke scrapers), Granicus/Legistar APIs for council minutes and agendas. Storage/diffing: Postgres + pgvector, S3 document store with content-hash versioning per solicitation; amendment detection is deterministic (poll source-of-record, checksum, pdf-to-text via Docling/Reducto, structural text diff) with LLM used only to summarize changed hunks — never to decide whether something changed. Models: embeddings (voyage-3 or text-embedding-3-large) for candidate retrieval, Haiku 4.5 / Gemini Flash-class for match scoring and digest copy, Sonnet 4.6-class only for capture briefs and agency dossier synthesis on the top tier. Citation grounding: every digest claim deep-links to source doc + page anchor; quoted text string-verified against extracted text before send (no unverifiable quotes shipped). Orchestration: boring queue workers (Temporal or SQS + cron) for the daily batch — no agent framework needed; agentic browsing reserved for credentialed portal retrieval. Unit economics: marginal LLM + embedding COGS ~$10-40/user/mo (embeddings-first filtering keeps cheap-model calls to ~200-500 candidate evals/day/user; amendment summarization is trivial token volume); fixed costs dominate — crawl/proxy/parse fleet $3-10K/mo plus 2-3 permanent FTEs babysitting adapters that break weekly. Gross margin 75-85% at $149-699/mo once past ~300 customers; underwater on fixed costs below ~75 customers. Viable margins, but the same math is available to every incumbent already in the category.
