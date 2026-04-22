import React from 'react';
import { useDataContext } from '../context/DataContext';
import { UploadSection } from '../components/UploadSection';
import { DataPreview } from '../components/DataPreview';
import { CleaningSection } from '../components/CleaningSection';
import { ChartDisplay } from '../components/ChartDisplay';
import { InsightCards } from '../components/InsightCards';
import { ExportSection } from '../components/ExportSection';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Lightbulb } from 'lucide-react';
import type { ChartType } from '../domain/types';

export function InsightSummary() {
  const { isDataLoaded, columns: columnInfos, viewState, setInsightSummaryConfig, activeDataset } = useDataContext();
  const columns = columnInfos.map(c => c.name);
  const config = viewState.insightSummary;
  const datasetName = activeDataset?.name || 'Unnamed dataset';

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
          <Lightbulb className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Insight & Summary</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Auto-generate annotations and narrative summaries
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <UploadSection />

      {/* Data Preview */}
      <DataPreview />

      {/* Cleaning Controls */}
      <CleaningSection />

      {/* Chart Configuration */}
      {isDataLoaded && (
        <>
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-6">Visualization Configuration</h3>

            {config.auto?.reason && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">Auto-configured: {config.auto.reason}</p>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Chart Type</Label>
                <Select value={config.chartType} onValueChange={(v) => setInsightSummaryConfig({ chartType: v as ChartType })}>
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
                <Label>X-Axis</Label>
                <Select value={config.xAxis} onValueChange={(v) => setInsightSummaryConfig({ xAxis: v })}>
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
                <Label>Y-Axis</Label>
                <Select value={config.yAxis} onValueChange={(v) => setInsightSummaryConfig({ yAxis: v })}>
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
            </div>
          </div>

          {/* Chart & Insights Combined */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart Display */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Data Visualization</h3>
              <ChartDisplay
                chartType={config.chartType}
                xAxis={config.xAxis}
                yAxis={config.yAxis}
                groupBy={config.groupBy}
              />
            </div>

            {/* Quick Insights */}
            <div className="space-y-4">
              <InsightCards />
            </div>
          </div>

          {/* Detailed Insights */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 p-8 shadow-sm">
            <div className="max-w-4xl mx-auto">
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">
                📊 Narrative Summary
              </h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  Conclusions are based on dataset <strong>{datasetName}</strong> and current visualization settings (chart type{' '}
                  <strong>{config.chartType}</strong>, X-axis <strong>{config.xAxis || 'Not selected'}</strong>, Y-axis{' '}
                  <strong>{config.yAxis || 'Not selected'}</strong>).
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  If no valid numeric field exists, or current filtering yields empty results, the app explains the reason
                  and avoids unsupported conclusions. You can switch field combinations to explore better dimensions and
                  metric definitions.
                </p>
                <div className="mt-6 p-4 bg-white/70 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 italic mb-2">
                    💡 <strong>Recommendation:</strong>
                  </p>
                  <p className="text-sm text-gray-700">
                    For deeper analysis, use Visual Comparison or Data Comparison with different fields/groupings to verify
                    whether conclusions remain consistent under different definitions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Export Section */}
      <ExportSection />
    </div>
  );
}
