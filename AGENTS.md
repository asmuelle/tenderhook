# AGENTS.md — Operating Manual for AI Agents

## Project snapshot

**Tenderhook** is a procurement radar for SMB government contractors: a daily pipeline over SAM.gov, FPDS/USASpending, grants.gov, EU TED, and SLED portals that maintains living dossiers per agency and opportunity — red-lining every amendment against the stored prior version and flagging incumbent contracts expiring 6–12 months out. **Payers:** BD leads at 5–200-employee contractors ($149/$349/$699 per month, annual-anchored). **Status:** Tier 1 research candidate (ranked #2 of 12; survived platform-risk review). Currently a docs-only scaffold — no application code yet; M0 in DESIGN.md is the bootstrap.

**The differentiators are amendment diffs and the pre-RFP incumbent-expiration radar — NOT opportunity search.** Search is a crowded market (SamSearch, Sweetspot, GovDash, HigherGov). Do not build or polish search surfaces unless explicitly asked.

## Read first

1. `README.md` — research dossier: market evidence, comparables, adversarial review, unit economics. Treat as ground truth for product claims.
2. `DESIGN.md` — architecture, data model, key flows, milestones (M0–M3), risks. Treat as ground truth for technical direction.
3. `TOOLS.md` — every command, external API, env var, and CI behavior.

## Commands (single source of truth)

Always use `just` recipes — never raw `pnpm`/`docker` invocations. Until M0 lands, most recipes intentionally fail with a bootstrap message.

| Recipe                        | Purpose                                                             |
| ----------------------------- | ------------------------------------------------------------------- |
| `just`                        | List recipes                                                        |
| `just setup`                  | corepack enable + pnpm install                                      |
| `just dev`                    | Run Next.js app + Inngest dev server                                |
| `just db-up` / `just db-down` | Start/stop local Postgres (pgvector:pg16)                           |
| `just migrate`                | Apply Drizzle migrations                                            |
| `just test`                   | Vitest unit tests, all packages                                     |
| `just e2e`                    | Playwright e2e against apps/web                                     |
| `just lint` / `just format`   | ESLint / Prettier                                                   |
| `just typecheck`              | tsc --noEmit, all packages                                          |
| `just build`                  | Production build                                                    |
| `just ci`                     | lint + typecheck + test + build — must pass before any commit lands |

## Working in this repo today (pre-M0)

- The repo is documentation plus harness: README.md, DESIGN.md, TOOLS.md, justfile, CI, `.claude/settings.json`. There is no `package.json` yet.
- The first code task is **M0 in DESIGN.md** — bootstrap the pnpm workspace so `just ci` goes green. Do not start M1 features before M0 acceptance criteria pass.
- CI is green by design while docs-only (bootstrap guard in `.github/workflows/ci.yml`). Do not "fix" the guard; it removes itself functionally the moment `package.json` exists.
- The format/lint/typecheck hooks in `.claude/settings.json` are no-ops until bootstrap; afterwards they run automatically on edits.

## Architecture summary

A pnpm monorepo where data flows **source → version store → deterministic diff → triage → synthesis → surface**: ingestion adapters in `packages/pipeline` (Inngest cron/step functions) pull federal extracts and SLED portal documents into an append-only, content-hashed version store; a pure-TS diff engine in `packages/core` detects and red-lines changes deterministically; embeddings-first triage plus cheap-model scoring matches opportunities to capability profiles; LLM synthesis (summaries, capture briefs) runs last and only on already-changed hunks; `apps/web` (Next.js 15) and email/Slack render the results.

| Module              | Owns                                                                             |
| ------------------- | -------------------------------------------------------------------------------- |
| `apps/web`          | Pipeline board, agency dossiers, red-line viewer, settings                       |
| `packages/core`     | Pure domain logic: diff engine, citation verifier, deadline math, types. No I/O. |
| `packages/pipeline` | Inngest workers: ingestion adapters, fetch+hash, extraction, triage, digests     |
| `packages/db`       | Drizzle schema, migrations, repositories, pgvector queries                       |

## Coding standards

- TypeScript strict mode everywhere; no `any` without a written justification comment.
- Files < 800 lines, functions < 50 lines; organize by feature/domain, not file type.
- Immutability by default — return new objects, never mutate inputs.
- Explicit error handling at every boundary (adapter fetch, extraction, DB, model calls); never swallow errors. Pipeline failures must update `Source` health state.
- Validate all external data at the boundary (zod or equivalent): government feeds are messy; never trust extract fields, API responses, or scraped HTML.
- No hardcoded secrets — env vars only (see TOOLS.md table). Never log credentials or document contents containing them.
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.

Package boundaries (enforce in review):

- `packages/core` does **no I/O** — no fetch, no DB, no fs, no env reads. If a function needs the network or database, it belongs in `pipeline` or `db` and calls core logic with plain data.
- `packages/db` is the only package that issues SQL/Drizzle queries; other packages go through its repositories.
- `packages/pipeline` is the only package that touches external networks (government feeds, model APIs, Playwright). Each adapter implements the shared adapter interface and ships with recorded fixtures.
- `apps/web` renders and orchestrates; business decisions (materiality, matching, verification) live in `core`, not in route handlers or components.

## Testing policy

- **TDD:** write the failing test first, then implement, then refactor. 80%+ coverage target.
- AAA pattern (Arrange–Act–Assert), descriptive behavior-named tests.
- What matters most **for this product**, in order:
  1. **Diff-engine golden corpus** — real solicitation version pairs as fixtures; detection and hunk extraction must be exact. This is the trust feature; treat regressions as release blockers.
  2. **Citation verifier** — property-style tests that no unverified quote can pass the gate.
  3. **Adapter contract tests** — each ingestion adapter against recorded fixtures (extract files, portal HTML snapshots), so weekly portal breakage is caught by CI, not customers.
  4. **Deadline math** — timezone, parsing, and change-classification edge cases.
  5. **E2E** — profile → track → amendment → red-line view; digest assembly.

## PRODUCT INVARIANTS (non-negotiable; enforce in review and tests)

1. **Deterministic-before-LLM:** whether a document changed is decided ONLY by content hash + structural text diff. LLMs summarize already-detected hunks; an LLM output must never create, suppress, or reclassify a change event. Testable: diff pipeline produces identical change sets with model calls stubbed out.
2. **No unverifiable quotes ship:** every quoted span in any digest, alert, or summary must string-verify against the stored extracted text before send; verification failure blocks the summary and ships the raw red-line instead. Testable: send-path unit test with a corrupted quote must block.
3. **Silence is never "no changes":** if a source poll fails, the tracked item must surface "monitoring degraded" after the failure threshold. A digest may never imply coverage that didn't happen. Testable: failed-poll simulation must flip health state and annotate the digest.
4. **Every claim deep-links:** each digest/alert item carries a citation to the source document (URL + page anchor where available). No citation, no ship.
5. **Credentialed access is per-customer only:** SLED documents behind vendor-registration logins are fetched ONLY with that customer's own authorized credentials, ONLY for that customer's tracked items. No shared-credential crawling behind login walls — this is a ToS/legal line, not a preference. Uncredentialed crawling is limited to public pages.
6. **Credentials and tenant data are sacrosanct:** portal credentials encrypted at rest, never logged, never sent to any LLM, deletable on request; one org's tracked items, profiles, and dossier annotations are never visible to another.
7. **Version store is append-only:** fetched document versions are immutable; diffs are computed only between stored versions; re-extraction creates a new record (extractor version pinned), never an overwrite.
8. **Cost gates hold:** no frontier-model calls in the daily batch path; no LLM call upstream of the embedding filter; Sonnet-class usage only for Capture-tier briefs/dossiers. Testable: model-router unit tests per tier.
9. **Deadline changes alert immediately** (Slack/email), independent of the next digest cycle.

## Definition of done

- [ ] `just ci` passes (lint + typecheck + test + build)
- [ ] New behavior has tests written first; coverage ≥ 80% on touched packages
- [ ] No product invariant violated (check the list above explicitly)
- [ ] External data validated at the boundary; errors handled, not swallowed
- [ ] No secrets in code or logs; new env vars documented in TOOLS.md
- [ ] Conventional commit message; docs (DESIGN.md/TOOLS.md) updated if architecture or tool surface changed
- [ ] For pipeline changes: adapter fixtures updated and golden-corpus suite still green
