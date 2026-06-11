import type { PlanTier } from '../types';

/**
 * Model router — PRODUCT INVARIANT 8 (cost gates) as code:
 * - change detection is always deterministic,
 * - no frontier-class calls in the daily batch path,
 * - Sonnet-class usage only for Capture-tier briefs/dossiers.
 */

export type ModelClass = 'deterministic' | 'embedding' | 'cheap' | 'frontier';

export type PipelinePath = 'daily-batch' | 'on-demand';

export type RoutedTask =
  | 'change-detection'
  | 'candidate-retrieval'
  | 'match-scoring'
  | 'hunk-summary'
  | 'digest-copy'
  | 'capture-brief'
  | 'agency-dossier-synthesis';

export interface RouteContext {
  readonly tier: PlanTier;
  readonly path: PipelinePath;
}

export class ModelRoutingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModelRoutingError';
  }
}

export function routeModel(task: RoutedTask, context: RouteContext): ModelClass {
  switch (task) {
    case 'change-detection':
      return 'deterministic';
    case 'candidate-retrieval':
      return 'embedding';
    case 'match-scoring':
    case 'hunk-summary':
    case 'digest-copy':
      return 'cheap';
    case 'capture-brief':
    case 'agency-dossier-synthesis':
      return routeFrontier(task, context);
  }
}

function routeFrontier(task: RoutedTask, context: RouteContext): ModelClass {
  if (context.path === 'daily-batch') {
    throw new ModelRoutingError(
      `${task} is frontier-class and forbidden in the daily batch path (invariant 8).`,
    );
  }
  if (context.tier !== 'capture') {
    throw new ModelRoutingError(`${task} requires the capture tier (invariant 8).`);
  }
  return 'frontier';
}
