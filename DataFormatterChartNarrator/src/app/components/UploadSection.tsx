import React, { useRef, useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, Database, Loader2, X, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useDataContext, preprocessData } from '../context/DataContext';
import type { Dataset } from '../domain/types';
import { getDefaultChartConfig, inferSchemaFromColumns } from '../domain/rules';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { toast } from 'sonner';

export function UploadSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { 
    addDataset,
    setIsLoading,
    setUploadError,
    resetData,
    isLoading,
    uploadError,
  } = useDataContext();
  const { language } = useLanguage();
  const isZh = language === 'zh';

  const createId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const parseExcelFile = useCallback((file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsBinaryString(file);
    });
  }, []);

  const processFile = useCallback(async (file: File) => {
    setUploadError(null);
    setIsLoading(true);

    try {
      let data: any[];

      if (file.name.endsWith('.csv')) {
        data = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (error) => reject(error),
          });
        });
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        data = await parseExcelFile(file);
      } else {
        throw new Error(isZh ? '不支持的文件格式，请上传 CSV 或 Excel 文件。' : 'Unsupported file format. Please upload CSV or Excel file.');
      }

      if (!data || data.length === 0) {
        throw new Error(isZh ? '上传文件为空或无法解析。' : 'The uploaded file is empty or could not be parsed.');
      }

      const { processed, columns } = preprocessData(data);
      const inferredSchema = inferSchemaFromColumns(columns);
      const dataset: Dataset = {
        id: createId(),
        name: file.name,
        rawRows: processed,
        processedRows: processed,
        columns,
        inferredSchema,
        meta: { isCleaned: false, source: 'upload', createdAt: Date.now() },
      };
      addDataset(dataset, { setActive: true });
      const auto = getDefaultChartConfig(inferredSchema);
      toast.success(isZh ? `已成功加载 ${file.name}（${data.length} 行）` : `Successfully loaded ${file.name} (${data.length} rows)`);
      toast.info(isZh ? '系统已自动应用推荐配置。' : 'Recommended defaults were applied automatically.');
    } catch (error: any) {
      const errorMessage = error.message || (isZh ? '发生未知错误' : 'Unknown error occurred');
      setUploadError(errorMessage);
      toast.error(`${isZh ? '错误：' : 'Error: '}${errorMessage}`);
      resetData();
    } finally {
      setIsLoading(false);
    }
  }, [parseExcelFile, addDataset, setIsLoading, setUploadError, resetData]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    event.target.value = '';
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validTypes = ['.csv', '.xlsx', '.xls'];
      const isValid = validTypes.some(type => file.name.toLowerCase().endsWith(type));
      
      if (isValid) {
        processFile(file);
      } else {
        toast.error(isZh ? '请上传 CSV 或 Excel 文件（.csv, .xlsx, .xls）' : 'Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      }
    }
  }, [processFile]);

  const handleSampleData = useCallback(() => {
    const sampleData = [
      { Category: 'Electronics', Sales: 15000, Profit: 4500, Region: 'North', Date: '2024-01-15' },
      { Category: 'Clothing', Sales: 8000, Profit: 2400, Region: 'South', Date: '2024-01-16' },
      { Category: 'Food', Sales: 12000, Profit: 3600, Region: 'East', Date: '2024-01-17' },
      { Category: 'Electronics', Sales: 18000, Profit: 5400, Region: 'West', Date: '2024-01-18' },
      { Category: 'Furniture', Sales: 10000, Profit: 3000, Region: 'North', Date: '2024-01-19' },
      { Category: 'Clothing', Sales: 9000, Profit: 2700, Region: 'East', Date: '2024-01-20' },
      { Category: 'Food', Sales: 11000, Profit: 3300, Region: 'South', Date: '2024-01-21' },
      { Category: 'Electronics', Sales: 20000, Profit: 6000, Region: 'North', Date: '2024-01-22' },
      { Category: 'Furniture', Sales: 13000, Profit: 3900, Region: 'West', Date: '2024-01-23' },
      { Category: 'Clothing', Sales: 7500, Profit: 2250, Region: 'North', Date: '2024-01-24' },
    ];

    const { processed, columns } = preprocessData(sampleData);
    const inferredSchema = inferSchemaFromColumns(columns);
    const dataset: Dataset = {
      id: createId(),
      name: 'sample-sales-data.csv',
      rawRows: processed,
      processedRows: processed,
      columns,
      inferredSchema,
      meta: { isCleaned: false, source: 'sample', createdAt: Date.now() },
    };
    addDataset(dataset, { setActive: true });
    const auto = getDefaultChartConfig(inferredSchema);
    toast.success(isZh ? '示例数据加载成功' : 'Sample data loaded successfully');
    toast.info(isZh ? '系统已自动应用推荐配置。' : 'Recommended defaults were applied automatically.');
  }, [addDataset]);

  const handleClearError = useCallback(() => {
    setUploadError(null);
  }, [setUploadError]);

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-sm">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
          <Upload className="w-8 h-8 text-blue-600" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{isZh ? '上传数据文件' : 'Upload Your Data'}</h2>
        <p className="text-sm text-gray-600 mb-6">
          {isZh ? '支持 CSV 与 Excel 文件。可拖拽上传或点击选择。' : 'Support for CSV and Excel files. Drag and drop or click to browse.'}
        </p>

        {uploadError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-sm text-red-800">{uploadError}</p>
            </div>
            <button onClick={handleClearError} className="text-red-600 hover:text-red-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="lg"
            className="gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-5 h-5" />
            )}
            {isZh ? '选择文件' : 'Choose File'}
          </Button>
          
          <Button
            onClick={handleSampleData}
            variant="outline"
            size="lg"
            className="gap-2"
            disabled={isLoading}
          >
            <Database className="w-5 h-5" />
            {isZh ? '使用示例数据' : 'Use Sample Data'}
          </Button>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer ${
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
          }`}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isLoading ? (
            <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          )}
          <p className="text-sm text-gray-600">
            {isLoading ? 'Processing file...' : 'Drop your CSV or Excel file here'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: .csv, .xlsx, .xls
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}
