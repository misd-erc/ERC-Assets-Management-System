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
      <div className="space-y-6 mb-8">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Delivery Management</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage incoming deliveries, inspections, and vendor receipts
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* ROW 1: Overall Status & Operations */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Deliveries (MTD)</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.deliveriesMTD}</p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <CalendarDays className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Pending Receipt</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.pendingDeliveries}</p>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Received / Completed</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.receivedDeliveries}</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`hover:shadow-md transition-shadow duration-200 ${
              stats.rejectedDeliveries > 0 ? 'border-red-200 bg-red-50/40' : 'border-slate-200'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className={`text-sm font-medium ${stats.rejectedDeliveries > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                    Rejected / Issues
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-slate-900">{stats.rejectedDeliveries}</p>
                    {stats.rejectedDeliveries > 0 && (
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 mt-1 animate-pulse">
                          Failed
                        </Badge>
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${
                    stats.rejectedDeliveries > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-50 text-slate-400'
                }`}>
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ROW 2: Financials & SLA */}

          <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Total Asset Value</p>
                  <p className="text-2xl font-bold text-slate-900 truncate max-w-[150px]" title={formatCurrency(stats.totalValue)}>
                    {formatCurrency(stats.totalValue)}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Value Received (MTD)</p>
                  <p className="text-2xl font-bold text-slate-900 truncate max-w-[150px]" title={formatCurrency(stats.valueReceivedMTD)}>
                    {formatCurrency(stats.valueReceivedMTD)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Pending Value</p>
                  <p className="text-2xl font-bold text-slate-900 truncate max-w-[150px]" title={formatCurrency(stats.pendingValue)}>
                    {formatCurrency(stats.pendingValue)}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`hover:shadow-md transition-shadow duration-200 ${
              stats.delayedInspections > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className={`text-sm font-medium ${stats.delayedInspections > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                    Delayed Inspections
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-slate-900">{stats.delayedInspections}</p>
                    {stats.delayedInspections > 0 && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 mt-1">
                          Warning
                        </Badge>
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${
                    stats.delayedInspections > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'
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