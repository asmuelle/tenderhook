/**
 * Generic longest-common-subsequence diff over arbitrary token arrays.
 * Deterministic by construction — the foundation of invariant 1
 * (deterministic-before-LLM): change detection never involves a model.
 */

export type DiffOp<T> =
  | { readonly kind: 'equal'; readonly value: T; readonly aIndex: number; readonly bIndex: number }
  | { readonly kind: 'delete'; readonly value: T; readonly aIndex: number }
  | { readonly kind: 'insert'; readonly value: T; readonly bIndex: number };

export function lcsDiff<T>(
  a: readonly T[],
  b: readonly T[],
  equals: (x: T, y: T) => boolean = (x, y) => x === y,
): readonly DiffOp<T>[] {
  const table = buildLcsTable(a, b, equals);
  return backtrack(a, b, table, equals);
}

function buildLcsTable<T>(
  a: readonly T[],
  b: readonly T[],
  equals: (x: T, y: T) => boolean,
): number[][] {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const matched = equals(a[i - 1] as T, b[j - 1] as T);
      table[i]![j] = matched
        ? table[i - 1]![j - 1]! + 1
        : Math.max(table[i - 1]![j]!, table[i]![j - 1]!);
    }
  }
  return table;
}

function backtrack<T>(
  a: readonly T[],
  b: readonly T[],
  table: number[][],
  equals: (x: T, y: T) => boolean,
): readonly DiffOp<T>[] {
  const ops: DiffOp<T>[] = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && equals(a[i - 1] as T, b[j - 1] as T)) {
      ops.push({ kind: 'equal', value: a[i - 1] as T, aIndex: i - 1, bIndex: j - 1 });
      i -= 1;
      j -= 1;
    } else if (j > 0 && (i === 0 || table[i]![j - 1]! >= table[i - 1]![j]!)) {
      ops.push({ kind: 'insert', value: b[j - 1] as T, bIndex: j - 1 });
      j -= 1;
    } else {
      ops.push({ kind: 'delete', value: a[i - 1] as T, aIndex: i - 1 });
      i -= 1;
    }
  }
  return ops.reverse();
}
