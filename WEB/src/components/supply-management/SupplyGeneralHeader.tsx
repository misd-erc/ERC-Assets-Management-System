// src/components/supply-management/SupplyGeneralHeader.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Package, TrendingDown, FileText, BarChart3, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSupplyItem } from '@/hooks';
import { formatCurrency } from '@/utils/formatters';

export const SupplyGeneralHeader = () => {
  const { vwSupplies } = useSupplyItem();

  // Calculate stats
  const totalItems = vwSupplies.length;
  const lowStockItems = vwSupplies.filter(s => s.currentStock <= s.reorderPoint).length;
  const totalInventoryValue = vwSupplies.reduce((sum, s) => sum + (s.currentStock * s.unitCost), 0);
  
  // Mock data for RIS (since we haven't built that hook yet)
  const pendingRIS = 0; 

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Supply Management</h1>
          <p className="text-slate-600">Manage deliveries, stock, allocations, and RIS operations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Items</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">{totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Low Stock Items</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">{lowStockItems}</p>
              </div>
              {lowStockItems > 0 ? (
                <TrendingDown className="w-8 h-8 text-red-600" />
              ) : (
                <Badge className="bg-green-100 text-green-800">Good</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pending RIS</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">{pendingRIS}</p>
              </div>
              <FileText className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Value</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">{formatCurrency(totalInventoryValue)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};