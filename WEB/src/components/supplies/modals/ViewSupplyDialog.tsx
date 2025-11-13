import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/ui/dialog';
import { Button } from '@/ui/button';
import { SupplyItem } from '@/types/supply/supply';
import { formatCurrency, getStockStatus, getStockStatusColor } from '@/utils/formatters';
import { Badge } from '@/ui/badge';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  supply?: SupplyItem | null;
}

export const ViewSupplyDialog: React.FC<Props> = ({ open, onOpenChange, supply }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Supply Item Details</DialogTitle>
          <DialogDescription>Complete information for {supply?.stockNumber}</DialogDescription>
        </DialogHeader>

        {supply ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Item Code</p>
              <p className="font-medium">{supply.stockNumber}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Category</p>
              <p className="font-medium">{supply.category}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-slate-600">Description</p>
              <p>{supply.description}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Current Stock</p>
              <p className="font-medium">{supply.currentStock} {supply.unit}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Unit Cost</p>
              <p className="font-medium">{formatCurrency(supply.unitCost)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Value</p>
              <p className="font-medium">{formatCurrency(supply.totalValue)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <Badge className={getStockStatusColor(getStockStatus(supply))}>{getStockStatus(supply)}</Badge>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">No supply selected</p>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="bg-blue-600">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

