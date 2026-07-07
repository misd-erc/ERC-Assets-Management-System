import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSupplyUnit, useVendor } from '@/hooks';
import { useSupplyStorageLocationStore } from '@/store/supply';
import { getCategories } from '@/api/asset/inventoryApi';
import { bookSupplyItem } from '@/api/booking/bookingApi';
import { PendingBookingItem } from '@/types/booking';

interface Props {
  item: PendingBookingItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookSupplyItemModal = ({ item, onClose, onSuccess }: Props) => {
  const { units, fetchSupplyUnits } = useSupplyUnit();
  const { vendors, fetchVendors } = useVendor();
  const { storagelocations, fetchSupplyStorageLocations } = useSupplyStorageLocationStore();
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: '',
    description: '',
    categoryId: 0,
    measurementUnitId: 0,
    quantity: 0,
    unitCost: 0,
    reorderPoint: 0,
    storageLocationId: 0,
    vendorId: 0,
  });

  useEffect(() => {
    if (item) {
      fetchSupplyUnits();
      fetchVendors();
      fetchSupplyStorageLocations();
      getCategories('Supply').then(setCategories);
      setForm({
        code: item.code || '',
        description: item.description || '',
        categoryId: item.categoryId || item.category?.id || 0,
        measurementUnitId: item.measurementUnitId || item.measurementUnit?.id || 0,
        quantity: item.quantity || 0,
        unitCost: item.unitCost || 0,
        reorderPoint: item.reorderPoint || 0,
        storageLocationId: item.storageLocationId || item.storageLocation?.id || 0,
        vendorId: item.vendorId || item.vendor?.id || 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (!form.description.trim()) {
      toast.error('Description is required');
      return;
    }

    try {
      setSaving(true);
      await bookSupplyItem({
        bookingItemId: item.id,
        code: form.code.trim() || undefined,
        description: form.description.trim(),
        categoryId: form.categoryId || null,
        measurementUnitId: form.measurementUnitId || null,
        quantity: form.quantity,
        unitCost: form.unitCost,
        reorderPoint: form.reorderPoint,
        storageLocationId: form.storageLocationId || null,
        vendorId: form.vendorId || null,
      });
      toast.success('Supply item has been booked');
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to book supply item';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Supply Item</DialogTitle>
          <DialogDescription>
            Review and complete the details before moving this item into Supply Items.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                className="w-full border rounded px-3 py-2 text-sm bg-background"
                value={form.categoryId}
                onChange={(e) => setForm(f => ({ ...f, categoryId: Number(e.target.value) }))}
              >
                <option value={0}>Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Storage Location</Label>
              <select
                className="w-full border rounded px-3 py-2 text-sm bg-background"
                value={form.storageLocationId}
                onChange={(e) => setForm(f => ({ ...f, storageLocationId: Number(e.target.value) }))}
              >
                <option value={0}>Select Location</option>
                {storagelocations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Vendor</Label>
              <select
                className="w-full border rounded px-3 py-2 text-sm bg-background"
                value={form.vendorId}
                onChange={(e) => setForm(f => ({ ...f, vendorId: Number(e.target.value) }))}
              >
                <option value={0}>Select Vendor</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <select
                className="w-full border rounded px-3 py-2 text-sm bg-background"
                value={form.measurementUnitId}
                onChange={(e) => setForm(f => ({ ...f, measurementUnitId: Number(e.target.value) }))}
              >
                <option value={0}>Select Unit</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Unit Cost</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.unitCost}
                onChange={(e) => setForm(f => ({ ...f, unitCost: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Reorder Point</Label>
              <Input
                type="number"
                min="0"
                value={form.reorderPoint}
                onChange={(e) => setForm(f => ({ ...f, reorderPoint: Number(e.target.value) }))}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 mt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Book Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
