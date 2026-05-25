import { useMemo, useEffect, type ReactNode } from 'react';
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
import { useSupplyItem } from '@/hooks';
import { useSupplyIARStore } from '@/store/supply/index';
import { useRISStore } from '@/store/supply/risStore';

function CurrencyStatValue({ value }: { value: number }) {
  const formatted = formatCurrency(value);
  const sizeClass =
    formatted.length > 16 ? 'text-xs sm:text-sm' :
    formatted.length > 13 ? 'text-sm sm:text-base' :
    formatted.length > 10 ? 'text-base sm:text-lg' :
    'text-xl sm:text-2xl';

  return (
    <p
      className={`${sizeClass} font-bold tabular-nums tracking-tight leading-snug text-slate-900 dark:text-white break-words`}
      title={formatted}
    >
      {formatted}
    </p>
  );
}

function CountStatValue({ value }: { value: number }) {
  const text = String(value);
  const sizeClass =
    text.length > 6 ? 'text-base sm:text-lg' :
    text.length > 4 ? 'text-lg sm:text-xl' :
    'text-xl sm:text-2xl';

  return (
    <p className={`${sizeClass} font-bold tabular-nums tracking-tight text-slate-900 dark:text-white`}>
      {value}
    </p>
  );
}

function MetricCardLayout({
  label,
  labelClassName,
  value,
  icon,
  iconClassName,
}: {
  label: string;
  labelClassName?: string;
  value: ReactNode;
  icon: ReactNode;
  iconClassName: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-2">
        <p className={`text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 ${labelClassName ?? ''}`}>
          {label}
        </p>
        {value}
      </div>
      <div className={`shrink-0 p-3 rounded-xl transition-colors duration-300 ${iconClassName}`}>
        {icon}
      </div>
    </div>
  );
}

export const SupplyGeneralHeader = () => {
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
        s => Number(s.totalCurrentStock || 0) === 0
    ).length;

    const lowStockItems = vwSuppliesSummary.filter(
        s => {
          const stock = Number(s.totalCurrentStock || 0);
          const reorder = Number(s.reorderPoint || 0);
          return stock > 0 && reorder > 0 && stock <= reorder;
        }
    ).length;

    const totalInventoryValue = vwSuppliesSummary.reduce(
        (sum, s) => sum + Number(s.totalStockCost || 0),
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
              const stock = Number(matchedSupply?.totalCurrentStock || 0);
              const costPerUnit = stock > 0
                ? Number(matchedSupply?.totalStockCost || 0) / stock
                : 0;
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
              <MetricCardLayout
                label="Total Items"
                value={<CountStatValue value={stats.totalItems} />}
                icon={<Package className="w-5 h-5" />}
                iconClassName="bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100/70 dark:group-hover:bg-blue-900/40"
              />
            </CardContent>
          </Card>

          {/* CARD 2: Current Stock Value */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardContent className="p-5">
              <MetricCardLayout
                label="Current Stock Value"
                value={<CurrencyStatValue value={stats.totalInventoryValue} />}
                icon={<BarChart3 className="w-5 h-5" />}
                iconClassName="bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100/70 dark:group-hover:bg-emerald-900/40"
              />
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
              <MetricCardLayout
                label="Low Stock Items"
                labelClassName={stats.lowStockItems > 0 ? 'text-amber-600 dark:text-amber-400' : undefined}
                value={
                  <div className="flex flex-wrap items-center gap-2">
                    <CountStatValue value={stats.lowStockItems} />
                    {stats.lowStockItems === 0 && stats.outOfStockItems === 0 && (
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30 text-[10px] py-0.5 px-1.5 font-bold">
                        Healthy
                      </Badge>
                    )}
                  </div>
                }
                icon={<AlertTriangle className="w-5 h-5" />}
                iconClassName={
                  stats.lowStockItems > 0
                    ? 'bg-amber-50/60 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:bg-amber-100/70 dark:group-hover:bg-amber-900/40'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                }
              />
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
              <MetricCardLayout
                label="Out of Stock"
                labelClassName={stats.outOfStockItems > 0 ? 'text-red-600 dark:text-red-400' : undefined}
                value={
                  <div className="flex flex-wrap items-center gap-2">
                    <CountStatValue value={stats.outOfStockItems} />
                    {stats.outOfStockItems > 0 && (
                      <Badge variant="outline" className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30 animate-pulse text-[10px] py-0.5 px-1.5 font-bold">
                        Critical
                      </Badge>
                    )}
                  </div>
                }
                icon={<AlertOctagon className="w-5 h-5" />}
                iconClassName={
                  stats.outOfStockItems > 0
                    ? 'bg-red-50/60 dark:bg-red-950/40 text-red-600 dark:text-red-400 group-hover:bg-red-100/70 dark:group-hover:bg-red-900/40'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                }
              />
            </CardContent>
          </Card>

          {/* CARD 5: Pending RIS */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-orange-200 dark:hover:border-orange-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
            <CardContent className="p-5">
              <MetricCardLayout
                label="Pending RIS"
                value={<CountStatValue value={stats.pendingRIS} />}
                icon={<FileText className="w-5 h-5" />}
                iconClassName="bg-orange-50/60 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 group-hover:bg-orange-100/70 dark:group-hover:bg-orange-900/40"
              />
            </CardContent>
          </Card>

          {/* CARD 6: Completed RIS (MTD) */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardContent className="p-5">
              <MetricCardLayout
                label="Completed RIS (MTD)"
                value={<CountStatValue value={stats.completedRISThisMonth} />}
                icon={<CheckCircle2 className="w-5 h-5" />}
                iconClassName="bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100/70 dark:group-hover:bg-emerald-900/40"
              />
            </CardContent>
          </Card>

          {/* CARD 7: Inbound Deliveries */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <CardContent className="p-5">
              <MetricCardLayout
                label="Inbound Deliveries"
                value={<CountStatValue value={stats.pendingDeliveries} />}
                icon={<Truck className="w-5 h-5" />}
                iconClassName="bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100/70 dark:group-hover:bg-indigo-900/40"
              />
            </CardContent>
          </Card>

          {/* CARD 8: Value Issued (MTD) */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-purple-200 dark:hover:border-purple-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
            <CardContent className="p-5">
              <MetricCardLayout
                label="Value Issued (MTD)"
                value={<CurrencyStatValue value={stats.issuedValueMTD} />}
                icon={<TrendingUp className="w-5 h-5" />}
                iconClassName="bg-purple-50/60 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 group-hover:bg-purple-100/70 dark:group-hover:bg-purple-900/40"
              />
            </CardContent>
          </Card>

        </div>
      </div>
  );
};