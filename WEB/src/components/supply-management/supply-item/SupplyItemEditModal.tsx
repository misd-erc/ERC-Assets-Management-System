// src/components/supply-management/supply-item/SupplyItemEditModal.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

// Imports for Searchable Dropdown (Combobox)
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

// --- Reusable Searchable Select Component ---
interface SearchableSelectProps {
  value: number;
  onChange: (value: number) => void;
  options: { id: number; name: string }[];
  placeholder?: string;
}

const SearchableSelect = ({ value, onChange, options, placeholder = "Select..." }: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground"
          )}
        >
          {value
            ? options.find((item) => item.id === value)?.name
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput className="border-0 outline-none focus:outline-none focus:ring-0 ring-0" placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No result found.</CommandEmpty>
            <CommandGroup>
              {options.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// --- Main Component ---
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  supplyItem?: VwSupplyItem | null;
}

export const SupplyItemEditModal = ({ open, onOpenChange, mode, supplyItem }: Props) => {
  const { addSupplyItem, updateSupplyItem } = useSupplyItem();
  const { units, fetchSupplyUnits } = useSupplyUnit();
  const { storagelocations, fetchSupplyStorageLocations } = useSupplyStorageLocation();
  const { vendors, fetchVendors } = useVendor();
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  const [form, setForm] = useState<Partial<SupplyItem>>({
    id: 0,
    code: '',
    description: '',
    categoryId: 0,
    measurementUnitId: 0,
    currentStock: 0,
    unitCost: 0,
    reorderPoint: 0,
    storageLocationId: 0,
    vendorId: 0,
    isActive: true
  });

  const fetchCategoriesData = async () => {
    try {
      const data = await getCategories();
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
  }, []);

  useEffect(() => {
    if (mode === 'edit' && supplyItem) {
      setForm({
        code: supplyItem.code,
        description: supplyItem.description,
        categoryId: supplyItem.category?.id || 0,
        measurementUnitId: supplyItem.measurementUnit?.id || 0,
        currentStock: supplyItem.currentStock,
        unitCost: supplyItem.unitCost,
        reorderPoint: supplyItem.reorderPoint,
        storageLocationId: supplyItem.storageLocation?.id || 0,
        vendorId: supplyItem.vendor?.id || 0,
        isActive: supplyItem.isActive
      });
    } else {
      setForm({
        code: '',
        description: '',
        categoryId: 0,
        measurementUnitId: 0,
        currentStock: 0,
        unitCost: 0,
        reorderPoint: 0,
        storageLocationId: 0,
        vendorId: 0,
        isActive: true
      });
    }
  }, [mode, supplyItem, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'add') {
        await addSupplyItem(form);
      } else if (supplyItem) {
        await updateSupplyItem(supplyItem.id, form);
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Supply Item' : 'Edit Supply Item'}</DialogTitle>
          <DialogDescription>Enter details for the supply item.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Item Code</Label>
              <Input 
                value={form.code} 
                onChange={e => setForm({...form, code: e.target.value})} 
                placeholder="e.g. ITM-001"
                required 
              />
            </div>
             <div className="space-y-2">
              <Label>Unit</Label>
              <SearchableSelect
                value={form.measurementUnitId || 0}
                onChange={(val) => setForm({...form, measurementUnitId: val})}
                options={units}
                placeholder="Select Unit"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})} 
              required 
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="space-y-2">
              <Label>Current Stock</Label>
              <Input type="number" value={form.currentStock} onChange={e => setForm({...form, currentStock: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Unit Cost</Label>
              <Input type="number" step="0.01" value={form.unitCost} onChange={e => setForm({...form, unitCost: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Reorder Point</Label>
              <Input type="number" value={form.reorderPoint} onChange={e => setForm({...form, reorderPoint: Number(e.target.value)})} />
            </div>
          </div>

          {/* Updated Row: Category and Vendor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <SearchableSelect
                value={form.categoryId || 0}
                onChange={(val) => setForm({...form, categoryId: val})}
                options={categories}
                placeholder="Select Category"
              />
            </div>

            <div className="space-y-2">
              <Label>Vendor</Label>
              <SearchableSelect
                value={form.vendorId || 0}
                onChange={(val) => setForm({...form, vendorId: val})}
                options={vendors}
                placeholder="Select Vendor"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Storage Location</Label>
              <SearchableSelect
                value={form.storageLocationId || 0}
                onChange={(val) => setForm({...form, storageLocationId: val})}
                options={storagelocations}
                placeholder="Select Location"
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-8">
                <Switch checked={form.isActive} onCheckedChange={c => setForm({...form, isActive: c})} />
                <Label>Active Status</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};