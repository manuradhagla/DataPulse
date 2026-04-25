// Analytics engine — pure functions that compute KPIs from row arrays.
// All numeric helpers are null-safe and ignore non-numeric values.

export type Row = Record<string, unknown>;

export function toNumberArray(rows: Row[], column: string): number[] {
  const out: number[] = [];
  for (const r of rows) {
    const v = r[column];
    if (v === null || v === undefined || v === "") continue;
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

export function isNumericColumn(rows: Row[], column: string): boolean {
  if (rows.length === 0) return false;
  const sample = rows.slice(0, Math.min(rows.length, 50));
  let numeric = 0;
  let total = 0;
  for (const r of sample) {
    const v = r[column];
    if (v === null || v === undefined || v === "") continue;
    total++;
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n)) numeric++;
  }
  return total > 0 && numeric / total >= 0.7;
}

export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function mode(arr: number[]): number | null {
  if (arr.length === 0) return null;
  const counts = new Map<number, number>();
  for (const n of arr) counts.set(n, (counts.get(n) ?? 0) + 1);
  let best: number | null = null;
  let bestCount = 0;
  for (const [k, c] of counts) {
    if (c > bestCount) {
      best = k;
      bestCount = c;
    }
  }
  return bestCount > 1 ? best : null;
}

export function minMax(arr: number[]): { min: number; max: number } {
  if (arr.length === 0) return { min: 0, max: 0 };
  let min = arr[0];
  let max = arr[0];
  for (const n of arr) {
    if (n < min) min = n;
    if (n > max) max = n;
  }
  return { min, max };
}

export function stdDev(arr: number[]): number {
  if (arr.length === 0) return 0;
  const m = mean(arr);
  const variance = arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

// Outliers via IQR rule
export function detectOutliers(arr: number[]): number[] {
  if (arr.length < 4) return [];
  const s = [...arr].sort((a, b) => a - b);
  const q = (p: number) => {
    const idx = (s.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (idx - lo);
  };
  const q1 = q(0.25);
  const q3 = q(0.75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return arr.filter((n) => n < lower || n > upper);
}

export function growthPercent(arr: number[]): number {
  if (arr.length < 2) return 0;
  const first = arr[0];
  const last = arr[arr.length - 1];
  if (first === 0) return last === 0 ? 0 : 100;
  return ((last - first) / Math.abs(first)) * 100;
}

// Categorical aggregation: count per unique value (top N)
export function valueCounts(
  rows: Row[],
  column: string,
  topN = 8,
): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const v = r[column];
    if (v === null || v === undefined || v === "") continue;
    const key = String(v);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([label, count]) => ({ label, count }));
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(2) + "K";
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
}
