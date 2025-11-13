// src/components/office/DivisionEditModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/dialog';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/ui/select';
import { Button } from '@/ui/button';
import { Switch } from '@/ui/switch';
import { useState, useEffect } from 'react';
import { useDivision } from '@/hooks';
import { Division, Office, VwDivision } from '@/types';
import { toast } from 'sonner';
import { getOffices } from '@/api';   // <-- same folder as other api calls

interface Props {
  open: boolean;
  mode: 'add' | 'edit';
  division?: VwDivision | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helper â€“ client-side filter (shadcn/ui does not have filterOption) */
/* ------------------------------------------------------------------ */
const useSearchableSelect = (items: Office[], search: string) => {
  return items.filter((office) =>
    office.name.toLowerCase().includes(search.toLowerCase())
  );
};

export const DivisionEditModal = ({
  open,
  mode,
  division,
  onOpenChange,
  onSuccess,
}: Props) => {
  const { addDivision, updateDivision } = useDivision();

  /* ------------------- STATE ------------------- */
  const [offices, setOffices] = useState<Office[]>([]);
  const [search, setSearch] = useState('');               // <--- search input
  const [form, setForm] = useState<Partial<Division>>({
    name: '',
    acronym: '',
    officeId: undefined,
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
          const data = await getOffices();
          setOffices(data);
        } catch {
          toast.error('Failed to load offices');
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
    if (mode === 'edit' && division) {
      setForm({
        id: division.id,
        name: division.name,
        acronym: division.acronym,
        officeId: division.office?.id,
        isActive: division.isActive,
      });
    } else {
      setForm({ name: '', acronym: '', officeId: undefined, isActive: true });
    }
  }, [mode, division, open]);

  /* ------------------- FILTERED OFFICES ------------------- */
  const filteredOffices = useSearchableSelect(offices, search);

  /* ------------------- SUBMIT ------------------- */
  const submit = async () => {
    if (!form.name?.trim() || !form.acronym?.trim() || !form.officeId) {
      toast.error('Name, Acronym, and Office are required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        officeId: form.officeId,
        name: form.name,
        acronym: form.acronym,
        isActive: form.isActive ?? true,
      };

      if (mode === 'add') {
        await addDivision(payload);
      } else if (division?.id) {
        await updateDivision(division.id, payload);
      }

      toast.success(mode === 'add' ? 'Division added' : 'Division updated');
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error('Failed to save division');
    } finally {
      setSaving(false);
    }
  };

  /* ------------------- RENDER ------------------- */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Division' : 'Edit Division'}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">Loading offices...</p>
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
                placeholder="e.g. General Service Division"
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

            {/* SEARCHABLE OFFICE SELECT */}
            <div className="grid gap-2">
              <Label htmlFor="office">Office</Label>

              {/* Search input inside the Select trigger */}
              <Select
                value={form.officeId?.toString() ?? ''}
                onValueChange={(v) => setForm({ ...form, officeId: parseInt(v, 10) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select office">
                    {/* Show selected name or placeholder */}
                    {form.officeId
                      ? offices.find((o) => o.id === form.officeId)?.name
                      : 'Select office'}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent>
                  {/* Search box inside dropdown */}
                  <div className="p-2">
                    <Input
                      placeholder="Search offices..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-8"
                      // Prevent closing dropdown on input focus
                      onFocus={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Filtered list */}
                  {filteredOffices.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No offices found
                    </div>
                  ) : (
                    filteredOffices.map((office) => (
                      <SelectItem key={office.id} value={office.id.toString()}>
                        {office.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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

