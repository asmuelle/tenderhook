# Tenderhook — Design Doc

## Thesis

SMB government contractors already pay $1,800–$42,000/yr for inferior keyword tools, and a single missed addendum is a directly lost six-or-seven-figure contract — the most concrete ROI story in B2B monitoring. Tenderhook wins not on opportunity search (crowded: SamSearch, Sweetspot, GovDash, HigherGov/Procurement Sciences) but on two underserved layers: deterministic amendment red-lining with near-perfect recall, and a pre-RFP incumbent-expiration radar built from the FPDS/USASpending award graph. Government data is public, structured, and crawl-permitted — the one corpus where an always-on agent runs at full fidelity, so reliability engineering (not model cleverness) is the moat.

### Non-goals (hold the line)

- **Not an opportunity search engine.** SamSearch, HigherGov, and four other funded entrants already sell that. We surface matches; we do not build a search UX.
- **Not a proposal-drafting tool** (for now). Capture briefs at the top tier are the ceiling; full proposal generation is GovDash/Sweetspot territory and a separate product decision.
- **Not a general LLM agent.** The daily batch is boring cron workers; agentic browsing exists solely for credentialed portal retrieval.
- **Not broad municipal-PDF mining at launch.** Budget docs/council minutes (Granicus/Legistar) are deferred past M3 and scoped to customer-tracked agencies.

## Architecture

### Monorepo layout (pnpm workspace)

| Module              | Responsibility                                                                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`          | Next.js 15 App Router (TypeScript strict): pipeline board, agency dossiers, amendment red-line viewer, capability-profile settings, digest preview                |
| `packages/core`     | Pure TS domain logic, zero I/O: diff engine, citation verifier, deadline math, materiality classification, match-scoring contracts, shared entity types           |
| `packages/pipeline` | Inngest functions: ingestion adapters (`sam`, `fpds`, `grants`, `ted`, `sled/*`), document fetch + hash, text extraction, triage, digest assembly, alert dispatch |
| `packages/db`       | Drizzle ORM schema, migrations, repositories, pgvector similarity queries                                                                                         |

Local infra: docker compose Postgres 16 with pgvector. Document blobs in S3-compatible storage (R2/S3), keyed by content hash.

**Scheduling choice: Inngest** (not Temporal). The daily-batch workload is "boring queue workers + cron" per the research dossier; Inngest gives cron triggers, step retries, fan-out, and concurrency keys with zero infrastructure to operate at pre-revenue scale, and it runs inside the Next.js deployment. Revisit Temporal only if SLED adapter orchestration outgrows step functions (long-lived credentialed browser sessions at >50 adapters).

### Data flow (source → diff → triage → synthesis → surface)

```
SAM.gov extracts/API ─┐
FPDS / USASpending ───┤   ingest        version store        deterministic
grants.gov XML ───────┼─► normalize ──► S3 + content-hash ──► diff engine ──┐
EU TED API ───────────┤   & upsert      per solicitation      (checksum +   │
SLED Playwright ──────┘                                       text diff)    │
                                                                            ▼
surfaces ◄── synthesis ◄─────────── triage ◄────────────────────── changed/new
email digest   LLM summaries        embeddings-first retrieval     opportunities
web dossiers   verified citations   then cheap-model scoring
Slack alerts   capture briefs
```

### Cost discipline: deterministic → cheap → frontier

| Layer                                               | Used for                                                                                                                                                                                                | Never used for                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Deterministic code**                              | Change detection (content hash + structural text diff), deadline parsing and change alerts, incumbent-expiration computation from FPDS period-of-performance dates, citation string-verification, dedup | —                                   |
| **Embeddings** (voyage-3 or text-embedding-3-large) | Candidate retrieval: capability profile ↔ opportunity, capped at ~200–500 candidate evals/day/user                                                                                                      | Final relevance decisions           |
| **Cheap model** (Haiku 4.5 / Flash-class)           | Match-score rationale, digest copy, summarizing _already-diffed_ hunks, Q&A addendum summaries                                                                                                          | Deciding _whether_ anything changed |
| **Frontier model** (Sonnet 4.6-class)               | Capture briefs and agency dossier synthesis — Capture tier only                                                                                                                                         | Anything in the daily batch path    |

Target marginal COGS: $10–40/user/mo (per dossier unit economics). Embeddings-first filtering is the cost gate; any PR that adds an LLM call upstream of the embedding filter is wrong by default.

## Data model sketch

- **Org / User** — tenant, plan tier (solo/team/capture), seats, Slack workspace link, digest send time + timezone
- **CapabilityProfile** — org_id, NAICS codes[], natural-language capability description, embedding vector, active flag (tier-capped count)
- **Source** — kind (`sam` | `fpds` | `grants` | `ted` | `sled-bonfire` | `sled-bidnet` | `sled-periscope` | `sled-opengov` | `sled-planetbids`), adapter version, poll cadence, health status, last_success_at, consecutive_failures
- **Agency** — canonical id, level (federal/state/local), parent, dossier rollups (buying history, top NAICS, incumbent map), deep links
- **Opportunity** — source_id, external_id, agency_id, title, NAICS/PSC, type (presolicitation/RFP/RFQ/grant), status, response_deadline (UTC + source timezone), posted_at, canonical URL
- **DocumentVersion** — opportunity_id, content_hash (sha-256), fetched_at, blob storage key, extracted_text key, extraction tool + version. **Append-only; never overwritten.**
- **AmendmentDiff** — opportunity_id, from_version_id, to_version_id, structured hunks (JSON), materiality flags (deadline_changed, scope_changed, qa_added), LLM summary, summary_verified (citation gate passed)
- **AwardContract** — from FPDS/USASpending bulk: agency_id, incumbent name + UEI, NAICS, obligated value, period-of-performance end date → drives the expiration radar
- **MatchScore** — opportunity_id × profile_id, embedding similarity, cheap-model score + rationale, surfaced/suppressed decision, decided_at
- **TrackedItem / Alert / DigestDelivery** — what each org watches; every outbound alert with channel, sent_at, and its citations (doc + page anchor) recorded for auditability

## Key flows

### 1. Daily federal sweep (the backbone)

1. Inngest cron (per-source) downloads the SAM.gov daily extract (extracts are the backbone; Get Opportunities API fills intraday gaps at the 1,000 req/day system-account tier).
2. `packages/pipeline` normalizes records, upserts `Opportunity` rows, embeds new/changed titles+descriptions.
3. For each active `CapabilityProfile`: pgvector retrieval pulls top candidates, cheap model scores them with a one-paragraph rationale.
4. Digest assembler builds the morning email per org: new matches, deadline changes, amendment red-line summaries — every claim deep-linked, every quote string-verified.
5. Send at the org's configured local morning time; record `DigestDelivery` with citations.

### 2. Amendment red-line on a tracked solicitation (the trust feature)

1. Poller fetches the source-of-record document list for every `TrackedItem` (federal: daily; configurable per source).
2. Content hash compared to latest `DocumentVersion`. Identical → done. Different → store new immutable version (blob + hash).
3. PDF-to-text (Docling/Reducto-class extractor, version pinned per `DocumentVersion`), then **deterministic structural text diff** in `packages/core` produces hunks.
4. Deterministic classifiers flag materiality: deadline change (regex/date-parse on changed hunks), section scope changes, new Q&A.
5. Cheap model summarizes _only the changed hunks_. Citation verifier string-matches every quoted span against extracted text — failure blocks the summary, ships the raw red-line instead.
6. Deadline changes additionally fire an immediate Slack/email alert, not just the next digest.
7. If a poll fails, `Source.consecutive_failures` increments; after the threshold, the tracked item shows "monitoring degraded" in web + digest. **Silence is never reported as "no changes."**

### 3. Incumbent-expiration radar (the pre-RFP wedge)

1. Weekly Inngest job ingests FPDS/USASpending award archives into `AwardContract`.
2. Deterministic query: contracts with period-of-performance ending 6–12 months out, joined to agency + NAICS.
3. Embedding match against capability profiles; cheap model writes a one-line "why this matters to you."
4. Surfaced in the Team-tier digest section "Expiring incumbents" and on agency dossier pages, deep-linked to USASpending award records.

### 4. Credentialed SLED retrieval (the ToS-safe path)

1. Customer connects their own vendor-portal registration (Bonfire/BidNet/Periscope/OpenGov/PlanetBids) during onboarding; credentials encrypted at rest with a dedicated key.
2. Playwright adapter logs in **as that customer, only for that customer's tracked solicitations** — no shared-credential mass crawling behind login walls.
3. Retrieved documents enter the same version-store → diff → summarize path as federal docs.
4. Public portal metadata (titles, deadlines, open listings) is crawled without credentials where ToS permits.

### 5. Onboarding / seeded trial (the conversion mechanic)

1. Prospect enters NAICS codes + plain-language capability description; profile embedded immediately.
2. First digest is generated synchronously against the existing opportunity corpus — ideally showing a live opportunity (or recently missed amendment) in their lane on day one.
3. 14-day trial; loss-aversion framing ("here is what you would not have seen").

## Surfaces

Email digest is the primary surface — morning opportunity review is the BD ritual in this industry. Fixed section order so readers build muscle memory:

1. **Deadline & amendment changes on tracked bids** (the reason they trust us — always first, even when empty: "No changes on your 12 tracked bids. All 12 sources polled successfully." Coverage statements are part of the trust contract.)
2. **New matches** — top N per capability profile, each with the cheap-model one-line rationale and a deep link.
3. **Expiring incumbents** (Team+) — awards ending in 6–12 months in the org's NAICS lanes, linked to USASpending.
4. **Footer** — monitoring health summary per source.

Web app is the depth surface: pipeline board (Kanban: watching → bid/no-bid → preparing → submitted), agency dossiers, and the amendment red-line viewer. Slack is interrupt-only: deadline changes and material amendments on tracked bids — never digest noise.

## Product & visual design direction: Redline Ledger

Government-document editorial — the interface looks like the artifacts BD leads live in (solicitations, award ledgers, contract mods), elevated. **Palette:** warm paper white surface (`oklch(97% 0.01 90)`), ink navy text (`oklch(25% 0.05 260)`), redline crimson for deletions/changed clauses (`oklch(50% 0.19 25)`), additive green for insertions, amber strictly for deadline urgency — color is semantic, never decorative. **Typography:** Source Serif 4 for dossier headlines and digest prose, IBM Plex Sans for UI chrome, IBM Plex Mono for solicitation numbers, NAICS codes, dates, and diff hunks. Amendment diffs render as legal red-lines (crimson strikethrough / green underline inline in document flow), not developer unified diffs. Dense, ruled data tables on the pipeline board; generous editorial spacing on agency dossiers. Light mode is primary — this audience prints things.

## Milestones

### M0 — Bootstrap (make `just ci` green)

- pnpm workspace with `apps/web`, `packages/core`, `packages/pipeline`, `packages/db`; TypeScript strict everywhere; eslint + prettier + vitest + Playwright configured; docker-compose.yml with pgvector/pg16; initial Drizzle schema (Org, CapabilityProfile, Source, Opportunity, DocumentVersion) + first migration; root scripts (`dev`, `test`, `e2e`, `lint`, `format`, `typecheck`, `build`) wired so every just recipe resolves; one trivial passing vitest per package and one Playwright smoke test (home route renders).
- **Accept:** `just setup && just db-up && just migrate && just ci` all pass locally; GitHub Actions runs the bootstrapped path green (guard flips automatically); the justfile guard messages no longer trigger; `.claude` hooks (prettier/eslint/tsc) activate and pass on a sample edit.

### M1 — Thin vertical slice (federal amendment red-line, end to end)

- SAM.gov daily extract ingestion → Postgres; one capability profile; embeddings-first matching; morning email digest with deep links; tracking + stored-version diffing on federal solicitations; red-line viewer in `apps/web`.
- **Accept:** a user creates a capability profile, tracks a real SAM.gov solicitation, and when the agency posts an amendment the user receives an email within 24h containing a red-lined diff in which every quoted span string-verifies against extracted text. Diff engine has a golden-corpus vitest suite (real solicitation version pairs); e2e covers profile → track → diff view.

### M2 — Trust layer

- Citation gate enforced in the send path (unverifiable quote → block summary, ship raw red-line). Monitoring-health surfaces ("monitoring degraded" badges; digests state coverage status). Recall harness: replayed golden corpus of historical amendments must hit 100% detection (detection is deterministic — anything less is a bug). Incumbent-expiration radar from FPDS/USASpending with USASpending deep links. Immediate deadline-change alerts via Slack.
- **Accept:** recall harness green in CI; zero unverified quotes shippable by construction (unit-tested gate); degraded-source state visible in web + digest within one poll cycle of failure.

### M3 — Monetization wiring

- Stripe subscriptions for Solo $149 / Team $349 / Capture $699 (annual-anchored); feature gates: pre-RFP radar at Team+, capture briefs (Sonnet-class) + CRM export at Capture; seat add-ons; 14-day seeded trial flow; first credentialed SLED adapter (Bonfire) behind per-customer credentials.
- **Accept:** trial → paid conversion works end to end in Stripe test mode; tier gates enforced server-side; capture brief generation runs only for Capture orgs; SLED credential storage passes a security review (encrypted at rest, never logged, deletable on request).

## Operational notes (adapters break weekly — plan for it)

- **Adapter health is a product feature**, not just ops: `Source` health states feed customer-visible "monitoring degraded" badges (invariant 3). Every adapter failure path must end in a state update, never a swallowed exception.
- **Fixture discipline:** each adapter keeps recorded fixtures (extract samples, portal HTML/PDF snapshots) under `packages/pipeline/<adapter>/fixtures/`. When a portal changes its markup, the fix lands with a refreshed fixture in the same PR — CI is the early-warning system, customers are not.
- **Golden corpus grows monotonically:** every amendment processed in production that exposes a diff-engine edge case (rotated scans, re-issued full documents, renamed attachments) gets its version pair added to the corpus. The recall harness only ever gets stricter.
- **Extractor pinning:** PDF-to-text tool + version is recorded on every `DocumentVersion`; extractor upgrades trigger re-extraction as _new_ records and a corpus replay before rollout, so text drift can never masquerade as a document change.
- **Budget watch:** per-org daily counters for embedding and model calls; alert internally when an org exceeds the ~500 candidate-evals/day envelope — that is a triage bug, not a scaling event.

## Risks & mitigations (from the adversarial review)

1. **The wedge is contested, not empty** — HigherGov (acquired by Procurement Sciences, May 2026), SamSearch, Sweetspot, GovDash, GovSignals all sell AI matching to SMBs. _Mitigation:_ never compete on search; every surface leads with amendment red-lining and the expiration radar; Solo tier positioned against SamSearch on "we catch the change that disqualifies you," and the seeded trial demonstrates a concrete miss in week one.
2. **Near-100% recall requirement on amendments; one miss is reputational kill.** _Mitigation:_ detection is fully deterministic (hash + diff — recall failures are engineering bugs, not model variance); dual federal coverage (extract + API); golden-corpus recall harness in CI (M2); degraded-monitoring states so a broken poller is never mistaken for a quiet solicitation.
3. **SLED documents sit behind vendor-registration logins; credentialed mass-scraping violates portal ToS.** _Mitigation:_ per-customer delegated credentials fetching only that customer's tracked items (the vendor's own authorized access, automated); uncredentialed crawling restricted to public metadata; this constraint is a hard product invariant (AGENTS.md), and the shared-crawl cost model is only assumed for federal/grants/TED sources.
4. **Pre-RFP budget-doc/minutes mining is low-signal LLM burn across thousands of municipal PDFs.** _Mitigation:_ the pre-RFP headline ships from _structured_ FPDS/USASpending data (deterministic, near-zero marginal cost); Granicus/Legistar budget-doc mining is deferred past M3, scoped to customer-tracked agencies only, and embeddings-gated before any model call.
5. **Solo-tier churn (no-win SMBs cancel at 4–7%/mo) and a fixed-cost floor (~75 customers to break even on crawl fleet).** _Mitigation:_ annual-anchored pricing with Team as center of gravity; system-of-record stickiness (pipeline board, bid/no-bid records, agency dossiers accrue value); adapter fleet capped at the 5 platforms covering ~70% of SLED volume until revenue funds the long tail.
