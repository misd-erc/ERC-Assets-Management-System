// src/components/position/PositionEditModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { usePosition } from '@/hooks';
import { Position } from '@/types';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  mode: 'add' | 'edit';
  position?: Position | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const PositionEditModal = ({
  open,
  mode,
  position,
  onOpenChange,
  onSuccess,
}: Props) => {
  const { addPosition, updatePosition } = usePosition();

  const [form, setForm] = useState<Partial<Position>>({
    acronym: '',
    salaryGrade: '',
    name: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && position) {
      setForm({
        acronym: position.acronym,
        salaryGrade: position.salaryGrade,
        name: position.name,
        isActive: position.isActive,
      });
    } else {
      setForm({ acronym: '', salaryGrade: '', name: '', isActive: true });
    }
  }, [mode, position, open]);

  const submit = async () => {
    if (!form.acronym?.trim() || !form.salaryGrade?.trim() || !form.name?.trim()) {
      toast.error('Acronym, Salary Grade, and Name are required');
      return;
    }

    try {
      setSaving(true);
      if (mode === 'add') {
        await addPosition(form);
      } else if (position?.id) {
        await updatePosition(position.id, form);
      }
      onSuccess();
    } catch {
      toast.error('Failed to save position');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Position' : 'Edit Position'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">

          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name ?? ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Director"
              disabled={saving}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="acronym">Acronym</Label>
            <Input
              id="acronym"
              value={form.acronym ?? ''}
              onChange={(e) => setForm({ ...form, acronym: e.target.value })}
              placeholder="e.g. DIR-001"
              disabled={saving}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="salaryGrade">Salary Grade</Label>
            <Input
              id="salaryGrade"
              value={form.salaryGrade ?? ''}
              onChange={(e) => setForm({ ...form, salaryGrade: e.target.value })}
              placeholder="e.g. 12"
              disabled={saving}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={form.isActive ?? true}
              onCheckedChange={(c) => setForm({ ...form, isActive: c })}
              disabled={saving}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              {form.isActive ? 'Active' : 'Inactive'}
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? 'Saving...' : mode === 'add' ? 'Add' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};





