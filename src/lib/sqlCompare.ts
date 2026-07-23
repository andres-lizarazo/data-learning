// Compares a learner's SQL result set to a reference solution's result set.
//
// Strategy: compare by VALUES in column order (ignoring column names/aliases, which a
// learner may name differently). Order-insensitive by default — two result sets match
// if they are permutations of each other — unless `ordered` is set (e.g. for ORDER BY
// exercises), where the row sequence must match.

/** Normalize one cell to a stable string so 1 === "1" and dates/arrays compare cleanly. */
function cell(v: unknown): string {
  if (v === null || v === undefined) return "∅";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "t" : "f";
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return JSON.stringify(v.map(cell));
  if (typeof v === "object") return JSON.stringify(v);
  // Numeric strings (PG numeric type) → canonical number form so 1648.50 === 1648.5.
  const s = String(v);
  if (/^-?\d+(\.\d+)?$/.test(s)) return String(Number(s));
  return s;
}

// Joins cells with a U+0001 delimiter (never present in real data) so adjacent columns
// can't merge into an ambiguous key — e.g. ["1","23"] and ["12","3"] must stay distinct.
function rowKey(row: unknown[]): string {
  return row.map(cell).join("");
}

export interface CompareResult {
  pass: boolean;
  reason?: string;
}

export function compareResultSets(
  user: { columns: string[]; rows: unknown[][] },
  expected: { columns: string[]; rows: unknown[][] },
  ordered = false,
): CompareResult {
  if (user.columns.length !== expected.columns.length) {
    return {
      pass: false,
      reason: `Expected ${expected.columns.length} column(s), your query returned ${user.columns.length}.`,
    };
  }
  if (user.rows.length !== expected.rows.length) {
    return {
      pass: false,
      reason: `Expected ${expected.rows.length} row(s), your query returned ${user.rows.length}.`,
    };
  }

  if (ordered) {
    for (let i = 0; i < expected.rows.length; i++) {
      if (rowKey(user.rows[i]) !== rowKey(expected.rows[i])) {
        return { pass: false, reason: `Row ${i + 1} does not match the expected output.` };
      }
    }
    return { pass: true };
  }

  // Order-insensitive: compare as multisets of rows.
  const counts = new Map<string, number>();
  for (const r of expected.rows) {
    const k = rowKey(r);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  for (const r of user.rows) {
    const k = rowKey(r);
    const n = counts.get(k);
    if (!n) return { pass: false, reason: "Your rows don't match the expected output." };
    counts.set(k, n - 1);
  }
  return { pass: true };
}
