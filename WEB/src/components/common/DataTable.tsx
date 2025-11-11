import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  searchable?: boolean;
  sortable?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  searchPlaceholder = "Search...",
  emptyMessage = "No data found.",
  searchable = true,
  sortable = true
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key: keyof T) => {
    if (!sortable) return;

    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: keyof T) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`text-left py-3 px-4 font-medium text-slate-700 ${
                    column.sortable && sortable ? 'cursor-pointer hover:bg-slate-50' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key as keyof T)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && getSortIcon(column.key as keyof T)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-slate-100 hover:bg-slate-50">
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="py-3 px-4">
                    {column.render
                      ? column.render(row[column.key as keyof T], row, rowIndex)
                      : String(row[column.key as keyof T] || '')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedData.length === 0 && searchTerm && (
        <div className="text-center py-8 text-slate-500">
          No results found for "{searchTerm}"
        </div>
      )}
    </div>
  );
}
