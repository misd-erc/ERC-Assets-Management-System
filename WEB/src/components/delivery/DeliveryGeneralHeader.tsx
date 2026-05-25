import { useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Clock,
  CheckCircle,
  DollarSign,
  AlertCircle,
  XCircle,
  CalendarDays,
  TrendingUp
} from "lucide-react";
import { useDeliveryRecordStore } from "@/store/delivery"; // Adjust path if needed
import { useSupplyIARStore } from "@/store/supply";
import { formatCurrency } from "@/utils/formatters";

export const DeliveryGeneralHeader = () => {
  const vwDeliveryRecordsSummary = useDeliveryRecordStore(state => state.vwDeliveryRecordsSummary);
  const fetchDeliveryRecordsSummary = useDeliveryRecordStore(state => state.fetchDeliveryRecordsSummary);
  
  const iarsSummary = useSupplyIARStore(state => state.iarsSummary);
  const fetchSupplyIARSummary = useSupplyIARStore(state => state.fetchSupplyIARSummary);

  useEffect(() => {
    fetchDeliveryRecordsSummary();
    fetchSupplyIARSummary();
  }, [fetchDeliveryRecordsSummary, fetchSupplyIARSummary]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalDeliveries = 0;
    let pendingDeliveries = 0;
    let receivedDeliveries = 0;
    let totalValue = 0;

    let pendingValue = 0;
    let deliveriesMTD = 0;
    let valueReceivedMTD = 0;
    let rejectedDeliveries = 0;
    let delayedInspections = 0;

    // --- Process Delivery Records ---
    vwDeliveryRecordsSummary.forEach(record => {
      totalDeliveries++;

      const recordTotal = Number(record.totalAmount) || 0;
      totalValue += recordTotal;

      const recordDateString = record.deliveryDate || record.createdAt;
      const recordDate = recordDateString ? new Date(recordDateString) : now;
      const isThisMonth = recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;

      if (!record.isReceived) {
        pendingDeliveries++;
        pendingValue += recordTotal;

        const daysPending = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 3600 * 24));
        if (daysPending > 3) delayedInspections++;
      } else {
        receivedDeliveries++;
        if (isThisMonth) {
          deliveriesMTD++;
          valueReceivedMTD += recordTotal;
        }
      }
    });

    // --- Process Unlinked IARs ---
    iarsSummary.forEach(iar => {
      if (!iar.recordId) {
        totalDeliveries++;
        if (!iar.isApproved) {
          pendingDeliveries++;
          const recordDateString = iar.iarNumberDate || iar.createdAt;
          const recordDate = recordDateString ? new Date(recordDateString) : now;
          const daysPending = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 3600 * 24));
          if (daysPending > 3) delayedInspections++;
        } else {
          receivedDeliveries++;
          const recordDateString = iar.iarNumberDate || iar.createdAt;
          const recordDate = recordDateString ? new Date(recordDateString) : now;
          const isThisMonth = recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
          if (isThisMonth) deliveriesMTD++;
        }
      }
    });

    return {
      totalDeliveries,
      pendingDeliveries,
      receivedDeliveries,
      totalValue,
      pendingValue,
      deliveriesMTD,
      valueReceivedMTD,
      rejectedDeliveries,
      delayedInspections
    };
  }, [vwDeliveryRecordsSummary, iarsSummary]);

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
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Deliveries (MTD)</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.deliveriesMTD}</p>
                </div>
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl group-hover:bg-blue-100/70 dark:group-hover:bg-blue-900/40 transition-colors duration-300">
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
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pending Receipt</p>
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
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Received / Completed</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.receivedDeliveries}</p>
                </div>
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-100/70 dark:group-hover:bg-emerald-900/40 transition-colors duration-300">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 4: Rejected / Issues */}
          <Card className={`group relative overflow-hidden bg-white dark:bg-slate-900 border hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl ${
              stats.rejectedDeliveries > 0 
                ? 'border-red-200 dark:border-red-900/50 hover:border-red-300' 
                : 'border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300'
          }`}>
            <div className={`absolute top-0 left-0 w-1 h-full ${
              stats.rejectedDeliveries > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-400'
            }`} />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${stats.rejectedDeliveries > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    Rejected / Issues
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.rejectedDeliveries}</p>
                    {stats.rejectedDeliveries > 0 && (
                        <Badge variant="outline" className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30 animate-pulse text-[10px] py-0.5 px-1.5 font-bold">
                          Issues
                        </Badge>
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-xl transition-colors duration-300 ${
                    stats.rejectedDeliveries > 0 
                      ? 'bg-red-50/60 dark:bg-red-950/40 text-red-600 dark:text-red-400 group-hover:bg-red-100/70 dark:group-hover:bg-red-900/40' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                }`}>
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 5: Total Asset Value */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Asset Value</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate max-w-[140px]" title={formatCurrency(stats.totalValue)}>
                    {formatCurrency(stats.totalValue)}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-100/70 dark:group-hover:bg-emerald-900/40 transition-colors duration-300">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 6: Value Received (MTD) */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-purple-200 dark:hover:border-purple-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Value Received (MTD)</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate max-w-[140px]" title={formatCurrency(stats.valueReceivedMTD)}>
                    {formatCurrency(stats.valueReceivedMTD)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50/60 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl group-hover:bg-purple-100/70 dark:group-hover:bg-purple-900/40 transition-colors duration-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 7: Pending Value */}
          <Card className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-orange-200 dark:hover:border-orange-900/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pending Value</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate max-w-[140px]" title={formatCurrency(stats.pendingValue)}>
                    {formatCurrency(stats.pendingValue)}
                  </p>
                </div>
                <div className="p-3 bg-orange-50/60 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-xl group-hover:bg-orange-100/70 dark:group-hover:bg-orange-900/40 transition-colors duration-300">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 8: Delayed Inspections */}
          <Card className={`group relative overflow-hidden bg-white dark:bg-slate-900 border hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm rounded-2xl ${
              stats.delayedInspections > 0 
                ? 'border-amber-200 dark:border-amber-900/50 hover:border-amber-300' 
                : 'border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300'
          }`}>
            <div className={`absolute top-0 left-0 w-1 h-full ${
              stats.delayedInspections > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
            }`} />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${stats.delayedInspections > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    Delayed Inspections
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.delayedInspections}</p>
                    {stats.delayedInspections > 0 && (
                        <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30 animate-pulse text-[10px] py-0.5 px-1.5 font-bold">
                          Warning
                        </Badge>
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-xl transition-colors duration-300 ${
                    stats.delayedInspections > 0 
                      ? 'bg-amber-50/60 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:bg-amber-100/70 dark:group-hover:bg-amber-900/40' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                }`}>
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
  );
};