import { sha256Hex } from './hash';

/**
 * Append-only document version store — PRODUCT INVARIANT 7.
 * Versions are immutable (frozen) and never overwritten; re-extraction
 * creates a new record with its extractor pinned. The in-memory
 * implementation backs M1 (fixtures only); a Postgres/S3 implementation
 * lands behind the same interface later.
 */

export interface DocumentVersionRecord {
  readonly versionId: string;
  readonly opportunityId: string;
  readonly contentHash: string;
  readonly extractedText: string;
  readonly fetchedAt: string;
  readonly extractorTool: string;
  readonly extractorVersion: string;
}

export interface AppendVersionInput {
  readonly opportunityId: string;
  readonly extractedText: string;
  readonly fetchedAt: string;
  readonly extractorTool: string;
  readonly extractorVersion: string;
}

export interface VersionStore {
  append(input: AppendVersionInput): DocumentVersionRecord;
  latest(opportunityId: string): DocumentVersionRecord | undefined;
  versions(opportunityId: string): readonly DocumentVersionRecord[];
  get(versionId: string): DocumentVersionRecord | undefined;
}

export class InMemoryVersionStore implements VersionStore {
  private readonly byOpportunity = new Map<string, readonly DocumentVersionRecord[]>();
  private readonly byVersionId = new Map<string, DocumentVersionRecord>();

  append(input: AppendVersionInput): DocumentVersionRecord {
    const existing = this.byOpportunity.get(input.opportunityId) ?? [];
    const record: DocumentVersionRecord = Object.freeze({
      versionId: `${input.opportunityId}@v${existing.length + 1}`,
      opportunityId: input.opportunityId,
      contentHash: sha256Hex(input.extractedText),
      extractedText: input.extractedText,
      fetchedAt: input.fetchedAt,
      extractorTool: input.extractorTool,
      extractorVersion: input.extractorVersion,
    });
    this.byOpportunity.set(input.opportunityId, [...existing, record]);
    this.byVersionId.set(record.versionId, record);
    return record;
  }

  latest(opportunityId: string): DocumentVersionRecord | undefined {
    const list = this.byOpportunity.get(opportunityId);
    return list === undefined ? undefined : list[list.length - 1];
  }

  versions(opportunityId: string): readonly DocumentVersionRecord[] {
    return this.byOpportunity.get(opportunityId) ?? [];
  }

  get(versionId: string): DocumentVersionRecord | undefined {
    return this.byVersionId.get(versionId);
  }
}
