import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  vector,
} from 'drizzle-orm/pg-core';

/**
 * Initial Drizzle schema (M0): Org, CapabilityProfile, Source, Opportunity,
 * DocumentVersion — mirroring the data model sketch in DESIGN.md.
 * The first migration lives in drizzle/0000_init.sql; `just migrate`
 * applies it to DATABASE_URL. Nothing in the test suite touches Postgres.
 */

export const orgs = pgTable('orgs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  planTier: text('plan_tier', { enum: ['solo', 'team', 'capture'] })
    .notNull()
    .default('solo'),
  digestSendTime: text('digest_send_time').notNull().default('07:00'),
  timezone: text('timezone').notNull().default('America/New_York'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const capabilityProfiles = pgTable('capability_profiles', {
  id: text('id').primaryKey(),
  orgId: text('org_id')
    .notNull()
    .references(() => orgs.id),
  name: text('name').notNull(),
  naicsCodes: jsonb('naics_codes').$type<readonly string[]>().notNull(),
  description: text('description').notNull(),
  embedding: vector('embedding', { dimensions: 128 }),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sources = pgTable('sources', {
  id: text('id').primaryKey(),
  kind: text('kind', {
    enum: [
      'sam',
      'fpds',
      'grants',
      'ted',
      'sled-bonfire',
      'sled-bidnet',
      'sled-periscope',
      'sled-opengov',
      'sled-planetbids',
    ],
  }).notNull(),
  label: text('label').notNull(),
  adapterVersion: text('adapter_version').notNull(),
  pollCadence: text('poll_cadence').notNull().default('daily'),
  status: text('status', { enum: ['healthy', 'degraded'] })
    .notNull()
    .default('healthy'),
  lastSuccessAt: timestamp('last_success_at', { withTimezone: true }),
  consecutiveFailures: integer('consecutive_failures').notNull().default(0),
});

export const opportunities = pgTable(
  'opportunities',
  {
    id: text('id').primaryKey(),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    externalId: text('external_id').notNull(),
    solicitationNumber: text('solicitation_number').notNull(),
    title: text('title').notNull(),
    agencyPath: text('agency_path').notNull(),
    naicsCode: text('naics_code').notNull(),
    type: text('type', {
      enum: ['presolicitation', 'solicitation', 'combined', 'sources-sought', 'grant', 'other'],
    }).notNull(),
    postedAt: text('posted_at').notNull(),
    responseDeadline: text('response_deadline'),
    url: text('url').notNull(),
    description: text('description').notNull(),
  },
  (table) => [
    uniqueIndex('opportunities_source_external_idx').on(table.sourceId, table.externalId),
  ],
);

/** Append-only (PRODUCT INVARIANT 7): rows are never updated or deleted. */
export const documentVersions = pgTable(
  'document_versions',
  {
    id: text('id').primaryKey(),
    opportunityId: text('opportunity_id')
      .notNull()
      .references(() => opportunities.id),
    contentHash: text('content_hash').notNull(),
    blobKey: text('blob_key').notNull(),
    extractedTextKey: text('extracted_text_key').notNull(),
    extractorTool: text('extractor_tool').notNull(),
    extractorVersion: text('extractor_version').notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('document_versions_opp_hash_extractor_idx').on(
      table.opportunityId,
      table.contentHash,
      table.extractorTool,
      table.extractorVersion,
    ),
  ],
);
