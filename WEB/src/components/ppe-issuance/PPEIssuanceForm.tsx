import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IssuanceFormState, IssuanceItemFormState } from './PPEIssuance';

interface PPEIssuanceFormProps {
  form: IssuanceFormState;
  items: IssuanceItemFormState[];
  saving: boolean;
  onChange: (field: keyof IssuanceFormState, value: string) => void;
  onItemChange: (index: number, field: keyof IssuanceItemFormState, value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function PPEIssuanceForm({
  form,
  items,
  saving,
  onChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onSubmit,
  onClose,
}: PPEIssuanceFormProps) {
  return (
    <DialogContent className="max-w-5xl w-full">
      <DialogHeader>
        <DialogTitle>Record PPE/SE Issuance</DialogTitle>
        <DialogDescription>
          Choose NEW or RENEW then issue one or more items. PAR/ICS numbers are auto-generated per item.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5 py-2">
        <div className="space-y-2">
          <Label>Flow</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={form.issuanceType === 'NEW' ? 'default' : 'outline'}
              onClick={() => onChange('issuanceType', 'NEW')}
              className="flex-1"
            >
              Create New
            </Button>
            <Button
              type="button"
              variant={form.issuanceType === 'RENEW' ? 'default' : 'outline'}
              onClick={() => onChange('issuanceType', 'RENEW')}
              className="flex-1"
            >
              Renew
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="plantillaEmployeeId">Accountable Employee (Plantilla) - ID</Label>
            <Input
              id="plantillaEmployeeId"
              value={form.plantillaEmployeeId}
              onChange={(e) => onChange('plantillaEmployeeId', e.target.value)}
              placeholder="Plantilla employee ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plantillaEmployeeName">Accountable Employee (Plantilla) - Name</Label>
            <Input
              id="plantillaEmployeeName"
              value={form.plantillaEmployeeName}
              onChange={(e) => onChange('plantillaEmployeeName', e.target.value)}
              placeholder="Plantilla employee name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nonPlantillaEmployeeId">Sub Accountable (Non-Plantilla) - ID</Label>
            <Input
              id="nonPlantillaEmployeeId"
              value={form.nonPlantillaEmployeeId}
              onChange={(e) => onChange('nonPlantillaEmployeeId', e.target.value)}
              placeholder="Optional non-plantilla ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nonPlantillaEmployeeName">Sub Accountable (Non-Plantilla) - Name</Label>
            <Input
              id="nonPlantillaEmployeeName"
              value={form.nonPlantillaEmployeeName}
              onChange={(e) => onChange('nonPlantillaEmployeeName', e.target.value)}
              placeholder="Optional non-plantilla name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="issuedDate">Issued Date</Label>
            <Input
              id="issuedDate"
              type="date"
              value={form.issuedDate}
              onChange={(e) => onChange('issuedDate', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
            <Input
              id="expiryDate"
              type="date"
              value={form.expiryDate}
              onChange={(e) => onChange('expiryDate', e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={form.notes}
              onChange={(e) => onChange('notes', e.target.value)}
              placeholder="Additional details"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Items to issue</p>
              <p className="text-xs text-muted-foreground">Each item auto-generates a PAR (PPE) or ICS (SE) number.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onAddItem}>
              Add item
            </Button>
          </div>

          {items.map((item, index) => (
            <div key={`${item.parIcsNumber}-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end rounded-md border p-3">
              <div className="space-y-2 md:col-span-2">
                <Label>Item Name</Label>
                <Input
                  value={item.itemName}
                  onChange={(e) => onItemChange(index, 'itemName', e.target.value)}
                  placeholder="Hard Hat, Laptop, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Group</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={item.itemGroup}
                  onChange={(e) => onItemChange(index, 'itemGroup', e.target.value)}
                >
                  <option value="PPE">PPE</option>
                  <option value="SE">SE</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>PAR/ICS</Label>
                <Input value={item.parIcsNumber} readOnly className="bg-muted" />
              </div>
              <div className="md:col-span-4 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(index)}
                  disabled={items.length === 1}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={saving}>
          {saving ? 'Saving...' : 'Save Issuance'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
