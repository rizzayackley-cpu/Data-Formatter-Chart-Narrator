import { useMemo } from 'react';
import type { ColumnInfo, DataComparisonConfig, DataRow, Dataset, InferredSchema } from '../../../domain/types';
import {
  COMPARISON_METRICS,
  computeCategoryDistribution,
  computeMetricMap,
  computeTimeSeries,
  safeAbsDiff,
  safePercentChange,
} from '../../../domain/comparison';

const METRIC_LABEL_ZH: Record<string, string> = {
  sample_count: '样本数',
  unique_count: '唯一值数（分组/指标）',
  duplicate_count: '重复值数（分组/指标）',
  missing_count: '缺失值数量（指标）',
  missing_rate: '缺失率（指标）',
  completeness_rate: '完整率（指标）',
  sum: '总和',
  mean: '均值',
  median: '中位数',
  mode: '众数（离散时）',
  min: '最小值',
  max: '最大值',
  range: '极差',
  stddev: '标准差',
  variance: '方差',
  q1: 'Q1（25%分位）',
  q3: 'Q3（75%分位）',
  iqr: 'IQR（四分位距）',
  p90: 'P90（90%分位）',
  outlier_iqr: '异常值数量（IQR）',
};

type CompareSide = { name: string; rows: DataRow[]; columns: ColumnInfo[] };

type DataCompareSlices = {
  scope: DataComparisonConfig['compareScope'];
  a: CompareSide;
  b: CompareSide;
  valueKey: string;
  groupBy: string;
};

type MetricRow = {
  id: string;
  label: string;
  category: string;
  a: ReturnType<typeof computeMetricMap>[string] | undefined;
  b: ReturnType<typeof computeMetricMap>[string] | undefined;
  abs: number | null;
  pct: number | null;
};

export function useDataCompareModel(args: {
  datasets: Dataset[];
  activeDataset: Dataset | null;
  config: DataComparisonConfig;
  language: 'zh' | 'en';
}) {
  const { datasets, activeDataset, config, language } = args;
  const localizeMetricLabel = (id: string, fallback: string) => (language === 'zh' ? METRIC_LABEL_ZH[id] || fallback : fallback);

  const selectValues = useMemo(() => {
    return {
      datasetA: config.datasetAId || '__unset__',
      datasetB: config.datasetBId || '__unset__',
      valueKey: config.valueKey || '__unset__',
      groupBy: config.groupBy || '__none__',
      groupA: config.groupA || '__unset__',
      groupB: config.groupB || '__unset__',
    };
  }, [config.datasetAId, config.datasetBId, config.groupA, config.groupB, config.groupBy, config.valueKey]);

  const enabledMetricIds = useMemo(() => {
    return config.metrics && config.metrics.length > 0
      ? config.metrics
      : COMPARISON_METRICS.filter(m => m.defaultEnabled).map(m => m.id);
  }, [config.metrics]);

  const dataCompareDatasets = useMemo(() => {
    const a = datasets.find(d => d.id === config.datasetAId) || null;
    const b = datasets.find(d => d.id === config.datasetBId) || null;
    return { a, b };
  }, [config.datasetAId, config.datasetBId, datasets]);

  const overlapInfo = useMemo(() => {
    if (datasets.length < 2) return null;
    const a = datasets.find(d => d.id === config.datasetAId) || null;
    const b = datasets.find(d => d.id === config.datasetBId) || null;
    if (!a || !b) return null;
    const aCols = new Set(a.columns.map(c => c.name));
    const bCols = new Set(b.columns.map(c => c.name));
    const shared = [...aCols].filter(c => bCols.has(c));
    return {
      a,
      b,
      sharedColumns: shared,
    };
  }, [config.datasetAId, config.datasetBId, datasets]);

  const dataCompareNumericColumns = useMemo(() => {
    const a = dataCompareDatasets.a;
    if (!a) return [];
    return a.inferredSchema.numeric;
  }, [dataCompareDatasets.a]);

  const groupByCandidates = useMemo(() => {
    const d = dataCompareDatasets.a || activeDataset;
    if (!d) return { categorical: [], date: [] };
    return {
      categorical: d.inferredSchema.categorical,
      date: d.inferredSchema.date,
    };
  }, [activeDataset, dataCompareDatasets.a]);

  const groupOptions = useMemo(() => {
    const d = dataCompareDatasets.a || activeDataset;
    const key = config.groupBy;
    if (!d || !key) return [];
    const values = d.columns.find(c => c.name === key)?.uniqueValues?.map(v => String(v)) || [];
    return values.slice(0, 200);
  }, [activeDataset, config.groupBy, dataCompareDatasets.a]);

  const metricDefinitions = useMemo(() => {
    const defs = COMPARISON_METRICS.map(def => ({ ...def, label: localizeMetricLabel(def.id, def.label) }));
    return {
      basic: defs.filter(d => d.category === 'basic'),
      stats: defs.filter(d => d.category === 'stats'),
      quality: defs.filter(d => d.category === 'quality'),
    };
  }, [language]);

  const dataCompareSlices = useMemo<DataCompareSlices | null>(() => {
    const scope = config.compareScope;
    const valueKey = config.valueKey;
    const groupBy = config.groupBy;

    if (scope === 'dataset') {
      const a = dataCompareDatasets.a;
      const b = dataCompareDatasets.b;
      if (!a || !b) return null;
      return {
        scope,
        a: { name: `A: ${a.name}`, rows: a.processedRows, columns: a.columns },
        b: { name: `B: ${b.name}`, rows: b.processedRows, columns: b.columns },
        valueKey,
        groupBy,
      };
    }

    const d = activeDataset;
    if (!d || !groupBy || !config.groupA || !config.groupB) return null;
    const aRows = d.processedRows.filter(r => String(r[groupBy]) === config.groupA);
    const bRows = d.processedRows.filter(r => String(r[groupBy]) === config.groupB);
    return {
      scope,
      a: { name: language === 'zh' ? `分组 A: ${config.groupA}` : `Group A: ${config.groupA}`, rows: aRows, columns: d.columns },
      b: { name: language === 'zh' ? `分组 B: ${config.groupB}` : `Group B: ${config.groupB}`, rows: bRows, columns: d.columns },
      valueKey,
      groupBy,
    };
  }, [activeDataset, config.compareScope, config.groupA, config.groupB, config.groupBy, config.valueKey, dataCompareDatasets.a, dataCompareDatasets.b, language]);

  const dataCompareMetricRows = useMemo<{ aLabel: string; bLabel: string; rows: MetricRow[] } | null>(() => {
    if (!dataCompareSlices) return null;
    const { a, b, valueKey, groupBy } = dataCompareSlices;
    const aMap = computeMetricMap({ rows: a.rows, columns: a.columns, valueKey, groupKey: groupBy, metricIds: enabledMetricIds });
    const bMap = computeMetricMap({ rows: b.rows, columns: b.columns, valueKey, groupKey: groupBy, metricIds: enabledMetricIds });
    const defs = new Map(COMPARISON_METRICS.map(d => [d.id, d]));
    const rows: MetricRow[] = enabledMetricIds.map(id => {
      const def = defs.get(id);
      const aOut = aMap[id];
      const bOut = bMap[id];
      const aNum = aOut?.kind === 'number' ? aOut.value : null;
      const bNum = bOut?.kind === 'number' ? bOut.value : null;
      const abs = safeAbsDiff(aNum, bNum);
      const pct = safePercentChange(aNum, bNum);
      return {
        id,
        label: localizeMetricLabel(id, def?.label || id),
        category: def?.category || 'basic',
        a: aOut,
        b: bOut,
        abs,
        pct,
      };
    });

    const filtered = config.onlyDifferences
      ? rows.filter(
          r =>
            (r.abs != null && Math.abs(r.abs) > 0) ||
            (r.a?.kind === 'na' && r.b?.kind !== 'na') ||
            (r.b?.kind === 'na' && r.a?.kind !== 'na')
        )
      : rows;

    const sorted = [...filtered].sort((x, y) => {
      if (config.sortBy === 'label') return x.label.localeCompare(y.label);
      if (config.sortBy === 'pct') return Math.abs(y.pct || 0) - Math.abs(x.pct || 0);
      return Math.abs(y.abs || 0) - Math.abs(x.abs || 0);
    });

    return { aLabel: a.name, bLabel: b.name, rows: sorted };
  }, [config.onlyDifferences, config.sortBy, dataCompareSlices, enabledMetricIds, language]);

  const structureCompare = useMemo(() => {
    if (!dataCompareSlices) return null;
    const groupBy = config.groupBy;
    if (!groupBy) return null;
    const a = dataCompareSlices.a;
    const b = dataCompareSlices.b;
    const aCol = a.columns.find(c => c.name === groupBy);
    if (!aCol) return null;
    if (aCol.type !== 'category' && aCol.type !== 'text') return null;
    const topN = Math.max(3, config.topN || 8);
    const distA = computeCategoryDistribution({ rows: a.rows, key: groupBy, topN });
    const distB = computeCategoryDistribution({ rows: b.rows, key: groupBy, topN });
    const keys = Array.from(new Set([...distA.map(d => d.key), ...distB.map(d => d.key)]));
    const mapA = new Map(distA.map(d => [d.key, d]));
    const mapB = new Map(distB.map(d => [d.key, d]));
    const merged = keys
      .map(k => {
        const aa = mapA.get(k);
        const bb = mapB.get(k);
        const shareDiff = (bb?.share ?? 0) - (aa?.share ?? 0);
        return {
          key: k,
          countA: aa?.count ?? 0,
          shareA: aa?.share ?? 0,
          countB: bb?.count ?? 0,
          shareB: bb?.share ?? 0,
          shareDiff,
        };
      })
      .sort((x, y) => Math.abs(y.shareDiff) - Math.abs(x.shareDiff));
    return { groupBy, rows: merged };
  }, [config.groupBy, config.topN, dataCompareSlices]);

  const trendCompare = useMemo<{
    rows: { Bucket: string; Series: string; Value: number }[];
    xAxis: string;
    yAxis: string;
    groupBy: string;
    schema: InferredSchema;
  } | null>(() => {
    if (!dataCompareSlices) return null;
    const groupBy = config.groupBy;
    const valueKey = config.valueKey;
    if (!groupBy || !valueKey) return null;
    const a = dataCompareSlices.a;
    const b = dataCompareSlices.b;
    const aCol = a.columns.find(c => c.name === groupBy);
    if (!aCol || aCol.type !== 'date') return null;
    const bucket = config.dateBucket || 'day';
    const seriesA = computeTimeSeries({ rows: a.rows, dateKey: groupBy, valueKey, aggregation: 'sum', bucket });
    const seriesB = computeTimeSeries({ rows: b.rows, dateKey: groupBy, valueKey, aggregation: 'sum', bucket });
    const rows = [
      ...seriesA.map(p => ({ Bucket: p.bucket, Series: 'A', Value: p.value })),
      ...seriesB.map(p => ({ Bucket: p.bucket, Series: 'B', Value: p.value })),
    ];
    return {
      rows,
      xAxis: 'Bucket',
      yAxis: 'Value',
      groupBy: 'Series',
      schema: {
        numeric: ['Value'],
        date: ['Bucket'],
        categorical: ['Series'],
        text: [],
      },
    };
  }, [config.dateBucket, config.groupBy, config.valueKey, dataCompareSlices]);

  return {
    selectValues,
    enabledMetricIds,
    dataCompareDatasets,
    overlapInfo,
    dataCompareNumericColumns,
    groupByCandidates,
    groupOptions,
    metricDefinitions,
    dataCompareSlices,
    dataCompareMetricRows,
    structureCompare,
    trendCompare,
  };
}
