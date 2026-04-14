import React from 'react';

type Column<T = any> = {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode; 
};

interface Props<T = any> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  emptyMessage?: string;
}

export function DataTable<T>({
  data,
  columns,
  title,
  emptyMessage,
}: Props<T>) {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-sm text-slate-600">
        {emptyMessage || 'No records found.'}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-800/60">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-2 text-left text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-transparent divide-y divide-slate-100 dark:divide-slate-700/50">
          {data.map((row: any, idx) => (
            <tr key={row.id ?? idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors">
              {columns.map((col) => {
                const value = row[col.key];
                return (
                  <td key={col.key} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300">
                    {col.render ? col.render(value, row) : value ?? '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
