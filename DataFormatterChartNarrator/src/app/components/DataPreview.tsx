import React from 'react';
import { useDataContext } from '../context/DataContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function DataPreview() {
  const { rawData, cleanedData, isDataLoaded, isCleaned, columns } = useDataContext();

  if (!isDataLoaded || rawData.length === 0) {
    return null;
  }

  const previewLimit = 5;

  const countMissingValues = (data: any[], column: string): number => {
    return data.filter(row => row[column] == null || row[column] === '').length;
  };

  const getColumnInfo = (columnName: string) => {
    return columns.find(c => c.name === columnName);
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'numeric': return 'default';
      case 'date': return 'secondary';
      case 'category': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Raw Data Preview
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {rawData.length} rows × {columns.length} columns
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {columns.slice(0, 4).map(col => {
            const missing = countMissingValues(rawData, col.name);
            return (
              <Badge
                key={col.name}
                variant={missing > 0 ? "destructive" : "secondary"}
                className="text-xs"
              >
                {col.name}: {col.type} {missing > 0 && `(${missing} missing)`}
              </Badge>
            );
          })}
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(col => (
                    <TableHead key={col.name} className="whitespace-nowrap bg-gray-50">
                      <div>
                        <div className="font-medium">{col.name}</div>
                        <Badge variant={getTypeBadgeVariant(col.type)} className="text-xs mt-1">
                          {col.type}
                        </Badge>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rawData.slice(0, previewLimit).map((row, idx) => (
                  <TableRow key={idx}>
                    {columns.map(col => (
                      <TableCell key={col.name} className="whitespace-nowrap">
                        {row[col.name] != null ? String(row[col.name]) : (
                          <span className="text-red-400 italic text-xs">null</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className={`w-5 h-5 ${isCleaned ? 'text-green-600' : 'text-gray-400'}`} />
              Cleaned Data Preview
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {cleanedData.length} rows × {columns.length} columns
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {columns.slice(0, 4).map(col => {
            const missing = countMissingValues(cleanedData, col.name);
            return (
              <Badge
                key={col.name}
                variant={missing > 0 ? "destructive" : "default"}
                className="text-xs"
              >
                {col.name}: {missing} missing
              </Badge>
            );
          })}
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(col => (
                    <TableHead key={col.name} className="whitespace-nowrap bg-gray-50">
                      <div>
                        <div className="font-medium">{col.name}</div>
                        <Badge variant={getTypeBadgeVariant(col.type)} className="text-xs mt-1">
                          {col.type}
                        </Badge>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cleanedData.slice(0, previewLimit).map((row, idx) => (
                  <TableRow key={idx}>
                    {columns.map(col => (
                      <TableCell key={col.name} className="whitespace-nowrap">
                        {row[col.name] != null ? String(row[col.name]) : (
                          <span className="text-red-400 italic text-xs">null</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
