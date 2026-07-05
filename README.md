# Tenderhook

[![CI](https://github.com/asmuelle/tenderhook/actions/workflows/ci.yml/badge.svg)](https://github.com/asmuelle/tenderhook/actions/workflows/ci.yml)

> Procurement radar for SMB government contractors: a daily agent over SAM.gov, state/local portals, and buyer budget documents maintains living dossiers per agency and opportunity — semantically matching tenders to your real capabilities, red-lining every amendment, and flagging incumbent contracts expiring 6-12 months out.


## Concept

Procurement radar for SMB government contractors: a daily agent over SAM.gov, state/local portals, and buyer budget documents maintains living dossiers per agency and opportunity — semantically matching tenders to your real capabilities, red-lining every amendment, and flagging incumbent contracts expiring 6-12 months out.


## Auto-Research Mechanic

Daily monitoring of SAM.gov APIs, state and major-city procurement portals, EU TED, grants.gov — plus the pre-RFP layer incumbents ignore at this price: agency budget documents, board/council minutes, capital-improvement plans that telegraph solicitations months early, and award databases revealing incumbent contracts nearing expiration. Capability profiles (NAICS codes + natural-language description of what the firm actually does) drive cheap-model semantic matching far beyond keywords ('cloud migration under an IT modernization umbrella' matches when keywords don't). Living dossier per tracked opportunity — every amendment red-lined against the prior version, Q&A addenda summarized — and per target agency (buying history, incumbent map, upcoming expirations). All sources are public government documents: deep-linked, verifiable, free of the AI-crawler-blocking problem.

## Product Surface

Email digest first (morning opportunity review is the BD ritual in this industry) + web SaaS for the pipeline board, agency dossiers, and amendment red-lines + Slack alerts for deadline changes on tracked bids.





## Tech Stack & Unit Economics

### Ingestion
* SAM.gov daily extracts + Get Opportunities API via non-federal system account (1,000 req/day tier; 10/day without a role — extracts are the real backbone)
* FPDS-NG/USASpending bulk downloads for the award + incumbent-expiration graph
* grants.gov XML extract, EU TED API
* SLED via per-platform adapters (Playwright workers with platform-level adapters for Bonfire, BidNet Direct, Periscope S2G, OpenGov, Ionwave, PlanetBids covers ~70% of volume; long tail is bespoke scrapers)
* Granicus/Legistar APIs for council minutes and agendas.
  
### Storage/diffing
* Postgres + pgvector
* S3 document store with content-hash versioning per solicitation; amendment detection is deterministic (poll source-of-record, checksum, pdf-to-text via Docling/Reducto, structural text diff) with LLM used only to summarize changed hunks — never to decide whether something changed.
  
### Models
* embeddings (voyage-3 or text-embedding-3-large) for candidate retrieval
* Haiku 4.5 / Gemini Flash-class for match scoring and digest copy
* Sonnet 4.6-class only for capture briefs and agency dossier synthesis on the top tier.
  
### Citation grounding
* every digest claim deep-links to source doc + page anchor
* quoted text string-verified against extracted text before send (no unverifiable quotes shipped)
### Orchestration
* boring queue workers (Temporal or SQS + cron) for the daily batch — no agent framework needed
* agentic browsing reserved for credentialed portal retrieval. 
