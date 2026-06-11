import type { Embedder } from '@tenderhook/core';

/**
 * Deterministic hash-based embedder (token hashing + L2 norm). Stands in
 * for voyage-3 / text-embedding-3-large behind the same Embedder contract,
 * so M1 builds and tests with zero AI API calls and zero egress.
 */

const DIMENSIONS = 128;

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'under',
  'including',
  'into',
  'from',
  'that',
  'shall',
  'will',
  'services',
  'support',
  'all',
  'are',
  'per',
]);

export class DeterministicEmbedder implements Embedder {
  readonly dimensions = DIMENSIONS;

  embed(texts: readonly string[]): Promise<readonly (readonly number[])[]> {
    return Promise.resolve(texts.map(embedOne));
  }
}

export function tokenizeForMatching(text: string): readonly string[] {
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return tokens.filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function embedOne(text: string): readonly number[] {
  const vector = new Array<number>(DIMENSIONS).fill(0);
  for (const token of tokenizeForMatching(text)) {
    const bucket = fnv1a(token) % DIMENSIONS;
    vector[bucket] = (vector[bucket] ?? 0) + 1;
  }
  return l2Normalize(vector);
}

function fnv1a(token: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

function l2Normalize(vector: readonly number[]): readonly number[] {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return norm === 0 ? vector : vector.map((value) => value / norm);
}
