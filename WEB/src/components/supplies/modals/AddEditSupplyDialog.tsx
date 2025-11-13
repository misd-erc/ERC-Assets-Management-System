import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/ui/dialog';
import { Input } from '@/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Button } from '@/ui/button';
import { useSupplies } from '@/hooks/data/useSupplies';
import { SupplyItem } from '@/types/supply/supply';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: SupplyItem | null;
}

export const AddEditSupplyDialog: React.FC<Props> = ({ open, onOpenChange, editing }) => {
  const { create, update } = useSupplies();
  const [form, setForm] = useState<any>({
    stockNumber: '',
    description: '',
    category: '',
    unit: 'Piece',
    currentStock: 0,
    reorderPoint: 0,
    unitCost: 0,
    location: '',
    supplier: ''
  });

  useEffect(() => {
    if (editing) setForm(editing);
    else setForm({
      stockNumber: `ITM-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      description: '',
      category: '',
      unit: 'Piece',
      currentStock: 0,
      reorderPoint: 0,
      unitCost: 0,
      location: '',
      supplier: ''
    });
  }, [editing]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (editing) {
      await update(editing.id, { ...form, totalValue: form.currentStock * form.unitCost });
    } else {
      await create({ ...form, totalValue: form.currentStock * form.unitCost });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Supply Item' : 'Add New Supply Item'}</DialogTitle>
          <DialogDescription>Enter the details for the supply item.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Item Code</label>
              <Input value={form.stockNumber} onChange={(e) => setForm((p:any)=>({ ...p, stockNumber: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm">Category</label>
              <Select value={form.category} onValueChange={(v) => setForm((p:any)=>({ ...p, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                  <SelectItem value="Cleaning Supplies">Cleaning Supplies</SelectItem>
                  <SelectItem value="IT Supplies">IT Supplies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm">Description</label>
            <Input value={form.description} onChange={(e) => setForm((p:any)=>({ ...p, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm">Unit</label>
              <Select value={form.unit} onValueChange={(v) => setForm((p:any)=>({ ...p, unit: v }))}>
                <SelectTrigger><SelectValue placeholder="Unit" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Piece">Piece</SelectItem>
                  <SelectItem value="Box">Box</SelectItem>
                  <SelectItem value="Ream">Ream</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">Current Stock</label>
              <Input type="number" value={form.currentStock} onChange={(e)=>setForm((p:any)=>({...p, currentStock: parseInt(e.target.value)||0}))} />
            </div>
            <div>
              <label className="text-sm">Unit Cost</label>
              <Input type="number" value={form.unitCost} onChange={(e)=>setForm((p:any)=>({...p, unitCost: parseFloat(e.target.value)||0}))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Reorder Point</label>
              <Input type="number" value={form.reorderPoint} onChange={(e)=>setForm((p:any)=>({...p, reorderPoint: parseInt(e.target.value)||0}))} />
            </div>
            <div>
              <label className="text-sm">Location</label>
              <Input value={form.location} onChange={(e)=>setForm((p:any)=>({...p, location: e.target.value}))} />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

