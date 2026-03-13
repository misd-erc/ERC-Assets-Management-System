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
import { useSupplyIAR } from '@/hooks';

// Components
import { DeliveryItemModal } from './DeliveryItemModal';

// Types
import { VwDeliveryRecord, DeliveryRecordItem, DeliveryRecordRawItem } from '@/types/delivery/delivery';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  record?: VwDeliveryRecord | null;
  onSubmit: (data: any) => Promise<void>;
}

export const DeliveryRecordEditModal = ({ open, onOpenChange, mode, record, onSubmit }: Props) => {
  const { iars, fetchSupplyIARs } = useSupplyIAR();
  const [loading, setLoading] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    id: 0,
    drNumber: '',
    supplyIARId: 0,
    deliveryDate: new Date().toISOString().split('T')[0],
    employeeId: 0,
    remarks: '',
    isReceived: false,
    isActive: true
  });

  const [items, setItems] = useState<Partial<DeliveryRecordItem>[]>([]);
  const [removedItems, setRemovedItems] = useState<Partial<DeliveryRecordItem>[]>([]);

  useEffect(() => {
    if (open) fetchSupplyIARs();
  }, [open, fetchSupplyIARs]);

  useEffect(() => {
    if (mode === 'edit' && record) {
      setFormData({
        id: record.id,
        drNumber: record.drNumber,
        supplyIARId: record.supplyIAR?.id || 0,
        deliveryDate: record.deliveryDate.split('T')[0],
        employeeId: record.employee?.id || 0,
        remarks: record.remarks,
        isReceived: record.isReceived,
        isActive: record.isActive
      });
      setItems(record.items.map(i => ({ ...i, isDeleted: false })));
      setRemovedItems([]);
    } else {
      setFormData({
        id: 0, drNumber: '', supplyIARId: 0,
        deliveryDate: new Date().toISOString().split('T')[0],
        employeeId: 0, remarks: '', isReceived: false, isActive: true
      });
      setItems([]);
      setRemovedItems([]);
    }
  }, [mode, record, open]);

  const handleAddItem = (newItem: any) => {
    setItems([...items, { ...newItem, id: 0, isActive: true, isDeleted: false }]);
  };

  const handleRemoveItem = (index: number) => {
    const itemToRemove = items[index];
    if (itemToRemove.id && itemToRemove.id > 0) {
      setRemovedItems(prev => [...prev, { ...itemToRemove, isDeleted: true }]);
    }
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Create the Raw Item payload required by the backend
      const finalItems: DeliveryRecordRawItem[] = [...items, ...removedItems].map(item => ({
        id: item.id || 0,
        recordId: formData.id,
        code: item.code || '',
        itemTypeId: item.itemTypeId || 1,
        categoryId: item.category?.id || (item as any).categoryId || 0,
        itemDescription: item.itemDescription || '',
        itemSpecification: item.itemSpecification || '',
        itemQuantity: item.itemQuantity || 0,
        measurementUnitId: item.measurementUnit?.id || (item as any).measurementUnitId || 0,
        unitCost: item.unitCost || 0,
        currentStock: item.currentStock || 0,
        reorderPoint: item.reorderPoint || 0,
        storageLocationId: item.storageLocation?.id || (item as any).storageLocationId || 0,
        vendorId: item.vendor?.id || (item as any).vendorId || 0,
        isActive: item.isActive ?? true,
        isDeleted: item.isDeleted ?? false
      }));

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
            <DialogDescription>Enter delivery details and link to an IAR.</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>DR Number</Label>
                <Input value={formData.drNumber} onChange={e => setFormData({...formData, drNumber: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Linked IAR / PO</Label>
                <Select value={formData.supplyIARId.toString()} onValueChange={val => setFormData({...formData, supplyIARId: Number(val)})}>
                  <SelectTrigger><SelectValue placeholder="Select IAR Reference" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Select IAR Reference</SelectItem>
                    {iars.map(iar => (
                      <SelectItem key={iar.id} value={iar.id.toString()}>
                        {iar.iarNumber} (PO: {iar.poNumber})
                      </SelectItem>
                    ))}
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

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold">Delivery Items</h3>
                <Button type="button" size="sm" onClick={() => setIsItemModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2"/> Add Item
                </Button>
              </div>

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
                        {item.code && <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded font-mono">[{item.code}]</span>}
                      </div>
                      <div className="text-muted-foreground text-[11px] mt-0.5">
                        {item.itemSpecification && <span className="italic">Specs: {item.itemSpecification}</span>}
                      </div>
                      <div className="text-muted-foreground text-xs mt-1">
                        {item.itemQuantity} {item.measurementUnit?.name || (item as any).measurementUnitName} x {formatCurrency(item.unitCost || 0)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{formatCurrency((item.itemQuantity || 0) * (item.unitCost || 0))}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700 h-6 w-6 p-0"><X className="w-4 h-4"/></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Record'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeliveryItemModal 
        open={isItemModalOpen} 
        onOpenChange={setIsItemModalOpen} 
        onSave={handleAddItem}
      />
    </>
  );
};