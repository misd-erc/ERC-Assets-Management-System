// src/components/office-management/employee/EmployeeEditModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useState, useEffect } from 'react';
import { useEmployee } from '@/hooks';
import { EmployeeDetail, VwOffice, VwDivision, VwEmploymentType, VwPosition } from '@/types';
import { toast } from 'sonner';
import { Check, ChevronsUpDown } from 'lucide-react';
import { getOffices, getDivisions, getEmploymentTypes, getPositions } from '@/api';
import { cn } from '@/components/ui/utils';

interface Props {
  open: boolean;
  mode: 'add' | 'edit';
  employee?: EmployeeDetail | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface EmployeeForm {
  employeeId?: number;
  firstName: string;
  middleName: string;
  lastName: string;
  suffixName: string;
  employeeIdOriginal: string;
  officeId: number | null;
  divisionId: number | null;
  employmentTypeId: number | null;
  positionId: number | null;
  isActive: boolean;
}

export const EmployeeEditModal = ({ open, mode, employee, onOpenChange, onSuccess }: Props) => {
  const { addEmployee, updateEmployee } = useEmployee();

  const [offices, setOffices] = useState<VwOffice[]>([]);
  const [divisions, setDivisions] = useState<VwDivision[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<VwEmploymentType[]>([]);
  const [positions, setPositions] = useState<VwPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [officeOpen, setOfficeOpen] = useState(false);
  const [divisionOpen, setDivisionOpen] = useState(false);
  const [employmentTypeOpen, setEmploymentTypeOpen] = useState(false);
  const [positionOpen, setPositionOpen] = useState(false);

  const emptyForm: EmployeeForm = {
    firstName: '',
    middleName: '',
    lastName: '',
    suffixName: '',
    employeeIdOriginal: '',
    officeId: null,
    divisionId: null,
    employmentTypeId: null,
    positionId: null,
    isActive: true,
  };

  const [form, setForm] = useState<EmployeeForm>(emptyForm);

  /* ---- Load reference data ---- */
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        setLoading(true);
        const [o, d, et, p] = await Promise.all([
          getOffices(),
          getDivisions(),
          getEmploymentTypes(),
          getPositions(),
        ]);
        setOffices(o);
        setDivisions(d);
        setEmploymentTypes(et);
        setPositions(p);
      } catch {
        toast.error('Failed to load reference data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open]);

  /* ---- Pre-fill on edit ---- */
  useEffect(() => {
    if (mode === 'edit' && employee) {
      setForm({
        employeeId: employee.id,
        firstName: employee.firstName ?? '',
        middleName: employee.middleName ?? '',
        lastName: employee.lastName ?? '',
        suffixName: employee.suffixName ?? '',
        employeeIdOriginal: employee.employeeIdOriginal ?? '',
        officeId: employee.office?.id ?? null,
        divisionId: employee.division?.id ?? null,
        employmentTypeId: employee.employmentType?.id ?? null,
        positionId: employee.position?.id ?? null,
        isActive: employee.isActive,
      });
    } else {
      setForm(emptyForm);
    }
  }, [mode, employee, open]);

  const submit = async () => {
    if (!form.employeeIdOriginal?.trim()) {
      toast.error('Employee ID is required');
      return;
    }
    if (!form.firstName?.trim() || !form.lastName?.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        firstName: form.firstName,
        middleName: form.middleName || undefined,
        lastName: form.lastName,
        suffixName: form.suffixName || undefined,
        employeeIdOriginal: form.employeeIdOriginal,
        officeId: form.officeId,
        divisionId: form.divisionId,
        employmentTypeId: form.employmentTypeId,
        positionId: form.positionId,
        isActive: form.isActive,
      };

      if (mode === 'add') {
        await addEmployee(payload);
      } else if (form.employeeId) {
        await updateEmployee(form.employeeId, payload);
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setSaving(false);
    }
  };

  /* ---- Helpers ---- */
  const selectedOffice = offices.find(o => o.id === form.officeId);
  const selectedDivision = divisions.find(d => d.id === form.divisionId);
  const selectedEmploymentType = employmentTypes.find(et => et.id === form.employmentTypeId);
  const selectedPosition = positions.find(p => p.id === form.positionId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Employee' : 'Edit Employee'}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        ) : (
          <div className="grid gap-4 py-2">
            {/* Employee ID */}
            <div className="grid gap-1.5">
              <Label>Employee ID <span className="text-red-500">*</span></Label>
              <Input
                value={form.employeeIdOriginal}
                onChange={e => setForm(f => ({ ...f, employeeIdOriginal: e.target.value }))}
                placeholder="e.g. ERC-2024-001"
              />
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>First Name <span className="text-red-500">*</span></Label>
                <Input
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  placeholder="First name"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Last Name <span className="text-red-500">*</span></Label>
                <Input
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Middle Name</Label>
                <Input
                  value={form.middleName}
                  onChange={e => setForm(f => ({ ...f, middleName: e.target.value }))}
                  placeholder="Middle name"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Suffix</Label>
                <Input
                  value={form.suffixName}
                  onChange={e => setForm(f => ({ ...f, suffixName: e.target.value }))}
                  placeholder="Jr., Sr., III..."
                />
              </div>
            </div>

            {/* Office */}
            <div className="grid gap-1.5">
              <Label>Office</Label>
              <Popover open={officeOpen} onOpenChange={setOfficeOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="justify-between font-normal">
                    {selectedOffice ? selectedOffice.name : 'Select office...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search office..." />
                    <CommandList>
                      <CommandEmpty>No office found.</CommandEmpty>
                      <CommandGroup>
                        {offices.map(o => (
                          <CommandItem
                            key={o.id}
                            value={o.name}
                            onSelect={() => {
                              setForm(f => ({ ...f, officeId: o.id }));
                              setOfficeOpen(false);
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', form.officeId === o.id ? 'opacity-100' : 'opacity-0')} />
                            {o.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Division */}
            <div className="grid gap-1.5">
              <Label>Division</Label>
              <Popover open={divisionOpen} onOpenChange={setDivisionOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="justify-between font-normal">
                    {selectedDivision ? selectedDivision.name : 'Select division...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search division..." />
                    <CommandList>
                      <CommandEmpty>No division found.</CommandEmpty>
                      <CommandGroup>
                        {divisions.map(d => (
                          <CommandItem
                            key={d.id}
                            value={d.name}
                            onSelect={() => {
                              setForm(f => ({ ...f, divisionId: d.id }));
                              setDivisionOpen(false);
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', form.divisionId === d.id ? 'opacity-100' : 'opacity-0')} />
                            {d.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Employment Type */}
            <div className="grid gap-1.5">
              <Label>Employment Type</Label>
              <Popover open={employmentTypeOpen} onOpenChange={setEmploymentTypeOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="justify-between font-normal">
                    {selectedEmploymentType ? selectedEmploymentType.name : 'Select employment type...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search employment type..." />
                    <CommandList>
                      <CommandEmpty>No employment type found.</CommandEmpty>
                      <CommandGroup>
                        {employmentTypes.map(et => (
                          <CommandItem
                            key={et.id}
                            value={et.name}
                            onSelect={() => {
                              setForm(f => ({ ...f, employmentTypeId: et.id }));
                              setEmploymentTypeOpen(false);
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', form.employmentTypeId === et.id ? 'opacity-100' : 'opacity-0')} />
                            {et.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Position */}
            <div className="grid gap-1.5">
              <Label>Position</Label>
              <Popover open={positionOpen} onOpenChange={setPositionOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="justify-between font-normal">
                    {selectedPosition ? selectedPosition.name : 'Select position...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search position..." />
                    <CommandList>
                      <CommandEmpty>No position found.</CommandEmpty>
                      <CommandGroup>
                        {positions.map(p => (
                          <CommandItem
                            key={p.id}
                            value={p.name}
                            onSelect={() => {
                              setForm(f => ({ ...f, positionId: p.id }));
                              setPositionOpen(false);
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', form.positionId === p.id ? 'opacity-100' : 'opacity-0')} />
                            {p.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
              />
              <Label>{form.isActive ? 'Active' : 'Inactive'}</Label>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || loading}>
            {saving ? 'Saving...' : mode === 'add' ? 'Add Employee' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
