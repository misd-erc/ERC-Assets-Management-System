import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Eye, Edit, Trash2, Search, Filter, AlertTriangle } from 'lucide-react';
import { DataTable } from '../common/DataTable';
import { useSupplyStore } from '../../store/supply/useSupplyStore';
import { formatCurrency, getStockStatus, getStockStatusColor } from '../../utils/formatters';
import { SupplyItem } from '../../types/supply/supply';

interface Props {
  onView?: (s: SupplyItem) => void;
  onEdit?: (s: SupplyItem) => void;
  onDelete?: (s: SupplyItem) => void;
}

export const SupplyTable: React.FC<Props> = ({ onView, onEdit, onDelete }) => {
  const { supplies } = useSupplyStore();

  const columns = [
    { key: 'stockNumber', label: 'Item Code' },
    { key: 'description', label: 'Description', render: (v: any) => <div className="max-w-xs truncate">{v}</div> },
    { key: 'unit', label: 'Unit' },
    { key: 'currentStock', label: 'Current Stock', render: (v: number, r: SupplyItem) => (
      <div className="flex items-center space-x-2">
        <span>{v} {r.unit}</span>
        {v <= r.reorderPoint && <AlertTriangle className="w-4 h-4 text-amber-500" />}
      </div>
    ) },
    { key: 'reorderPoint', label: 'Reorder Point' },
    { key: 'unitCost', label: 'Unit Cost', render: (_: any, r: SupplyItem) => formatCurrency(r.unitCost) },
    { key: 'totalValue', label: 'Total Value', render: (_: any, r: SupplyItem) => formatCurrency(r.totalValue) },
    { key: 'status', label: 'Status', render: (_: any, r: SupplyItem) => {
      const status = getStockStatus(r);
      return <span className={`inline-block px-2 py-0.5 text-xs rounded ${getStockStatusColor(status)}`}>{status}</span>;
    } },
    { key: 'actions', label: 'Actions', render: (_: any, r: SupplyItem) => (
      <div className="flex items-center space-x-1">
        <Button size="sm" variant="ghost" onClick={() => onView?.(r)} className="h-8 w-8 p-0"><Eye className="w-4 h-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => onEdit?.(r)} className="h-8 w-8 p-0"><Edit className="w-4 h-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete?.(r)} className="h-8 w-8 p-0 text-red-600"><Trash2 className="w-4 h-4" /></Button>
      </div>
    ) }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input placeholder="Search supplies..." className="pl-9" />
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="border-slate-200 hover:bg-slate-50"><Filter className="w-4 h-4 mr-2" />Filter</Button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <DataTable data={supplies} columns={columns} emptyMessage="No supplies yet." />
      </div>
    </div>
  );
};
