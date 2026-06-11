import type { CapabilityProfile, SourceHealth } from '@tenderhook/core';
import {
  SAM_EXTRACT_2026_06_09,
  VA_36C10B_26_Q_0188_V1,
  W912DY_26_R_0014_V1,
  W912DY_26_R_0014_V2,
} from './adapters/sam/fixtures/index';
import { TEMPE_RFP_26_114_V1 } from './adapters/bonfire/fixtures/tempe-rfp-26-114.v1';
import { DeterministicEmbedder } from './triage/embedder';
import { MockMatchScorer } from './triage/scorer';
import { createSummarizer } from './synthesis/summarizer';
import { InMemoryVersionStore } from './version-store/store';
import { runDailySlice, type SliceResult, type TrackedSolicitation } from './run';

/**
 * The canonical fixture-backed demo run of the M1 slice, shared by the web
 * dossier view and the test suite. Fixed clock — fully deterministic.
 */

export const DEMO_NOW = '2026-06-10T11:00:00.000Z';

export const DEMO_PROFILE: CapabilityProfile = {
  id: 'profile-meridianstack-cloud',
  orgId: 'org-meridianstack',
  name: 'Cloud migration & IT modernization',
  naicsCodes: ['541511', '541512', '541519'],
  description:
    'Cloud migration and legacy application modernization for federal and state agencies: ' +
    'application portfolio assessment, re-platforming to AWS GovCloud and Azure Government, ' +
    'zero trust network engineering, identity management, and post-migration operations ' +
    'under IT modernization programs.',
};

export const DEMO_ORG_NAME = 'MeridianStack Federal LLC';

const DEMO_SOURCES: readonly SourceHealth[] = [
  {
    sourceId: 'sam-extract',
    kind: 'sam',
    label: 'SAM.gov daily extract',
    consecutiveFailures: 0,
    lastSuccessAt: null,
    status: 'healthy',
  },
  {
    sourceId: 'sam-poller',
    kind: 'sam',
    label: 'SAM.gov tracked-notice poller',
    consecutiveFailures: 0,
    lastSuccessAt: null,
    status: 'healthy',
  },
  {
    sourceId: 'bonfire-tempe',
    kind: 'sled-bonfire',
    label: 'Bonfire — City of Tempe, AZ',
    consecutiveFailures: 0,
    lastSuccessAt: null,
    status: 'healthy',
  },
];

const DEMO_TRACKED: readonly TrackedSolicitation[] = [
  {
    opportunityId: 'sam:1f64e7a2c8b94d0e9a317c5d2f80a416',
    solicitationNumber: 'W912DY-26-R-0014',
    title: 'Enterprise IT Modernization and Cloud Migration Services',
    url: 'https://sam.gov/opp/1f64e7a2c8b94d0e9a317c5d2f80a416/view',
    sourceId: 'sam-poller',
    fetches: [
      { ok: true, text: W912DY_26_R_0014_V1 },
      { ok: true, text: W912DY_26_R_0014_V2 },
    ],
  },
  {
    opportunityId: 'sam:8c2b51d97e3f4a6c8d20b94f1e57c302',
    solicitationNumber: '36C10B-26-Q-0188',
    title: 'Legacy Application Re-Platforming and Cloud Hosting Support',
    url: 'https://sam.gov/opp/8c2b51d97e3f4a6c8d20b94f1e57c302/view',
    sourceId: 'sam-poller',
    fetches: [{ ok: true, text: VA_36C10B_26_Q_0188_V1 }],
  },
  {
    opportunityId: 'bonfire:tempe-rfp-26-114',
    solicitationNumber: 'RFP 26-114',
    title: 'Citywide ERP Modernization and Cloud Migration Assessment',
    url: 'https://gobonfire.com/portal/tempe/opportunities/26-114',
    sourceId: 'bonfire-tempe',
    fetches: [
      { ok: true, text: TEMPE_RFP_26_114_V1 },
      { ok: false, error: 'HTTP 503 from portal listing' },
      { ok: false, error: 'HTTP 503 from portal listing' },
      { ok: false, error: 'timeout after 30s' },
    ],
  },
];

export function runDemoSlice(): Promise<SliceResult> {
  return runDailySlice(
    {
      extract: SAM_EXTRACT_2026_06_09,
      orgName: DEMO_ORG_NAME,
      profile: DEMO_PROFILE,
      tracked: DEMO_TRACKED,
      sources: DEMO_SOURCES,
      retrievalTopK: 3,
    },
    {
      embedder: new DeterministicEmbedder(),
      scorer: new MockMatchScorer(),
      summarizer: createSummarizer({}).summarizer,
      store: new InMemoryVersionStore(),
      now: () => DEMO_NOW,
    },
  );
}
