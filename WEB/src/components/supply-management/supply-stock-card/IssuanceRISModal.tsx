import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { IssuanceRISForm } from './IssuanceRISForm';

interface IssuanceRISModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockNumber: string;
  description: string;
  unitId?: number;
  totalCurrentStock?: number;
  editItemId?: number;
  parentRISId?: number;
  onSuccess: () => void;
}

export const IssuanceRISModal = ({
  open,
  onOpenChange,
  stockNumber,
  description,
  unitId,
  totalCurrentStock,
  editItemId,
  parentRISId,
  onSuccess,
}: IssuanceRISModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-7xl !w-[60vw] max-h-[90vh] overflow-y-auto p-6 bg-white border border-slate-200 rounded-lg shadow-2xl flex flex-col gap-4">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-2xl text-slate-900 font-bold">
            {editItemId ? 'Edit' : 'RIS'} (Issuance): <span className="text-blue-600 font-mono">{stockNumber}</span>
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium text-sm mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        {open && (!editItemId || editItemId > 0) && (
          <IssuanceRISForm
            stockNumber={stockNumber}
            description={description}
            unitId={unitId}
            totalCurrentStock={totalCurrentStock}
            editItemId={editItemId}
            parentRISId={parentRISId}
            onSuccess={onSuccess}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
