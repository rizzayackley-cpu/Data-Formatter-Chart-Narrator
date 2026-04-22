import type { ChartConfig, ChartType, ColumnInfo, DataRow, InferredSchema } from './types';

export function inferSchemaFromColumns(columns: ColumnInfo[]): InferredSchema {
  return {
    numeric: columns.filter(c => c.type === 'numeric').map(c => c.name),
    date: columns.filter(c => c.type === 'date').map(c => c.name),
    categorical: columns.filter(c => c.type === 'category').map(c => c.name),
    text: columns.filter(c => c.type === 'text').map(c => c.name),
  };
}

function firstOrEmpty(values: string[]): string {
  return values.length > 0 ? values[0] : '';
}

function uniqueStrings(values: (string | number | null | undefined)[]): string[] {
  const set = new Set<string>();
  values.forEach(v => {
    if (v == null) return;
    const s = String(v);
    if (s !== '') set.add(s);
  });
  return [...set];
}

export function recommendChartType(params: {
  schema: InferredSchema;
  xAxis?: string;
  yAxis?: string;
  isPieSemanticsClear?: boolean;
}): { chartType: ChartType; reason: string } {
  const { schema, xAxis, yAxis } = params;
  const hasNumeric = schema.numeric.length > 0;
  const hasCategory = schema.categorical.length > 0;
  const hasDate = schema.date.length > 0;

  if (hasDate && hasNumeric) {
    return { chartType: 'line', reason: 'Date and numeric fields detected. A line chart is recommended for trend analysis.' };
  }

  if (hasCategory && hasNumeric) {
    if (params.isPieSemanticsClear) {
      return { chartType: 'pie', reason: 'Categorical and numeric fields detected with composition semantics. Pie chart recommended.' };
    }
    return { chartType: 'bar', reason: 'Categorical and numeric fields detected. Bar chart is recommended for comparison.' };
  }

  if (hasNumeric) {
    return { chartType: 'line', reason: 'Only numeric fields detected. Line chart is used by default.' };
  }

  return { chartType: 'bar', reason: 'No numeric field detected. Bar chart is used as fallback until a numeric field is selected.' };
}

export function getDefaultChartConfig(schema: InferredSchema): { config: ChartConfig; reason: string } {
  const xAxis = firstOrEmpty(schema.categorical) || firstOrEmpty(schema.date) || firstOrEmpty(schema.text);
  const yAxis = firstOrEmpty(schema.numeric);
  const { chartType, reason: typeReason } = recommendChartType({ schema, xAxis, yAxis });

  const reasonParts: string[] = [];
  if (xAxis) reasonParts.push(`X = ${xAxis}`);
  if (yAxis) reasonParts.push(`Y = ${yAxis}`);
  reasonParts.push(`recommended_chart = ${chartType}`);
  reasonParts.push(typeReason);

  return {
    config: {
      chartType,
      xAxis,
      yAxis,
      groupBy: '',
      auto: { xAxis, yAxis, chartType, reason: reasonParts.join('; ') },
    },
    reason: reasonParts.join('; '),
  };
}

export function normalizeGroupBy(config: ChartConfig): ChartConfig {
  if (config.groupBy && config.groupBy.trim() !== '') return config;
  if (!config.xAxis) return config;
  return { ...config, groupBy: config.xAxis };
}

export function ensureChartConfigValid(params: {
  config: ChartConfig;
  schema: InferredSchema;
  columns: string[];
}): { config: ChartConfig; changed: boolean; reason?: string } {
  const { schema, columns } = params;
  const next: ChartConfig = { ...params.config };
  let changed = false;
  const reasons: string[] = [];

  if (next.xAxis && !columns.includes(next.xAxis)) {
    next.xAxis = '';
    changed = true;
    reasons.push('X-axis field no longer exists and has been cleared.');
  }
  if (next.yAxis && !columns.includes(next.yAxis)) {
    next.yAxis = '';
    changed = true;
    reasons.push('Y-axis field no longer exists and has been cleared.');
  }
  if (next.groupBy && !columns.includes(next.groupBy)) {
    next.groupBy = '';
    changed = true;
    reasons.push('Group field no longer exists and has been cleared.');
  }

  if (!next.xAxis) {
    const fallbackX = firstOrEmpty(schema.categorical) || firstOrEmpty(schema.date) || firstOrEmpty(schema.text) || firstOrEmpty(columns);
    if (fallbackX) {
      next.xAxis = fallbackX;
      changed = true;
      reasons.push(`auto_selected_x = ${fallbackX}`);
    }
  }

  if (!next.yAxis) {
    const fallbackY = firstOrEmpty(schema.numeric) || (columns.length > 1 ? columns[1] : firstOrEmpty(columns));
    if (fallbackY) {
      next.yAxis = fallbackY;
      changed = true;
      reasons.push(`auto_selected_y = ${fallbackY}`);
    }
  }

  const recommended = recommendChartType({ schema, xAxis: next.xAxis, yAxis: next.yAxis }).chartType;
  if (next.chartType !== recommended) {
    next.chartType = recommended;
    changed = true;
    reasons.push(`recommended_chart = ${recommended}`);
  }

  if (changed) {
    next.auto = { ...(next.auto || {}), xAxis: next.xAxis, yAxis: next.yAxis, chartType: next.chartType, reason: reasons.join('; ') };
  }

  return { config: next, changed, reason: reasons.length > 0 ? reasons.join('; ') : undefined };
}

export function buildChartData(params: {
  rows: DataRow[];
  config: ChartConfig;
}): { data: any[]; seriesKeys: string[] } {
  const { rows } = params;
  const config = normalizeGroupBy(params.config);

  if (!config.xAxis || !config.yAxis || rows.length === 0) {
    return { data: [], seriesKeys: [] };
  }

  if (config.chartType === 'pie') {
    const key = config.groupBy || config.xAxis;
    const aggregated: Record<string, number> = {};
    rows.forEach(r => {
      const category = String(r[key]);
      const value = typeof r[config.yAxis] === 'number' ? (r[config.yAxis] as number) : 0;
      aggregated[category] = (aggregated[category] || 0) + value;
    });
    return {
      data: Object.entries(aggregated).map(([name, value]) => ({ name, value })),
      seriesKeys: ['value'],
    };
  }

  if (config.groupBy && config.groupBy !== config.xAxis) {
    const grouped: Record<string, Record<string, number>> = {};
    rows.forEach(r => {
      const x = String(r[config.xAxis]);
      const group = String(r[config.groupBy]);
      const y = typeof r[config.yAxis] === 'number' ? (r[config.yAxis] as number) : 0;
      if (!grouped[x]) grouped[x] = {};
      grouped[x][group] = (grouped[x][group] || 0) + y;
    });
    const seriesKeys = uniqueStrings(rows.map(r => r[config.groupBy]));
    return {
      data: Object.entries(grouped).map(([name, values]) => ({ name, ...values })),
      seriesKeys,
    };
  }

  return {
    data: rows.map(r => ({
      name: String(r[config.xAxis]),
      value: typeof r[config.yAxis] === 'number' ? (r[config.yAxis] as number) : 0,
    })),
    seriesKeys: ['value'],
  };
}

export interface AggregateMetricRow {
  category: string;
  total: number;
  avg: number;
  max: number;
  min: number;
  count: number;
}

export function computeCategoryMetrics(params: {
  rows: DataRow[];
  groupKey: string;
  valueKey: string;
}): AggregateMetricRow[] {
  const { rows, groupKey, valueKey } = params;
  const grouped: Record<string, number[]> = {};
  rows.forEach(r => {
    const category = String(r[groupKey]);
    const value = typeof r[valueKey] === 'number' ? (r[valueKey] as number) : 0;
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(value);
  });
  const metrics = Object.entries(grouped).map(([category, values]) => {
    const total = values.reduce((a, b) => a + b, 0);
    const avg = values.length > 0 ? total / values.length : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;
    const min = values.length > 0 ? Math.min(...values) : 0;
    return { category, total, avg, max, min, count: values.length };
  });
  return metrics.sort((a, b) => b.total - a.total);
}

export interface InsightStats {
  targetColumn: string;
  max: number;
  min: number;
  avg: number;
  total: number;
  topCategory?: { key: string; total: number; by: string };
  trend: 'up' | 'down' | 'flat';
  count: number;
  basis: {
    yAxis: string;
    xAxis?: string;
    groupBy?: string;
    aggregation: 'sum' | 'raw';
  };
}

export function computeInsightStats(params: {
  rows: DataRow[];
  schema: InferredSchema;
  config: ChartConfig;
}): InsightStats | null {
  const { rows, schema } = params;
  const config = normalizeGroupBy(params.config);
  if (rows.length === 0) return null;
  const yAxis = config.yAxis || firstOrEmpty(schema.numeric);
  if (!yAxis) return null;

  const values = rows.map(r => r[yAxis]).filter(v => typeof v === 'number') as number[];
  if (values.length === 0) return null;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const total = values.reduce((a, b) => a + b, 0);
  const avg = total / values.length;

  let trend: InsightStats['trend'] = 'flat';
  if (values.length > 1) {
    const first = values[0];
    const last = values[values.length - 1];
    if (last > first) trend = 'up';
    else if (last < first) trend = 'down';
  }

  let topCategory: InsightStats['topCategory'] | undefined;
  const categoryKey = config.groupBy || config.xAxis || firstOrEmpty(schema.categorical) || firstOrEmpty(schema.text);
  if (categoryKey) {
    const totals: Record<string, number> = {};
    rows.forEach(r => {
      const key = String(r[categoryKey]);
      const v = typeof r[yAxis] === 'number' ? (r[yAxis] as number) : 0;
      totals[key] = (totals[key] || 0) + v;
    });
    const entries = Object.entries(totals);
    if (entries.length > 0) {
      const best = entries.reduce((a, b) => (a[1] >= b[1] ? a : b));
      topCategory = { key: best[0], total: best[1], by: categoryKey };
    }
  }

  const aggregation: InsightStats['basis']['aggregation'] =
    config.chartType === 'pie' || (config.groupBy && config.groupBy !== config.xAxis) ? 'sum' : 'raw';

  return {
    targetColumn: yAxis,
    max,
    min,
    avg,
    total,
    topCategory,
    trend,
    count: values.length,
    basis: {
      yAxis,
      xAxis: config.xAxis || undefined,
      groupBy: config.groupBy || undefined,
      aggregation,
    },
  };
}

