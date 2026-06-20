# Tenderhook task runner — single source of truth for all commands.
# Agents and humans: use these recipes, never raw pnpm/docker invocations.

set shell := ["sh", "-c"]

# List available recipes
default:
    @just --list

# Guard: most recipes require the repo to be bootstrapped (M0 in DESIGN.md)
_guard:
    @if [ ! -f package.json ]; then \
        echo "ERROR: package.json not found — repo is a docs-only scaffold."; \
        echo "Bootstrap the pnpm workspace first (see DESIGN.md, milestone M0)."; \
        exit 1; \
    fi

# Guard: database recipes require the docker compose file
_guard-db:
    @if [ ! -f docker-compose.yml ]; then \
        echo "ERROR: docker-compose.yml not found — repo is a docs-only scaffold."; \
        echo "Bootstrap the workspace first (see DESIGN.md, milestone M0)."; \
        exit 1; \
    fi

# Enable corepack (best effort — pnpm may already be on PATH) and install all workspace dependencies
setup: _guard
    corepack enable 2>/dev/null || echo "corepack enable skipped (pnpm already available)"
    pnpm install

# Run the Next.js app (and Inngest dev server) in watch mode
dev: _guard
    pnpm dev

# Start local Postgres (pgvector/pgvector:pg16) in the background
db-up: _guard-db
    docker compose up -d postgres

# Stop local Postgres
db-down: _guard-db
    docker compose down

# Apply Drizzle migrations to the database at DATABASE_URL
migrate: _guard
    pnpm --filter @tenderhook/db migrate

# Run all unit tests (vitest) across the workspace
test: _guard
    pnpm test

# Run Playwright end-to-end tests against apps/web
e2e: _guard
    pnpm e2e

# Lint all packages (eslint)
lint: _guard
    pnpm lint

# Format the repo (prettier --write)
format: _guard
    pnpm format

# verify formatting (prettier --check); CI gate
format-check: _guard
    pnpm run format:check

# audit dependencies for high+ severity advisories; CI gate
audit: _guard
    pnpm audit --audit-level=high

# Type-check all packages (tsc --noEmit)
typecheck: _guard
    pnpm typecheck

# Production build of all packages and the web app
build: _guard
    pnpm build

# Full CI gate: lint, typecheck, test, build — must pass before any merge
ci: lint format-check typecheck test build audit
