import { describe, expect, it } from 'vitest';
import { InMemoryVersionStore } from './store';
import { sha256Hex } from './hash';

const BASE_INPUT = {
  opportunityId: 'sam:test-opp',
  fetchedAt: '2026-06-10T11:00:00.000Z',
  extractorTool: 'fixture-text',
  extractorVersion: '1.0.0',
};

describe('InMemoryVersionStore (append-only, invariant 7)', () => {
  it('appends versions in order and never overwrites prior records', () => {
    // Arrange
    const store = new InMemoryVersionStore();

    // Act
    const v1 = store.append({ ...BASE_INPUT, extractedText: 'version one' });
    const v2 = store.append({ ...BASE_INPUT, extractedText: 'version two' });

    // Assert
    const versions = store.versions('sam:test-opp');
    expect(versions).toHaveLength(2);
    expect(versions[0]).toBe(v1);
    expect(versions[1]).toBe(v2);
    expect(store.latest('sam:test-opp')).toBe(v2);
    expect(store.get(v1.versionId)?.extractedText).toBe('version one');
  });

  it('freezes records so stored versions are immutable', () => {
    // Arrange
    const store = new InMemoryVersionStore();

    // Act
    const record = store.append({ ...BASE_INPUT, extractedText: 'immutable' });

    // Assert
    expect(Object.isFrozen(record)).toBe(true);
  });

  it('pins the content hash to the exact extracted text', () => {
    // Arrange
    const store = new InMemoryVersionStore();

    // Act
    const record = store.append({ ...BASE_INPUT, extractedText: 'hash me' });

    // Assert
    expect(record.contentHash).toBe(sha256Hex('hash me'));
    expect(record.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('records the extractor tool and version on every record (extractor pinning)', () => {
    // Arrange
    const store = new InMemoryVersionStore();

    // Act — re-extraction with a new extractor creates a NEW record.
    store.append({ ...BASE_INPUT, extractedText: 'same doc' });
    const reExtracted = store.append({
      ...BASE_INPUT,
      extractedText: 'same doc',
      extractorVersion: '2.0.0',
    });

    // Assert
    expect(store.versions('sam:test-opp')).toHaveLength(2);
    expect(reExtracted.extractorVersion).toBe('2.0.0');
  });

  it('returns an empty list and undefined latest for an unknown opportunity', () => {
    // Arrange
    const store = new InMemoryVersionStore();

    // Assert
    expect(store.versions('sam:unknown')).toHaveLength(0);
    expect(store.latest('sam:unknown')).toBeUndefined();
  });
});
