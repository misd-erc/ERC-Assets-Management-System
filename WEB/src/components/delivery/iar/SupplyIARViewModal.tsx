import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/utils/dateUtils';
import { VwSupplyIAR } from '@/types';

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
          <DialogTitle>IAR Details</DialogTitle>
          <DialogDescription>Reference: {record.iarNumber}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 border-b pb-4">
             <div><Label className="text-muted-foreground text-xs">IAR Number</Label><div className="font-medium text-blue-700">{record.iarNumber}</div></div>
             <div><Label className="text-muted-foreground text-xs">IAR Date</Label><div className="font-medium">{formatDate(record.iarNumberDate)}</div></div>
             <div className="col-span-2 border-t pt-2"></div>
             <div><Label className="text-muted-foreground text-xs">Vendor</Label><div className="font-medium text-slate-900">{record.vendor?.name || '-'}</div></div>
             <div><Label className="text-muted-foreground text-xs">Fund Cluster</Label><div className="font-medium">{record.fundCluster || '-'}</div></div>
             <div><Label className="text-muted-foreground text-xs">Requisitioning Office</Label><div className="font-medium">{record.office?.name  || 'N/A'}</div></div>
             <div><Label className="text-muted-foreground text-xs">Division</Label><div className="font-medium">{record.division?.name || '-'}</div></div>
             <div className="col-span-2 border-t pt-2"></div>
             <div><Label className="text-muted-foreground text-xs">PO Number</Label><div className="font-medium">{record.poNumber}</div></div>
             <div><Label className="text-muted-foreground text-xs">PO Date</Label><div className="font-medium">{formatDate(record.poDate)}</div></div>
             <div><Label className="text-muted-foreground text-xs">RCC Code</Label><div className="font-medium">{record.centerCode || '-'}</div></div>
             <div><Label className="text-muted-foreground text-xs">Status</Label><div><Badge>{record.isActive ? 'Active' : 'Inactive'}</Badge></div></div>
          </div>
        </div>

        <DialogFooter><Button onClick={() => onOpenChange(false)}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};