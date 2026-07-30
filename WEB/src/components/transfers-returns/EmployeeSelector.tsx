"use client";

import * as React from "react";
import { Check, Search, X } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export const EmployeeSelector = React.memo(function EmployeeSelector({
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

  const selected = React.useMemo(
    () => employees.find(emp => emp.id === value),
    [employees, value]
  );

  React.useEffect(() => {
    if (value === null && displayValue !== undefined) {
      setSearch(displayValue);
    }
  }, [displayValue, value]);

  const filteredEmployees = React.useMemo(() => {
    if (!search) return employees.slice(0, 50);
    
    const searchLower = toSearchable(search);
    return employees.filter(emp =>
      toSearchable(emp.firstName).includes(searchLower) ||
      toSearchable(emp.lastName).includes(searchLower) ||
      toSearchable(emp.employeeIdOriginal).includes(searchLower) ||
      toSearchable(emp.officeName).includes(searchLower) ||
      toSearchable(emp.divisionName).includes(searchLower)
    ).slice(0, 50);
  }, [search, employees, toSearchable]);

  const handleSelect = React.useCallback((employeeId: number) => {
    onSelect(employeeId);
    setOpen(false);
    setSearch("");
  }, [onSelect]);

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
        <div
          className="max-h-[300px] overflow-y-auto"
          onWheel={(e) => {
            e.currentTarget.scrollTop += e.deltaY;
          }}
        >
          {filteredEmployees.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">No employees found.</div>
          ) : (
            <>
              {filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  onClick={() => handleSelect(employee.id)}
                  className={cn(
                    "flex items-center p-3 border-b border-slate-50 cursor-pointer transition-colors",
                    value === employee.id ? "bg-blue-50" : "hover:bg-gray-50"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === employee.id ? "opacity-100 text-blue-600" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-sm">
                      {employee.firstName} {employee.lastName}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      {employee.employeeIdOriginal || employee.id}
                      {employee.officeName && ` • ${employee.officeName}`}
                      {employee.divisionName && ` • ${employee.divisionName}`}
                    </span>
                  </div>
                </div>
              ))}
              {filteredEmployees.length === 50 && (
                <div className="text-center text-xs text-slate-400 py-2 border-t border-slate-100">
                  Showing first 50 results. Refine your search to narrow down.
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});
