import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useOffice } from '@/hooks';
import { Office } from '@/types';
import { toast } from 'sonner';
import { Toggle } from '@/components/ui/toggle';
import { Check, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Props {
  open: boolean;
  mode: 'add' | 'edit';
  office?: Office | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const OfficeEditModal = ({
  open,
  mode,
  office,
  onOpenChange,
  onSuccess,
}: Props) => {
  const { addOffice, updateOffice } = useOffice();

  // â”€â”€â”€â”€â”€â”€ STATE â”€â”€â”€â”€â”€â”€
  const [form, setForm] = useState<Partial<Office>>({
    name: '',
    acronym: '',
    generalCode: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);   // request in flight
  const [loading, setLoading] = useState(false); // optional preâ€‘fetch

  // â”€â”€â”€â”€â”€â”€ EFFECTS â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (mode === 'edit' && office) {
      setForm({
        name: office.name,
        acronym: office.acronym,
        generalCode: office.generalCode,
        isActive: office.isActive,
      });
    } else {
      setForm({ name: '', acronym: '', generalCode: '', isActive: true });
    }
  }, [mode, office, open]);

  // â”€â”€â”€â”€â”€â”€ SUBMIT â”€â”€â”€â”€â”€â”€
  const submit = async () => {
    if (!form.name?.trim() || !form.acronym?.trim() || !form.generalCode?.trim()) {
      toast.error('Name, Acronym, and General Code are required');
      return;
    }

    try {
      setSaving(true);                     // start
      if (mode === 'add') {
        await addOffice(form);
      } else if (office?.id) {
        await updateOffice(office.id, form);
      }
      onSuccess();
    } catch {
      toast.error('Failed to save office');
    } finally {
      setSaving(false);                    // end
    }
  };

  // â”€â”€â”€â”€â”€â”€ RENDER â”€â”€â”€â”€â”€â”€
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Office' : 'Edit Office'}</DialogTitle>
        </DialogHeader>

        {/* â”€â”€ OPTIONAL LOADING PLACEHOLDER â”€â”€ */}
        {loading ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">Loading form data...</p>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name ?? ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Office of the Director"
                disabled={saving}
              />
            </div>

            {/* Acronym */}
            <div className="grid gap-2">
              <Label htmlFor="acronym">Acronym</Label>
              <Input
                id="acronym"
                value={form.acronym ?? ''}
                onChange={(e) => setForm({ ...form, acronym: e.target.value })}
                placeholder="e.g. ODIR"
                disabled={saving}
              />
            </div>

            {/* General Code */}
            <div className="grid gap-2">
              <Label htmlFor="generalCode">General Code</Label>
              <Input
                id="generalCode"
                value={form.generalCode ?? ''}
                onChange={(e) => setForm({ ...form, generalCode: e.target.value })}
                placeholder="e.g. GEN001"
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
        )}

        {/* â”€â”€ FOOTER â”€â”€ */}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>

          {/* Save button â€“ disabled while loading OR saving */}
          <Button onClick={submit} disabled={saving || loading}>
            {saving ? 'Saving...' : mode === 'add' ? 'Add' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};





