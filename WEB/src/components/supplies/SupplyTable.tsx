import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Eye, Edit, Trash2, Search, Filter, AlertTriangle } from 'lucide-react';
import { DataTable } from '../common/DataTable';
import { SupplyItem } from '../../types/supply';
import { formatCurrency, getStockStatus, getStockStatusColor } from '../../utils/formatters';
import { useFilters } from '../../hooks/useFilters';

interface SupplyTableProps {
  supplies: SupplyItem[];
  onView: (supply: SupplyItem) => void;
  onEdit: (supply: SupplyItem) => void;
  onDelete: (supply: SupplyItem) => void;
}

export const SupplyTable = ({ supplies, onView, onEdit, onDelete }: SupplyTableProps) => {
  const { filters, updateFilter } = useFilters();

  const getFilteredSupplies = () => {
    return supplies.filter(supply => {
      if (filters.searchTerm && !supply.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
  };

  const supplyColumns = [
    {
      key: 'name',
      label: 'Item Code',
      sortable: true
    },
    {
      key: 'name',
      label: 'Description',
      sortable: true,
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'unit',
      label: 'Unit',
      sortable: true
    },
    {
      key: 'quantity',
      label: 'Current Stock',
      sortable: true,
      render: (value: number, row: SupplyItem) => (
        <div className="flex items-center space-x-2">
          <span>{value} {row.unit}</span>
          {value <= (row.minThreshold || 0) && (
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          )}
        </div>
      )
    },
    {
      key: 'minThreshold',
      label: 'Reorder Point',
      sortable: true,
      render: (value: number) => (
        <span className="text-sm">{value || 0}</span>
      )
    },
    {
      key: 'unitCost',
      label: 'Unit Cost',
      sortable: true,
      render: (_: any, row: SupplyItem) => formatCurrency(row.unitCost || 0)
    },
    {
      key: 'totalValue',
      label: 'Total Value',
      sortable: true,
      render: (_: any, row: SupplyItem) => formatCurrency((row.quantity || 0) * (row.unitCost || 0))
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: any, row: SupplyItem) => {
        const status = getStockStatus(row);
        return (
          <Badge className={getStockStatusColor(status)}>
            {status}
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: SupplyItem) => (
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView(row)}
            className="h-8 w-8 p-0"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(row)}
            className="h-8 w-8 p-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(row)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search supplies by description or item code..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
            className="pl-9 border-slate-200 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="border-slate-200 hover:bg-slate-50">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <DataTable
          data={getFilteredSupplies()}
          columns={supplyColumns}
          title="inventory-items"
          searchPlaceholder=""
          emptyMessage="No supplies found. Add your first supply item to get started."
        />
      </div>
    </div>
  );
};
