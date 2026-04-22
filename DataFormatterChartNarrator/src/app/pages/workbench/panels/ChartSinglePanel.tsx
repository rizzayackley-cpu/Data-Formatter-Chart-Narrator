import React from 'react';
import { ChartDisplay } from '../../../components/ChartDisplay';
import { InsightCards } from '../../../components/InsightCards';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useDataContext } from '../../../context/DataContext';
import { useLanguage } from '../../../context/LanguageContext';
import { toChartType } from '../utils';

export function ChartSinglePanel() {
  const { columns, isDataLoaded, viewState, setChartSingleConfig, activeDataset } = useDataContext();
  const { language } = useLanguage();
  const isZh = language === 'zh';

  return (
    <>
      {viewState.chartSingle.auto?.reason && (
        <div className="bg-white rounded-2xl border-2 border-blue-200 p-6 shadow-sm">
          <p className="text-sm text-blue-900">{isZh ? '系统已自动完成推荐配置' : 'The system has applied recommended defaults automatically.'}</p>
        </div>
      )}

      {isDataLoaded && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-6">{isZh ? '图表配置' : 'Chart Settings'}</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{isZh ? '图表类型' : 'Chart Type'}</Label>
              <Select
                value={viewState.chartSingle.chartType}
                onValueChange={v => setChartSingleConfig({ chartType: toChartType(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">{isZh ? '柱状图' : 'Bar Chart'}</SelectItem>
                  <SelectItem value="line">{isZh ? '折线图' : 'Line Chart'}</SelectItem>
                  <SelectItem value="pie">{isZh ? '饼图' : 'Pie Chart'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isZh ? 'X 轴' : 'X-Axis'}</Label>
              <Select value={viewState.chartSingle.xAxis} onValueChange={v => setChartSingleConfig({ xAxis: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={isZh ? '选择 X 轴' : 'Select X-Axis'} />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col.name} value={col.name}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isZh ? 'Y 轴' : 'Y-Axis'}</Label>
              <Select value={viewState.chartSingle.yAxis} onValueChange={v => setChartSingleConfig({ yAxis: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={isZh ? '选择 Y 轴' : 'Select Y-Axis'} />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col.name} value={col.name}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isZh ? '分组（可选）' : 'Group By (Optional)'}</Label>
              <Select
                value={viewState.chartSingle.groupBy || '__none__'}
                onValueChange={v => setChartSingleConfig({ groupBy: v === '__none__' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isZh ? '选择分组字段' : 'Select Grouping'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{isZh ? '无' : 'None'}</SelectItem>
                  {columns.map(col => (
                    <SelectItem key={col.name} value={col.name}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">{isZh ? '图表预览' : 'Chart Preview'}</h3>
          <ChartDisplay
            chartType={viewState.chartSingle.chartType}
            xAxis={viewState.chartSingle.xAxis}
            yAxis={viewState.chartSingle.yAxis}
            groupBy={viewState.chartSingle.groupBy}
          />
        </div>
        <div className="space-y-4">
          <InsightCards />
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">{isZh ? '叙述性总结' : 'Narrative Summary'}</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {isZh ? (
                <>
                  结论基于数据集 <strong>{activeDataset?.name || '未命名数据集'}</strong> 与当前配置（图表类型{' '}
                  <strong>{viewState.chartSingle.chartType}</strong>，X 轴 <strong>{viewState.chartSingle.xAxis || '未选择'}</strong>，
                  Y 轴 <strong>{viewState.chartSingle.yAxis || '未选择'}</strong>）。
                </>
              ) : (
                <>
                  Conclusions are based on dataset <strong>{activeDataset?.name || 'Unnamed dataset'}</strong> and current
                  settings (chart type <strong>{viewState.chartSingle.chartType}</strong>, X-axis{' '}
                  <strong>{viewState.chartSingle.xAxis || 'Not selected'}</strong>, Y-axis{' '}
                  <strong>{viewState.chartSingle.yAxis || 'Not selected'}</strong>).
                </>
              )}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed mt-3">
              {isZh
                ? '若当前缺少可用数值列，或筛选/清洗导致结果为空，系统会说明原因而不会输出武断结论。'
                : 'If no valid numeric field exists or filtering/cleaning yields empty results, the app explains why instead of showing unsupported conclusions.'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
