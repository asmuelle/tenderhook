import { createHash } from 'node:crypto';

/** Content hash for document versions (PRODUCT INVARIANT 1 and 7). */
export function sha256Hex(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}
