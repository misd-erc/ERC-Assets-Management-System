import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SearchableSelectProps {
  value: number;
  onChange: (value: number) => void;
  options: { id: number; name: string }[];
  placeholder?: string;
  disabled?: boolean;
}

export const SearchableSelect = ({ value, onChange, options, placeholder = "Select...", disabled = false }: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);
  const [activeSearch, setActiveSearch] = useState("");
  const selectedOption = options.find((o) => o.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
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
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl shadow-xl border border-slate-100 bg-white overflow-hidden" align="start">
        <Command className="bg-white" value={activeSearch} onValueChange={setActiveSearch}>
          <div className="p-2 bg-slate-50/50 border-b border-slate-100">
            <div className="relative rounded-md border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
              <CommandInput
                placeholder={`Search ${placeholder.toLowerCase()}...`}
                className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none"
              />
            </div>
          </div>
          <CommandList className="max-h-60 overflow-y-auto p-1">
            <CommandEmpty className="py-6 text-center text-sm text-slate-500">
              No result found.
            </CommandEmpty>
            <CommandGroup>
              {options.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 my-0.5 text-sm cursor-pointer transition-all duration-150 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700 hover:bg-slate-50",
                    value === item.id && "bg-blue-50/60 font-medium text-blue-700"
                  )}
                >
                  <span className="truncate flex-1">{item.name}</span>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4 shrink-0 transition-all duration-200",
                      value === item.id ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75"
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
