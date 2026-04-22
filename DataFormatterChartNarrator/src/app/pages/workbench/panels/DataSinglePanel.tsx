import React, { useMemo } from 'react';
import { DataPreview } from '../../../components/DataPreview';
import { CleaningSection } from '../../../components/CleaningSection';
import { ChartDisplay } from '../../../components/ChartDisplay';
import { Badge } from '../../../components/ui/badge';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Sigma } from 'lucide-react';
import type { ChartType, DataRow, InferredSchema } from '../../../domain/types';
import { computeCategoryMetrics } from '../../../domain/rules';
import { useDataContext } from '../../../context/DataContext';
import { useLanguage } from '../../../context/LanguageContext';

export function DataSinglePanel() {
  const { activeDataset, cleanedData, columns, isDataLoaded, viewState, setDataSingleConfig } = useDataContext();
  const { language } = useLanguage();
  const isZh = language === 'zh';

  const fieldRows = useMemo(() => {
    if (!activeDataset) return [];
    const countMissing = (rows: DataRow[], key: string) => rows.filter(r => r[key] == null || r[key] === '').length;
    return activeDataset.columns.map(c => ({
      name: c.name,
      type: c.type,
      uniqueSample: c.uniqueValues?.length ?? 0,
      missingRaw: countMissing(activeDataset.rawRows, c.name),
      missingProcessed: countMissing(activeDataset.processedRows, c.name),
    }));
  }, [activeDataset]);

  const dataSingleGroupValue = viewState.dataSingle.groupBy || '__none__';

  const dataSingleMetrics = useMemo(() => {
    if (!isDataLoaded) return null;
    if (!viewState.dataSingle.groupBy || !viewState.dataSingle.valueKey) return null;
    const metrics = computeCategoryMetrics({
      rows: cleanedData,
      groupKey: viewState.dataSingle.groupBy,
      valueKey: viewState.dataSingle.valueKey,
    });
    return metrics.slice(0, 12);
  }, [cleanedData, isDataLoaded, viewState.dataSingle.groupBy, viewState.dataSingle.valueKey]);

  const dataSingleChart = useMemo<{
    chartType: ChartType;
    xAxis: string;
    yAxis: string;
    rows: DataRow[];
    schema: InferredSchema;
  } | null>(() => {
    if (!isDataLoaded) return null;
    if (!activeDataset) return null;
    if (!dataSingleMetrics || dataSingleMetrics.length === 0) return null;
    const groupBy = viewState.dataSingle.groupBy;
    const valueKey = viewState.dataSingle.valueKey;
    if (!groupBy || !valueKey) return null;
    const isDate = activeDataset.inferredSchema.date.includes(groupBy);
    const rows: DataRow[] = dataSingleMetrics.map(m => ({
      [groupBy]: m.category,
      [valueKey]: viewState.dataSingle.aggregation === 'sum' ? m.total : m.avg,
    }));
    return {
      chartType: isDate ? 'line' : 'bar',
      xAxis: groupBy,
      yAxis: valueKey,
      rows,
      schema: {
        numeric: [valueKey],
        date: isDate ? [groupBy] : [],
        categorical: isDate ? [] : [groupBy],
        text: [],
      },
    };
  }, [activeDataset, dataSingleMetrics, isDataLoaded, viewState.dataSingle.aggregation, viewState.dataSingle.groupBy, viewState.dataSingle.valueKey]);

  return (
    <>
      <DataPreview />
      <CleaningSection />

      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">{isZh ? '字段分析' : 'Field Analysis'}</h3>
        {!isDataLoaded ? (
          <p className="text-sm text-gray-600">{isZh ? '未加载数据，无法生成字段统计' : 'No data loaded. Field statistics are unavailable.'}</p>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isZh ? '字段' : 'Field'}</TableHead>
                    <TableHead>{isZh ? '类型' : 'Type'}</TableHead>
                    <TableHead>{isZh ? '唯一值(样本)' : 'Unique Values (sample)'}</TableHead>
                    <TableHead>{isZh ? '缺失(原始)' : 'Missing (raw)'}</TableHead>
                    <TableHead>{isZh ? '缺失(清洗后)' : 'Missing (cleaned)'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fieldRows.slice(0, 20).map(r => (
                    <TableRow key={r.name}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.type}</TableCell>
                      <TableCell>{r.uniqueSample}</TableCell>
                      <TableCell>{r.missingRaw}</TableCell>
                      <TableCell>{r.missingProcessed}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Sigma className="h-5 w-5 text-purple-600" />
            {isZh ? '分组聚合' : 'Group Aggregation'}
          </h3>
          {viewState.dataSingle.auto?.reason && (
            <Badge variant="outline" className="text-xs">
              {isZh ? '已应用默认聚合配置' : 'Default aggregation settings applied'}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Group By</Label>
            <Select value={dataSingleGroupValue} onValueChange={v => setDataSingleConfig({ groupBy: v === '__none__' ? '' : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Grouping" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {columns.map(c => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Value</Label>
            <Select value={viewState.dataSingle.valueKey} onValueChange={v => setDataSingleConfig({ valueKey: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Metric" />
              </SelectTrigger>
              <SelectContent>
                {activeDataset?.inferredSchema.numeric.map(c => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Aggregation</Label>
            <Select
              value={viewState.dataSingle.aggregation}
              onValueChange={v => setDataSingleConfig({ aggregation: v === 'avg' ? 'avg' : 'sum' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sum">sum</SelectItem>
                <SelectItem value="avg">avg</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6">
          {!isDataLoaded ? (
            <p className="text-sm text-gray-600">{isZh ? '未加载数据，无法生成聚合统计' : 'No data loaded. Aggregation is unavailable.'}</p>
          ) : !viewState.dataSingle.valueKey ? (
            <p className="text-sm text-gray-600">{isZh ? '未检测到可用的数值指标列' : 'No numeric metric field detected.'}</p>
          ) : !viewState.dataSingle.groupBy ? (
            <p className="text-sm text-gray-600">{isZh ? '未选择分组字段，无法生成分组聚合结果' : 'Select a group field to generate grouped results.'}</p>
          ) : !dataSingleMetrics || dataSingleMetrics.length === 0 ? (
            <p className="text-sm text-gray-600">{isZh ? '当前配置无可展示结果' : 'No results available for the current configuration.'}</p>
          ) : (
            <>
              {dataSingleChart && (
                <div className="mb-6">
                  <div className="text-sm font-medium text-gray-700 mb-2">{isZh ? '聚合图表' : 'Aggregation Chart'}</div>
                  <ChartDisplay
                    chartType={dataSingleChart.chartType}
                    xAxis={dataSingleChart.xAxis}
                    yAxis={dataSingleChart.yAxis}
                    groupBy=""
                    rows={dataSingleChart.rows}
                    schema={dataSingleChart.schema}
                  />
                </div>
              )}

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isZh ? '分组' : 'Group'}</TableHead>
                        <TableHead>{viewState.dataSingle.aggregation === 'sum' ? 'Total' : 'Average'}</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>Min</TableHead>
                        <TableHead>Max</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataSingleMetrics.map(m => (
                        <TableRow key={m.category}>
                          <TableCell className="font-medium">{m.category}</TableCell>
                          <TableCell>
                            {viewState.dataSingle.aggregation === 'sum' ? m.total.toFixed(2) : m.avg.toFixed(2)}
                          </TableCell>
                          <TableCell>{m.count}</TableCell>
                          <TableCell>{m.min.toFixed(2)}</TableCell>
                          <TableCell>{m.max.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
