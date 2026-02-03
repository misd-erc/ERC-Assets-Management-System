// src/components/supply-management/supply-item/SupplyItemEditModal.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// 1. Add useVendor to imports
import { useSupplyItem, useSupplyUnit, useSupplyStorageLocation, useVendor } from '@/hooks';
import { SupplyItem, VwSupplyItem } from '@/types';
import { getCategories } from '@/api/asset/inventoryApi';

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
  // 2. Destructure vendor data and fetcher
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
    vendorId: 0, // 3. Initialize vendorId
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
    fetchVendors(); // 4. Fetch vendors on mount
  }, []);

  useEffect(() => {
    if (mode === 'edit' && supplyItem) {
      setForm({
        code: supplyItem.code,
        description: supplyItem.description,
        categoryId: supplyItem.category?.id,
        measurementUnitId: supplyItem.measurementUnit?.id,
        currentStock: supplyItem.currentStock,
        unitCost: supplyItem.unitCost,
        reorderPoint: supplyItem.reorderPoint,
        storageLocationId: supplyItem.storageLocation?.id,
        vendorId: supplyItem.vendor?.id, // 5. Map existing vendorId
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
      <DialogContent className="max-w-2xl">
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
              <Select 
                value={form.measurementUnitId?.toString()} 
                onValueChange={v => setForm({...form, measurementUnitId: Number(v)})}
              >
                <SelectTrigger><SelectValue placeholder="Select Unit" /></SelectTrigger>
                <SelectContent>
                   {units.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
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
              <Select 
                value={form.categoryId?.toString()} 
                onValueChange={v => setForm({...form, categoryId: Number(v)})}
              >
                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                   {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vendor</Label>
              <Select 
                value={form.vendorId?.toString()} 
                onValueChange={v => setForm({...form, vendorId: Number(v)})}
              >
                <SelectTrigger><SelectValue placeholder="Select Vendor" /></SelectTrigger>
                <SelectContent>
                   {vendors.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Storage Location</Label>
               <Select 
                  value={form.storageLocationId?.toString()} 
                  onValueChange={v => setForm({...form, storageLocationId: Number(v)})}
                >
                  <SelectTrigger><SelectValue placeholder="Select Location" /></SelectTrigger>
                  <SelectContent>
                     {storagelocations.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
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