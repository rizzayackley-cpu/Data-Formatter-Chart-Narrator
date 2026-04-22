import React, { useMemo } from 'react';
import { useDataContext } from '../context/DataContext';
import { UploadSection } from '../components/UploadSection';
import { DataPreview } from '../components/DataPreview';
import { CleaningSection } from '../components/CleaningSection';
import { ChartDisplay } from '../components/ChartDisplay';
import { ExportSection } from '../components/ExportSection';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Database, ArrowRight } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import type { ChartType } from '../domain/types';
import { computeCategoryMetrics } from '../domain/rules';

export function DataComparison() {
  const { cleanedData, isDataLoaded, columns: columnInfos, viewState, setDataComparisonConfig } = useDataContext();
  const columns = columnInfos.map(c => c.name);
  const config = viewState.dataComparison;
  const groupBySelectValue = config.groupBy || '__none__';

  // Calculate comparison metrics
  const comparisonMetrics = useMemo(() => {
    if (!isDataLoaded || !config.yAxis || cleanedData.length === 0) {
      return null;
    }

    const groupKey = config.groupBy || config.xAxis;
    if (!groupKey) return null;
    return computeCategoryMetrics({ rows: cleanedData, groupKey, valueKey: config.yAxis });
  }, [cleanedData, isDataLoaded, config.groupBy, config.xAxis, config.yAxis]);

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
          <Database className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Data Comparison</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Compare fields, categories, and numerical relationships
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <UploadSection />

      {/* Data Preview */}
      <DataPreview />

      {/* Cleaning Controls */}
      <CleaningSection />

      {/* Analysis Configuration */}
      {isDataLoaded && (
        <>
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-6">Data Comparison Configuration</h3>

            {config.auto?.reason && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">Auto-configured: {config.auto.reason}</p>
              </div>
            )}
            
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Chart Type</Label>
                <Select value={config.chartType} onValueChange={(v) => setDataComparisonConfig({ chartType: v as ChartType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="pie">Pie Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>X-Axis (Category)</Label>
                <Select value={config.xAxis} onValueChange={(v) => setDataComparisonConfig({ xAxis: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select X-Axis" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Y-Axis (Value)</Label>
                <Select value={config.yAxis} onValueChange={(v) => setDataComparisonConfig({ yAxis: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Y-Axis" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Group By (Optional)</Label>
                <Select
                  value={groupBySelectValue}
                  onValueChange={(v) => setDataComparisonConfig({ groupBy: v === '__none__' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Grouping" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Chart Display */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Comparison Visualization</h3>
            <ChartDisplay
              chartType={config.chartType}
              xAxis={config.xAxis}
              yAxis={config.yAxis}
              groupBy={config.groupBy}
            />
          </div>

          {/* Comparison Metrics */}
          {comparisonMetrics && (
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Category Comparison Metrics</h3>
              <div className="space-y-3">
                {comparisonMetrics.map((metric, idx) => (
                  <div
                    key={metric.category}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                      {idx + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{metric.category}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{metric.count} records</div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Total</div>
                        <div className="font-semibold text-gray-900">{metric.total.toFixed(0)}</div>
                      </div>
                      
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Average</div>
                        <div className="font-semibold text-blue-600">{metric.avg.toFixed(1)}</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Range</div>
                        <div className="font-semibold text-purple-600">
                          {metric.min.toFixed(0)} - {metric.max.toFixed(0)}
                        </div>
                      </div>

                      <Badge variant={idx === 0 ? "default" : "secondary"}>
                        {idx === 0 ? 'Top' : `#${idx + 1}`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Export Section */}
      <ExportSection />
    </div>
  );
}
