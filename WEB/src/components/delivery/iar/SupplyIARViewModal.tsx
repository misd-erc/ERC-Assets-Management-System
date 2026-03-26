import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/dateUtils';
import { VwSupplyIAR } from '@/types';
import { FileText, ClipboardCheck, Package } from 'lucide-react';
import { VwDeliveryRecord } from "@/types/delivery/delivery";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: VwSupplyIAR | null;
  deliveryRecord: VwDeliveryRecord | null;
}

export const SupplyIARViewModal = ({ open, onOpenChange, record, deliveryRecord }: Props) => {
  if (!record) return null;

  const deliveryItems = deliveryRecord?.items || [];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600">
            <ClipboardCheck className="h-5 w-5" />
            <DialogTitle>IAR Details</DialogTitle>
          </div>
          <DialogDescription>Reference: {record.iarNumber}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information Grid */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 border-b pb-6">
            <div>
              <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">IAR Number</Label>
              <div className="font-semibold text-blue-700 text-base">{record.iarNumber}</div>
            </div>
            <div>
              <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">IAR Date</Label>
              <div className="font-medium text-slate-900">{formatDate(record.iarNumberDate)}</div>
            </div>
            
            {/* Linked Delivery Record */}
            {deliveryRecord && (
              <>
                <div className="col-span-2 border-t pt-4"></div>
                <div className="col-span-2 bg-blue-50/50 p-3 rounded-md border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <Label className="text-[10px] uppercase font-bold tracking-wider text-blue-700">Linked Delivery Record</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">DR Number:</span>
                      <div className="font-medium text-blue-700">{deliveryRecord.drNumber}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Delivery Date:</span>
                      <div className="font-medium">{formatDate(deliveryRecord.deliveryDate)}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-xs">Items:</span>
                      <div className="font-medium">{deliveryRecord.items?.length || 0} item(s)</div>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            <div className="col-span-2 border-t pt-4"></div>
            
            <div>
              <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Vendor / Supplier</Label>
              <div className="font-medium text-slate-900">{record.vendor?.name || '-'}</div>
            </div>
            <div>
              <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Fund Cluster</Label>
              <div className="font-medium text-slate-900">{record.fundCluster || '-'}</div>
            </div>
            
            <div>
              <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Requisitioning Office</Label>
              <div className="font-medium text-slate-900">{record.office?.name || 'N/A'}</div>
            </div>
            <div>
              <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Division</Label>
              <div className="font-medium text-slate-900">{record.division?.name || '-'}</div>
            </div>
            
            <div className="col-span-2 border-t pt-4"></div>
            
            <div>
              <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Purchase Order Number</Label>
              <div className="font-medium text-slate-900">{record.poNumber}</div>
            </div>
            <div>
              <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">PO Date</Label>
              <div className="font-medium text-slate-900">{formatDate(record.poDate)}</div>
            </div>
            
            <div>
              <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">RCC Code</Label>
              <div className="font-medium text-slate-900">{record.centerCode || '-'}</div>
            </div>
            <div>
              <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Approval Status</Label>
              <div className="mt-1">
                <Badge 
                  variant={record.isApproved ? "default" : "secondary"} 
                  className={record.isApproved ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {record.isApproved ? 'Approved' : 'Pending Approval'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Invoice Details Section */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 gap-4">
             <div className="col-span-2 flex items-center gap-2 mb-1 text-slate-500">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-bold uppercase">Invoice Reference</span>
             </div>
             <div>
                <Label className="text-[10px] text-muted-foreground">Invoice Number</Label>
                <div className="text-sm font-medium">{record.iarInvoiceNumber || 'N/A'}</div>
             </div>
             <div>
                <Label className="text-[10px] text-muted-foreground">Invoice Date</Label>
                <div className="text-sm font-medium">{record.iarInvoiceNumberDate ? formatDate(record.iarInvoiceNumberDate) : 'N/A'}</div>
             </div>
          </div>

          {/* Items List from Linked DR */}
          {deliveryItems.length > 0 ? (
            <div className="space-y-4">
              <div className="col-span-2 border-t my-4"></div>
              <div>
                <h3 className="font-semibold mb-3 text-sm">Delivered Items</h3>
                <div className="space-y-2">
                  {deliveryItems.map((item) => (
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
              </div>
            </div>
          ) : (
            <div className="py-10 text-center border-t">
              <p className="text-sm text-muted-foreground italic">No Delivered Items Yet</p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close View</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};