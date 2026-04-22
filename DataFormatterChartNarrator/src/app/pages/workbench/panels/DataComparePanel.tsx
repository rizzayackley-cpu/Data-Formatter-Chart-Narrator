import React from 'react';
import { DataPreview } from '../../../components/DataPreview';
import { CleaningSection } from '../../../components/CleaningSection';
import { ChartDisplay } from '../../../components/ChartDisplay';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { formatMetricValue } from '../../../domain/comparison';
import { useDataContext } from '../../../context/DataContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useDataCompareModel } from '../hooks/useDataCompareModel';

export function DataComparePanel() {
  const { datasets, activeDataset, viewState, setDataCompareConfig } = useDataContext();
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const txt = (zh: string, en: string) => (isZh ? zh : en);

  const model = useDataCompareModel({ datasets, activeDataset, config: viewState.dataCompare, language });

  const dataCompareAValue = model.selectValues.datasetA;
  const dataCompareBValue = model.selectValues.datasetB;
  const dataCompareValueKey = model.selectValues.valueKey;
  const dataCompareGroupBy = model.selectValues.groupBy;
  const dataCompareGroupA = model.selectValues.groupA;
  const dataCompareGroupB = model.selectValues.groupB;

  const enabledMetricIds = model.enabledMetricIds;

  const dataCompareDatasets = model.dataCompareDatasets;

  const overlapInfo = model.overlapInfo;

  const dataCompareNumericColumns = model.dataCompareNumericColumns;

  const groupByCandidates = model.groupByCandidates;

  const groupOptions = model.groupOptions;

  const metricDefinitions = model.metricDefinitions;

  const dataCompareSlices = model.dataCompareSlices;

  const dataCompareMetricRows = model.dataCompareMetricRows;

  const structureCompare = model.structureCompare;

  const trendCompare = model.trendCompare;

  return (
    <>
      <DataPreview />
      <CleaningSection />

      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h3 className="font-semibold text-gray-900">{txt('数据对比', 'Data Comparison')}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {txt('选择比较对象、分组维度与指标体系，输出清晰的差异摘要与可解释结果。', 'Choose scope, grouping, and metric sets to generate clear difference summaries and explainable details.')}
            </p>
          </div>
          {viewState.dataCompare.auto?.reason && (
            <Badge variant="outline" className="text-xs">
              {txt('已应用默认对比指标组合', 'Default comparison metric set applied')}
            </Badge>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>{txt('比较对象', 'Comparison Scope')}</Label>
            <Select
              value={viewState.dataCompare.compareScope}
              onValueChange={v => setDataCompareConfig({ compareScope: v === 'group' ? 'group' : 'dataset' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dataset">{txt('数据集 vs 数据集', 'Dataset vs Dataset')}</SelectItem>
                <SelectItem value="group">{txt('同数据集分组 vs 分组', 'Group vs Group (same dataset)')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{txt('指标字段（数值）', 'Numeric Metric Field')}</Label>
            <Select value={dataCompareValueKey} onValueChange={v => setDataCompareConfig({ valueKey: v === '__unset__' ? '' : v })}>
              <SelectTrigger>
                <SelectValue placeholder={txt('选择数值字段', 'Select numeric field')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unset__">{txt('未选择', 'Unselected')}</SelectItem>
                {(dataCompareNumericColumns.length > 0 ? dataCompareNumericColumns : activeDataset?.inferredSchema.numeric || []).map(c => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{txt('分组维度（可选）', 'Group Dimension (Optional)')}</Label>
            <Select value={dataCompareGroupBy} onValueChange={v => setDataCompareConfig({ groupBy: v === '__none__' ? '' : v })}>
              <SelectTrigger>
                <SelectValue placeholder={txt('选择分组维度', 'Select group dimension')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{txt('无', 'None')}</SelectItem>
                {groupByCandidates.categorical.map(c => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
                {groupByCandidates.date.map(c => (
                  <SelectItem key={c} value={c}>
                    {isZh ? `${c}（日期）` : `${c} (date)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{txt('显示方式', 'View Mode')}</Label>
            <Select
              value={viewState.dataCompare.view}
              onValueChange={v => setDataCompareConfig({ view: v === 'cards' ? 'cards' : v === 'table' ? 'table' : 'both' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cards">{txt('指标卡片', 'Metric Cards')}</SelectItem>
                <SelectItem value="table">{txt('表格明细', 'Detailed Table')}</SelectItem>
                <SelectItem value="both">{txt('卡片 + 表格', 'Cards + Table')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {viewState.dataCompare.compareScope === 'dataset' && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{txt('数据集 A', 'Dataset A')}</Label>
              <Select value={dataCompareAValue} onValueChange={v => setDataCompareConfig({ datasetAId: v === '__unset__' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder={txt('选择数据集 A', 'Select Dataset A')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unset__">{txt('未选择', 'Unselected')}</SelectItem>
                  {datasets.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} · {d.id.slice(0, 4)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{txt('数据集 B', 'Dataset B')}</Label>
              <Select value={dataCompareBValue} onValueChange={v => setDataCompareConfig({ datasetBId: v === '__unset__' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder={txt('选择数据集 B', 'Select Dataset B')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unset__">{txt('未选择', 'Unselected')}</SelectItem>
                  {datasets.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} · {d.id.slice(0, 4)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {viewState.dataCompare.compareScope === 'group' && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{txt('分组 A', 'Group A')}</Label>
              <Select value={dataCompareGroupA} onValueChange={v => setDataCompareConfig({ groupA: v === '__unset__' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder={txt('选择分组 A', 'Select group A')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unset__">{txt('未选择', 'Unselected')}</SelectItem>
                  {groupOptions.map(v => (
                    <SelectItem key={`a-${v}`} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{txt('分组 B', 'Group B')}</Label>
              <Select value={dataCompareGroupB} onValueChange={v => setDataCompareConfig({ groupB: v === '__unset__' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder={txt('选择分组 B', 'Select group B')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unset__">{txt('未选择', 'Unselected')}</SelectItem>
                  {groupOptions.map(v => (
                    <SelectItem key={`b-${v}`} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{txt('时间分桶（日期分组）', 'Time Bucket (when grouped by date)')}</Label>
              <Select value={viewState.dataCompare.dateBucket} onValueChange={v => setDataCompareConfig({ dateBucket: v === 'month' ? 'month' : 'day' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">{txt('日', 'day')}</SelectItem>
                  <SelectItem value="month">{txt('月', 'month')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {viewState.dataCompare.compareScope === 'dataset' && viewState.dataCompare.groupBy && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{txt('时间分桶（日期分组）', 'Time Bucket (when grouped by date)')}</Label>
              <Select value={viewState.dataCompare.dateBucket} onValueChange={v => setDataCompareConfig({ dateBucket: v === 'month' ? 'month' : 'day' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">{txt('日', 'day')}</SelectItem>
                  <SelectItem value="month">{txt('月', 'month')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{txt('仅显示差异项', 'Differences Only')}</Label>
              <div className="flex items-center gap-2 h-10">
                <Checkbox checked={viewState.dataCompare.onlyDifferences} onCheckedChange={v => setDataCompareConfig({ onlyDifferences: Boolean(v) })} />
                <span className="text-sm text-gray-700">{txt('仅保留差值不为 0 或一侧缺失的指标', 'Keep metrics with non-zero delta or one-side missing only')}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{txt('排序', 'Sort By')}</Label>
              <Select value={viewState.dataCompare.sortBy} onValueChange={v => setDataCompareConfig({ sortBy: v === 'pct' ? 'pct' : v === 'label' ? 'label' : 'abs' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="abs">{txt('按绝对差值', 'Absolute Delta')}</SelectItem>
                  <SelectItem value="pct">{txt('按变化率', 'Percent Change')}</SelectItem>
                  <SelectItem value="label">{txt('按指标名', 'Metric Name')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h4 className="font-semibold text-gray-900">{txt('指标选择', 'Metric Selection')}</h4>
              <p className="text-sm text-gray-600 mt-1">{txt('按指标组勾选，结果会立即更新。', 'Toggle metrics by group; results update instantly.')}</p>
            </div>
            <div className="space-y-2">
              <Label>{txt('Top N（结构指标）', 'Top N (structure metrics)')}</Label>
              <Select value={String(viewState.dataCompare.topN)} onValueChange={v => setDataCompareConfig({ topN: Number(v) })}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 5, 8, 10, 15].map(n => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {(['basic', 'stats', 'quality'] as const).map(cat => {
              const defs = metricDefinitions[cat];
              return (
                <div key={cat} className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <div className="text-sm font-medium text-gray-900 mb-3">
                    {cat === 'basic' ? txt('基础规模', 'Basic Size') : cat === 'stats' ? txt('数值统计', 'Numeric Stats') : txt('数据质量', 'Data Quality')}
                  </div>
                  <div className="space-y-2">
                    {defs.map(def => {
                      const checked = enabledMetricIds.includes(def.id);
                      return (
                        <label key={def.id} className="flex items-center gap-2 text-sm text-gray-800">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={v => {
                              const next = Boolean(v)
                                ? Array.from(new Set([...enabledMetricIds, def.id]))
                                : enabledMetricIds.filter(id => id !== def.id);
                              setDataCompareConfig({ metrics: next });
                            }}
                          />
                          <span>{def.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <h4 className="font-semibold text-gray-900 mb-4">{txt('结果', 'Results')}</h4>

          {viewState.dataCompare.compareScope === 'dataset' && datasets.length < 2 && (
            <p className="text-sm text-gray-600">
              {txt('进行“数据集 vs 数据集”对比至少需要两个数据集。可重复上传或加载示例数据。', 'At least two datasets are required for dataset-vs-dataset comparison. Upload or load sample data twice.')}
            </p>
          )}

          {viewState.dataCompare.compareScope === 'group' && (!activeDataset || !viewState.dataCompare.groupBy) && (
            <p className="text-sm text-gray-600">{txt('分组对比分组需要选择分组维度（分类/日期字段）。', 'Group comparison requires a group dimension (categorical/date field).')}</p>
          )}

          {viewState.dataCompare.compareScope === 'dataset' && (!viewState.dataCompare.datasetAId || !viewState.dataCompare.datasetBId) && (
            <p className="text-sm text-gray-600 mt-2">{txt('请选择数据集 A 和数据集 B。', 'Please select Dataset A and Dataset B.')}</p>
          )}

          {viewState.dataCompare.compareScope === 'group' && (!viewState.dataCompare.groupA || !viewState.dataCompare.groupB) && (
            <p className="text-sm text-gray-600 mt-2">{txt('请选择分组 A 和分组 B。', 'Please select Group A and Group B.')}</p>
          )}

          {viewState.dataCompare.valueKey === '' && (
            <p className="text-sm text-gray-600 mt-2">{txt('请选择一个数值指标字段用于统计和差异计算。', 'Select one numeric metric field for statistics and difference calculation.')}</p>
          )}

          {dataCompareMetricRows && (viewState.dataCompare.view === 'cards' || viewState.dataCompare.view === 'both') && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
              {['sample_count', 'sum', 'mean', 'median', 'stddev', 'missing_rate'].map(id => {
                const r = dataCompareMetricRows.rows.find(x => x.id === id);
                if (!r) return null;
                const aText = r.a ? formatMetricValue(r.a) : txt('无', 'N/A');
                const bText = r.b ? formatMetricValue(r.b) : txt('无', 'N/A');
                const abs = r.abs;
                const pct = r.pct;
                return (
                  <div key={id} className="rounded-xl border border-gray-200 p-4 bg-white">
                    <div className="text-sm font-medium text-gray-900">{r.label}</div>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">{dataCompareMetricRows.aLabel}</div>
                        <div className="text-lg font-semibold text-gray-900">{aText}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">{dataCompareMetricRows.bLabel}</div>
                        <div className="text-lg font-semibold text-gray-900">{bText}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                      <span>{txt('差值', 'Delta')}: {abs == null ? txt('无', 'N/A') : abs.toFixed(2)}</span>
                      <span>{txt('变化率', 'Change')}: {pct == null ? txt('无', 'N/A') : `${pct.toFixed(2)}%`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {dataCompareMetricRows && (viewState.dataCompare.view === 'table' || viewState.dataCompare.view === 'both') && (
            <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{txt('指标', 'Metric')}</TableHead>
                      <TableHead>{dataCompareMetricRows.aLabel}</TableHead>
                      <TableHead>{dataCompareMetricRows.bLabel}</TableHead>
                      <TableHead>{txt('差值（B - A）', 'Delta (B - A)')}</TableHead>
                      <TableHead>{txt('变化率', 'Change')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataCompareMetricRows.rows.map(r => {
                      const abs = r.abs;
                      const highlight = abs != null && Math.abs(abs) > 0;
                      const absText = abs == null ? txt('无', 'N/A') : abs.toFixed(2);
                      const pctText = r.pct == null ? txt('无', 'N/A') : `${r.pct.toFixed(2)}%`;
                      const deltaClass = highlight && abs != null ? (abs > 0 ? 'text-green-700' : 'text-red-700') : '';
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.label}</TableCell>
                          <TableCell>{r.a ? formatMetricValue(r.a) : txt('无', 'N/A')}</TableCell>
                          <TableCell className={deltaClass}>{r.b ? formatMetricValue(r.b) : txt('无', 'N/A')}</TableCell>
                          <TableCell className={deltaClass}>{absText}</TableCell>
                          <TableCell className={r.pct != null ? (r.pct > 0 ? 'text-green-700' : r.pct < 0 ? 'text-red-700' : '') : ''}>
                            {pctText}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {structureCompare && (
            <div className="mt-8">
              <h4 className="font-semibold text-gray-900 mb-3">{txt(`分类结构对比（Top ${viewState.dataCompare.topN}）`, `Category Structure Comparison (Top ${viewState.dataCompare.topN})`)}</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{structureCompare.groupBy}</TableHead>
                        <TableHead>{txt('A 数量', 'A count')}</TableHead>
                        <TableHead>{txt('A 占比', 'A share')}</TableHead>
                        <TableHead>{txt('B 数量', 'B count')}</TableHead>
                        <TableHead>{txt('B 占比', 'B share')}</TableHead>
                        <TableHead>{txt('占比变化（B - A）', 'Share Change (B - A)')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {structureCompare.rows.slice(0, viewState.dataCompare.topN).map(r => (
                        <TableRow key={r.key}>
                          <TableCell className="font-medium">{r.key}</TableCell>
                          <TableCell>{r.countA}</TableCell>
                          <TableCell>{(r.shareA * 100).toFixed(2)}%</TableCell>
                          <TableCell>{r.countB}</TableCell>
                          <TableCell>{(r.shareB * 100).toFixed(2)}%</TableCell>
                          <TableCell className={r.shareDiff > 0 ? 'text-green-700' : r.shareDiff < 0 ? 'text-red-700' : ''}>
                            {(r.shareDiff * 100).toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {trendCompare && (
            <div className="mt-8">
              <h4 className="font-semibold text-gray-900 mb-3">
                {txt(`时间趋势对比（分桶: ${viewState.dataCompare.dateBucket}）`, `Time Trend Comparison (bucket: ${viewState.dataCompare.dateBucket})`)}
              </h4>
              <ChartDisplay
                chartType="line"
                xAxis={trendCompare.xAxis}
                yAxis={trendCompare.yAxis}
                groupBy={trendCompare.groupBy}
                rows={trendCompare.rows}
                schema={trendCompare.schema}
              />
            </div>
          )}

          {overlapInfo && viewState.dataCompare.compareScope === 'dataset' && (
            <div className="mt-8">
              <h4 className="font-semibold text-gray-900 mb-3">{txt('字段兼容性', 'Field Compatibility')}</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">{txt('A 行数 / 列数', 'A Rows / Columns')}</div>
                  <div className="text-sm text-gray-900 font-medium">
                    {overlapInfo.a.processedRows.length} / {overlapInfo.a.columns.length}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">{txt('B 行数 / 列数', 'B Rows / Columns')}</div>
                  <div className="text-sm text-gray-900 font-medium">
                    {overlapInfo.b.processedRows.length} / {overlapInfo.b.columns.length}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">{txt('共享列数', 'Shared Columns')}</div>
                  <div className="text-sm text-gray-900 font-medium">{overlapInfo.sharedColumns.length}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
