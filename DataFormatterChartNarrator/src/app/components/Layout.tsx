import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { BarChart3, Database, Lightbulb, ChevronLeft, ChevronRight, FileCheck, Sparkles, TrendingUp } from 'lucide-react';
import { useDataContext } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Badge } from './ui/badge';

const navigationItems = [
  {
    id: 'visual',
    path: '/',
    icon: BarChart3,
  },
  {
    id: 'data',
    path: '/data-comparison',
    icon: Database,
  },
  {
    id: 'insight',
    path: '/insight-summary',
    icon: Lightbulb,
  },
];

export function Layout() {
  const location = useLocation();
  const { isDataLoaded, isCleaned, fileName, datasets, activeDataset, viewState } = useDataContext();
  const { language, setLanguage, t } = useLanguage();
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  const navigationText = {
    visual: {
      title: language === 'zh' ? '图表对比' : 'Visual Comparison',
      description: language === 'zh' ? '对比两张图表或不同筛选结果' : 'Compare two charts or filtered results',
    },
    data: {
      title: language === 'zh' ? '数据对比' : 'Data Comparison',
      description: language === 'zh' ? '对比字段、类别与数值' : 'Compare fields, categories, and values',
    },
    insight: {
      title: language === 'zh' ? '洞察与总结' : 'Insight & Summary',
      description: language === 'zh' ? '自动生成标注与摘要' : 'Auto-generate annotations and summaries',
    },
  } as const;

  const chartTypeLabel = (() => {
    if (viewState.analysisTarget !== 'chart') return '-';
    if (viewState.analysisMode === 'single') return viewState.chartSingle.chartType;
    return `${viewState.chartCompare.left.chartType} / ${viewState.chartCompare.right.chartType}`;
  })();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">Data Formatter</h1>
          <p className="text-sm text-gray-500 mt-1">& Chart Narrator</p>
          <div className="mt-4 inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            <button
              type="button"
              onClick={() => setLanguage('zh')}
              className={`px-3 py-1 text-xs rounded-md ${language === 'zh' ? 'bg-white border border-gray-200 text-gray-900' : 'text-gray-600'}`}
            >
              {t('common.zh')}
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-xs rounded-md ${language === 'en' ? 'bg-white border border-gray-200 text-gray-900' : 'text-gray-600'}`}
            >
              {t('common.en')}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-3">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const nav = navigationText[item.id as keyof typeof navigationText];
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`block p-4 rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                      {nav.title}
                    </div>
                    <div className={`text-xs mt-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {nav.description}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Status Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-500 uppercase mb-3">{t('layout.appStatus')}</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileCheck className="w-4 h-4" />
                <span>{t('layout.dataLoaded')}</span>
              </div>
              <Badge variant={isDataLoaded ? "default" : "secondary"}>
                {isDataLoaded ? t('layout.yes') : t('layout.no')}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Sparkles className="w-4 h-4" />
                <span>{t('layout.cleaned')}</span>
              </div>
              <Badge variant={isCleaned ? "default" : "secondary"}>
                {isCleaned ? t('layout.yes') : t('layout.no')}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4" />
                <span>{t('layout.chartType')}</span>
              </div>
              <Badge variant="outline" className="capitalize">
                {chartTypeLabel}
              </Badge>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Right Sidebar */}
      <aside
        className={`bg-white border-l border-gray-200 transition-all duration-300 ${
          isRightPanelOpen ? 'w-80' : 'w-12'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Toggle Button */}
          <button
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            className="p-3 border-b border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            {isRightPanelOpen ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Panel Content */}
          {isRightPanelOpen && (
            <div className="flex-1 p-6 overflow-auto">
              <h3 className="font-semibold text-gray-900 mb-4">{t('layout.quickInfo')}</h3>
              
              <div className="space-y-4">
                {/* File Info */}
                {fileName && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                      {t('layout.currentFile')}
                    </div>
                    <div className="text-sm text-gray-900 break-all">{fileName}</div>
                  </div>
                )}

                {datasets.length > 1 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                      {t('layout.datasets')}
                    </div>
                    <div className="text-sm text-gray-900">
                      {datasets.length} {t('layout.loaded')}
                      {activeDataset?.name ? `, ${t('layout.active')}: ${activeDataset.name}` : ''}
                    </div>
                  </div>
                )}

                {/* Data Info */}
                {isDataLoaded && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                      {t('layout.dataStatus')}
                    </div>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span>{t('layout.loadedStatus')}:</span>
                        <span className="font-medium text-green-600">{t('layout.activeStatus')}</span>
                      </div>
                      {isCleaned && (
                        <div className="flex justify-between">
                          <span>{t('layout.cleanedStatus')}:</span>
                          <span className="font-medium text-blue-600">{t('layout.complete')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Chart Recommendations */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-xs font-medium text-blue-900 uppercase mb-2">
                    {t('layout.recommendedCharts')}
                  </div>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">{language === 'zh' ? '柱状图' : 'Bar Chart'}</Badge>
                    <Badge variant="outline" className="text-xs ml-2">{language === 'zh' ? '折线图' : 'Line Chart'}</Badge>
                    <Badge variant="outline" className="text-xs">{language === 'zh' ? '饼图' : 'Pie Chart'}</Badge>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-xs font-medium text-amber-900 uppercase mb-2">
                    {`💡 ${t('layout.quickTip')}`}
                  </div>
                  <div className="text-sm text-amber-800">
                    {t('layout.tipContent')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
