// src/components/employment-type/EmploymentTypeEditModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/dialog';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Button } from '@/ui/button';
import { Switch } from '@/ui/switch';
import { useState, useEffect } from 'react';
import { useEmploymentType } from '@/hooks';
import { EmploymentType } from '@/types';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  mode: 'add' | 'edit';
  type?: EmploymentType | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EmploymentTypeEditModal = ({
  open,
  mode,
  type,
  onOpenChange,
  onSuccess,
}: Props) => {
  const { addEmploymentType, updateEmploymentType } = useEmploymentType();

  const [form, setForm] = useState<Partial<EmploymentType>>({
    name: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && type) {
      setForm({
        id: type.id,
        name: type.name ?? '',
        isActive: type.isActive ?? true,
      });
    } else {
      setForm({name: '', isActive: true });
    }
  }, [mode, type, open]);

  const submit = async () => {
    if (!form.name?.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setSaving(true);
      if (mode === 'add') {
        await addEmploymentType(form);
      } else if (type?.id) {
        await updateEmploymentType(type.id, form);
      }
      onSuccess();
    } catch {
      toast.error('Failed to save employment type');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Employment Type' : 'Edit Employment Type'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name ?? ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Regular, Contractual"
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

