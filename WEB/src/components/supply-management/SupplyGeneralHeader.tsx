import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, FileText, BarChart3, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useSupplyItem } from '@/hooks';
import { formatCurrency } from '@/utils/formatters';

export const SupplyGeneralHeader = () => {
  const { vwSupplies } = useSupplyItem();

  // Optimized calculations to prevent unnecessary re-renders
  const stats = useMemo(() => {
    const totalItems = vwSupplies.length;

    // Ensure numbers to avoid string comparison bugs
    const lowStockItems = vwSupplies.filter(
        s => Number(s.currentStock || 0) <= Number(s.reorderPoint || 0)
    ).length;

    const totalInventoryValue = vwSupplies.reduce(
        (sum, s) => sum + (Number(s.currentStock || 0) * Number(s.unitCost || 0)),
        0
    );

    return {
      totalItems,
      lowStockItems,
      totalInventoryValue,
      pendingRIS: 0 // Mock data
    };
  }, [vwSupplies]);

  return (
      <div className="space-y-6 mb-8">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Supply Management</h1>
            <p className="text-slate-500 mt-1">
              Manage deliveries, stock levels, allocations, and RIS operations
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* 1. Total Items Card */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Total Items</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalItems}</p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Low Stock Alert Card (Dynamic State) */}
          <Card className={`hover:shadow-md transition-shadow duration-200 ${
              stats.lowStockItems > 0
                  ? 'border-red-200 bg-red-50/30'
                  : 'border-slate-200'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className={`text-sm font-medium ${stats.lowStockItems > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                    Low Stock Items
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-slate-900">{stats.lowStockItems}</p>
                    {stats.lowStockItems === 0 && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mt-1">
                          Healthy
                        </Badge>
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${
                    stats.lowStockItems > 0
                        ? 'bg-red-100 text-red-600 animate-pulse'
                        : 'bg-green-50 text-green-600'
                }`}>
                  {stats.lowStockItems > 0 ? (
                      <AlertTriangle className="w-5 h-5" />
                  ) : (
                      <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Pending RIS Card */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Pending RIS</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.pendingRIS}</p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Total Value Card */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Total Value</p>
                  <p className="text-3xl font-bold text-slate-900 truncate max-w-[150px]" title={formatCurrency(stats.totalInventoryValue)}>
                    {formatCurrency(stats.totalInventoryValue)}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
  );
};