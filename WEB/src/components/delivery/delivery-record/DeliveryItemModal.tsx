import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSupplyUnit, useVendor } from '@/hooks';
import { useSupplyStorageLocationStore } from '@/store/supply';
import { getCategories } from '@/api/asset/inventoryApi';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: any) => void;
}

export const DeliveryItemModal = ({ open, onOpenChange, onSave }: Props) => {
  const { units, fetchSupplyUnits } = useSupplyUnit();
  const { vendors, fetchVendors } = useVendor();
  const { storagelocations, fetchSupplyStorageLocations } = useSupplyStorageLocationStore();
  const [categories, setCategories] = useState<any[]>([]);

  const [item, setItem] = useState({
    itemTypeId: 1, 
    categoryId: 0,
    itemDescription: '',
    itemSpecification: '',
    itemQuantity: 0,
    measurementUnitId: 0,
    unitCost: 0,
    code: '',
    currentStock: 0,
    reorderPoint: 0,
    storageLocationId: 0,
    vendorId: 0
  });

  useEffect(() => {
    if (open) {
      fetchSupplyUnits();
      fetchVendors();
      fetchSupplyStorageLocations();
      getCategories().then(setCategories);
      setItem({ 
        itemTypeId: 1, categoryId: 0, itemDescription: '', itemSpecification: '', 
        itemQuantity: 0, measurementUnitId: 0, unitCost: 0,
        code: '', currentStock: 0, reorderPoint: 0, storageLocationId: 0, vendorId: 0 
      });
    }
  }, [open, fetchSupplyUnits, fetchVendors, fetchSupplyStorageLocations]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const categoryObj = categories.find(c => c.id === Number(item.categoryId));
    const unitObj = units.find(u => u.id === Number(item.measurementUnitId));
    const vendorObj = vendors.find(v => v.id === Number(item.vendorId));
    const locationObj = storagelocations.find(l => l.id === Number(item.storageLocationId));

    onSave({ 
      ...item, 
      category: categoryObj, 
      measurementUnit: unitObj,
      vendor: vendorObj,
      storageLocation: locationObj
    });
    onOpenChange(false);
  };

  const isSupply = item.itemTypeId === 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Delivery Item</DialogTitle>
          <DialogDescription>Enter item details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Item Type</Label>
              <Select value={item.itemTypeId.toString()} onValueChange={v => setItem({...item, itemTypeId: Number(v)})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Supply</SelectItem>
                  <SelectItem value="2">PPE</SelectItem>
                  <SelectItem value="3">Semi-Expendable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={item.categoryId.toString()} onValueChange={v => setItem({...item, categoryId: Number(v)})}>
                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input 
              value={item.itemDescription} 
              onChange={e => setItem({...item, itemDescription: e.target.value})} 
              placeholder="Item name/description" 
              required 
            />
          </div>

          {isSupply && (
            <div className="p-4 bg-slate-50 border rounded-md space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item Code (Required)</Label>
                  <Input 
                    value={item.code} 
                    onChange={e => setItem({...item, code: e.target.value})} 
                    placeholder="e.g. SKU-123" 
                    required={isSupply} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Storage Location</Label>
                  <Select value={item.storageLocationId.toString()} onValueChange={v => setItem({...item, storageLocationId: Number(v)})}>
                    <SelectTrigger><SelectValue placeholder="Select Location" /></SelectTrigger>
                    <SelectContent>
                      {storagelocations.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Stock</Label>
                  <Input 
                    type="number" 
                    value={item.currentStock} 
                    onChange={e => setItem({...item, currentStock: Number(e.target.value)})} 
                    required={isSupply} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reorder Point</Label>
                  <Input 
                    type="number" 
                    value={item.reorderPoint} 
                    onChange={e => setItem({...item, reorderPoint: Number(e.target.value)})} 
                    required={isSupply} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select value={item.vendorId.toString()} onValueChange={v => setItem({...item, vendorId: Number(v)})}>
                  <SelectTrigger><SelectValue placeholder="Select Vendor" /></SelectTrigger>
                  <SelectContent>
                    {vendors.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Specifications</Label>
            <Textarea 
              value={item.itemSpecification} 
              onChange={e => setItem({...item, itemSpecification: e.target.value})} 
              placeholder="Technical specs (model, brand, color, etc.)" 
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min="1" value={item.itemQuantity} onChange={e => setItem({...item, itemQuantity: Number(e.target.value)})} required />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={item.measurementUnitId.toString()} onValueChange={v => setItem({...item, measurementUnitId: Number(v)})}>
                <SelectTrigger><SelectValue placeholder="Select Unit" /></SelectTrigger>
                <SelectContent>
                  {units.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit Cost</Label>
              <Input type="number" min="0" step="0.01" value={item.unitCost} onChange={e => setItem({...item, unitCost: Number(e.target.value)})} required />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Add Item</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};