-- 0000_init: M0 schema — Org, CapabilityProfile, Source, Opportunity, DocumentVersion.
-- Applied by `just migrate` (packages/db/scripts/migrate.mjs) against DATABASE_URL.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "orgs" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "plan_tier" text NOT NULL DEFAULT 'solo',
  "digest_send_time" text NOT NULL DEFAULT '07:00',
  "timezone" text NOT NULL DEFAULT 'America/New_York',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "capability_profiles" (
  "id" text PRIMARY KEY,
  "org_id" text NOT NULL REFERENCES "orgs"("id"),
  "name" text NOT NULL,
  "naics_codes" jsonb NOT NULL,
  "description" text NOT NULL,
  "embedding" vector(128),
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "sources" (
  "id" text PRIMARY KEY,
  "kind" text NOT NULL,
  "label" text NOT NULL,
  "adapter_version" text NOT NULL,
  "poll_cadence" text NOT NULL DEFAULT 'daily',
  "status" text NOT NULL DEFAULT 'healthy',
  "last_success_at" timestamptz,
  "consecutive_failures" integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "opportunities" (
  "id" text PRIMARY KEY,
  "source_id" text NOT NULL REFERENCES "sources"("id"),
  "external_id" text NOT NULL,
  "solicitation_number" text NOT NULL,
  "title" text NOT NULL,
  "agency_path" text NOT NULL,
  "naics_code" text NOT NULL,
  "type" text NOT NULL,
  "posted_at" text NOT NULL,
  "response_deadline" text,
  "url" text NOT NULL,
  "description" text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "opportunities_source_external_idx"
  ON "opportunities" ("source_id", "external_id");

-- Append-only (PRODUCT INVARIANT 7): never UPDATE or DELETE rows here.
CREATE TABLE IF NOT EXISTS "document_versions" (
  "id" text PRIMARY KEY,
  "opportunity_id" text NOT NULL REFERENCES "opportunities"("id"),
  "content_hash" text NOT NULL,
  "blob_key" text NOT NULL,
  "extracted_text_key" text NOT NULL,
  "extractor_tool" text NOT NULL,
  "extractor_version" text NOT NULL,
  "fetched_at" timestamptz NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "document_versions_opp_hash_extractor_idx"
  ON "document_versions" ("opportunity_id", "content_hash", "extractor_tool", "extractor_version");
