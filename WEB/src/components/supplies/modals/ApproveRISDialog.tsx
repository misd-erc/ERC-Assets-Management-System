import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/dialog';
import { Button } from '@/ui/button';
import { RISRequest } from '@/types/supply/ris';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ris?: RISRequest | null;
  onApprove?: (id: string, approvedItems: any[]) => void;
}

export const ApproveRISDialog: React.FC<Props> = ({ open, onOpenChange, ris, onApprove }) => {
  if (!ris) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Approve RIS Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm">RIS Number: {ris.risNumber}</p>
          <p className="text-sm">Requester: {ris.requester}</p>

          {ris.items.map(item => (
            <div key={item.id} className="border rounded p-2">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="text-sm text-slate-600">Requested: {item.quantityRequested} {item.unit}</p>
                </div>
                <div>
                  <input type="number" defaultValue={item.quantityRequested} className="border p-1 rounded w-20 text-sm" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-green-600" onClick={() => { onApprove?.(ris.id, ris.items); onOpenChange(false); }}>Approve</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

