// src/components/supply-management/supply-ris/RISItemRow.tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Trash2 } from 'lucide-react';
import { VwSupplyGroupedItem } from '@/types';
import { FormItem } from './RISItemsSection';
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
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";

interface Props {
  item: FormItem;
  index: number;
  vwSupplyGroups: VwSupplyGroupedItem[];
  isViewMode: boolean;
  onUpdate: (index: number, field: keyof FormItem, value: any) => void;
  onRemove: (index: number) => void;
}

export const RISItemRow = ({
  item,
  index,
  vwSupplyGroups,
  isViewMode,
  onUpdate,
  onRemove,
}: Props) => {
  const availableUnits = item.availableUnits || [];
  const isLoadingUnits = item.isLoadingUnits || false;

  return (
    <div className="border rounded-md p-4 space-y-3 relative bg-white">
      {!isViewMode && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 hover:bg-red-50"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 min-w-0 flex flex-col">
        <Label className="text-slate-700 font-medium">Stock Number</Label>
        <Popover>
          <PopoverTrigger asChild disabled={isViewMode}>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between [&>span]:truncate text-left font-normal px-3 bg-white hover:bg-slate-50 border-slate-200 shadow-sm transition-colors"
            >
              <span className="truncate text-slate-700">
                {item.stockNumber
                  ? vwSupplyGroups
                      .filter((g) => g.code === item.stockNumber)
                      .map((g) => `${g.code} - ${g.description}`)[0] || "Select Item"
                  : "Select Item"}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-lg shadow-lg border-slate-200 overflow-hidden">
            <Command className="bg-white">
              
              {/* Enhanced Search Box */}
              <div className="p-2 bg-slate-50 border-b border-slate-100">
                <div className="relative rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
                  <CommandInput
                    placeholder="Search stock number or description..."
                    className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none"
                  />
                </div>
              </div>

              <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                No item found.
              </CommandEmpty>

              <CommandGroup className="max-h-60 overflow-y-auto p-1.5">
                {/* Clear Selection Option */}
                <CommandItem
                  onSelect={() => onUpdate(index, 'stockNumber', "")}
                  className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors text-slate-500 italic hover:bg-slate-50"
                >
                  <span className="truncate flex-1">Clear Selection</span>
                </CommandItem>

                {/* Map over vwSupplyGroups */}
                {vwSupplyGroups.map((g) => (
                  <CommandItem
                    key={g.code}
                    value={`${g.code} ${g.description}`} // Enables searching by either code or description
                    onSelect={() => onUpdate(index, 'stockNumber', g.code)}
                    className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700"
                  >
                    <span className="truncate flex-1">
                      {g.code} - {g.description}
                    </span>
                    <Check
                      className={`ml-2 h-4 w-4 shrink-0 transition-all duration-200 ${
                        item.stockNumber === g.code ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75"
                      }`}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input
            value={item.itemDescription}
            disabled
            className="bg-slate-50 text-slate-700"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Unit</Label>
          {isLoadingUnits ? (
            <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-slate-50">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : availableUnits.length > 0 ? (
            <Select
              value={item.unitId && item.unitId > 0 ? item.unitId.toString() : undefined}
              onValueChange={(val) => onUpdate(index, 'unitId', Number(val))}
              disabled={isViewMode}
            >
              <SelectTrigger className={isViewMode ? "bg-slate-50" : ""}>
                <SelectValue placeholder="Select Unit" />
              </SelectTrigger>
              <SelectContent>
                {availableUnits.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id.toString()}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input value="—" disabled className="bg-slate-50 text-slate-500 text-center" />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="requisitionQuantity" className="text-slate-700 font-medium">Requisition Quantity</Label>
          <Input
              id="requisitionQuantity"
              type="number"
              placeholder="0"
              disabled

              value={item.requisitionQuantity === 0 ? "" : item.requisitionQuantity}

              className="bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`issueQuantity-${index}`} className="text-slate-700 font-medium">Issue Quantity</Label>
          <Input
              id={`issueQuantity-${index}`}
              type="number"
              min={0}
              max={item.requisitionQuantity}
              placeholder="0"
              required
              disabled={isViewMode}
              value={item.issueQuantity === 0 ? "" : item.issueQuantity}

              onChange={(e) => {
                const val = e.target.value;
                onUpdate(index, 'issueQuantity', val === "" ? 0 : Number(val));
              }}
              onKeyDown={(e) => ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()}
              className={`border-slate-200 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  isViewMode
                      ? "bg-slate-50 text-slate-700 cursor-not-allowed"
                      : "bg-white focus:ring-blue-500"
              }`}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Remarks</Label>
        <Input
          value={item.itemRemarks}
          onChange={(e) => onUpdate(index, 'itemRemarks', e.target.value)}
          placeholder="Optional remarks"
          disabled={isViewMode}
          className={isViewMode ? "bg-slate-50" : ""}
        />
      </div>
    </div>
  );
};