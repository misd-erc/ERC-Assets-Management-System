import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSupplyUnit, useVendor, useSupplyItem } from '@/hooks';
import { useSupplyStorageLocationStore } from '@/store/supply';
import { getCategories } from '@/api/asset/inventoryApi';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: any) => void;
}

export const DeliveryItemModal = ({ open, onOpenChange, onSave }: Props) => {
  const { units, fetchSupplyUnits } = useSupplyUnit();
  const { vendors, fetchVendors } = useVendor();
  const { storagelocations, fetchSupplyStorageLocations } = useSupplyStorageLocationStore();
  const { vwUniqueRawSupplies, fetchSupplyUniqueRawItems } = useSupplyItem();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [isNewItem, setIsNewItem] = useState(false);

  const [item, setItem] = useState({
    itemTypeId: 1, 
    categoryId: 0,
    itemDescription: '',
    itemQuantity: 0,
    measurementUnitId: 0,
    unitCost: 0,
    code: '',
    reorderPoint: 0,
    storageLocationId: 0,
    vendorId: 0
  });

  useEffect(() => {
    if (open) {
      fetchSupplyUnits();
      fetchVendors();
      fetchSupplyStorageLocations();
      fetchSupplyUniqueRawItems();
      getCategories().then(setCategories);
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setIsNewItem(false);
    setItem({ 
      itemTypeId: 1, categoryId: 0, itemDescription: '', 
      itemQuantity: 0, measurementUnitId: 0, unitCost: 0,
      code: '', reorderPoint: 0,
      storageLocationId: 0, vendorId: 0 
    });
  };

  const handleCodeChange = (val: string) => {
    if (val === "NEW_ITEM") {
      setIsNewItem(true);
      setItem(prev => ({ 
        ...prev, 
        code: '', 
        itemDescription: '', 
        categoryId: 0,
        storageLocationId: 0, 
        vendorId: 0,
        reorderPoint: 0 
      }));
    } else {
      setIsNewItem(false);
      const selected = vwUniqueRawSupplies.find(s => s.code === val);
      if (selected) {
        setItem(prev => ({
          ...prev,
          code: selected.code,
          itemDescription: selected.description,
          categoryId: selected.category?.id || 0,
          storageLocationId: selected.storageLocation?.id || 0,
          vendorId: selected.vendor?.id || 0,
          reorderPoint: (selected as any).reorderPoint || 0
        }));
      }
    }
  };

  const validate = () => {
    if (!item.code) {
      toast.error('Item code is required');
      return false;
    }
    if (!item.itemDescription) {
      toast.error('Description is required');
      return false;
    }
    if (item.itemTypeId === 1) { // Supply
      if (!item.categoryId || item.categoryId === 0) {
        toast.error('Category is required');
        return false;
      }
      if (!item.measurementUnitId || item.measurementUnitId === 0) {
        toast.error('Unit is required');
        return false;
      }
      if (!item.storageLocationId || item.storageLocationId === 0) {
        toast.error('Storage location is required');
        return false;
      }
      if (!item.vendorId || item.vendorId === 0) {
        toast.error('Vendor is required');
        return false;
      }
    }
    if (item.itemQuantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return false;
    }
    if (item.unitCost < 0) {
      toast.error('Unit cost cannot be negative');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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
  const isExistingItem = isSupply && !isNewItem && item.code !== '';

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
              <Select value={item.itemTypeId.toString()} onValueChange={v => {
                const typeId = Number(v);
                setItem({...item, itemTypeId: typeId});
                if (typeId !== 1) setIsNewItem(true);
              }}>
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
              <Select 
                disabled={isExistingItem && item.categoryId !== 0}
                value={item.categoryId.toString()} 
                onValueChange={v => setItem({...item, categoryId: Number(v)})}
              >
                <SelectTrigger className={isExistingItem && item.categoryId !== 0 ? "bg-slate-50" : ""}>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Select Category</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Item Code</Label>
            {isSupply ? (
              isNewItem ? (
                <div className="flex gap-2">
                  <Input 
                    value={item.code} 
                    onChange={e => setItem({...item, code: e.target.value})} 
                    placeholder="Enter new item code" 
                    required 
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsNewItem(false)}>Cancel</Button>
                </div>
              ) : (
                <Select value={item.code} onValueChange={handleCodeChange}>
                  <SelectTrigger><SelectValue placeholder="Select or search item code" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW_ITEM" className="font-bold text-blue-600 italic">+ Add New Item Reference</SelectItem>
                    {vwUniqueRawSupplies.map(s => (
                      <SelectItem key={s.id} value={s.code}>{s.code} - {s.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            ) : (
              <Input 
                value={item.code} 
                onChange={e => setItem({...item, code: e.target.value})} 
                placeholder="Enter Code" 
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input 
              value={item.itemDescription} 
              onChange={e => setItem({...item, itemDescription: e.target.value})} 
              placeholder="Item name/description" 
              required 
              disabled={isExistingItem}
              className={isExistingItem ? "bg-slate-50" : ""}
            />
          </div>

          {isSupply && (
            <div className="p-4 bg-slate-50/50 border rounded-md space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Storage Location</Label>
                  <Select 
                    disabled={isExistingItem && item.storageLocationId !== 0} 
                    value={item.storageLocationId.toString()} 
                    onValueChange={v => setItem({...item, storageLocationId: Number(v)})}
                  >
                    <SelectTrigger className={isExistingItem && item.storageLocationId !== 0 ? "bg-slate-100" : ""}>
                      <SelectValue placeholder="Select Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Select Location</SelectItem>
                      {storagelocations.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Select 
                    disabled={isExistingItem && item.vendorId !== 0} 
                    value={item.vendorId.toString()} 
                    onValueChange={v => setItem({...item, vendorId: Number(v)})}
                  >
                    <SelectTrigger className={isExistingItem && item.vendorId !== 0 ? "bg-slate-100" : ""}>
                      <SelectValue placeholder="Select Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Select Vendor</SelectItem>
                      {vendors.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
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
            </div>
          )}

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
                  <SelectItem value="0">Select Unit</SelectItem>
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