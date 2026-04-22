import React from 'react';
import { ChartDisplay } from '../../../components/ChartDisplay';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useDataContext } from '../../../context/DataContext';
import { useLanguage } from '../../../context/LanguageContext';
import { toChartType } from '../utils';

export function ChartComparePanel() {
  const { columns, viewState, setChartCompareConfig } = useDataContext();
  const { language } = useLanguage();
  const isZh = language === 'zh';

  return (
    <>
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-6">{isZh ? '左右图表对比配置' : 'Side-by-Side Chart Comparison'}</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium text-gray-700">{isZh ? '左图' : 'Left Chart'}</div>
              <Select
                value={viewState.chartCompare.left.chartType}
                onValueChange={v => setChartCompareConfig('left', { chartType: toChartType(v) })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">{isZh ? '柱状图' : 'Bar Chart'}</SelectItem>
                  <SelectItem value="line">{isZh ? '折线图' : 'Line Chart'}</SelectItem>
                  <SelectItem value="pie">{isZh ? '饼图' : 'Pie Chart'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {viewState.chartCompare.left.auto?.reason && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900">{isZh ? '左图已自动完成推荐配置' : 'Recommended defaults applied for the left chart.'}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{isZh ? 'X 轴' : 'X-Axis'}</Label>
                <Select
                  value={viewState.chartCompare.left.xAxis}
                  onValueChange={v => setChartCompareConfig('left', { xAxis: v })}
                >
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
                <Select
                  value={viewState.chartCompare.left.yAxis}
                  onValueChange={v => setChartCompareConfig('left', { yAxis: v })}
                >
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
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium text-gray-700">{isZh ? '右图' : 'Right Chart'}</div>
              <Select
                value={viewState.chartCompare.right.chartType}
                onValueChange={v => setChartCompareConfig('right', { chartType: toChartType(v) })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">{isZh ? '柱状图' : 'Bar Chart'}</SelectItem>
                  <SelectItem value="line">{isZh ? '折线图' : 'Line Chart'}</SelectItem>
                  <SelectItem value="pie">{isZh ? '饼图' : 'Pie Chart'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {viewState.chartCompare.right.auto?.reason && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900">{isZh ? '右图已自动完成推荐配置' : 'Recommended defaults applied for the right chart.'}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{isZh ? 'X 轴' : 'X-Axis'}</Label>
                <Select
                  value={viewState.chartCompare.right.xAxis}
                  onValueChange={v => setChartCompareConfig('right', { xAxis: v })}
                >
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
                <Select
                  value={viewState.chartCompare.right.yAxis}
                  onValueChange={v => setChartCompareConfig('right', { yAxis: v })}
                >
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
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">{isZh ? '左图预览' : 'Left Chart Preview'}</h3>
          <ChartDisplay
            chartType={viewState.chartCompare.left.chartType}
            xAxis={viewState.chartCompare.left.xAxis}
            yAxis={viewState.chartCompare.left.yAxis}
            groupBy={viewState.chartCompare.left.groupBy}
          />
        </div>
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">{isZh ? '右图预览' : 'Right Chart Preview'}</h3>
          <ChartDisplay
            chartType={viewState.chartCompare.right.chartType}
            xAxis={viewState.chartCompare.right.xAxis}
            yAxis={viewState.chartCompare.right.yAxis}
            groupBy={viewState.chartCompare.right.groupBy}
          />
        </div>
      </div>
    </>
  );
}
