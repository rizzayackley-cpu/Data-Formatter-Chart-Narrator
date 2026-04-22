import React from 'react';
import { Download, FileText, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';
import { useDataContext } from '../context/DataContext';
import { Button } from './ui/button';
import { toast } from 'sonner';
import Papa from 'papaparse';

export function ExportSection() {
  const { cleanedData, isDataLoaded, fileName, activeDataset } = useDataContext();

  const handleDownloadCSV = () => {
    if (!isDataLoaded || cleanedData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csv = Papa.unparse(cleanedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `cleaned-${fileName || 'data.csv'}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV file downloaded successfully');
  };

  const handleDownloadChart = () => {
    toast.info('Chart download feature would capture the chart as an image');
  };

  const handleDownloadSummary = () => {
    if (!isDataLoaded || cleanedData.length === 0) {
      toast.error('No data to summarize');
      return;
    }

    const columns = Object.keys(cleanedData[0] || {});
    const numericColumns = activeDataset?.inferredSchema.numeric && activeDataset.inferredSchema.numeric.length > 0
      ? activeDataset.inferredSchema.numeric
      : columns.filter(col => {
          const sample = cleanedData.find(row => row[col] != null)?.[col];
          return typeof sample === 'number';
        });

    let summary = 'Data Summary Report\n';
    summary += '===================\n\n';
    summary += `File: ${fileName || 'Unknown'}\n`;
    summary += `Total Rows: ${cleanedData.length}\n`;
    summary += `Total Columns: ${columns.length}\n\n`;
    
    numericColumns.forEach(col => {
      const values = cleanedData
        .map(row => row[col])
        .filter(val => typeof val === 'number') as number[];
      
      if (values.length > 0) {
        const max = Math.max(...values);
        const min = Math.min(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const total = values.reduce((a, b) => a + b, 0);
        
        summary += `${col}:\n`;
        summary += `  Total: ${total.toFixed(2)}\n`;
        summary += `  Average: ${avg.toFixed(2)}\n`;
        summary += `  Maximum: ${max.toFixed(2)}\n`;
        summary += `  Minimum: ${min.toFixed(2)}\n\n`;
      }
    });

    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `summary-${fileName?.replace('.csv', '') || 'data'}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Summary text downloaded successfully');
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Download className="w-5 h-5 text-green-600" />
          Export Your Results
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Download cleaned data, charts, and analysis summaries
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Button
          onClick={handleDownloadCSV}
          variant="outline"
          size="lg"
          className="h-auto flex-col gap-3 p-6 hover:bg-blue-50 hover:border-blue-300"
          disabled={!isDataLoaded}
        >
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">Download CSV</div>
            <div className="text-xs text-gray-500 mt-1">Cleaned data file</div>
          </div>
        </Button>

        <Button
          onClick={handleDownloadChart}
          variant="outline"
          size="lg"
          className="h-auto flex-col gap-3 p-6 hover:bg-purple-50 hover:border-purple-300"
          disabled={!isDataLoaded}
        >
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">Download Chart</div>
            <div className="text-xs text-gray-500 mt-1">PNG image export</div>
          </div>
        </Button>

        <Button
          onClick={handleDownloadSummary}
          variant="outline"
          size="lg"
          className="h-auto flex-col gap-3 p-6 hover:bg-green-50 hover:border-green-300"
          disabled={!isDataLoaded}
        >
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">Download Summary</div>
            <div className="text-xs text-gray-500 mt-1">Text analysis report</div>
          </div>
        </Button>
      </div>
    </div>
  );
}
