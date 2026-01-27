// src/components/office/DivisionEditModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { Vendor} from '@/types';
import { toast } from 'sonner';
import { getVendors } from '@/api'; 
import { useVendor } from '@/hooks';

interface Props {
  open: boolean;
  mode: 'add' | 'edit';
  vendor?: Vendor | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helper â€“ client-side filter (shadcn/ui does not have filterOption) */
/* ------------------------------------------------------------------ */
const useSearchableSelect = (items: Vendor[], search: string) => {
  return items.filter((vendor) =>
    vendor.name.toLowerCase().includes(search.toLowerCase())
  );
};

export const VendorEditModal = ({
  open,
  mode,
  vendor,
  onOpenChange,
  onSuccess,
}: Props) => {
  const { addVendor, updateVendor } = useVendor();

  /* ------------------- STATE ------------------- */
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');               // <--- search input
  const [form, setForm] = useState<Partial<Vendor>>({
    name: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ------------------- FETCH OFFICES ------------------- */
  useEffect(() => {
    if (open) {
      const load = async () => {
        try {
          setLoading(true);
          const data = await getVendors();
          setVendors(data);
        } catch {
          toast.error('Failed to load vendors');
        } finally {
          setLoading(false);
        }
      };
      load();
    } else {
      setSearch('');   // reset search when modal closes
    }
  }, [open]);

  /* ------------------- PRE-FILL FORM ------------------- */
  useEffect(() => {
    if (mode === 'edit' && vendor) {
      setForm({
        id: vendor.id,
        name: vendor.name,
        isActive: vendor.isActive,
      });
    } else {
      setForm({ name: '', isActive: true });
    }
  }, [mode, vendor, open]);

  /* ------------------- FILTERED OFFICES ------------------- */
  const filteredOffices = useSearchableSelect(vendors, search);

  /* ------------------- SUBMIT ------------------- */
  const submit = async () => {
    if (!form.name?.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        id: form.id,
        name: form.name,
        isActive: form.isActive ?? true,
      };

      if (mode === 'add') {
        await addVendor(payload);
      } else if (vendor?.id) {
        await updateVendor(vendor.id, payload);
      }

      //toast.success(mode === 'add' ? 'Vendor added' : 'Vendor updated');
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error('Failed to save vendor');
    } finally {
      setSaving(false);
    }
  };

  /* ------------------- RENDER ------------------- */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Vendor' : 'Edit Vendor'}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">Loading vendors...</p>
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
                placeholder="e.g. Water General Company"
                disabled={saving}
              />
            </div>

            {/* Active toggle */}
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

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button onClick={submit} disabled={saving || loading}>
            {saving ? 'Saving...' : mode === 'add' ? 'Add' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};





