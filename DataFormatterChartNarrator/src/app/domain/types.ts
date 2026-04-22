export type ColumnType = 'numeric' | 'date' | 'category' | 'text';

export interface DataRow {
  [key: string]: string | number | null;
}

export interface ColumnInfo {
  name: string;
  type: ColumnType;
  uniqueValues?: (string | number)[];
}

export type ChartType = 'bar' | 'line' | 'pie';

export type AnalysisTarget = 'chart' | 'data';
export type AnalysisMode = 'single' | 'compare';

export interface InferredSchema {
  numeric: string[];
  date: string[];
  categorical: string[];
  text: string[];
}

export interface DatasetMeta {
  isCleaned: boolean;
  source: 'upload' | 'sample' | 'unknown';
  createdAt: number;
}

export interface Dataset {
  id: string;
  name: string;
  rawRows: DataRow[];
  processedRows: DataRow[];
  columns: ColumnInfo[];
  inferredSchema: InferredSchema;
  meta: DatasetMeta;
}

export interface AutoSelectionInfo {
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
  chartType?: ChartType;
  reason?: string;
}

export interface ChartConfig {
  chartType: ChartType;
  xAxis: string;
  yAxis: string;
  groupBy: string;
  auto?: AutoSelectionInfo;
}

export interface DataAnalysisAutoInfo {
  groupBy?: string;
  valueKey?: string;
  aggregation?: 'sum' | 'avg';
  reason?: string;
}

export interface DataAnalysisConfig {
  groupBy: string;
  valueKey: string;
  aggregation: 'sum' | 'avg';
  auto?: DataAnalysisAutoInfo;
}

export interface DataCompareAutoInfo {
  datasetAId?: string;
  datasetBId?: string;
  joinKey?: string;
  valueKey?: string;
  compareScope?: 'dataset' | 'group';
  groupBy?: string;
  groupA?: string;
  groupB?: string;
  dateBucket?: 'day' | 'month';
  metrics?: string[];
  reason?: string;
}

export interface DataComparisonConfig {
  datasetAId: string;
  datasetBId: string;
  valueKey: string;
  compareScope: 'dataset' | 'group';
  groupBy: string;
  groupA: string;
  groupB: string;
  dateBucket: 'day' | 'month';
  metrics: string[];
  view: 'cards' | 'table' | 'both';
  onlyDifferences: boolean;
  sortBy: 'abs' | 'pct' | 'label';
  topN: number;
  auto?: DataCompareAutoInfo;
}

export interface ViewState {
  analysisTarget: AnalysisTarget;
  analysisMode: AnalysisMode;
  chartSingle: ChartConfig;
  chartCompare: {
    left: ChartConfig;
    right: ChartConfig;
  };
  dataSingle: DataAnalysisConfig;
  dataCompare: DataComparisonConfig;
}

