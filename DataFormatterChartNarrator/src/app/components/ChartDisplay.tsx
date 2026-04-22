import React, { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDataContext } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import type { ChartConfig, DataRow, InferredSchema } from '../domain/types';
import { buildChartData, inferSchemaFromColumns, normalizeGroupBy } from '../domain/rules';

interface ChartDisplayProps {
  chartType: string;
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
  rows?: DataRow[];
  schema?: InferredSchema;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6', '#f97316'];

export function ChartDisplay({ chartType, xAxis, yAxis, groupBy, rows: rowsProp, schema: schemaProp }: ChartDisplayProps) {
  const { cleanedData, isDataLoaded, columns } = useDataContext();
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const rows = rowsProp ?? cleanedData;
  const schema = schemaProp ?? inferSchemaFromColumns(columns);

  const chartConfig: ChartConfig = useMemo(() => ({
    chartType: chartType === 'bar' || chartType === 'line' || chartType === 'pie' ? chartType : 'bar',
    xAxis: xAxis || '',
    yAxis: yAxis || '',
    groupBy: groupBy || '',
  }), [chartType, xAxis, yAxis, groupBy]);

  const normalized = useMemo(() => normalizeGroupBy(chartConfig), [chartConfig]);
  const { data: chartData, seriesKeys } = useMemo(() => buildChartData({ rows, config: normalized }), [rows, normalized]);

  if (!isDataLoaded || rows.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <p className="text-gray-500">{isZh ? '未加载数据，无法生成图表' : 'No data loaded. Unable to generate chart.'}</p>
      </div>
    );
  }

  if (!chartConfig.xAxis) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <p className="text-gray-500">{isZh ? '请选择 X 轴字段（通常是分类/日期列）' : 'Please select an X-axis field (usually categorical/date).'}</p>
      </div>
    );
  }

  if (schema.numeric.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <p className="text-gray-500">{isZh ? '未检测到可用于 Y 轴的数值列' : 'No numeric field available for Y-axis.'}</p>
      </div>
    );
  }

  if (!chartConfig.yAxis) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <p className="text-gray-500">{isZh ? '请选择 Y 轴字段（需要数值列）' : 'Please select a Y-axis field (numeric required).'}</p>
      </div>
    );
  }

  if (schema.numeric.length > 0 && !schema.numeric.includes(chartConfig.yAxis)) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <p className="text-gray-500">{isZh ? '当前 Y 轴不是数值列：' : 'Current Y-axis is not numeric: '}{chartConfig.yAxis}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <p className="text-gray-500">{isZh ? '当前配置没有可展示结果，请调整字段或清洗条件' : 'No results for current settings. Adjust fields or cleaning conditions.'}</p>
      </div>
    );
  }

  const renderChart = () => {
    switch (chartConfig.chartType) {
      case 'bar':
        if (normalized.groupBy && normalized.groupBy !== normalized.xAxis) {
          return (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                {seriesKeys.map((group, idx) => (
                  <Bar key={group} dataKey={group} fill={COLORS[idx % COLORS.length]} radius={[8, 8, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          );
        }
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        if (normalized.groupBy && normalized.groupBy !== normalized.xAxis) {
          return (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                {seriesKeys.map((group, idx) => (
                  <Line
                    key={group}
                    type="monotone"
                    dataKey={group}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          );
        }
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <div>{isZh ? '未知图表类型' : 'Unknown chart type'}</div>;
    }
  };

  return (
    <div className="h-96 bg-white p-6 rounded-xl border border-gray-200">
      {renderChart()}
    </div>
  );
}
