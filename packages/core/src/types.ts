/**
 * Shared entity types — pure data shapes, no I/O.
 * Mirrors the data model sketch in DESIGN.md.
 */

export type SourceKind =
  | 'sam'
  | 'fpds'
  | 'grants'
  | 'ted'
  | 'sled-bonfire'
  | 'sled-bidnet'
  | 'sled-periscope'
  | 'sled-opengov'
  | 'sled-planetbids';

export type OpportunityType =
  | 'presolicitation'
  | 'solicitation'
  | 'combined'
  | 'sources-sought'
  | 'grant'
  | 'other';

export interface Opportunity {
  readonly id: string;
  readonly sourceKind: SourceKind;
  readonly externalId: string;
  readonly solicitationNumber: string;
  readonly title: string;
  readonly agencyPath: string;
  readonly naicsCode: string;
  readonly type: OpportunityType;
  readonly postedAt: string;
  readonly responseDeadline: string | null;
  readonly url: string;
  readonly description: string;
}

export type PlanTier = 'solo' | 'team' | 'capture';

export interface CapabilityProfile {
  readonly id: string;
  readonly orgId: string;
  readonly name: string;
  readonly naicsCodes: readonly string[];
  readonly description: string;
}

export type SourceStatus = 'healthy' | 'degraded';

export interface SourceHealth {
  readonly sourceId: string;
  readonly kind: SourceKind;
  readonly label: string;
  readonly consecutiveFailures: number;
  readonly lastSuccessAt: string | null;
  readonly status: SourceStatus;
}
