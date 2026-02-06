import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Package } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

// Hooks
import { useVendor } from '@/hooks';

// Components
import { DeliveryItemModal } from './DeliveryItemModal';

// Types
import { VwDeliveryRecord, DeliveryRecordItem } from '@/types/delivery/delivery';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  record?: VwDeliveryRecord | null;
  onSubmit: (data: any) => Promise<void>;
}

export const DeliveryRecordEditModal = ({ open, onOpenChange, mode, record, onSubmit }: Props) => {
  const { vendors, fetchVendors } = useVendor();
  const [loading, setLoading] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  // Main Form State
  const [formData, setFormData] = useState({
    id: 0,
    drNumber: '',
    poNumber: '',
    vendorId: 0,
    deliveryDate: new Date().toISOString().split('T')[0],
    employeeId: 0,
    remarks: '',
    isReceived: false,
    isActive: true
  });

  // Active Items (Visible in the list)
  const [items, setItems] = useState<Partial<DeliveryRecordItem>[]>([]);
  
  // Removed Items (Hidden, but tracked for deletion on save)
  const [removedItems, setRemovedItems] = useState<Partial<DeliveryRecordItem>[]>([]);

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (mode === 'edit' && record) {
      setFormData({
        id: record.id,
        drNumber: record.drNumber,
        poNumber: record.poNumber,
        vendorId: record.vendor?.id || 0,
        deliveryDate: record.deliveryDate.split('T')[0],
        employeeId: record.employee?.id || 0,
        remarks: record.remarks,
        isReceived: record.isReceived,
        isActive: record.isActive
      });
      // Load existing items and ensure isDeleted is false by default
      setItems(record.items.map(i => ({ ...i, isDeleted: false })));
      // Clear removed buffer when opening edit mode
      setRemovedItems([]);
    } else {
      setFormData({
        id: 0, drNumber: '', poNumber: '', vendorId: 0,
        deliveryDate: new Date().toISOString().split('T')[0],
        employeeId: 0, remarks: '', isReceived: false, isActive: true
      });
      setItems([]);
      setRemovedItems([]);
    }
  }, [mode, record, open]);

  const handleAddItem = (newItem: any) => {
    const itemToAdd: any = {
      id: 0, 
      recordId: formData.id,
      ...newItem,
      isActive: true,
      isDeleted: false // Default for new items
    };
    setItems([...items, itemToAdd]);
  };

  const handleRemoveItem = (index: number) => {
    const itemToRemove = items[index];
    
    // UPDATED LOGIC: 
    // If the item has an ID > 0, it exists in the database.
    // We must add it to 'removedItems' with isDeleted: true
    if (itemToRemove.id && itemToRemove.id > 0) {
        setRemovedItems(prev => [...prev, { ...itemToRemove, isDeleted: true }]);
    }

    // Remove it from the visible 'items' list so the user sees it disappear
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // COMBINE: Active items + Removed (deleted) items
      const finalItems = [...items, ...removedItems];

      const payload = {
        deliveryRecord: formData,
        items: finalItems
      };
      
      await onSubmit(payload);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
        <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
            <DialogTitle>{mode === 'add' ? 'Record New Delivery' : 'Edit Delivery Record'}</DialogTitle>
            <DialogDescription>Enter delivery details and items.</DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* --- Main Details --- */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label>DR Number</Label>
                <Input value={formData.drNumber} onChange={e => setFormData({...formData, drNumber: e.target.value})} required />
                </div>
                <div className="space-y-2">
                <Label>PO Number</Label>
                <Input value={formData.poNumber} onChange={e => setFormData({...formData, poNumber: e.target.value})} required />
                </div>
                <div className="space-y-2">
                <Label>Vendor</Label>
                <Select value={formData.vendorId.toString()} onValueChange={val => setFormData({...formData, vendorId: Number(val)})}>
                    <SelectTrigger><SelectValue placeholder="Select Vendor" /></SelectTrigger>
                    <SelectContent>
                    {vendors.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                </div>
                <div className="space-y-2">
                <Label>Delivery Date</Label>
                <Input type="date" value={formData.deliveryDate} onChange={e => setFormData({...formData, deliveryDate: e.target.value})} required />
                </div>
            </div>
            
            <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
            </div>

            {/* --- Items Section --- */}
            <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold">Delivery Items</h3>
                    <Button type="button" size="sm" onClick={() => setIsItemModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2"/> Add Item
                    </Button>
                </div>

                {/* Items List */}
                <div className="space-y-2 max-h-60 overflow-y-auto min-h-[100px] border rounded-md p-2 bg-slate-50/50">
                    {items.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Package className="h-10 w-10 mb-2 opacity-20" />
                            <p className="text-sm">No items added yet.</p>
                        </div>
                    )}
                    {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 border rounded bg-white text-sm shadow-sm">
                            <div>
                                <div className="font-medium flex items-center gap-2">
                                    <Badge variant="outline">{item.itemTypeId === 1 ? 'Supply' : item.itemTypeId === 2 ? 'PPE' : 'SE'}</Badge>
                                    {item.itemDescription}
                                </div>
                                <div className="text-muted-foreground text-xs mt-1">
                                    {item.itemQuantity} {item.measurementUnit?.name} x {formatCurrency(item.unitCost || 0)}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-semibold">{formatCurrency((item.itemQuantity || 0) * (item.unitCost || 0))}</span>
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700 h-6 w-6 p-0"><X className="w-4 h-4"/></Button>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="flex justify-end pt-4 mt-4">
                    <div className="text-right">
                        <span className="text-sm text-muted-foreground">Total Value: </span>
                        <span className="font-bold text-lg">{formatCurrency(items.reduce((acc, i) => acc + ((i.itemQuantity || 0) * (i.unitCost || 0)), 0))}</span>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Record'}</Button>
            </DialogFooter>
            </form>
        </DialogContent>
        </Dialog>

        {/* Nested Modal for Adding Item */}
        <DeliveryItemModal 
            open={isItemModalOpen} 
            onOpenChange={setIsItemModalOpen} 
            onSave={handleAddItem}
        />
    </>
  );
};