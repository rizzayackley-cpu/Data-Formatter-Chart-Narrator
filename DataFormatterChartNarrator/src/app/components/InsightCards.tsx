import React, { useMemo } from 'react';
import { useDataContext } from '../context/DataContext';
import { TrendingUp, TrendingDown, AlertTriangle, Award, Copy } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { computeInsightStats, inferSchemaFromColumns } from '../domain/rules';

export function InsightCards() {
  const { cleanedData, isDataLoaded, viewState, activeDataset, columns } = useDataContext();

  const insights = useMemo(() => {
    if (!isDataLoaded || cleanedData.length === 0) return null;
    const schema = activeDataset?.inferredSchema ?? inferSchemaFromColumns(columns);
    return computeInsightStats({ rows: cleanedData, schema, config: viewState.chartSingle });
  }, [cleanedData, isDataLoaded, viewState.chartSingle, activeDataset, columns]);

  const noInsightsReason = useMemo(() => {
    if (!isDataLoaded || cleanedData.length === 0) return 'No data loaded. Insights cannot be generated.';
    const schema = activeDataset?.inferredSchema ?? inferSchemaFromColumns(columns);
    if (schema.numeric.length === 0) return 'No numeric field is available for insight statistics.';
    if (!viewState.chartSingle.yAxis) return 'Y-axis is not selected (numeric field required).';
    return 'Current configuration is insufficient for insight generation.';
  }, [isDataLoaded, cleanedData, activeDataset, columns, viewState.chartSingle.yAxis]);

  const summaryText = `
Insight Summary (based on current dataset and settings):
• Dataset: ${activeDataset?.name || 'Unnamed'}
• Y-axis: ${insights?.basis.yAxis || '-'}
• Grouping: ${insights?.basis.groupBy || insights?.basis.xAxis || '-'}
• Aggregation: ${insights?.basis.aggregation === 'sum' ? 'Grouped sum' : 'Raw series'}
• Total: ${insights ? insights.total.toFixed(2) : '-'}
• Average: ${insights ? insights.avg.toFixed(2) : '-'}
• Maximum: ${insights ? insights.max.toFixed(2) : '-'}
• Minimum: ${insights ? insights.min.toFixed(2) : '-'}
• Data Points: ${insights ? insights.count : '-'}
${insights?.topCategory ? `• Top Category: ${insights.topCategory.key} (${insights.topCategory.total.toFixed(2)}) by ${insights.topCategory.by}` : ''}
• Trend: ${insights ? (insights.trend === 'up' ? 'Increasing' : insights.trend === 'down' ? 'Decreasing' : 'Flat') : '-'}
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    toast.success('Summary copied to clipboard');
  };

  return (
    <div className="space-y-4">
      {!insights && (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
            Auto-Generated Insights
          </h3>
          <p className="text-sm text-gray-600">{noInsightsReason}</p>
        </div>
      )}

      {/* KPI Cards */}
      {insights && (
        <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="text-sm text-blue-700 font-medium mb-1">Total</div>
          <div className="text-2xl font-bold text-blue-900">{insights.total.toFixed(0)}</div>
          <div className="text-xs text-blue-600 mt-1">{insights.targetColumn}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="text-sm text-purple-700 font-medium mb-1">Average</div>
          <div className="text-2xl font-bold text-purple-900">{insights.avg.toFixed(1)}</div>
          <div className="text-xs text-purple-600 mt-1">Mean value</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="text-sm text-green-700 font-medium mb-1">Maximum</div>
          <div className="text-2xl font-bold text-green-900">{insights.max.toFixed(0)}</div>
          <div className="text-xs text-green-600 mt-1">Peak value</div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
          <div className="text-sm text-amber-700 font-medium mb-1">Minimum</div>
          <div className="text-2xl font-bold text-amber-900">{insights.min.toFixed(0)}</div>
          <div className="text-xs text-amber-600 mt-1">Lowest value</div>
        </div>
      </div>
      )}

      {/* Insight Summary */}
      {insights && (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
            Auto-Generated Insights
          </h3>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-2">
            <Copy className="w-4 h-4" />
            Copy
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">
                For metric <span className="font-semibold">{insights.targetColumn}</span>, total is{' '}
                <span className="font-semibold">{insights.total.toFixed(2)}</span> and average is{' '}
                <span className="font-semibold">{insights.avg.toFixed(2)}</span>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <Award className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">
                Maximum is <span className="font-semibold">{insights.max.toFixed(2)}</span> and minimum is{' '}
                <span className="font-semibold">{insights.min.toFixed(2)}</span>.
              </p>
            </div>
          </div>

          {insights.topCategory && (
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <Award className="w-5 h-5 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  In grouping field <span className="font-semibold">{insights.topCategory.by}</span>, the highest total is{' '}
                  <span className="font-semibold">{insights.topCategory.key}</span> with{' '}
                  <span className="font-semibold">{insights.topCategory.total.toFixed(2)}</span>.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
            {insights.trend === 'up' ? (
              <TrendingUp className="w-5 h-5 text-amber-600 mt-0.5" />
            ) : insights.trend === 'down' ? (
              <TrendingDown className="w-5 h-5 text-amber-600 mt-0.5" />
            ) : (
              <TrendingUp className="w-5 h-5 text-amber-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm text-gray-900">
                The data sequence shows a{' '}
                <span className="font-semibold">
                  {insights.trend === 'up' ? 'rising' : insights.trend === 'down' ? 'falling' : 'relatively stable'}
                </span>{' '}
                trend from start to end (based only on current sequence order).
              </p>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
          <Badge variant="outline" className="text-xs">
            Dataset: {activeDataset?.name || 'Unnamed'}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Metric: {insights.basis.yAxis}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Grouping: {insights.basis.groupBy || insights.basis.xAxis || '-'}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Aggregation: {insights.basis.aggregation === 'sum' ? 'sum' : 'raw'}
          </Badge>
        </div>
      </div>
      )}
    </div>
  );
}
