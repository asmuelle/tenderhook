import { describe, expect, it } from 'vitest';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { capabilityProfiles, documentVersions, opportunities, orgs, sources } from './schema';

describe('drizzle schema (no database required)', () => {
  it('defines the five M0 tables with their expected names', () => {
    expect(getTableName(orgs)).toBe('orgs');
    expect(getTableName(capabilityProfiles)).toBe('capability_profiles');
    expect(getTableName(sources)).toBe('sources');
    expect(getTableName(opportunities)).toBe('opportunities');
    expect(getTableName(documentVersions)).toBe('document_versions');
  });

  it('pins the extractor on every document version (invariant 7)', () => {
    const columns = getTableColumns(documentVersions);
    expect(columns.contentHash.notNull).toBe(true);
    expect(columns.extractorTool.notNull).toBe(true);
    expect(columns.extractorVersion.notNull).toBe(true);
  });

  it('tracks source health fields needed for degraded-monitoring surfaces (invariant 3)', () => {
    const columns = getTableColumns(sources);
    expect(columns.status.notNull).toBe(true);
    expect(columns.consecutiveFailures.notNull).toBe(true);
    expect(columns.lastSuccessAt.notNull).toBe(false);
  });
});
