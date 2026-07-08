import { useEffect, type ReactNode } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Package,
  Clock,
  CheckCircle,
  DollarSign,
  CalendarDays,
  TrendingUp
} from "lucide-react";
import { useDeliveryRecordStore } from "@/store/delivery"; // Adjust path if needed
import { formatCurrency } from "@/utils/formatters";

/** Responsive font size so currency values fit without truncation */
function CurrencyStatValue({ value }: { value: number }) {
  const formatted = formatCurrency(value);
  const sizeClass =
    formatted.length > 16 ? "text-xs sm:text-sm" :
    formatted.length > 13 ? "text-sm sm:text-base" :
    formatted.length > 10 ? "text-base sm:text-lg" :
    "text-xl sm:text-2xl";

  return (
    <p
      className={`${sizeClass} font-bold tabular-nums tracking-tight leading-snug text-slate-900 dark:text-white`}
      title={formatted}
    >
      {formatted}
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
        <p className={`text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 ${labelClassName ?? ""}`}>
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

export const DeliveryGeneralHeader = () => {
  // Month-to-date figures are computed server-side (see /Delivery/record/stats) so
  // this header doesn't need to pull the full delivery/IAR history to the client.
  const stats = useDeliveryRecordStore(state => state.deliveryStats);
  const fetchDeliveryStats = useDeliveryRecordStore(state => state.fetchDeliveryStats);

  useEffect(() => {
    fetchDeliveryStats();
  }, [fetchDeliveryStats]);

  return (
      <div className="space-y-6 mb-4">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Deliveries & Receipts
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage incoming deliveries, inspections, and vendor receipts
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* CARD 1: Deliveries (MTD) */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Deliveries (MTD)</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.deliveriesMTD}</p>
                </div>
                <div className="shrink-0 p-3 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl group-hover:bg-blue-100/70 dark:group-hover:bg-blue-900/40 transition-colors duration-300">
                  <CalendarDays className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: Pending Receipt */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pending Receipt (MTD)</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.pendingDeliveries}</p>
                </div>
                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:bg-indigo-100/70 dark:group-hover:bg-indigo-900/40 transition-colors duration-300">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 3: Received / Completed */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Received / Completed (MTD)</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.receivedDeliveries}</p>
                </div>
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-100/70 dark:group-hover:bg-emerald-900/40 transition-colors duration-300">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 4: Total Delivered Value */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardContent className="p-5">
              <MetricCardLayout
                label="Total Delivered Value (MTD)"
                value={<CurrencyStatValue value={stats.totalValue} />}
                icon={<DollarSign className="w-5 h-5" />}
                iconClassName="bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100/70 dark:group-hover:bg-emerald-900/40"
              />
            </CardContent>
          </Card>

          {/* CARD 5: Value Received (MTD) */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-purple-200 dark:hover:border-purple-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
            <CardContent className="p-5">
              <MetricCardLayout
                label="Value Received (MTD)"
                value={<CurrencyStatValue value={stats.valueReceivedMTD} />}
                icon={<TrendingUp className="w-5 h-5" />}
                iconClassName="bg-purple-50/60 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 group-hover:bg-purple-100/70 dark:group-hover:bg-purple-900/40"
              />
            </CardContent>
          </Card>

          {/* CARD 6: Pending Value (MTD) */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-orange-200 dark:hover:border-orange-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
            <CardContent className="p-5">
              <MetricCardLayout
                label="Pending Value (MTD)"
                value={<CurrencyStatValue value={stats.pendingValue} />}
                icon={<DollarSign className="w-5 h-5" />}
                iconClassName="bg-orange-50/60 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 group-hover:bg-orange-100/70 dark:group-hover:bg-orange-900/40"
              />
            </CardContent>
          </Card>

        </div>
      </div>
  );
};