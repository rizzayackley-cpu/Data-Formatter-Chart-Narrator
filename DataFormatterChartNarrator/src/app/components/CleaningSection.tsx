import React, { useState } from 'react';
import { useDataContext } from '../context/DataContext';
import type { DataRow } from '../domain/types';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Sparkles, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function CleaningSection() {
  const { rawData, updateActiveDatasetProcessedRows, isDataLoaded, columns: columnInfos } = useDataContext();
  const [missingValueStrategy, setMissingValueStrategy] = useState('delete');
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  if (!isDataLoaded || rawData.length === 0) {
    return null;
  }

  const columns = columnInfos.length > 0 ? columnInfos.map(c => c.name) : Object.keys(rawData[0] || {});

  const handleApplyCleaning = () => {
    let cleaned: DataRow[] = [...rawData];

    // Handle missing values
    if (missingValueStrategy === 'delete') {
      cleaned = cleaned.filter(row => {
        return Object.values(row).every(val => val != null && val !== '');
      });
    } else if (missingValueStrategy === 'mean') {
      // Calculate mean for numeric columns and fill
      columns.forEach(col => {
        const numericValues = cleaned
          .map(row => row[col])
          .filter(val => typeof val === 'number') as number[];
        
        if (numericValues.length > 0) {
          const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
          cleaned = cleaned.map(row => ({
            ...row,
            [col]: row[col] == null || row[col] === '' ? mean : row[col],
          }));
        }
      });
    } else if (missingValueStrategy === 'median') {
      // Calculate median for numeric columns and fill
      columns.forEach(col => {
        const numericValues = cleaned
          .map(row => row[col])
          .filter(val => typeof val === 'number')
          .sort((a, b) => (a as number) - (b as number)) as number[];
        
        if (numericValues.length > 0) {
          const median = numericValues[Math.floor(numericValues.length / 2)];
          cleaned = cleaned.map(row => ({
            ...row,
            [col]: row[col] == null || row[col] === '' ? median : row[col],
          }));
        }
      });
    }

    // Remove duplicates
    if (removeDuplicates) {
      const seen = new Set<string>();
      cleaned = cleaned.filter(row => {
        const key = JSON.stringify(row);
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    }

    // Filter selected columns
    if (selectedColumns.length > 0) {
      cleaned = cleaned.map(row => {
        const filtered: DataRow = {};
        selectedColumns.forEach(col => {
          filtered[col] = row[col];
        });
        return filtered;
      });
    }

    updateActiveDatasetProcessedRows(cleaned, { isCleaned: true });
    toast.success(`Data cleaned successfully! ${cleaned.length} rows remaining.`);
  };

  const handleReset = () => {
    updateActiveDatasetProcessedRows(rawData, { isCleaned: false });
    setMissingValueStrategy('delete');
    setRemoveDuplicates(false);
    setSelectedColumns([]);
    toast.info('Cleaning settings reset');
  };

  const toggleColumn = (column: string) => {
    setSelectedColumns(prev => {
      if (prev.includes(column)) {
        return prev.filter(c => c !== column);
      } else {
        return [...prev, column];
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Data Cleaning Controls
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure cleaning options to prepare your data
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Missing Values Strategy */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Missing Values</Label>
          <Select value={missingValueStrategy} onValueChange={setMissingValueStrategy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="delete">Delete Rows</SelectItem>
              <SelectItem value="mean">Fill with Mean</SelectItem>
              <SelectItem value="median">Fill with Median</SelectItem>
              <SelectItem value="none">Keep As Is</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">How to handle missing values</p>
        </div>

        {/* Duplicates */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Duplicate Handling</Label>
          <div className="flex items-center space-x-2 h-10 px-3 border border-gray-200 rounded-lg">
            <Checkbox
              id="duplicates"
              checked={removeDuplicates}
              onCheckedChange={(checked) => setRemoveDuplicates(checked as boolean)}
            />
            <label
              htmlFor="duplicates"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Remove duplicates
            </label>
          </div>
          <p className="text-xs text-gray-500">Remove identical rows</p>
        </div>

        {/* Column Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Select Columns</Label>
          <div className="border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto bg-gray-50">
            <div className="space-y-2">
              {columns.map(col => (
                <div key={col} className="flex items-center space-x-2">
                  <Checkbox
                    id={`col-${col}`}
                    checked={selectedColumns.length === 0 || selectedColumns.includes(col)}
                    onCheckedChange={() => toggleColumn(col)}
                  />
                  <label
                    htmlFor={`col-${col}`}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    {col}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500">Choose columns to keep</p>
        </div>
      </div>

      {/* Apply Button */}
      <div className="mt-6 flex justify-center">
        <Button onClick={handleApplyCleaning} size="lg" className="gap-2">
          <Trash2 className="w-5 h-5" />
          Apply Cleaning
        </Button>
      </div>
    </div>
  );
}
