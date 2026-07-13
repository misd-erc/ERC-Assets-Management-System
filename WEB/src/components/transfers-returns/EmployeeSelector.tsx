"use client";

import * as React from "react";
import { Check, Search, X } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EmployeeSelectorProps {
  employees: Array<{
    id: number;
    firstName: string;
    lastName: string;
    employeeIdOriginal?: string | null;
    officeName?: string;
    divisionName?: string;
    employmentTypeName?: string;
  }>;
  value: number | null;
  onSelect: (employeeId: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  displayValue?: string;
}

export function EmployeeSelector({
  employees,
  value,
  onSelect,
  placeholder = "Search for employee...",
  className,
  disabled = false,
  displayValue,
}: EmployeeSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState(displayValue || "");

  const toSearchable = React.useCallback((value: unknown) => {
    if (value === null || value === undefined) return "";
    return String(value).toLowerCase();
  }, []);

  const selected = employees.find(emp => emp.id === value);

  React.useEffect(() => {
    if (value === null && displayValue !== undefined) {
      setSearch(displayValue);
    }
  }, [displayValue, value]);

  const filteredEmployees = React.useMemo(() => {
    if (!search) return employees;
    
    const searchLower = toSearchable(search);
    return employees.filter(emp =>
      toSearchable(emp.firstName).includes(searchLower) ||
      toSearchable(emp.lastName).includes(searchLower) ||
      toSearchable(emp.employeeIdOriginal).includes(searchLower) ||
      toSearchable(emp.officeName).includes(searchLower) ||
      toSearchable(emp.divisionName).includes(searchLower)
    );
  }, [search, employees, toSearchable]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <div className={cn("relative w-full", className)}>
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
          <Input
            placeholder={placeholder}
            value={selected ? `${selected.firstName} ${selected.lastName}` : search}
            onChange={(e) => {
              if (disabled) return;
              setSearch(e.target.value);
              setOpen(true);
            }}
            onClick={() => {
              if (!disabled) setOpen(true);
            }}
            className="pl-10 pr-10"
            disabled={disabled}
          />
          {selected && !disabled && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null as any);
                setSearch("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 max-h-[--radix-popover-content-available-height] overflow-y-auto"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandEmpty>No employees found.</CommandEmpty>
          <CommandList
            className="max-h-[300px]"
            onWheel={(e) => {
              // Radix Dialog's scroll lock (react-remove-scroll) blocks native wheel
              // scrolling on this list because it's portaled outside the dialog's own
              // DOM subtree. Scroll it manually instead.
              e.currentTarget.scrollTop += e.deltaY;
            }}
          >
            <CommandGroup>
              {filteredEmployees.map((employee) => (
                <CommandItem
                  key={employee.id}
                  value={String(employee.id)}
                  onSelect={() => {
                    onSelect(employee.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="p-3 border rounded hover:bg-gray-50 cursor-pointer m-2"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === employee.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {employee.employeeIdOriginal || employee.id}
                      {employee.officeName && ` • ${employee.officeName}`}
                      {employee.divisionName && ` • ${employee.divisionName}`}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
