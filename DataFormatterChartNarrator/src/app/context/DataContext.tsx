import React, { createContext, useContext, useMemo, useState, ReactNode, useCallback } from 'react';
import type { AnalysisMode, AnalysisTarget, ChartConfig, ColumnInfo, DataAnalysisConfig, DataComparisonConfig, DataRow, Dataset, ViewState } from '../domain/types';
import { ensureChartConfigValid, getDefaultChartConfig, inferSchemaFromColumns } from '../domain/rules';
import { getDefaultMetricIds } from '../domain/comparison';

export interface DataContextType {
  datasets: Dataset[];
  activeDatasetId: string | null;
  activeDataset: Dataset | null;
  viewState: ViewState;
  isLoading: boolean;
  uploadError: string | null;
  setIsLoading: (loading: boolean) => void;
  setUploadError: (error: string | null) => void;
  addDataset: (dataset: Dataset, options?: { setActive?: boolean }) => void;
  setActiveDatasetId: (id: string | null) => void;
  updateActiveDataset: (patch: Partial<Dataset>) => void;
  updateActiveDatasetProcessedRows: (rows: DataRow[], meta?: Partial<Dataset['meta']>) => void;
  resetData: () => void;
  setAnalysisTarget: (target: AnalysisTarget) => void;
  setAnalysisMode: (mode: AnalysisMode) => void;
  setChartSingleConfig: (patch: Partial<ChartConfig>) => void;
  setChartCompareConfig: (side: 'left' | 'right', patch: Partial<ChartConfig>) => void;
  setDataSingleConfig: (patch: Partial<DataAnalysisConfig>) => void;
  setDataCompareConfig: (patch: Partial<DataComparisonConfig>) => void;

  rawData: DataRow[];
  cleanedData: DataRow[];
  fileName: string;
  isDataLoaded: boolean;
  isCleaned: boolean;
  columns: ColumnInfo[];
  numericColumns: string[];
  categoryColumns: string[];
  dateColumns: string[];
  textColumns: string[];
  setRawData: (data: DataRow[]) => void;
  setCleanedData: (data: DataRow[]) => void;
  setFileName: (name: string) => void;
  setIsDataLoaded: (loaded: boolean) => void;
  setIsCleaned: (cleaned: boolean) => void;
  setColumns: (columns: ColumnInfo[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function detectColumnType(values: (string | number | null)[]): ColumnInfo['type'] {
  const nonNullValues = values.filter(v => v != null && v !== '');
  if (nonNullValues.length === 0) return 'text';

  const sampleSize = Math.min(nonNullValues.length, 100);
  const sample = nonNullValues.slice(0, sampleSize);

  const numericCount = sample.filter(v => typeof v === 'number' || (!isNaN(Number(v)) && String(v).trim() !== '')).length;
  if (numericCount / sampleSize > 0.8) return 'numeric';

  const dateCount = sample.filter(v => {
    if (typeof v === 'number') return false;
    const date = new Date(String(v));
    return !isNaN(date.getTime()) && String(v).length > 4;
  }).length;
  if (dateCount / sampleSize > 0.8) return 'date';

  const uniqueRatio = new Set(sample.map(String)).size / sampleSize;
  if (uniqueRatio < 0.5) return 'category';

  return 'text';
}

function preprocessData(data: DataRow[]): { processed: DataRow[]; columns: ColumnInfo[] } {
  if (data.length === 0) return { processed: [], columns: [] };

  const columns = Object.keys(data[0]);
  const columnInfos: ColumnInfo[] = [];
  const processed: DataRow[] = data.map(row => {
    const newRow: DataRow = {};
    columns.forEach(col => {
      let value = row[col];

      if (typeof value === 'string') {
        value = value.trim();

        const numValue = Number(value);
        if (!isNaN(numValue) && value !== '') {
          newRow[col] = numValue;
        } else {
          const dateValue = new Date(value);
          if (!isNaN(dateValue.getTime()) && value.length > 4 && /\d{4}/.test(value)) {
            newRow[col] = value;
          } else {
            newRow[col] = value;
          }
        }
      } else {
        newRow[col] = value;
      }
    });
    return newRow;
  });

  columns.forEach(col => {
    const values = processed.map(row => row[col]);
    const type = detectColumnType(values);
    const uniqueValues = [...new Set(values.filter(v => v != null).map(String))];
    columnInfos.push({ name: col, type, uniqueValues: uniqueValues.slice(0, 50) });
  });

  return { processed, columns: columnInfos };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);

  const emptyChartConfig: ChartConfig = useMemo(() => ({ chartType: 'bar', xAxis: '', yAxis: '', groupBy: '' }), []);
  const emptyDataSingle: DataAnalysisConfig = useMemo(() => ({ groupBy: '', valueKey: '', aggregation: 'sum' }), []);
  const emptyDataCompare: DataComparisonConfig = useMemo(() => ({
    datasetAId: '',
    datasetBId: '',
    valueKey: '',
    compareScope: 'dataset',
    groupBy: '',
    groupA: '',
    groupB: '',
    dateBucket: 'day',
    metrics: [],
    view: 'both',
    onlyDifferences: false,
    sortBy: 'abs',
    topN: 8,
  }), []);
  const [viewState, setViewState] = useState<ViewState>(() => ({
    analysisTarget: 'chart',
    analysisMode: 'single',
    chartSingle: emptyChartConfig,
    chartCompare: { left: emptyChartConfig, right: emptyChartConfig },
    dataSingle: emptyDataSingle,
    dataCompare: emptyDataCompare,
  }));

  const activeDataset = useMemo(() => {
    if (!activeDatasetId) return null;
    return datasets.find(d => d.id === activeDatasetId) || null;
  }, [datasets, activeDatasetId]);

  const rawData = activeDataset?.rawRows ?? [];
  const cleanedData = activeDataset?.processedRows ?? [];
  const fileName = activeDataset?.name ?? '';
  const isDataLoaded = !!activeDataset && cleanedData.length > 0;
  const isCleaned = !!activeDataset && !!activeDataset.meta?.isCleaned;
  const columns = activeDataset?.columns ?? [];

  const numericColumns = useMemo(() => columns.filter(c => c.type === 'numeric').map(c => c.name), [columns]);
  const categoryColumns = useMemo(() => columns.filter(c => c.type === 'category').map(c => c.name), [columns]);
  const dateColumns = useMemo(() => columns.filter(c => c.type === 'date').map(c => c.name), [columns]);
  const textColumns = useMemo(() => columns.filter(c => c.type === 'text').map(c => c.name), [columns]);

  const applyAutoConfigsForActiveDataset = useCallback((dataset: Dataset) => {
    const schema = dataset.inferredSchema;
    const allColumns = dataset.columns.map(c => c.name);
    const base = getDefaultChartConfig(schema).config;

    const chartSingle = ensureChartConfigValid({ config: { ...base }, schema, columns: allColumns }).config;
    const left = ensureChartConfigValid({ config: { ...base }, schema, columns: allColumns }).config;
    const rightSeed: ChartConfig = { ...base };
    if (schema.numeric.length > 1) rightSeed.yAxis = schema.numeric[1];
    else if (schema.categorical.length > 1) rightSeed.xAxis = schema.categorical[1];
    const right = ensureChartConfigValid({ config: rightSeed, schema, columns: allColumns }).config;

    const groupBy = schema.categorical[0] || schema.text[0] || '';
    const valueKey = schema.numeric[0] || '';
    const dataSingle: DataAnalysisConfig = {
      groupBy,
      valueKey,
      aggregation: 'sum',
      auto: {
        groupBy,
        valueKey,
        aggregation: 'sum',
        reason: [groupBy ? `group = ${groupBy}` : 'no groupable field detected', valueKey ? `metric = ${valueKey}` : 'no numeric metric field detected', 'aggregation = sum'].join('; '),
      },
    };

    const dataCompare: DataComparisonConfig = {
      datasetAId: dataset.id,
      datasetBId: '',
      valueKey,
      compareScope: 'dataset',
      groupBy: '',
      groupA: '',
      groupB: '',
      dateBucket: 'day',
      metrics: getDefaultMetricIds({ valueKey, columns: dataset.columns }),
      view: 'both',
      onlyDifferences: false,
      sortBy: 'abs',
      topN: 8,
      auto: {
        datasetAId: dataset.id,
        valueKey,
        compareScope: 'dataset',
        metrics: getDefaultMetricIds({ valueKey, columns: dataset.columns }),
        reason: 'Default metric set selected. You can refine by grouping/time or change the metric field.',
      },
    };

    setViewState(prev => ({
      ...prev,
      chartSingle,
      chartCompare: { left, right },
      dataSingle,
      dataCompare: {
        ...prev.dataCompare,
        datasetAId: prev.dataCompare.datasetAId || dataset.id,
        valueKey: prev.dataCompare.valueKey || dataCompare.valueKey,
        compareScope: prev.dataCompare.compareScope || dataCompare.compareScope,
        dateBucket: prev.dataCompare.dateBucket || dataCompare.dateBucket,
        metrics: prev.dataCompare.metrics && prev.dataCompare.metrics.length > 0 ? prev.dataCompare.metrics : dataCompare.metrics,
        view: prev.dataCompare.view || dataCompare.view,
        onlyDifferences: typeof prev.dataCompare.onlyDifferences === 'boolean' ? prev.dataCompare.onlyDifferences : dataCompare.onlyDifferences,
        sortBy: prev.dataCompare.sortBy || dataCompare.sortBy,
        topN: prev.dataCompare.topN || dataCompare.topN,
        auto: dataCompare.auto,
      },
    }));
  }, []);

  const resetData = useCallback(() => {
    setDatasets([]);
    setActiveDatasetId(null);
    setUploadError(null);
    setViewState({
      analysisTarget: 'chart',
      analysisMode: 'single',
      chartSingle: emptyChartConfig,
      chartCompare: { left: emptyChartConfig, right: emptyChartConfig },
      dataSingle: emptyDataSingle,
      dataCompare: emptyDataCompare,
    });
  }, []);

  const addDataset = useCallback((dataset: Dataset, options?: { setActive?: boolean }) => {
    setDatasets(prev => [...prev, dataset]);
    if (options?.setActive !== false) {
      setActiveDatasetId(dataset.id);
      applyAutoConfigsForActiveDataset(dataset);
    }
  }, [applyAutoConfigsForActiveDataset]);

  const updateActiveDataset = useCallback((patch: Partial<Dataset>) => {
    setDatasets(prev =>
      prev.map(d => (d.id === activeDatasetId ? { ...d, ...patch } : d))
    );
  }, [activeDatasetId]);

  const updateActiveDatasetProcessedRows = useCallback((rows: DataRow[], meta?: Partial<Dataset['meta']>) => {
    if (!activeDatasetId) return;
    const { processed, columns: nextColumns } = preprocessData(rows);
    const inferredSchema = inferSchemaFromColumns(nextColumns);
    setDatasets(prev =>
      prev.map(d => {
        if (d.id !== activeDatasetId) return d;
        const next: Dataset = {
          ...d,
          processedRows: processed,
          columns: nextColumns,
          inferredSchema,
          meta: { ...d.meta, ...meta },
        };
        const allColumns = next.columns.map(c => c.name);
        const fixChart = (cfg: ChartConfig) => ensureChartConfigValid({ config: cfg, schema: inferredSchema, columns: allColumns }).config;

        const fixDataSingle = (cfg: DataAnalysisConfig): DataAnalysisConfig => {
          let groupBy = cfg.groupBy;
          let valueKey = cfg.valueKey;
          let changed = false;

          if (groupBy && !allColumns.includes(groupBy)) {
            groupBy = '';
            changed = true;
          }
          if (valueKey && !allColumns.includes(valueKey)) {
            valueKey = '';
            changed = true;
          }
          if (!groupBy) {
            groupBy = inferredSchema.categorical[0] || inferredSchema.text[0] || '';
            if (groupBy) changed = true;
          }
          if (!valueKey) {
            valueKey = inferredSchema.numeric[0] || '';
            if (valueKey) changed = true;
          }
          const nextCfg: DataAnalysisConfig = { ...cfg, groupBy, valueKey };
          if (changed) {
            nextCfg.auto = {
              groupBy,
              valueKey,
              aggregation: nextCfg.aggregation,
              reason: [groupBy ? `group = ${groupBy}` : 'no groupable field detected', valueKey ? `metric = ${valueKey}` : 'no numeric metric field detected', `aggregation = ${nextCfg.aggregation}`].join('; '),
            };
          }
          return nextCfg;
        };

        const fixDataCompare = (cfg: DataComparisonConfig): DataComparisonConfig => {
          const nextCfg: DataComparisonConfig = { ...cfg };
          if (nextCfg.datasetAId === '') nextCfg.datasetAId = activeDatasetId;
          if (nextCfg.valueKey && !allColumns.includes(nextCfg.valueKey)) nextCfg.valueKey = '';
          if (!nextCfg.valueKey) nextCfg.valueKey = inferredSchema.numeric[0] || '';
          if (!nextCfg.metrics || nextCfg.metrics.length === 0) {
            nextCfg.metrics = getDefaultMetricIds({ valueKey: nextCfg.valueKey, columns: next.columns });
          }
          return nextCfg;
        };

        setViewState(prevView => ({
          ...prevView,
          chartSingle: fixChart(prevView.chartSingle),
          chartCompare: { left: fixChart(prevView.chartCompare.left), right: fixChart(prevView.chartCompare.right) },
          dataSingle: fixDataSingle(prevView.dataSingle),
          dataCompare: fixDataCompare(prevView.dataCompare),
        }));
        return next;
      })
    );
  }, [activeDatasetId]);

  const setAnalysisTarget = useCallback((target: AnalysisTarget) => {
    setViewState(prev => ({ ...prev, analysisTarget: target }));
  }, []);

  const setAnalysisMode = useCallback((mode: AnalysisMode) => {
    if (!activeDataset) {
      setViewState(prev => ({ ...prev, analysisMode: mode }));
      return;
    }

    setViewState(prev => {
      const next: ViewState = { ...prev, analysisMode: mode };

      if (prev.analysisTarget === 'chart' && prev.analysisMode === 'single' && mode === 'compare') {
        next.chartCompare = {
          left: { ...prev.chartSingle },
          right: prev.chartCompare.right.xAxis || prev.chartCompare.right.yAxis ? prev.chartCompare.right : getDefaultChartConfig(activeDataset.inferredSchema).config,
        };
      }

      if (prev.analysisTarget === 'data' && prev.analysisMode === 'single' && mode === 'compare') {
        next.dataCompare = { ...prev.dataCompare, datasetAId: activeDataset.id || prev.dataCompare.datasetAId };
      }

      return next;
    });
  }, [activeDataset]);

  const setChartSingleConfig = useCallback((patch: Partial<ChartConfig>) => {
    setViewState(prev => ({ ...prev, chartSingle: { ...prev.chartSingle, ...patch, auto: undefined } }));
  }, []);

  const setChartCompareConfig = useCallback((side: 'left' | 'right', patch: Partial<ChartConfig>) => {
    setViewState(prev => ({
      ...prev,
      chartCompare: { ...prev.chartCompare, [side]: { ...prev.chartCompare[side], ...patch, auto: undefined } },
    }));
  }, []);

  const setDataSingleConfig = useCallback((patch: Partial<DataAnalysisConfig>) => {
    setViewState(prev => ({ ...prev, dataSingle: { ...prev.dataSingle, ...patch, auto: undefined } }));
  }, []);

  const setDataCompareConfig = useCallback((patch: Partial<DataComparisonConfig>) => {
    setViewState(prev => ({ ...prev, dataCompare: { ...prev.dataCompare, ...patch, auto: undefined } }));
  }, []);

  const setRawData = useCallback((data: DataRow[]) => {
    if (!activeDatasetId) return;
    const { processed, columns: nextColumns } = preprocessData(data);
    const inferredSchema = inferSchemaFromColumns(nextColumns);
    setDatasets(prev =>
      prev.map(d =>
        d.id === activeDatasetId
          ? { ...d, rawRows: data, processedRows: processed, columns: nextColumns, inferredSchema }
          : d
      )
    );
  }, [activeDatasetId]);

  const setCleanedData = useCallback((data: DataRow[]) => {
    updateActiveDatasetProcessedRows(data, { isCleaned: true });
  }, [updateActiveDatasetProcessedRows]);

  const setFileName = useCallback((name: string) => {
    updateActiveDataset({ name });
  }, [updateActiveDataset]);

  const setIsDataLoaded = useCallback((loaded: boolean) => {
    if (loaded) return;
    resetData();
  }, [resetData]);

  const setIsCleaned = useCallback((cleaned: boolean) => {
    updateActiveDataset({ meta: { ...(activeDataset?.meta || { isCleaned: false, source: 'unknown', createdAt: Date.now() }), isCleaned: cleaned } });
  }, [activeDataset, updateActiveDataset]);

  const setColumns = useCallback((nextColumns: ColumnInfo[]) => {
    const inferredSchema = inferSchemaFromColumns(nextColumns);
    updateActiveDataset({ columns: nextColumns, inferredSchema });
  }, [updateActiveDataset]);

  return (
    <DataContext.Provider
      value={{
        datasets,
        activeDatasetId,
        activeDataset,
        viewState,
        isLoading,
        uploadError,
        setIsLoading,
        setUploadError,
        addDataset,
        setActiveDatasetId,
        updateActiveDataset,
        updateActiveDatasetProcessedRows,
        resetData,
        setAnalysisTarget,
        setAnalysisMode,
        setChartSingleConfig,
        setChartCompareConfig,
        setDataSingleConfig,
        setDataCompareConfig,

        rawData,
        cleanedData,
        fileName,
        isDataLoaded,
        isCleaned,
        columns,
        numericColumns,
        categoryColumns,
        dateColumns,
        textColumns,
        setRawData,
        setCleanedData,
        setFileName,
        setIsDataLoaded,
        setIsCleaned,
        setColumns,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within DataProvider');
  }
  return context;
}

export { preprocessData, detectColumnType };
