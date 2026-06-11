# TOOLS.md — Commands, APIs, Env Vars, CI

## just recipes

| Recipe           | What it does                                                        | When to run                                           |
| ---------------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| `just`           | Lists all recipes                                                   | Orientation                                           |
| `just setup`     | `corepack enable` + `pnpm install` across the workspace             | Fresh clone, after lockfile changes                   |
| `just dev`       | Next.js app + Inngest dev server in watch mode                      | Daily development                                     |
| `just db-up`     | Starts local Postgres (`pgvector/pgvector:pg16`) via docker compose | Before `migrate`, `dev`, or `test` that touch the DB  |
| `just db-down`   | Stops the local Postgres container                                  | Done for the day                                      |
| `just migrate`   | Applies Drizzle migrations to `DATABASE_URL`                        | After schema changes, after `db-up` on a fresh volume |
| `just test`      | Vitest unit tests, all packages                                     | Constantly (TDD); always before commit                |
| `just e2e`       | Playwright e2e against `apps/web`                                   | Before merging UI or flow changes                     |
| `just lint`      | ESLint across the workspace                                         | Before commit                                         |
| `just format`    | Prettier write across the repo                                      | After bulk edits (also auto-runs via hook)            |
| `just typecheck` | `tsc --noEmit` in all packages                                      | Before commit                                         |
| `just build`     | Production build of all packages + web app                          | Verifying deployability                               |
| `just ci`        | lint + typecheck + test + build                                     | The merge gate; must be green                         |

Until M0 (bootstrap) lands, recipes exit 1 with a "not bootstrapped" message — that is expected.

## External data sources & APIs

| Source                                                                    | What we use                                                                                       | Auth env var                                                             | Limits / cost                                                                                   | Link                                                           |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| SAM.gov daily extracts                                                    | Backbone of federal opportunity ingestion (bulk CSV/JSON)                                         | `SAM_GOV_API_KEY` (download auth)                                        | Free; one extract/day                                                                           | https://sam.gov/data-services                                  |
| SAM.gov Get Opportunities API                                             | Intraday gap-fill, per-notice detail                                                              | `SAM_GOV_API_KEY`                                                        | 1,000 req/day with non-federal **system account**; only 10/day without — request the role early | https://open.gsa.gov/api/get-opportunities-public-api/         |
| FPDS-NG / USASpending bulk                                                | Award history + incumbent-expiration graph                                                        | none                                                                     | Free; large archives — ingest weekly, incrementally                                             | https://www.usaspending.gov/download_center/award_data_archive |
| grants.gov XML extract                                                    | Grant opportunities for nonprofit segment                                                         | none                                                                     | Free daily XML                                                                                  | https://www.grants.gov/xml-extract                             |
| EU TED API                                                                | EU tender notices                                                                                 | `TED_API_KEY`                                                            | Free; rate limits per API docs                                                                  | https://docs.ted.europa.eu/api/                                |
| Granicus / Legistar API                                                   | Council minutes & agendas (pre-RFP mining, deferred past M3)                                      | none (public endpoints)                                                  | Free; be polite (per-host throttle)                                                             | https://webapi.legistar.com                                    |
| SLED portals (Bonfire, BidNet Direct, Periscope S2G, OpenGov, PlanetBids) | Solicitation docs via Playwright adapters                                                         | Per-customer portal credentials stored **encrypted in DB**, never in env | Behind vendor logins — per-customer authorized fetch ONLY (see AGENTS.md invariant 5)           | platform-specific                                              |
| Voyage AI or OpenAI embeddings                                            | Candidate retrieval (profile ↔ opportunity)                                                       | `VOYAGE_API_KEY` or `OPENAI_API_KEY`                                     | ~200–500 candidate evals/day/user budget                                                        | https://docs.voyageai.com                                      |
| Anthropic API                                                             | Haiku-class: match rationale, hunk summaries, digest copy. Sonnet-class: Capture-tier briefs only | `ANTHROPIC_API_KEY`                                                      | Cost gate: no frontier calls in daily batch (invariant 8)                                       | https://docs.anthropic.com                                     |
| Resend (email)                                                            | Morning digest + deadline alerts                                                                  | `RESEND_API_KEY`                                                         | Per-plan sending limits                                                                         | https://resend.com/docs                                        |
| Slack API                                                                 | Deadline-change alerts to customer workspaces                                                     | `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`                                 | OAuth per workspace                                                                             | https://api.slack.com                                          |
| Stripe (M3)                                                               | Subscriptions, tier gating                                                                        | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`                             | n/a                                                                                             | https://docs.stripe.com                                        |
| Inngest                                                                   | Cron + step-function orchestration                                                                | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`                               | Free dev server locally                                                                         | https://www.inngest.com/docs                                   |

## Required env vars

| Var                                                                    | Purpose                                               |
| ---------------------------------------------------------------------- | ----------------------------------------------------- |
| `DATABASE_URL`                                                         | Postgres connection (local compose or hosted)         |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Content-hashed document blob store (S3/R2)            |
| `CREDENTIALS_ENCRYPTION_KEY`                                           | Envelope key for per-customer SLED portal credentials |
| `SAM_GOV_API_KEY`                                                      | SAM.gov API + extract access                          |
| `TED_API_KEY`                                                          | EU TED API                                            |
| `VOYAGE_API_KEY` _or_ `OPENAI_API_KEY`                                 | Embeddings                                            |
| `ANTHROPIC_API_KEY`                                                    | Match scoring, summaries, capture briefs              |
| `RESEND_API_KEY`                                                       | Digest + alert email                                  |
| `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`                               | Slack alert integration                               |
| `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`                             | Scheduling (production)                               |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`                           | Billing (M3)                                          |

Values live in `.env` (gitignored). Validate presence at startup; fail fast with a named-var error.

## Local services

- **Postgres 16 + pgvector** — `docker compose up -d postgres` via `just db-up`; image `pgvector/pgvector:pg16`. Used for all relational data and embedding similarity queries.
- **Inngest dev server** — bundled into `just dev`; replays and inspects scheduled functions locally, no cloud account needed.
- Blob store in local dev: MinIO container or a local-disk driver (decide at M0; keep behind the storage interface in `packages/pipeline`).

## CI overview (.github/workflows/ci.yml)

- Triggers on every `push` and `pull_request`; single `ci` job on `ubuntu-latest`.
- Steps: checkout → `extractions/setup-just@v3` → Node 22 + `corepack enable` → **bootstrap guard** → (if bootstrapped) `pnpm install --frozen-lockfile` → `just ci`.
- **Bootstrap guard:** if `package.json` is absent, the job emits a notice and skips install/build/test — the docs-only scaffold stays green. Once M0 lands, the full gate runs automatically.
- A `pgvector/pgvector:pg16` service container is provisioned with `DATABASE_URL` pre-wired (`postgres://tenderhook:tenderhook@localhost:5432/tenderhook_test`) for DB-backed tests; it is only exercised once the repo is bootstrapped.

## AI harness notes

Hooks active in `.claude/settings.json` (all no-ops until `package.json` exists):

- **PostToolUse (Write|Edit):** Prettier auto-formats edited `.ts/.tsx/.js/.jsx/.json/.css/.md` files; ESLint `--fix` runs on edited `.ts/.tsx`.
- **Stop:** `tsc --noEmit` runs at session end and surfaces the last 20 lines — fix type errors before finishing, don't leave them for the next session.
- **Permissions:** `just`, `pnpm`, `node`, `npx vitest`, `npx playwright`, `docker compose`, and read-only git commands are pre-allowed.

Most useful subagents for this repo:

- **tdd-guide** — before any new feature; the diff engine, citation verifier, and adapters are test-first by policy (AGENTS.md).
- **code-reviewer** — immediately after writing or modifying code; check the PRODUCT INVARIANTS list explicitly.
- **security-reviewer** — mandatory for anything touching portal credentials, tenant isolation, Stripe webhooks, or the credentialed Playwright adapters.
- **planner** — for multi-package work (e.g., a new ingestion adapter spans pipeline + db + core types + fixtures).
- **build-error-resolver** — when `just ci` breaks after dependency or config changes.
