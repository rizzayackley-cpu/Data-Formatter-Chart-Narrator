import React, { useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router';
import { BarChart3, Database, GitCompare, LineChart } from 'lucide-react';
import type { AnalysisMode, AnalysisTarget } from '../domain/types';
import { UploadSection } from '../components/UploadSection';
import { ExportSection } from '../components/ExportSection';
import { Segmented } from './workbench/Segmented';
import { ChartSinglePanel } from './workbench/panels/ChartSinglePanel';
import { ChartComparePanel } from './workbench/panels/ChartComparePanel';
import { DataSinglePanel } from './workbench/panels/DataSinglePanel';
import { DataComparePanel } from './workbench/panels/DataComparePanel';
import { useDataContext } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';

export function Workbench() {
  const location = useLocation();
  const { isLoading, uploadError, viewState, setAnalysisTarget, setAnalysisMode } = useDataContext();
  const { t } = useLanguage();

  useEffect(() => {
    if (location.pathname === '/insight-summary') {
      setAnalysisTarget('chart');
      setAnalysisMode('single');
      return;
    }
    if (location.pathname === '/data-comparison') {
      setAnalysisTarget('data');
      setAnalysisMode('compare');
      return;
    }
    setAnalysisTarget('chart');
    setAnalysisMode('compare');
  }, [location.pathname, setAnalysisMode, setAnalysisTarget]);

  const title = useMemo(() => {
    const target = viewState.analysisTarget;
    const mode = viewState.analysisMode;
    if (target === 'chart' && mode === 'single') return t('workbench.chartSingle');
    if (target === 'chart' && mode === 'compare') return t('workbench.chartCompare');
    if (target === 'data' && mode === 'single') return t('workbench.dataSingle');
    return t('workbench.dataCompare');
  }, [t, viewState.analysisTarget, viewState.analysisMode]);

  const setTarget = useCallback((t: AnalysisTarget) => setAnalysisTarget(t), [setAnalysisTarget]);
  const setMode = useCallback((m: AnalysisMode) => setAnalysisMode(m), [setAnalysisMode]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('workbench.desc')}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Segmented<AnalysisTarget>
              value={viewState.analysisTarget}
              onChange={setTarget}
              options={[
                { value: 'chart', label: t('workbench.targetChart'), icon: <BarChart3 className="h-4 w-4" /> },
                { value: 'data', label: t('workbench.targetData'), icon: <Database className="h-4 w-4" /> },
              ]}
            />
            <Segmented<AnalysisMode>
              value={viewState.analysisMode}
              onChange={setMode}
              options={[
                { value: 'single', label: t('workbench.modeSingle'), icon: <LineChart className="h-4 w-4" /> },
                { value: 'compare', label: t('workbench.modeCompare'), icon: <GitCompare className="h-4 w-4" /> },
              ]}
            />
          </div>
        </div>
      </div>

      <UploadSection />

      {isLoading && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
          <p className="text-sm text-gray-600">{t('workbench.loading')}</p>
        </div>
      )}

      {uploadError && (
        <div className="bg-white rounded-2xl border-2 border-red-200 p-6 shadow-sm">
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}

      {viewState.analysisTarget === 'chart' && viewState.analysisMode === 'single' && <ChartSinglePanel />}
      {viewState.analysisTarget === 'chart' && viewState.analysisMode === 'compare' && <ChartComparePanel />}
      {viewState.analysisTarget === 'data' && viewState.analysisMode === 'single' && <DataSinglePanel />}
      {viewState.analysisTarget === 'data' && viewState.analysisMode === 'compare' && <DataComparePanel />}

      <ExportSection />
    </div>
  );
}

