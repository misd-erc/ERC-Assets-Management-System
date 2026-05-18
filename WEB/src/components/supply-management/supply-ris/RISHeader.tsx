import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, VwOffice, VwDivision } from '@/types';
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

interface Props {
  header: EditSupplyRIS;
  offices: VwOffice[];
  divisions: VwDivision[];
  users: User[];
  isViewMode: boolean;
  onChange: (updated: Partial<EditSupplyRIS>) => void;
}

export const RISHeader = ({
  header,
  offices,
  divisions,
  users,
  isViewMode,
  onChange,
}: Props) => {
  const [openOffice, setOpenOffice] = useState(false);
  const [activeOffice, setActiveOffice] = useState("");
  const [openDivision, setOpenDivision] = useState(false);
  const [activeDivision, setActiveDivision] = useState("");
  const [openRequestedBy, setOpenRequestedBy] = useState(false);
  const [activeRequestedBy, setActiveRequestedBy] = useState("");
  const [openApprovedBy, setOpenApprovedBy] = useState(false);
  const [activeApprovedBy, setActiveApprovedBy] = useState("");
  const [openIssuedBy, setOpenIssuedBy] = useState(false);
  const [activeIssuedBy, setActiveIssuedBy] = useState("");
  const [openReceivedBy, setOpenReceivedBy] = useState(false);
  const [activeReceivedBy, setActiveReceivedBy] = useState("");

  const handleChange = (field: keyof EditSupplyRIS, value: any) => {
    onChange({ [field]: value });
  };

  const filteredDivisions = divisions.filter((d) => d.office?.id === header.officeId);

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <h3 className="font-semibold">RIS Information</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>RIS Number</Label>
          <Input
            value={header.risNumber}
            onChange={(e) => handleChange('risNumber', e.target.value)}
            placeholder="e.g., RIS-2024-001"
            required
            disabled={isViewMode}
          />
        </div>
        <div className="space-y-2">
          <Label>Requested Date</Label>
          <Input
            type="date"
            value={header.risRequestedDate?.slice(0, 10) || ''}
            onChange={(e) => handleChange('risRequestedDate', e.target.value)}
            required
            disabled={isViewMode}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Entity Name</Label>
          <Input
            value={header.entityName}
            onChange={(e) => handleChange('entityName', e.target.value)}
            placeholder="e.g., DOST"
            required
            disabled={isViewMode}
          />
        </div>
        <div className="space-y-2">
          <Label>Fund Cluster</Label>
          <Input
            value={header.fundCluster}
            onChange={(e) => handleChange('fundCluster', e.target.value)}
            placeholder="e.g., General Fund"
            required
            disabled={isViewMode}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Office Combobox */}
        <div className="space-y-2 min-w-0 flex flex-col">
          <Label className="text-slate-700 font-medium">Office</Label>
          <Popover open={openOffice} onOpenChange={(open) => {
            setOpenOffice(open);
            if (open) {
              const name = offices.find(o => o.id === header.officeId)?.name;
              setActiveOffice(name || "");
            }
          }}>
            <PopoverTrigger asChild disabled={isViewMode}>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between [&>span]:truncate text-left font-normal px-3 bg-white hover:bg-slate-50 border-slate-200 shadow-sm transition-colors"
              >
                <span className="truncate text-slate-700">
                  {header.officeId
                    ? offices.find((o) => o.id === header.officeId)?.name
                    : "Select Office"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-lg shadow-lg border-slate-200 overflow-hidden">
              <Command className="bg-white" value={activeOffice} onValueChange={setActiveOffice}>
                <div className="p-2 bg-slate-50 border-b border-slate-100">
                  <div className="relative rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
                    <CommandInput placeholder="Search office..." className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none" />
                  </div>
                </div>
                <CommandList className="max-h-60 overflow-y-auto overscroll-contain" onWheelCapture={(e) => e.stopPropagation()}>
                  <CommandEmpty className="py-6 text-center text-sm text-slate-500">No office found.</CommandEmpty>
                  <CommandGroup className="p-1.5">
                    {offices.map((o) => (
                      <CommandItem key={o.id} value={o.name} onSelect={() => { handleChange('officeId', o.id); if (o.id !== header.officeId) handleChange('divisionId', 0); setOpenOffice(false); }} className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700">
                        <span className="truncate flex-1">{o.name}</span>
                        <Check className={`ml-2 h-4 w-4 shrink-0 transition-all duration-200 ${header.officeId === o.id ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75"}`} />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Division Combobox */}
        <div className="space-y-2 min-w-0 flex flex-col">
          <Label className="text-slate-700 font-medium">Division</Label>
          <Popover open={openDivision} onOpenChange={(open) => {
            setOpenDivision(open);
            if (open) {
              const name = filteredDivisions.find(d => d.id === header.divisionId)?.name;
              setActiveDivision(name || "");
            }
          }}>
            <PopoverTrigger asChild disabled={isViewMode || !header.officeId}>
              <Button variant="outline" role="combobox" className="w-full justify-between [&>span]:truncate text-left font-normal px-3 bg-white hover:bg-slate-50 border-slate-200 shadow-sm transition-colors">
                <span className="truncate text-slate-700">{header.divisionId ? filteredDivisions.find((d) => d.id === header.divisionId)?.name : "Select Division"}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-lg shadow-lg border-slate-200 overflow-hidden">
              <Command className="bg-white" value={activeDivision} onValueChange={setActiveDivision}>
                <div className="p-2 bg-slate-50 border-b border-slate-100">
                  <div className="relative rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
                    <CommandInput placeholder="Search division..." className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none" />
                  </div>
                </div>
                <CommandList className="max-h-60 overflow-y-auto overscroll-contain" onWheelCapture={(e) => e.stopPropagation()}>
                  <CommandEmpty className="py-6 text-center text-sm text-slate-500">No division found.</CommandEmpty>
                  <CommandGroup className="p-1.5">
                    {filteredDivisions.map((d) => (
                      <CommandItem key={d.id} value={d.name} onSelect={() => { handleChange('divisionId', d.id); setOpenDivision(false); }} className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700">
                        <span className="truncate flex-1">{d.name}</span>
                        <Check className={`ml-2 h-4 w-4 shrink-0 transition-all duration-200 ${header.divisionId === d.id ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75"}`} />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Responsibility Center Code</Label>
        <Input value={header.responsibilityCenterCode} onChange={(e) => handleChange('responsibilityCenterCode', e.target.value)} placeholder="RCC-123" required disabled={isViewMode} />
      </div>

      <div className="space-y-2">
        <Label>Purpose</Label>
        <Textarea value={header.risPurpose} onChange={(e) => handleChange('risPurpose', e.target.value)} placeholder="State the reason for the requisition" required disabled={isViewMode} />
      </div>

      {/* ---------------- REQUESTED BY SECTION ---------------- */}
      <div className="grid grid-cols-2 gap-4">
        {/* Same as before... */}
        <div className="space-y-2 min-w-0 flex flex-col">
          <Label className="text-slate-700 font-medium">Requested By</Label>
          <Popover open={openRequestedBy} onOpenChange={(open) => {
            setOpenRequestedBy(open);
            if (open) {
              const user = users.find(u => u.id === header.risRequestedBySystemUserId);
              setActiveRequestedBy(user ? `${user.firstName} ${user.lastName}` : "");
            }
          }}>
            <PopoverTrigger asChild disabled={isViewMode}>
              <Button variant="outline" role="combobox" className="w-full justify-between [&>span]:truncate text-left font-normal px-3 bg-white hover:bg-slate-50 border-slate-200 shadow-sm transition-colors">
                <span className="truncate text-slate-700">{header.risRequestedBySystemUserId ? users.filter((u) => u.id === header.risRequestedBySystemUserId).map((u) => `${u.firstName} ${u.lastName}`.toUpperCase())[0] || "Select User" : "Select User"}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-lg shadow-lg border-slate-200 overflow-hidden">
              <Command className="bg-white" value={activeRequestedBy} onValueChange={setActiveRequestedBy}>
                <CommandInput placeholder="Search user..." />
                <CommandEmpty>No user found.</CommandEmpty>
                <CommandGroup className="max-h-60 overflow-y-auto p-1.5">
                  {users.map((u) => (
                    <CommandItem key={u.id} value={`${u.firstName} ${u.lastName}`} onSelect={() => { handleChange('risRequestedBySystemUserId', u.id); setOpenRequestedBy(false); }}>
                      <span className="truncate flex-1">{`${u.firstName} ${u.lastName}`.toUpperCase()}</span>
                      <Check className={`ml-2 h-4 w-4 shrink-0 transition-all duration-200 ${header.risRequestedBySystemUserId === u.id ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75"}`} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Requested Date</Label>
          <Input type="date" value={header.risRequestedDate?.slice(0, 10) || ''} disabled className="bg-gray-100 text-slate-500" />
        </div>
      </div>

      {/* ---------------- APPROVED BY SECTION ---------------- */}
      <div className="grid grid-cols-2 gap-4">
        {/* Same as before... */}
        <div className="space-y-2 min-w-0 flex flex-col">
          <Label className="text-slate-700 font-medium">Approved By</Label>
          <Popover open={openApprovedBy} onOpenChange={(open) => {
            setOpenApprovedBy(open);
            if (open) {
              const user = users.find(u => u.id === header.risApprovedBySystemUserId);
              setActiveApprovedBy(user ? `${user.firstName} ${user.lastName}` : "");
            }
          }}>
            <PopoverTrigger asChild disabled={isViewMode}>
              <Button variant="outline" role="combobox" className="w-full justify-between [&>span]:truncate text-left font-normal px-3 bg-white hover:bg-slate-50 border-slate-200 shadow-sm transition-colors">
                <span className="truncate text-slate-700">{header.risApprovedBySystemUserId ? users.filter((u) => u.id === header.risApprovedBySystemUserId).map((u) => `${u.firstName} ${u.lastName}`.toUpperCase())[0] || "Select User" : "Select User"}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-lg shadow-lg border-slate-200 overflow-hidden">
              <Command className="bg-white" value={activeApprovedBy} onValueChange={setActiveApprovedBy}>
                <CommandInput placeholder="Search user..." />
                <CommandEmpty>No user found.</CommandEmpty>
                <CommandGroup className="max-h-60 overflow-y-auto p-1.5">
                  {users.map((u) => (
                    <CommandItem key={u.id} value={`${u.firstName} ${u.lastName}`} onSelect={() => { handleChange('risApprovedBySystemUserId', u.id); setOpenApprovedBy(false); }}>
                      <span className="truncate flex-1">{`${u.firstName} ${u.lastName}`.toUpperCase()}</span>
                      <Check className={`ml-2 h-4 w-4 shrink-0 transition-all duration-200 ${header.risApprovedBySystemUserId === u.id ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75"}`} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Approved Date</Label>
          <Input type="date" value={header.risApprovedDate?.slice(0, 10) || ''} onChange={(e) => handleChange('risApprovedDate', e.target.value || undefined)} disabled={isViewMode} />
        </div>
      </div>

      {/* ---------------- ISSUED BY SECTION ---------------- */}
      <div className="grid grid-cols-2 gap-4">
        {/* Same as before... */}
        <div className="space-y-2 min-w-0 flex flex-col">
          <Label className="text-slate-700 font-medium">Issued By</Label>
          <Popover open={openIssuedBy} onOpenChange={(open) => {
            setOpenIssuedBy(open);
            if (open) {
              const user = users.find(u => u.id === header.risIssuedBySystemUserId);
              setActiveIssuedBy(user ? `${user.firstName} ${user.lastName}` : "");
            }
          }}>
            <PopoverTrigger asChild disabled={isViewMode}>
              <Button variant="outline" role="combobox" className="w-full justify-between [&>span]:truncate text-left font-normal px-3 bg-white hover:bg-slate-50 border-slate-200 shadow-sm transition-colors">
                <span className="truncate text-slate-700">{header.risIssuedBySystemUserId ? users.filter((u) => u.id === header.risIssuedBySystemUserId).map((u) => `${u.firstName} ${u.lastName}`.toUpperCase())[0] || "Select User" : "Select User"}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-lg shadow-lg border-slate-200 overflow-hidden">
              <Command className="bg-white" value={activeIssuedBy} onValueChange={setActiveIssuedBy}>
                <CommandInput placeholder="Search user..." />
                <CommandEmpty>No user found.</CommandEmpty>
                <CommandGroup className="max-h-60 overflow-y-auto p-1.5">
                  {users.map((u) => (
                    <CommandItem key={u.id} value={`${u.firstName} ${u.lastName}`} onSelect={() => { handleChange('risIssuedBySystemUserId', u.id); setOpenIssuedBy(false); }}>
                      <span className="truncate flex-1">{`${u.firstName} ${u.lastName}`.toUpperCase()}</span>
                      <Check className={`ml-2 h-4 w-4 shrink-0 transition-all duration-200 ${header.risIssuedBySystemUserId === u.id ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75"}`} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Issued Date</Label>
          <Input type="date" value={header.risIssuedDate?.slice(0, 10) || ''} onChange={(e) => handleChange('risIssuedDate', e.target.value || undefined)} disabled={isViewMode} />
        </div>
      </div>

      {/* ---------------- RECEIVED BY SECTION ---------------- */}
      <div className="grid grid-cols-2 gap-4">
        {/* Same as before... */}
        <div className="space-y-2 min-w-0 flex flex-col">
          <Label className="text-slate-700 font-medium">Received By</Label>
          <Popover open={openReceivedBy} onOpenChange={(open) => {
            setOpenReceivedBy(open);
            if (open) {
              const user = users.find(u => u.id === header.risReceivedBySystemUserId);
              setActiveReceivedBy(user ? `${user.firstName} ${user.lastName}` : "");
            }
          }}>
            <PopoverTrigger asChild disabled={isViewMode}>
              <Button variant="outline" role="combobox" className="w-full justify-between [&>span]:truncate text-left font-normal px-3 bg-white hover:bg-slate-50 border-slate-200 shadow-sm transition-colors">
                <span className="truncate text-slate-700">{header.risReceivedBySystemUserId ? users.filter((u) => u.id === header.risReceivedBySystemUserId).map((u) => `${u.firstName} ${u.lastName}`.toUpperCase())[0] || "Select User" : "Select User"}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-lg shadow-lg border-slate-200 overflow-hidden">
              <Command className="bg-white" value={activeReceivedBy} onValueChange={setActiveReceivedBy}>
                <CommandInput placeholder="Search user..." />
                <CommandEmpty>No user found.</CommandEmpty>
                <CommandGroup className="max-h-60 overflow-y-auto p-1.5">
                  {users.map((u) => (
                    <CommandItem key={u.id} value={`${u.firstName} ${u.lastName}`} onSelect={() => { handleChange('risReceivedBySystemUserId', u.id); setOpenReceivedBy(false); }}>
                      <span className="truncate flex-1">{`${u.firstName} ${u.lastName}`.toUpperCase()}</span>
                      <Check className={`ml-2 h-4 w-4 shrink-0 transition-all duration-200 ${header.risReceivedBySystemUserId === u.id ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75"}`} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Received Date</Label>
          <Input type="date" value={header.risReceivedDate?.slice(0, 10) || ''} onChange={(e) => handleChange('risReceivedDate', e.target.value || undefined)} disabled={isViewMode} />
        </div>

      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={header.isActive ? 'active' : 'inactive'}
          onValueChange={(val) => handleChange('isActive', val === 'active')}
          disabled={isViewMode}
        >
          <SelectTrigger>
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