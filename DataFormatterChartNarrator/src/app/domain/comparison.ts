import type { ColumnInfo, DataRow } from './types';

export type MetricCategory = 'basic' | 'stats' | 'quality' | 'structure' | 'difference' | 'advanced';
export type SupportedFieldType = 'numeric' | 'categorical' | 'date';

export interface ComparisonMetricDefinition {
  id: string;
  label: string;
  category: MetricCategory;
  supportedFieldTypes: SupportedFieldType[];
  supportsGrouping: boolean;
  supportsDatasetVsDataset: boolean;
  defaultEnabled: boolean;
  compute: (input: MetricComputeInput) => MetricComputeOutput;
}

export interface MetricComputeInput {
  rows: DataRow[];
  valueKey?: string;
  groupKey?: string;
  columns: ColumnInfo[];
}

export type MetricComputeOutput =
  | { kind: 'number'; value: number; unit?: string }
  | { kind: 'text'; value: string }
  | { kind: 'na'; reason: string };

export function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function extractNumericValues(rows: DataRow[], key: string): { values: number[]; missingCount: number } {
  const values: number[] = [];
  let missingCount = 0;
  rows.forEach(r => {
    const v = r[key];
    if (v == null || v === '') {
      missingCount += 1;
      return;
    }
    if (isFiniteNumber(v)) {
      values.push(v);
      return;
    }
    const n = Number(v);
    if (Number.isFinite(n)) values.push(n);
    else missingCount += 1;
  });
  return { values, missingCount };
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

export function quantile(values: number[], q: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const baseValue = sorted[base];
  const nextValue = sorted[base + 1];
  if (nextValue == null) return baseValue;
  return baseValue + rest * (nextValue - baseValue);
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function variance(values: number[]): number | null {
  if (values.length < 2) return null;
  const m = mean(values);
  if (m == null) return null;
  const s = values.reduce((acc, v) => acc + (v - m) * (v - m), 0);
  return s / (values.length - 1);
}

export function stddev(values: number[]): number | null {
  const v = variance(values);
  if (v == null) return null;
  return Math.sqrt(v);
}

export function modeIfDiscrete(values: number[]): number | null {
  if (values.length === 0) return null;
  const counts = new Map<number, number>();
  values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  if (counts.size > 50) return null;
  let best: { v: number; c: number } | null = null;
  counts.forEach((c, v) => {
    if (!best || c > best.c) best = { v, c };
  });
  if (!best) return null;
  if (best.c <= 1) return null;
  return best.v;
}

export function outlierCountIqr(values: number[]): number | null {
  if (values.length < 4) return null;
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  if (q1 == null || q3 == null) return null;
  const iqr = q3 - q1;
  const low = q1 - 1.5 * iqr;
  const high = q3 + 1.5 * iqr;
  return values.filter(v => v < low || v > high).length;
}

export function formatMetricValue(output: MetricComputeOutput): string {
  if (output.kind === 'na') return 'N/A';
  if (output.kind === 'text') return output.value;
  if (!Number.isFinite(output.value)) return 'N/A';
  const abs = Math.abs(output.value);
  const digits = abs >= 1000 ? 0 : abs >= 100 ? 1 : 2;
  const s = output.value.toFixed(digits);
  return output.unit ? `${s} ${output.unit}` : s;
}

export function safePercentChange(a: number | null, b: number | null): number | null {
  if (a == null || b == null) return null;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (a === 0) return null;
  return ((b - a) / Math.abs(a)) * 100;
}

export function safeAbsDiff(a: number | null, b: number | null): number | null {
  if (a == null || b == null) return null;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return b - a;
}

export function getColumnFieldType(col: ColumnInfo | undefined): SupportedFieldType | null {
  if (!col) return null;
  if (col.type === 'numeric') return 'numeric';
  if (col.type === 'category' || col.type === 'text') return 'categorical';
  if (col.type === 'date') return 'date';
  return null;
}

export function getDefaultMetricIds(params: { valueKey?: string; columns: ColumnInfo[] }): string[] {
  const valueCol = params.valueKey ? params.columns.find(c => c.name === params.valueKey) : undefined;
  const valueType = getColumnFieldType(valueCol);
  return COMPARISON_METRICS.filter(m => {
    if (!m.defaultEnabled) return false;
    if (!valueType) return true;
    return m.supportedFieldTypes.includes(valueType);
  }).map(m => m.id);
}

export const COMPARISON_METRICS: ComparisonMetricDefinition[] = [
  {
    id: 'sample_count',
    label: 'Sample Count',
    category: 'basic',
    supportedFieldTypes: ['numeric', 'categorical', 'date'],
    supportsGrouping: true,
    supportsDatasetVsDataset: true,
    defaultEnabled: true,
    compute: ({ rows }) => ({ kind: 'number', value: rows.length }),
  },
  {
    id: 'unique_count',
    label: 'Unique Values (group/metric)',
    category: 'basic',
    supportedFieldTypes: ['numeric', 'categorical', 'date'],
    supportsGrouping: true,
    supportsDatasetVsDataset: true,
    defaultEnabled: true,
    compute: ({ rows, valueKey, groupKey }) => {
      const key = groupKey || valueKey;
      if (!key) return { kind: 'na', reason: 'Field not selected' };
      const set = new Set<string>();
      rows.forEach(r => {
        const v = r[key];
        if (v == null || v === '') return;
        set.add(String(v));
      });
      return { kind: 'number', value: set.size };
    },
  },
  {
    id: 'duplicate_count',
    label: 'Duplicate Values (group/metric)',
    category: 'basic',
    supportedFieldTypes: ['numeric', 'categorical', 'date'],
    supportsGrouping: true,
    supportsDatasetVsDataset: true,
    defaultEnabled: true,
    compute: ({ rows, valueKey, groupKey }) => {
      const key = groupKey || valueKey;
      if (!key) return { kind: 'na', reason: 'Field not selected' };
      const set = new Set<string>();
      let present = 0;
      rows.forEach(r => {
        const v = r[key];
        if (v == null || v === '') return;
        present += 1;
        set.add(String(v));
      });
      return { kind: 'number', value: Math.max(0, present - set.size) };
    },
  },
  {
    id: 'missing_count',
    label: 'Missing Count (metric)',
    category: 'quality',
    supportedFieldTypes: ['numeric', 'categorical', 'date'],
    supportsGrouping: true,
    supportsDatasetVsDataset: true,
    defaultEnabled: true,
    compute: ({ rows, valueKey }) => {
      if (!valueKey) return { kind: 'na', reason: 'Metric field not selected' };
      const missing = rows.filter(r => r[valueKey] == null || r[valueKey] === '').length;
      return { kind: 'number', value: missing };
    },
  },
  {
    id: 'missing_rate',
    label: 'Missing Rate (metric)',
    category: 'quality',
    supportedFieldTypes: ['numeric', 'categorical', 'date'],
    supportsGrouping: true,
    supportsDatasetVsDataset: true,
    defaultEnabled: true,
    compute: ({ rows, valueKey }) => {
      if (!valueKey) return { kind: 'na', reason: 'Metric field not selected' };
      if (rows.length === 0) return { kind: 'na', reason: 'No samples' };
      const missing = rows.filter(r => r[valueKey] == null || r[valueKey] === '').length;
      return { kind: 'number', value: (missing / rows.length) * 100, unit: '%' };
    },
  },
  {
    id: 'complete_rate',
    label: 'Completeness (metric)',
    category: 'quality',
    supportedFieldTypes: ['numeric', 'categorical', 'date'],
    supportsGrouping: true,
    supportsDatasetVsDataset: true,
    defaultEnabled: false,
    compute: ({ rows, valueKey }) => {
      if (!valueKey) return { kind: 'na', reason: 'Metric field not selected' };
      if (rows.length === 0) return { kind: 'na', reason: 'No samples' };
      const missing = rows.filter(r => r[valueKey] == null || r[valueKey] === '').length;
      return { kind: 'number', value: ((rows.length - missing) / rows.length) * 100, unit: '%' };
    },
  },
  {
    id: 'sum',
    label: 'Sum',
    category: 'stats',
    supportedFieldTypes: ['numeric'],
    supportsGrouping: true,
    supportsDatasetVsDataset: true,
    defaultEnabled: true,
    compute: ({ rows, valueKey }) => {
      if (!valueKey) return { kind: 'na', reason: 'Numeric field not selected' };
      const values = getNumericValues(rows, valueKey);
      if (values.length === 0) return { kind: 'na', reason: 'No numeric values available' };
      return { kind: 'number', value: values.reduce((a, b) => a + b, 0) };
    },
  },
  {
    id: 'mean',
    label: 'Mean',
    category: 'stats',
    supportedFieldTypes: ['numeric'],
    supportsGrouping: true,
    supportsDatasetVsDataset: true,
    defaultEnabled: true,
    compute: ({ rows, valueKey }) => {
      if (!valueKey) return { kind: 'na', reason: 'Numeric field not selected' };
      const { values } = extractNumericValues(rows, valueKey);
      const m = mean(values);
      if (m == null) return { kind: 'na', reason: 'No numeric values available' };
      return { kind: 'number', value: m };
    },
  },
  {
    id: 'median',
    label: 'Median',
    category: 'stats',
    supportedFieldTypes: ['numeric'],
    supportsGrouping: true,
    supportsDatasetVsDataset: true,
    defaultEnabled: true,
    compute: ({ rows, valueKey }) => {
      if (!valueKey) return { kind: 'na', reason: 'Numeric field not selected' };
      const { values } = extractNumericValues(rows, valueKey);
      const m = median(values);
      if (m == null) return { kind: 'na', reason: 'No numeric values available' };
      return { kind: 'number', value: m };
    },
  },
  {
    id: 'mode',
    label: 'Mode (discrete)',
    category: 'stats',
    supportedFieldTypes: ['numeric'],
    supportsGrouping: true,
    supportsDatasetVsDataset: true,
    defaultEnabled: false,
    compute: ({ rows, valueKey }) => {
      if (!valueKey) return { kind: 'na', reason: 'Numeric field not selected' };
      const { values } = extractNumericValues(rows, valueKey);
      const m = modeIfDiscrete(values);
      if (m == null) return { kind: 'na', reason: 'Not applicable or no mode' };
      return { kind: 'number', value: m };
    },
  },
  {
    id: 'min',
    label: 'Minimum',
    category: 'stats',
    supportedFieldTypes: ['numeric'],
    supportsGrouping: true,
    supportsDatasetVsDataset: true,
    defaultEnabled: true,
    compute: ({ rows, valueKey }) => {
      if (!valueKey) return { kind: 'na', reason: 'Numeric field not selected' };
      const { values } = extractNumericValues(rows, valueKey);
      if (values.length === 0) return { kind: 'na', reason: 'No numeric values available' };
      return { kind: 'number', value: Math.min(...values) };
    },
  },
  {
    id: 'max',
    label: 'Maximum',
    category: 'stats',
    supportedFieldTypes: ['numeric'],
    supportsGrouping: true,
    supportsDatasetVsDataset: true,
    defaultEnabled: true,
    compute: ({ rows, valueKey }) => {
      if (!valueKey) return { kind: 'na', reason: 'Numeric field not selected' };
      const { values } = extractNumericValues(rows, valueKey);
      if (values.length === 0) return { kind: 'na', reason: 'No numeric values available' };
      return { kind: 'number', value: Math.max(...values) };
    },
  },
  {
    id: 'range',
    label: 'Range',
    category: 'stats',
    supportedFieldTypes: ['numeric'],
    supportsGrouping: true,
    supportsDatasetVsDataset: true,
    defaultEnabled: true,
    compute: ({ rows, valueKey }) => {
      if (!valueKey) return { kind: 'na', reason: 'Numeric field not selected' };
      const { values } = extractNumericValues(rows, valueKey);
      if (values.length === 0) return { kind: 'na', reason: 'No numeric values available' };
      return { kind: 'number', value: Math.max(...values) - Math.min(...values) };
    },
  },
  {
    id: 'stddev',
    label: 'Standard Deviation',
    category: 'stats',
    supportedFieldTypes: ['numeric'],
    supportsGrouping: true,
    supportsDatasetVsDataset: true,
    defaultEnabled: true,
    compute: ({ rows, valueKey }) => {
      if (!valueKey) return { kind: 'na', reason: 'Numeric field not selected' };
      const { values } = extractNumericValues(rows, valueKey);
      const s = stddev(values);
      if (s == null) return { kind: 'na', reason: 'Insufficient samples' };
      return { kind: 'number', value: s };
    },
  },
  {
    id: 'variance',
    label: 'Variance',
    category: 'stats',
    supportedFieldTypes: ['numeric'],
    supportsGrouping: true,
    supportsDatasetVsDataset: true,
    defaultEnabled: false,
    compute: ({ rows, valueKey }) => {
      if (!valueKey) return { kind: 'na', reason: 'Numeric field not selected' };
      const { values } = extractNumericValues(rows, valueKey);
      const v = variance(values);
      if (v == null) return { kind: 'na', reason: 'Insufficient samples' };
      return { kind: 'number', value: v };
    },
  },
  {
    id: 'q1',
    label: 'Q1 (25%)',
    category: 'stats',
    supportedFieldTypes: ['numeric'],
    supportsGrouping: true,
    supportsDatasetVsDataset: true,
    defaultEnabled: false,
    compute: ({ rows, valueKey }) => {
      if (!valueKey) return { kind: 'na', reason: 'Numeric field not selected' };
      const { values } = extractNumericValues(rows, valueKey);
      const v = quantile(values, 0.25);
      if (v == null) return { kind: 'na', reason: 'No numeric values available' };
      return { kind: 'number', value: v };
    },
  },
  {
    id: 'q3',
    label: 'Q3 (75%)',
    category: 'stats',
    supportedFieldTypes: ['numeric'],
    supportsGrouping: true,
    supportsDatasetVsDataset: true,
    defaultEnabled: false,
    compute: ({ rows, valueKey }) => {
      if (!valueKey) return { kind: 'na', reason: 'Numeric field not selected' };
      const { values } = extractNumericValues(rows, valueKey);
      const v = quantile(values, 0.75);
      if (v == null) return { kind: 'na', reason: 'No numeric values available' };
      return { kind: 'number', value: v };
    },
  },
  {
    id: 'p10',
    label: 'P10 (10%)',
    category: 'stats',
    supportedFieldTypes: ['numeric'],
    supportsGrouping: false,
    supportsDatasetVsDataset: true,
    defaultEnabled: false,
    compute: ({ rows, valueKey }) => {
      if (!valueKey) return { kind: 'na', reason: 'Numeric field not selected' };
      const { values } = extractNumericValues(rows, valueKey);
      const v = quantile(values, 0.1);
      if (v == null) return { kind: 'na', reason: 'No numeric values available' };
      return { kind: 'number', value: v };
    },
  },
  {
    id: 'p90',
    label: 'P90 (90%)',
    category: 'stats',
    supportedFieldTypes: ['numeric'],
    supportsGrouping: false,
    supportsDatasetVsDataset: true,
    defaultEnabled: false,
    compute: ({ rows, valueKey }) => {
      if (!valueKey) return { kind: 'na', reason: 'Numeric field not selected' };
      const { values } = extractNumericValues(rows, valueKey);
      const v = quantile(values, 0.9);
      if (v == null) return { kind: 'na', reason: 'No numeric values available' };
      return { kind: 'number', value: v };
    },
  },
  {
    id: 'outlier_count',
    label: 'Outlier Count (IQR)',
    category: 'quality',
    supportedFieldTypes: ['numeric'],
    supportsGrouping: true,
    supportsDatasetVsDataset: true,
    defaultEnabled: false,
    compute: ({ rows, valueKey }) => {
      if (!valueKey) return { kind: 'na', reason: 'Numeric field not selected' };
      const { values } = extractNumericValues(rows, valueKey);
      const c = outlierCountIqr(values);
      if (c == null) return { kind: 'na', reason: 'Insufficient samples' };
      return { kind: 'number', value: c };
    },
  },
];

export function computeMetricMap(params: {
  rows: DataRow[];
  columns: ColumnInfo[];
  valueKey?: string;
  groupKey?: string;
  metricIds: string[];
}): Record<string, MetricComputeOutput> {
  const defs = new Map(COMPARISON_METRICS.map(d => [d.id, d]));
  const output: Record<string, MetricComputeOutput> = {};
  params.metricIds.forEach(id => {
    const def = defs.get(id);
    if (!def) return;
    output[id] = def.compute({
      rows: params.rows,
      columns: params.columns,
      valueKey: params.valueKey,
      groupKey: params.groupKey,
    });
  });
  return output;
}

export function computeCategoryDistribution(params: {
  rows: DataRow[];
  key: string;
  topN: number;
}): { key: string; count: number; share: number }[] {
  const counts: Record<string, number> = {};
  let present = 0;
  params.rows.forEach(r => {
    const v = r[params.key];
    if (v == null || v === '') return;
    present += 1;
    const k = String(v);
    counts[k] = (counts[k] || 0) + 1;
  });
  const entries = Object.entries(counts)
    .map(([key, count]) => ({ key, count, share: present === 0 ? 0 : count / present }))
    .sort((a, b) => b.count - a.count);
  return entries.slice(0, Math.max(1, params.topN));
}

export type DateBucket = 'day' | 'month';

function toBucket(date: Date, bucket: DateBucket): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  if (bucket === 'month') return `${y}-${m}`;
  return `${y}-${m}-${d}`;
}

export function computeTimeSeries(params: {
  rows: DataRow[];
  dateKey: string;
  valueKey: string;
  aggregation: 'sum' | 'avg';
  bucket: DateBucket;
}): { bucket: string; value: number }[] {
  const map: Record<string, { sum: number; count: number }> = {};
  params.rows.forEach(r => {
    const rawDate = r[params.dateKey];
    if (rawDate == null || rawDate === '') return;
    const dt = new Date(String(rawDate));
    if (Number.isNaN(dt.getTime())) return;
    const b = toBucket(dt, params.bucket);
    const rawValue = r[params.valueKey];
    const n = isFiniteNumber(rawValue) ? rawValue : Number(rawValue);
    if (!Number.isFinite(n)) return;
    if (!map[b]) map[b] = { sum: 0, count: 0 };
    map[b].sum += n;
    map[b].count += 1;
  });
  return Object.entries(map)
    .map(([bucket, v]) => ({ bucket, value: params.aggregation === 'sum' ? v.sum : v.count === 0 ? 0 : v.sum / v.count }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket));
}

