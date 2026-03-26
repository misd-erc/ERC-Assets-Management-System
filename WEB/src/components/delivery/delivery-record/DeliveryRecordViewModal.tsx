import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/dateUtils';
import { VwDeliveryRecord } from '@/types/delivery/delivery';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: VwDeliveryRecord | null;
}

export const DeliveryRecordViewModal = ({ open, onOpenChange, record }: Props) => {
  if (!record) return null;

  const totalValue = record.items.reduce((acc, item) => acc + (item.itemQuantity * item.unitCost), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Delivery Details</DialogTitle>
          <DialogDescription>Reference: {record.drNumber}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4 border-b pb-4">
            <div>
              <Label className="text-muted-foreground text-xs">Delivery Date</Label>
              <div className="font-medium">{formatDate(record.deliveryDate)}</div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Status</Label>
              <div><Badge variant={record.isReceived ? "default" : "secondary"}>{record.isReceived ? 'Received' : 'Pending'}</Badge></div>
            </div>
          </div>

          {/* Items List */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Delivered Items</h3>
            <div className="space-y-2">
              {record.items.map((item) => (
                <div key={item.id} className="flex flex-col p-3 border rounded-lg bg-slate-50/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{item.itemTypeId === 1 ? 'Supply' : item.itemTypeId === 2 ? 'PPE' : 'SE'}</Badge>
                        {item.itemDescription}
                        {item.code && <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 rounded">[{item.code}]</span>}
                      </div>
                      
                      {item.itemTypeId === 1 && (
                        <div className="flex gap-3 mt-1.5 mb-1 text-[11px] text-blue-700 font-medium">
                          <span>Stock: {item.currentStock}</span>
                          <span>Reorder: {item.reorderPoint}</span>
                          <span>Loc: {item.storageLocation?.name || 'N/A'}</span>
                        </div>
                      )}

                      {item.itemSpecification && (
                        <div className="text-[11px] text-muted-foreground italic mt-1 max-w-sm">
                          Specs: {item.itemSpecification}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(item.itemQuantity * item.unitCost)}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.itemQuantity} {item.measurementUnit?.name} @ {formatCurrency(item.unitCost)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t">
              <span className="font-bold text-lg text-green-700">Total: {formatCurrency(totalValue)}</span>
            </div>
          </div>
          
          {record.remarks && (
            <div className="bg-slate-50 p-3 rounded text-sm">
              <Label className="text-xs text-muted-foreground">Remarks</Label>
              <p>{record.remarks}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};