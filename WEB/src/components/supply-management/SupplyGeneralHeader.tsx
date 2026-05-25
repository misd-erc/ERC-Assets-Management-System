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
  const { vwSuppliesSummary, totalSupplies, fetchSupplySummary } = useSupplyItem();
  const { iarsSummary, fetchSupplyIARSummary } = useSupplyIARStore();
  const { risSummary, fetchRISSummary } = useRISStore();

  // 3. Fetch latest summaries on mount
  useEffect(() => {
    fetchSupplyIARSummary();
    fetchRISSummary();
    fetchSupplySummary();
  }, [fetchSupplyIARSummary, fetchRISSummary, fetchSupplySummary]);

  // 4. Calculate all metrics
  const stats = useMemo(() => {
    // --- INVENTORY METRICS ---
    // The user wants "Total Items" to likely reflect the number of unique groups or the sum of quantities.
    // Given the context "encoded items", they probably mean total records.
    // However, since we display groups, showing totalGroups (totalSupplies) is more consistent with the table.
    // If they want total quantity, we should sum it.
    
    const totalItems = totalSupplies; 

    const outOfStockItems = vwSuppliesSummary.filter(
        s => Number(s.quantity || 0) === 0
    ).length;

    const lowStockItems = vwSuppliesSummary.filter(
        s => Number(s.quantity || 0) > 0 && Number(s.quantity || 0) <= Number(s.reorderPoint || 0)
    ).length;

    const totalInventoryValue = vwSuppliesSummary.reduce(
        (sum, s) => sum + (Number(s.quantity || 0) * Number(s.unitCost || 0)),
        0
    );

    // --- DELIVERY METRICS ---
    const pendingDeliveriesCount = iarsSummary.filter(iar => !iar.isApproved).length;

    // --- RIS METRICS ---
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let pendingRIS = 0;
    let completedRISThisMonth = 0;
    let issuedValueMTD = 0;

    risSummary.forEach(ris => {
      // 1. Pending: Requested but not yet approved or issued
      if (!ris.risApprovedDate && !ris.risIssuedDate) {
        pendingRIS++;
      }

      // 2. Completed (MTD): Has been issued, and the issue date is in the current month/year
      if (ris.risIssuedDate) {
        const issueDate = new Date(ris.risIssuedDate);
        if (issueDate.getMonth() === currentMonth && issueDate.getFullYear() === currentYear) {
          completedRISThisMonth++;

          // --- CALCULATE VALUE ISSUED MTD ---
          if (ris.items && ris.items.length > 0) {
            ris.items.forEach(risItem => {
              const matchedSupply = vwSuppliesSummary.find(s => s.code === risItem.stockNumber);
              const costPerUnit = matchedSupply ? Number(matchedSupply.unitCost || 0) : 0;
              const itemTotalValue = Number(risItem.issueQuantity || 0) * costPerUnit;
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
      pendingDeliveries: pendingDeliveriesCount,
      pendingRIS,
      completedRISThisMonth,
      issuedValueMTD
    };
  }, [vwSuppliesSummary, totalSupplies, iarsSummary, risSummary]); // Re-calculate when any of these 3 lists change

  return (
      <div className="space-y-6 mb-4">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Supply Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage deliveries, stock levels, allocations, and RIS operations
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* CARD 1: Total Items */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Items</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.totalItems}</p>
                </div>
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl group-hover:bg-blue-100/70 dark:group-hover:bg-blue-900/40 transition-colors duration-300">
                  <Package className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: Current Stock Value */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Current Stock Value</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate max-w-[140px]" title={formatCurrency(stats.totalInventoryValue)}>
                    {formatCurrency(stats.totalInventoryValue)}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-100/70 dark:group-hover:bg-emerald-900/40 transition-colors duration-300">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 3: Low Stock Items */}
          <Card className={`group relative overflow-hidden bg-white dark:bg-slate-900 border hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl ${
              stats.lowStockItems > 0 
                ? 'border-amber-200 dark:border-amber-900/50 hover:border-amber-300' 
                : 'border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300'
          }`}>
            <div className={`absolute top-0 left-0 w-1 h-full ${
              stats.lowStockItems > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
            }`} />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${stats.lowStockItems > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    Low Stock Items
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.lowStockItems}</p>
                    {stats.lowStockItems === 0 && stats.outOfStockItems === 0 && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30 text-[10px] py-0.5 px-1.5 font-bold">
                          Healthy
                        </Badge>
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-xl transition-colors duration-300 ${
                    stats.lowStockItems > 0 
                      ? 'bg-amber-50/60 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:bg-amber-100/70 dark:group-hover:bg-amber-900/40' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 4: Out of Stock */}
          <Card className={`group relative overflow-hidden bg-white dark:bg-slate-900 border hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl ${
              stats.outOfStockItems > 0 
                ? 'border-red-200 dark:border-red-900/50 hover:border-red-300' 
                : 'border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300'
          }`}>
            <div className={`absolute top-0 left-0 w-1 h-full ${
              stats.outOfStockItems > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-400'
            }`} />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${stats.outOfStockItems > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    Out of Stock
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.outOfStockItems}</p>
                    {stats.outOfStockItems > 0 && (
                        <Badge variant="outline" className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30 animate-pulse text-[10px] py-0.5 px-1.5 font-bold">
                          Critical
                        </Badge>
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-xl transition-colors duration-300 ${
                    stats.outOfStockItems > 0 
                      ? 'bg-red-50/60 dark:bg-red-950/40 text-red-600 dark:text-red-400 group-hover:bg-red-100/70 dark:group-hover:bg-red-900/40' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                }`}>
                  <AlertOctagon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 5: Pending RIS */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-orange-200 dark:hover:border-orange-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pending RIS</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.pendingRIS}</p>
                </div>
                <div className="p-3 bg-orange-50/60 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-xl group-hover:bg-orange-100/70 dark:group-hover:bg-orange-900/40 transition-colors duration-300">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 6: Completed RIS (MTD) */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Completed RIS (MTD)</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.completedRISThisMonth}</p>
                </div>
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-100/70 dark:group-hover:bg-emerald-900/40 transition-colors duration-300">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 7: Inbound Deliveries */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Inbound Deliveries</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.pendingDeliveries}</p>
                </div>
                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:bg-indigo-100/70 dark:group-hover:bg-indigo-900/40 transition-colors duration-300">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 8: Value Issued (MTD) */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-purple-200 dark:hover:border-purple-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Value Issued (MTD)</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate max-w-[140px]" title={formatCurrency(stats.issuedValueMTD)}>
                    {formatCurrency(stats.issuedValueMTD)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50/60 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl group-hover:bg-purple-100/70 dark:group-hover:bg-purple-900/40 transition-colors duration-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
  );
};