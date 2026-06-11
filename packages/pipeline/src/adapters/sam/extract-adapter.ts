import { z } from 'zod';
import type { Opportunity, OpportunityType } from '@tenderhook/core';

/**
 * SAM.gov daily-extract adapter. Government feeds are messy: every record
 * is validated at the boundary, invalid records are collected as explicit
 * errors (never swallowed), and valid records still flow through.
 */

const samRecordSchema = z.object({
  noticeId: z.string().min(1),
  title: z.string().min(1),
  solicitationNumber: z.string().min(1),
  fullParentPathName: z.string().min(1),
  postedDate: z.string().min(1),
  type: z.string().min(1),
  baseType: z.string().optional(),
  naicsCode: z.string().min(1),
  classificationCode: z.string().optional(),
  active: z.string().optional(),
  responseDeadLine: z.string().nullable(),
  uiLink: z.string().startsWith('https://'),
  description: z.string().min(1),
});

const samExtractSchema = z.object({
  extractDate: z.string().min(1),
  source: z.string().min(1),
  opportunities: z.array(z.unknown()),
});

export type SamRecord = z.infer<typeof samRecordSchema>;

export interface IngestError {
  readonly index: number;
  readonly message: string;
}

export interface SamIngestResult {
  readonly extractDate: string;
  readonly opportunities: readonly Opportunity[];
  readonly errors: readonly IngestError[];
}

export class SamExtractParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SamExtractParseError';
  }
}

export function parseSamExtract(raw: unknown): SamIngestResult {
  const envelope = samExtractSchema.safeParse(raw);
  if (!envelope.success) {
    throw new SamExtractParseError(`Malformed SAM extract envelope: ${issueText(envelope.error)}`);
  }

  const opportunities: Opportunity[] = [];
  const errors: IngestError[] = [];
  envelope.data.opportunities.forEach((record, index) => {
    const parsed = samRecordSchema.safeParse(record);
    if (parsed.success) {
      opportunities.push(toOpportunity(parsed.data));
    } else {
      errors.push({ index, message: issueText(parsed.error) });
    }
  });

  return { extractDate: envelope.data.extractDate, opportunities, errors };
}

function toOpportunity(record: SamRecord): Opportunity {
  return {
    id: `sam:${record.noticeId}`,
    sourceKind: 'sam',
    externalId: record.noticeId,
    solicitationNumber: record.solicitationNumber,
    title: record.title,
    agencyPath: record.fullParentPathName,
    naicsCode: record.naicsCode,
    type: mapNoticeType(record.type),
    postedAt: record.postedDate,
    responseDeadline: record.responseDeadLine,
    url: record.uiLink,
    description: record.description,
  };
}

function mapNoticeType(samType: string): OpportunityType {
  const normalized = samType.trim().toLowerCase();
  if (normalized === 'presolicitation') return 'presolicitation';
  if (normalized === 'solicitation') return 'solicitation';
  if (normalized === 'combined synopsis/solicitation') return 'combined';
  if (normalized === 'sources sought') return 'sources-sought';
  if (normalized === 'grant') return 'grant';
  return 'other';
}

function issueText(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
}
