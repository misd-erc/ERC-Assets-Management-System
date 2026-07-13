import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check, X } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { getDivisions } from "@/api/office-management/divisionApi";
import { getOffices } from "@/api/office-management/officeApi";
import { getEmployees } from "@/api/user-management/userApi";
import { VwDivision, VwOffice } from "@/types/office";

interface Option {
  id: number;
  label: string;
}

interface AssetTagFiltersProps {
  employeeFilter: string;
  onEmployeeFilterChange: (value: string) => void;
  officeFilter: string;
  onOfficeFilterChange: (value: string) => void;
  serviceFilter: string;
  onServiceFilterChange: (value: string) => void;
}

function FilterCombobox({
  label,
  placeholder,
  options,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value !== "all" ? options.find((o) => o.id.toString() === value) : undefined;

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full sm:w-48 justify-between font-normal h-9", !selected && "text-slate-400")}
          >
            <span className="truncate">{selected ? selected.label : placeholder}</span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
            <CommandList className="max-h-60">
              <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
              <CommandGroup>
                <CommandItem value="all" onSelect={() => { onChange("all"); setOpen(false); }}>
                  <Check className={cn("mr-2 size-4", value === "all" ? "opacity-100" : "opacity-0")} />
                  {placeholder}
                </CommandItem>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={opt.label}
                    onSelect={() => { onChange(opt.id.toString()); setOpen(false); }}
                  >
                    <Check className={cn("mr-2 size-4", value === opt.id.toString() ? "opacity-100" : "opacity-0")} />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function AssetTagFilters({
  employeeFilter,
  onEmployeeFilterChange,
  officeFilter,
  onOfficeFilterChange,
  serviceFilter,
  onServiceFilterChange,
}: AssetTagFiltersProps) {
  const [offices, setOffices] = useState<VwOffice[]>([]);
  const [services, setServices] = useState<VwDivision[]>([]);
  const [employees, setEmployees] = useState<Option[]>([]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [officesData, servicesData, employeesData] = await Promise.all([
          getOffices(),
          getDivisions(),
          getEmployees(1, 10000),
        ]);
        setOffices(Array.isArray(officesData) ? officesData : []);
        setServices(Array.isArray(servicesData) ? servicesData : []);
        const empItems = employeesData?.data?.items ?? [];
        setEmployees(empItems.map((e: any) => ({
          id: e.id,
          label: [e.lastName, e.firstName, e.middleName].filter(Boolean).join(", ") +
            (e.employeeIdOriginal ? ` — ${e.employeeIdOriginal}` : ""),
        })));
      } catch (error) {
        console.error("Failed to load asset tag filter options:", error);
      }
    };
    loadOptions();
  }, []);

  const hasActiveFilters = employeeFilter !== "all" || officeFilter !== "all" || serviceFilter !== "all";

  const clearFilters = () => {
    onEmployeeFilterChange("all");
    onOfficeFilterChange("all");
    onServiceFilterChange("all");
  };

  const servicesForOffice = officeFilter === "all"
    ? services
    : services.filter((s) => s.office?.id.toString() === officeFilter);

  const handleOfficeChange = (value: string) => {
    onOfficeFilterChange(value);
    const selectedService = services.find((s) => s.id.toString() === serviceFilter);
    if (value !== "all" && selectedService?.office?.id.toString() !== value) {
      onServiceFilterChange("all");
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <FilterCombobox
        label="Employee"
        placeholder="All Employees"
        options={employees}
        value={employeeFilter}
        onChange={onEmployeeFilterChange}
      />
      <FilterCombobox
        label="Office"
        placeholder="All Offices"
        options={offices.map((o) => ({ id: o.id, label: o.name }))}
        value={officeFilter}
        onChange={handleOfficeChange}
      />
      <FilterCombobox
        label="Service"
        placeholder="All Services"
        options={servicesForOffice.map((s) => ({ id: s.id, label: s.name }))}
        value={serviceFilter}
        onChange={onServiceFilterChange}
      />
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
          <X className="size-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
