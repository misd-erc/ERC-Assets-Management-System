import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Clock, CheckCircle, DollarSign } from "lucide-react";
import { useDeliveryRecordStore } from "@/store/delivery";
import { formatCurrency } from "@/utils/formatters";

export const DeliveryGeneralHeader = () => {
  const { vwDeliveryRecords } = useDeliveryRecordStore();

  const totalDeliveries = vwDeliveryRecords.length;
  const pendingDeliveries = vwDeliveryRecords.filter(r => !r.isReceived).length;
  const receivedDeliveries = vwDeliveryRecords.filter(r => r.isReceived).length;
  
  // Calculate total value of all deliveries (sum of all items in all records)
  const totalValue = vwDeliveryRecords.reduce((acc, record) => {
    const recordTotal = record.items?.reduce((sum, item) => sum + ((item.itemQuantity || 0) * (item.unitCost || 0)), 0) || 0;
    return acc + recordTotal;
  }, 0);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDeliveries}</div>
          <p className="text-xs text-muted-foreground">All time records</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Receipt</CardTitle>
          <Clock className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{pendingDeliveries}</div>
          <p className="text-xs text-muted-foreground">Awaiting inspection</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Received / Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{receivedDeliveries}</div>
          <p className="text-xs text-muted-foreground">Fully processed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalValue)}</div>
          <p className="text-xs text-muted-foreground">Total asset value</p>
        </CardContent>
      </Card>
    </div>
  );
};