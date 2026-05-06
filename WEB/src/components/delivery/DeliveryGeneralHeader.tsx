import { useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useSupplyIAR } from "@/hooks";
import { formatCurrency } from "@/utils/formatters";

export const DeliveryGeneralHeader = () => {
  // 1. Pull data from both delivery and supply stores
  const { vwDeliveryRecords, fetchDeliveryRecords } = useDeliveryRecordStore();
  const { iars, fetchSupplyIARs } = useSupplyIAR();

  // 2. Fetch all data when the dashboard component mounts
  useEffect(() => {
    fetchDeliveryRecords();
    fetchSupplyIARs();
  }, [fetchDeliveryRecords, fetchSupplyIARs]);

  // 3. Calculate metrics safely
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

    // Track linked IAR IDs to avoid double counting if we were to iterate IARs primarily
    const linkedIarIds = new Set(vwDeliveryRecords.map(r => r.supplyIAR?.id).filter(id => id !== undefined));

    // --- Process Delivery Records ---
    vwDeliveryRecords.forEach(record => {
      totalDeliveries++;

      const recordTotal = Number(record.totalAmount) || record.items?.reduce(
          (sum: number, item: any) => sum + ((Number(item.itemQuantity) || 0) * (Number(item.unitCost) || 0)),
          0
      ) || 0;

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

    // --- Process Unlinked IARs (Receipts created directly as IARs) ---
    iars.forEach(iar => {
      // If it's not linked to a DR, it's a separate "Receipt"
      if (!iar.recordId) {
        totalDeliveries++;
        
        // Unlinked IARs currently don't have items in the same way, 
        // but we should still count their status
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
  }, [vwDeliveryRecords, iars]); // Recalculate when either store updates

  return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">

        {/* ROW 1: Overall Status & Operations */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deliveries (MTD)</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deliveriesMTD}</div>
            <p className="text-xs text-muted-foreground">Received this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Receipt</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pendingDeliveries}</div>
            <p className="text-xs text-muted-foreground">Awaiting inspection</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received / Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.receivedDeliveries}</div>
            <p className="text-xs text-muted-foreground">Fully processed (All time)</p>
          </CardContent>
        </Card>

        <Card className={stats.rejectedDeliveries > 0 ? "border-red-200 bg-red-50/30" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected / Issues</CardTitle>
            <XCircle className={`h-4 w-4 ${stats.rejectedDeliveries > 0 ? "text-red-500" : "text-slate-400"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.rejectedDeliveries > 0 ? "text-red-600" : "text-slate-700"}`}>
              {stats.rejectedDeliveries}
            </div>
            <p className="text-xs text-muted-foreground">Failed inspections</p>
          </CardContent>
        </Card>

        {/* ROW 2: Financials & SLA */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Asset Value</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 truncate" title={formatCurrency(stats.totalValue)}>
              {formatCurrency(stats.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">All time value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Value Received (MTD)</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 truncate" title={formatCurrency(stats.valueReceivedMTD)}>
              {formatCurrency(stats.valueReceivedMTD)}
            </div>
            <p className="text-xs text-muted-foreground">Processed this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Value</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 truncate" title={formatCurrency(stats.pendingValue)}>
              {formatCurrency(stats.pendingValue)}
            </div>
            <p className="text-xs text-muted-foreground">Value awaiting inspection</p>
          </CardContent>
        </Card>

        <Card className={stats.delayedInspections > 0 ? "border-orange-200 bg-orange-50/30" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delayed Inspections</CardTitle>
            <AlertCircle className={`h-4 w-4 ${stats.delayedInspections > 0 ? "text-orange-500" : "text-slate-400"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.delayedInspections > 0 ? "text-orange-600" : "text-slate-700"}`}>
              {stats.delayedInspections}
            </div>
            <p className="text-xs text-muted-foreground">Pending for &gt; 3 days</p>
          </CardContent>
        </Card>

      </div>
  );
};