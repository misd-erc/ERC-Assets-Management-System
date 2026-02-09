// src/components/supply-management/supply-unit/SupplyUnitEditModal.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSupplyUnit } from '@/hooks';
import { SupplyUnit } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  unit?: SupplyUnit | null;
}

export const SupplyUnitEditModal = ({ open, onOpenChange, mode, unit }: Props) => {
  const { addSupplyUnit, updateSupplyUnit } = useSupplyUnit();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ id: 0, name: '', isActive: true });

  useEffect(() => {
    if (mode === 'edit' && unit) {
      setForm({ id: unit.id, name: unit.name, isActive: unit.isActive });
    } else {
      setForm({ id: 0, name: '', isActive: true });
    }
  }, [mode, unit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'add') await addSupplyUnit(form);
      else if (unit) await updateSupplyUnit(unit.id, form);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Unit' : 'Edit Unit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Unit Name</Label>
            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={form.isActive} onCheckedChange={c => setForm({...form, isActive: c})} />
            <Label>Active</Label>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};