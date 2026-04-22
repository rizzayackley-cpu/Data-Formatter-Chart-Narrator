import React, { createContext, useContext, useMemo, useState } from 'react';

export type AppLanguage = 'zh' | 'en';

type Dictionary = Record<string, string>;

const messages: Record<AppLanguage, Dictionary> = {
  zh: {
    'common.zh': '中文',
    'common.en': 'English',
    'layout.appStatus': '应用状态',
    'layout.dataLoaded': '数据已加载',
    'layout.cleaned': '已清洗',
    'layout.chartType': '图表类型',
    'layout.yes': '是',
    'layout.no': '否',
    'layout.quickInfo': '快速信息',
    'layout.currentFile': '当前文件',
    'layout.datasets': '数据集',
    'layout.loaded': '已加载',
    'layout.active': '当前',
    'layout.dataStatus': '数据状态',
    'layout.loadedStatus': '加载',
    'layout.activeStatus': '已激活',
    'layout.cleanedStatus': '清洗',
    'layout.complete': '已完成',
    'layout.recommendedCharts': '推荐图表',
    'layout.quickTip': '快速提示',
    'layout.tipContent': '上传 CSV 或 Excel 文件即可开始数据分析与可视化。',
    'workbench.chartSingle': '图表分析 · 单项分析',
    'workbench.chartCompare': '图表分析 · 对比分析',
    'workbench.dataSingle': '数据分析 · 单项分析',
    'workbench.dataCompare': '数据分析 · 对比分析',
    'workbench.desc': '在同一数据上下文中切换工作区与模式，配置状态彼此隔离',
    'workbench.targetChart': '图表分析',
    'workbench.targetData': '数据分析',
    'workbench.modeSingle': '单项分析',
    'workbench.modeCompare': '对比分析',
    'workbench.loading': '正在处理数据，请稍候…',
    'error.title': '页面出错',
    'error.unknown': '发生了未知错误',
    'error.refresh': '刷新页面',
    'error.backHome': '回到首页',
  },
  en: {
    'common.zh': 'Chinese',
    'common.en': 'English',
    'layout.appStatus': 'App Status',
    'layout.dataLoaded': 'Data Loaded',
    'layout.cleaned': 'Cleaned',
    'layout.chartType': 'Chart Type',
    'layout.yes': 'Yes',
    'layout.no': 'No',
    'layout.quickInfo': 'Quick Info',
    'layout.currentFile': 'Current File',
    'layout.datasets': 'Datasets',
    'layout.loaded': 'loaded',
    'layout.active': 'active',
    'layout.dataStatus': 'Data Status',
    'layout.loadedStatus': 'Loaded',
    'layout.activeStatus': 'Active',
    'layout.cleanedStatus': 'Cleaned',
    'layout.complete': 'Complete',
    'layout.recommendedCharts': 'Recommended Charts',
    'layout.quickTip': 'Quick Tip',
    'layout.tipContent': 'Upload CSV or Excel files to get started with data analysis and visualization.',
    'workbench.chartSingle': 'Chart Analysis · Single',
    'workbench.chartCompare': 'Chart Analysis · Compare',
    'workbench.dataSingle': 'Data Analysis · Single',
    'workbench.dataCompare': 'Data Analysis · Compare',
    'workbench.desc': 'Switch target and mode in one workspace while keeping configurations isolated.',
    'workbench.targetChart': 'Chart Analysis',
    'workbench.targetData': 'Data Analysis',
    'workbench.modeSingle': 'Single Analysis',
    'workbench.modeCompare': 'Compare Analysis',
    'workbench.loading': 'Processing data, please wait...',
    'error.title': 'Page Error',
    'error.unknown': 'An unknown error occurred',
    'error.refresh': 'Refresh',
    'error.backHome': 'Back Home',
  },
};

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>('en');

  const value = useMemo<LanguageContextValue>(() => {
    const dict = messages[language];
    return {
      language,
      setLanguage,
      t: (key: string) => dict[key] || key,
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
