import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, VwOffice, VwDivision } from '@/types';
import { ApiEmployee } from '@/types/transfer';
import { EmployeeSelector } from '@/components/transfers-returns/EmployeeSelector';
import { EditSupplyRIS } from '@/types/supply/ris';
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { cn } from "@/components/ui/utils";

interface ComboboxProps {
  value: number | undefined | null;
  onChange: (value: number) => void;
  options: { id: number; name: string }[];
  placeholder: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeSearch: string;
  onActiveSearchChange: (val: string) => void;
}

const Combobox = ({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Search...",
  disabled = false,
  open,
  onOpenChange,
  activeSearch,
  onActiveSearchChange
}: ComboboxProps) => {
  const selectedOption = options.find((o) => o.id === value);
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal h-10 px-3 bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 active:scale-[0.99] transition-all rounded-lg shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500",
            !value ? "text-slate-400" : "text-slate-900 font-medium"
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.name : placeholder}
          </span>
          <ChevronsUpDown className={cn("ml-2 h-4 w-4 shrink-0 transition-transform duration-200 text-slate-400", open && "text-blue-500")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl shadow-xl border border-slate-100 bg-white overflow-hidden">
        <Command className="bg-white" value={activeSearch} onValueChange={onActiveSearchChange}>
          <div className="p-2 bg-slate-50/50 border-b border-slate-100">
            <div className="relative rounded-md border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
              <CommandInput
                placeholder={searchPlaceholder}
                className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none"
              />
            </div>
          </div>
          <CommandList className="max-h-60 overflow-y-auto p-1">
            <CommandEmpty className="py-6 text-center text-sm text-slate-500">
              No result found.
            </CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.name}
                  onSelect={() => {
                    onChange(o.id);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 my-0.5 text-sm cursor-pointer transition-all duration-150 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700 hover:bg-slate-50",
                    value === o.id && "bg-blue-50/60 font-medium text-blue-700"
                  )}
                >
                  <span className="truncate flex-1">{o.name}</span>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4 shrink-0 transition-all duration-200",
                      value === o.id ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface Props {
  header: EditSupplyRIS;
  offices: VwOffice[];
  divisions: VwDivision[];
  users: User[];
  employees: ApiEmployee[];
  isViewMode: boolean;
  onChange: (updated: Partial<EditSupplyRIS>) => void;
}

export const RISHeader = ({
  header,
  offices,
  divisions,
  users,
  employees,
  isViewMode,
  onChange,
}: Props) => {
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Record<string, number | null>>({});

  const getEmployeeIdFromSystemUserId = (systemUserId: number | undefined | null, field: string) => {
    if (selectedEmployeeIds[field] !== undefined) return selectedEmployeeIds[field];
    if (!systemUserId) return null;
    const emp = employees.find(e => e.systemUser?.id === systemUserId);
    return emp ? emp.id : null;
  };

  const handleEmployeeSelect = (field: keyof EditSupplyRIS, employeeId: number | null) => {
    setSelectedEmployeeIds(prev => ({ ...prev, [field]: employeeId }));
    if (!employeeId) {
      handleChange(field, null);
      return;
    }
    const emp = employees.find(e => e.id === employeeId);
    const systemUserId = emp?.systemUser?.id || null;
    handleChange(field, systemUserId);
  };
  const [openOffice, setOpenOffice] = useState(false);
  const [activeOffice, setActiveOffice] = useState("");
  const [openDivision, setOpenDivision] = useState(false);
  const [activeDivision, setActiveDivision] = useState("");

  const handleChange = (field: keyof EditSupplyRIS, value: any) => {
    onChange({ [field]: value });
  };

  const filteredDivisions = divisions.filter((d) => d.office?.id === header.officeId);

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-white shadow-sm">
      <h3 className="font-semibold text-slate-800 text-base">RIS Information</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">RIS Number <span className="text-red-500">*</span></Label>
          <Input
            value={header.risNumber}
            onChange={(e) => handleChange('risNumber', e.target.value)}
            placeholder="e.g., RIS-2024-001"
            required
            disabled={isViewMode}
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Requested Date</Label>
          <Input
            type="date"
            value={header.risRequestedDate?.slice(0, 10) || ''}
            onChange={(e) => handleChange('risRequestedDate', e.target.value)}
            required
            disabled={isViewMode}
            className="h-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Entity Name <span className="text-red-500">*</span></Label>
          <Input
            value={header.entityName}
            onChange={(e) => handleChange('entityName', e.target.value)}
            placeholder="e.g., DOST"
            required
            disabled={isViewMode}
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Fund Cluster <span className="text-red-500">*</span></Label>
          <Input
            value={header.fundCluster}
            onChange={(e) => handleChange('fundCluster', e.target.value)}
            placeholder="e.g., General Fund"
            required
            disabled={isViewMode}
            className="h-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Office Combobox */}
        <div className="space-y-2 min-w-0 flex flex-col">
          <Label className="text-slate-700 font-medium">Office <span className="text-red-500">*</span></Label>
          <Combobox
            value={header.officeId}
            onChange={(val) => {
              handleChange('officeId', val);
              if (val !== header.officeId) handleChange('divisionId', 0);
            }}
            options={offices.map((o) => ({ id: o.id, name: o.name }))}
            placeholder="Select Office"
            searchPlaceholder="Search office..."
            disabled={isViewMode}
            open={openOffice}
            onOpenChange={setOpenOffice}
            activeSearch={activeOffice}
            onActiveSearchChange={setActiveOffice}
          />
        </div>

        {/* Division Combobox */}
        <div className="space-y-2 min-w-0 flex flex-col">
          <Label className="text-slate-700 font-medium">Division <span className="text-red-500">*</span></Label>
          <Combobox
            value={header.divisionId}
            onChange={(val) => handleChange('divisionId', val)}
            options={filteredDivisions.map((d) => ({ id: d.id, name: d.name }))}
            placeholder="Select Division"
            searchPlaceholder="Search division..."
            disabled={isViewMode || !header.officeId}
            open={openDivision}
            onOpenChange={setOpenDivision}
            activeSearch={activeDivision}
            onActiveSearchChange={setActiveDivision}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-700 font-medium">Responsibility Center Code <span className="text-red-500">*</span></Label>
        <Input 
          value={header.responsibilityCenterCode} 
          onChange={(e) => handleChange('responsibilityCenterCode', e.target.value)} 
          placeholder="RCC-123" 
          required 
          disabled={isViewMode} 
          className="h-10"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-slate-700 font-medium">Purpose <span className="text-red-500">*</span></Label>
        <Textarea 
          value={header.risPurpose} 
          onChange={(e) => handleChange('risPurpose', e.target.value)} 
          placeholder="State the reason for the requisition" 
          required 
          disabled={isViewMode} 
          rows={3}
        />
      </div>

      {/* ---------------- REQUESTED BY SECTION ---------------- */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 min-w-0 flex flex-col">
          <Label className="text-slate-700 font-medium">Requested By</Label>
          <EmployeeSelector
            employees={employees}
            value={getEmployeeIdFromSystemUserId(header.risRequestedBySystemUserId, 'risRequestedBySystemUserId')}
            onSelect={(empId) => handleEmployeeSelect('risRequestedBySystemUserId', empId)}
            placeholder="Select requesting employee"
            disabled={isViewMode}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Requested Date</Label>
          <Input type="date" value={header.risRequestedDate?.slice(0, 10) || ''} disabled className="bg-gray-50 text-slate-500 h-10" />
        </div>
      </div>

      {/* ---------------- APPROVED BY SECTION ---------------- */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 min-w-0 flex flex-col">
          <Label className="text-slate-700 font-medium">Approved By</Label>
          <EmployeeSelector
            employees={employees}
            value={getEmployeeIdFromSystemUserId(header.risApprovedBySystemUserId, 'risApprovedBySystemUserId')}
            onSelect={(empId) => handleEmployeeSelect('risApprovedBySystemUserId', empId)}
            placeholder="Select approving employee"
            disabled={isViewMode}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Approved Date</Label>
          <Input type="date" value={header.risApprovedDate?.slice(0, 10) || ''} onChange={(e) => handleChange('risApprovedDate', e.target.value || undefined)} disabled={isViewMode} className="h-10" />
        </div>
      </div>

      {/* ---------------- ISSUED BY SECTION ---------------- */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 min-w-0 flex flex-col">
          <Label className="text-slate-700 font-medium">Issued By</Label>
          <EmployeeSelector
            employees={employees}
            value={getEmployeeIdFromSystemUserId(header.risIssuedBySystemUserId, 'risIssuedBySystemUserId')}
            onSelect={(empId) => handleEmployeeSelect('risIssuedBySystemUserId', empId)}
            placeholder="Select issuing employee"
            disabled={isViewMode}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Issued Date</Label>
          <Input type="date" value={header.risIssuedDate?.slice(0, 10) || ''} onChange={(e) => handleChange('risIssuedDate', e.target.value || undefined)} disabled={isViewMode} className="h-10" />
        </div>
      </div>

      {/* ---------------- RECEIVED BY SECTION ---------------- */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 min-w-0 flex flex-col">
          <Label className="text-slate-700 font-medium">Received By</Label>
          <EmployeeSelector
            employees={employees}
            value={getEmployeeIdFromSystemUserId(header.risReceivedBySystemUserId, 'risReceivedBySystemUserId')}
            onSelect={(empId) => handleEmployeeSelect('risReceivedBySystemUserId', empId)}
            placeholder="Select receiving employee"
            disabled={isViewMode}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Received Date</Label>
          <Input type="date" value={header.risReceivedDate?.slice(0, 10) || ''} onChange={(e) => handleChange('risReceivedDate', e.target.value || undefined)} disabled={isViewMode} className="h-10" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-700 font-medium">Status</Label>
        <Select
          value={header.isActive ? 'active' : 'inactive'}
          onValueChange={(val) => handleChange('isActive', val === 'active')}
          disabled={isViewMode}
        >
          <SelectTrigger className="h-10 bg-white border-slate-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};