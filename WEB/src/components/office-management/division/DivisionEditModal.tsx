// src/components/office/DivisionEditModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useState, useEffect } from 'react';
import { useDivision } from '@/hooks';
import { Division, Office, VwDivision } from '@/types';
import { toast } from 'sonner';
import { Check, ChevronsUpDown } from 'lucide-react';
import { getOffices } from '@/api';
import { cn } from '@/components/ui/utils';

interface Props {
  open: boolean;
  mode: 'add' | 'edit';
  division?: VwDivision | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}


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
  const [officeOpen, setOfficeOpen] = useState(false);
  const [officeSearch, setOfficeSearch] = useState('');
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
      setOfficeOpen(false);
      setOfficeSearch('');
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

  /* ------------------- SUBMIT ------------------- */
  const submit = async () => {
    if (!form.name?.trim() || !form.acronym?.trim() || form.officeId == null) {
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

            {/* OFFICE COMBOBOX */}
            <div className="grid gap-2">
              <Label htmlFor="office">Office</Label>
              <Popover open={officeOpen} onOpenChange={setOfficeOpen} modal={false}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={officeOpen}
                    className="w-full justify-between font-normal"
                    disabled={saving}
                  >
                    {form.officeId != null
                      ? offices.find((o) => o.id === form.officeId)?.name ?? 'Select office'
                      : 'Select office'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search office..."
                      value={officeSearch}
                      onValueChange={setOfficeSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No office found.</CommandEmpty>
                      <CommandGroup>
                        {offices
                          .filter((o) =>
                            o.name.toLowerCase().includes(officeSearch.toLowerCase())
                          )
                          .map((office) => (
                          <CommandItem
                            key={office.id}
                            value={String(office.id)}
                            onSelect={() => {
                              setForm({ ...form, officeId: office.id });
                              setOfficeOpen(false);
                              setOfficeSearch('');
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', form.officeId === office.id ? 'opacity-100' : 'opacity-0')} />
                            {office.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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





