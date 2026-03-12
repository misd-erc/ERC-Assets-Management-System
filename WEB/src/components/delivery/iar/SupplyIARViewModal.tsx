import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/utils/dateUtils';
import { VwSupplyIAR } from '@/types';
import { FileText, ClipboardCheck } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: VwSupplyIAR | null;
}

export const SupplyIARViewModal = ({ open, onOpenChange, record }: Props) => {
  if (!record) return null;

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
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close View</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};