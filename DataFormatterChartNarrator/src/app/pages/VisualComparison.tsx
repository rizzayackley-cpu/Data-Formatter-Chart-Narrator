import React from 'react';
import { useDataContext } from '../context/DataContext';
import { UploadSection } from '../components/UploadSection';
import { DataPreview } from '../components/DataPreview';
import { CleaningSection } from '../components/CleaningSection';
import { ChartDisplay } from '../components/ChartDisplay';
import { ExportSection } from '../components/ExportSection';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { BarChart3 } from 'lucide-react';
import type { ChartType } from '../domain/types';

export function VisualComparison() {
  const { isDataLoaded, columns: columnInfos, viewState, setVisualComparisonConfig } = useDataContext();
  const columns = columnInfos.map(c => c.name);
  const left = viewState.visualComparison.left;
  const right = viewState.visualComparison.right;

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Visual Comparison</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Compare two charts or filtered results side by side
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <UploadSection />

      {/* Data Preview */}
      <DataPreview />

      {/* Cleaning Controls */}
      <CleaningSection />

      {/* Chart Configuration & Display */}
      {isDataLoaded && (
        <>
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-6">Chart Comparison Configuration</h3>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Chart 1 Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-700">Chart 1</h4>
                  <Select value={left.chartType} onValueChange={(v) => setVisualComparisonConfig('left', { chartType: v as ChartType })}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {left.auto?.reason && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-900">Auto-configured: {left.auto.reason}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>X-Axis</Label>
                  <Select value={left.xAxis} onValueChange={(v) => setVisualComparisonConfig('left', { xAxis: v })}>
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
                  <Select value={left.yAxis} onValueChange={(v) => setVisualComparisonConfig('left', { yAxis: v })}>
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

              {/* Chart 2 Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-700">Chart 2</h4>
                  <Select value={right.chartType} onValueChange={(v) => setVisualComparisonConfig('right', { chartType: v as ChartType })}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {right.auto?.reason && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-900">Auto-configured: {right.auto.reason}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>X-Axis</Label>
                  <Select value={right.xAxis} onValueChange={(v) => setVisualComparisonConfig('right', { xAxis: v })}>
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
                  <Select value={right.yAxis} onValueChange={(v) => setVisualComparisonConfig('right', { yAxis: v })}>
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
          </div>

          {/* Charts Display */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="mb-3 text-sm font-medium text-gray-700">Chart 1 Preview</div>
              <ChartDisplay
                chartType={left.chartType}
                xAxis={left.xAxis}
                yAxis={left.yAxis}
                groupBy={left.groupBy}
              />
            </div>
            <div>
              <div className="mb-3 text-sm font-medium text-gray-700">Chart 2 Preview</div>
              <ChartDisplay
                chartType={right.chartType}
                xAxis={right.xAxis}
                yAxis={right.yAxis}
                groupBy={right.groupBy}
              />
            </div>
          </div>
        </>
      )}

      {/* Export Section */}
      <ExportSection />
    </div>
  );
}
