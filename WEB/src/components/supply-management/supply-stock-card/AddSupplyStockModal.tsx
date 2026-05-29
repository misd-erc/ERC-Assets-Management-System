import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AddSupplyStockForm } from './AddSupplyStockForm';

interface AddSupplyStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockNumber: string;
  description: string;
  unitId?: number;
  editId?: number;
  onSuccess: () => void;
}

export const AddSupplyStockModal = ({
  open,
  onOpenChange,
  stockNumber,
  description,
  unitId,
  editId,
  onSuccess,
}: AddSupplyStockModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-7xl !w-[60vw] max-h-[90vh] overflow-y-auto p-6 bg-white border border-slate-200 rounded-lg shadow-2xl flex flex-col gap-4">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-2xl text-slate-900 font-bold">
            {editId ? 'Edit' : 'Add'} Supply Stock: <span className="text-blue-600 font-mono">{stockNumber}</span>
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium text-sm mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        {open && (!editId || editId > 0) && (
          <AddSupplyStockForm
            stockNumber={stockNumber}
            description={description}
            unitId={unitId}
            editId={editId}
            onSuccess={onSuccess}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
