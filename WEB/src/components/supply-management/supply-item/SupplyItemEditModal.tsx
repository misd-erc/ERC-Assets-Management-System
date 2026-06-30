// src/components/supply-management/supply-item/SupplyItemEditModal.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { useSupplyItem, useSupplyUnit, useSupplyStorageLocation, useVendor } from '@/hooks';
import { SupplyItem, VwSupplyItem } from '@/types';
import { getCategories } from '@/api/asset/inventoryApi';

interface SearchableSelectProps {
  value: number;
  onChange: (value: number) => void;
  options: { id: number; name: string }[];
  placeholder?: string;
  disabled?: boolean;
}

const SearchableSelect = ({ value, onChange, options, placeholder = "Select...", disabled = false }: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((item) => item.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
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
      <PopoverContent className="w-[300px] p-0 rounded-xl shadow-xl border border-slate-100 bg-white overflow-hidden" align="start">
        <Command className="bg-white">
          <div className="p-2 bg-slate-50/50 border-b border-slate-100">
            <div className="relative rounded-lg border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
              <CommandInput 
                className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none" 
                placeholder={`Search ${placeholder.toLowerCase()}...`} 
              />
            </div>
          </div>
          <CommandList className="max-h-60 overflow-y-auto p-1">
            <CommandEmpty className="py-6 text-center text-sm text-slate-500">No result found.</CommandEmpty>
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
                    "flex items-center justify-between rounded-lg px-3 py-2 my-0.5 text-sm cursor-pointer transition-all duration-150 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700 hover:bg-slate-50",
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit' | 'view';
  supplyItem?: VwSupplyItem | null;
  groupContext?: { code: string; description: string };
  onSuccess?: () => void;
}

export const SupplyItemEditModal = ({ open, onOpenChange, mode, supplyItem, groupContext, onSuccess }: Props) => {
  const { addSupplyItem, updateSupplyItem } = useSupplyItem();
  const { units, fetchSupplyUnits } = useSupplyUnit();
  const { storagelocations, fetchSupplyStorageLocations } = useSupplyStorageLocation();
  const { vendors, fetchVendors } = useVendor();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string; isActive?: boolean }[]>([]);

  const isViewMode = mode === 'view';
  const isAddWithGroup = mode === 'add' && groupContext !== undefined;

  const [form, setForm] = useState<Partial<SupplyItem>>({
    id: 0,
    code: '',
    description: '',
    categoryId: 0,
    measurementUnitId: 0,
    quantity: 0,
    unitCost: 0,
    reorderPoint: 0,
    storageLocationId: 0,
    vendorId: 0,
    isActive: true
  });

  const fetchCategoriesData = async () => {
    try {
      const data = await getCategories('Supply Management');
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchSupplyUnits();
    fetchSupplyStorageLocations();
    fetchCategoriesData();
    fetchVendors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if ((mode === 'edit' || mode === 'view') && supplyItem) {
      setForm({
        code: supplyItem.code,
        description: supplyItem.description,
        categoryId: supplyItem.category?.id || 0,
        measurementUnitId: supplyItem.measurementUnit?.id || 0,
        quantity: supplyItem.quantity,
        unitCost: supplyItem.unitCost,
        reorderPoint: supplyItem.reorderPoint,
        storageLocationId: supplyItem.storageLocation?.id || 0,
        vendorId: supplyItem.vendor?.id || 0,
        isActive: supplyItem.isActive,
      });
    } else if (mode === 'add') {
      if (groupContext) {
        setForm({
          code: groupContext.code,
          description: groupContext.description,
          categoryId: 0,
          measurementUnitId: 0,
          quantity: 0,
          unitCost: 0,
          reorderPoint: 0,
          storageLocationId: 0,
          vendorId: 0,
          isActive: true,
        });
      } else {
        setForm({
          code: '',
          description: '',
          categoryId: 0,
          measurementUnitId: 0,
          quantity: 0,
          unitCost: 0,
          reorderPoint: 0,
          storageLocationId: 0,
          vendorId: 0,
          isActive: true,
        });
      }
    }
  }, [mode, supplyItem, open, groupContext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) {
      onOpenChange(false);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'add') {
        await addSupplyItem(form);
      } else if (supplyItem) {
        await updateSupplyItem(supplyItem.id, form);
      }
      onSuccess?.();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOptions = (items: any[], currentId: number) => {
    if (!items) return [];
    return items.filter(item => item.isActive === true || item.id === currentId);
  };

  const getTitle = () => {
    if (mode === 'add') return 'Add Supply Item';
    if (mode === 'edit') return 'Edit Supply Item';
    return 'View Supply Item Details';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {isViewMode ? 'View details for this supply item.' : 'Enter details for the supply item.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Item Code</Label>
              <Input
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. ITM-001"
                required
                disabled={isViewMode || isAddWithGroup}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <SearchableSelect
                value={form.measurementUnitId || 0}
                onChange={(val) => setForm({ ...form, measurementUnitId: val })}
                options={getFilteredOptions(units, form.measurementUnitId || 0)}
                placeholder="Select Unit"
                disabled={isViewMode}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              required
              disabled={isViewMode || isAddWithGroup}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={form.quantity === 0 ? "" : form.quantity}
                onChange={e => {
                  const val = e.target.value;
                  setForm({ ...form, quantity: val === "" ? 0 : Number(val) });
                }}
                onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                className="bg-white border-slate-200 text-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
                disabled={isViewMode}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit Cost</Label>
              <Input
                type="number"
                step="0.01"
                value={form.unitCost === 0 ? "" : form.unitCost}
                onChange={e => {
                  const val = e.target.value;
                  setForm({ ...form, unitCost: val === "" ? 0 : Number(val) });
                }}
                onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                className="bg-white border-slate-200 text-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
                disabled={isViewMode}
              />
            </div>
            <div className="space-y-2">
              <Label>Reorder Point</Label>
              <Input
                type="number"
                value={form.reorderPoint === 0 ? "" : form.reorderPoint}
                onChange={e => {
                  const val = e.target.value;
                  setForm({ ...form, reorderPoint: val === "" ? 0 : Number(val) });
                }}
                onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                className="bg-white border-slate-200 text-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
                disabled={isViewMode}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <SearchableSelect
                value={form.categoryId || 0}
                onChange={(val) => setForm({ ...form, categoryId: val })}
                options={getFilteredOptions(categories, form.categoryId || 0)}
                placeholder="Select Category"
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-2">
              <Label>Vendor</Label>
              <SearchableSelect
                value={form.vendorId || 0}
                onChange={(val) => setForm({ ...form, vendorId: val })}
                options={getFilteredOptions(vendors, form.vendorId || 0)}
                placeholder="Select Vendor"
                disabled={isViewMode}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Storage Location</Label>
              <SearchableSelect
                value={form.storageLocationId || 0}
                onChange={(val) => setForm({ ...form, storageLocationId: val })}
                options={getFilteredOptions(storagelocations, form.storageLocationId || 0)}
                placeholder="Select Location"
                disabled={isViewMode}
              />
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Switch
                checked={form.isActive}
                onCheckedChange={c => setForm({ ...form, isActive: c })}
                disabled={isViewMode}
              />
              <Label>Active Status</Label>
            </div>
          </div>

          <DialogFooter>
            {isViewMode ? (
              <Button type="button" onClick={() => onOpenChange(false)}>Close</Button>
            ) : (
              <>
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
