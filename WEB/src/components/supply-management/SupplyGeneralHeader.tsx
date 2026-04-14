import { useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  FileText,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Truck,
  TrendingUp
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

// 1. Import your hooks and stores
import { useSupplyItem } from '@/hooks';
import { useSupplyIARStore } from '@/store/supply/index';
import { useRISStore } from '@/store/supply/risStore'; // Adjust path to where your RIS store is located

export const SupplyGeneralHeader = () => {
  // 2. Consume the stores
  const { vwSupplies, fetchSupplyItems } = useSupplyItem();
  const { iars, fetchSupplyIARs } = useSupplyIARStore();
  const { risList, fetchRISs } = useRISStore();

  // 3. Fetch latest IARs and RISs on mount
  useEffect(() => {
    fetchSupplyIARs();
    fetchRISs();
    fetchSupplyItems();
  }, [fetchSupplyIARs, fetchRISs]);

  // 4. Calculate all metrics
  const stats = useMemo(() => {
    // --- INVENTORY METRICS (from vwSupplies) ---
    const totalItems = vwSupplies.length;

    const outOfStockItems = vwSupplies.filter(
        s => Number(s.currentStock || 0) === 0
    ).length;

    const lowStockItems = vwSupplies.filter(
        s => Number(s.currentStock || 0) > 0 && Number(s.currentStock || 0) <= Number(s.reorderPoint || 0)
    ).length;

    const totalInventoryValue = vwSupplies.reduce(
        (sum, s) => sum + (Number(s.currentStock || 0) * Number(s.unitCost || 0)),
        0
    );

    // --- DELIVERY METRICS (from IAR Store) ---
    const pendingDeliveries = iars.filter(iar => !iar.isApproved).length;

    // --- RIS METRICS (from your RIS Store) ---
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let pendingRIS = 0;
    let completedRISThisMonth = 0;
    let issuedValueMTD = 0;

    risList.forEach(ris => {
      // 1. Pending: Requested but not yet approved or issued
      if (!ris.risApprovedDate && !ris.risIssuedDate) {
        pendingRIS++;
      }

      // 2. Completed (MTD): Has been issued, and the issue date is in the current month/year
      if (ris.risIssuedDate) {
        const issueDate = new Date(ris.risIssuedDate);
        if (issueDate.getMonth() === currentMonth && issueDate.getFullYear() === currentYear) {
          completedRISThisMonth++;

          // --- NEW: CALCULATE VALUE ISSUED MTD ---
          // Ensure the RIS has items loaded
          if (ris.items && ris.items.length > 0) {
            ris.items.forEach(risItem => {
              // A. Find the matching supply item in your inventory catalog to get its price
              // (Assuming 'code' in vwSupplies matches 'stockNumber' in risItem)
              const matchedSupply = vwSupplies.find(s => s.code === risItem.stockNumber);

              // B. Extract the unit cost (default to 0 if something is missing)
              const costPerUnit = matchedSupply ? Number(matchedSupply.unitCost || 0) : 0;

              // C. Multiply the cost by the ACTUAL quantity issued (not the requested amount)
              const itemTotalValue = Number(risItem.issueQuantity || 0) * costPerUnit;

              // D. Add it to our running total
              issuedValueMTD += itemTotalValue;
            });
          }
        }
      }
    });

    return {
      totalItems,
      outOfStockItems,
      lowStockItems,
      totalInventoryValue,
      pendingDeliveries,
      pendingRIS,
      completedRISThisMonth,
      issuedValueMTD
    };
  }, [vwSupplies, iars, risList]); // Re-calculate when any of these 3 lists change

  return (
      <div className="space-y-6 mb-8">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Supply Management</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage deliveries, stock levels, allocations, and RIS operations
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* ROW 1: Current Inventory State */}
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

          <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Current Stock Value</p>
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

          <Card className={`hover:shadow-md transition-shadow duration-200 ${
              stats.lowStockItems > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className={`text-sm font-medium ${stats.lowStockItems > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                    Low Stock Items
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-slate-900">{stats.lowStockItems}</p>
                    {stats.lowStockItems === 0 && stats.outOfStockItems === 0 && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mt-1">
                          Healthy
                        </Badge>
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${
                    stats.lowStockItems > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`hover:shadow-md transition-shadow duration-200 ${
              stats.outOfStockItems > 0 ? 'border-red-200 bg-red-50/40' : 'border-slate-200'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className={`text-sm font-medium ${stats.outOfStockItems > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                    Out of Stock
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-slate-900">{stats.outOfStockItems}</p>
                    {stats.outOfStockItems > 0 && (
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 mt-1 animate-pulse">
                          Critical
                        </Badge>
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${
                    stats.outOfStockItems > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-50 text-slate-400'
                }`}>
                  <AlertOctagon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ROW 2: Operations & Velocity */}

          <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Pending RIS</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.pendingRIS}</p>
                </div>
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Completed RIS (MTD)</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.completedRISThisMonth}</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Inbound Deliveries</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.pendingDeliveries}</p>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Value Issued (MTD)</p>
                  <p className="text-3xl font-bold text-slate-900 truncate max-w-[150px]" title={formatCurrency(stats.issuedValueMTD)}>
                    {formatCurrency(stats.issuedValueMTD)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
  );
};