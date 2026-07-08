import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSupplyUnit } from '@/hooks';
import { getCategories, getLegends } from '@/api/asset/inventoryApi';
import { bookPTAItem } from '@/api/booking/bookingApi';
import { PendingBookingItem } from '@/types/booking';

interface Props {
  item: PendingBookingItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookPTAItemModal = ({ item, onClose, onSuccess }: Props) => {
  const { units, fetchSupplyUnits } = useSupplyUnit();
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [legends, setLegends] = useState<{ id: number; name: string; description?: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    propertyNumber: '',
    categoryId: 0,
    legendId: 0,
    serialNumber: '',
    description: '',
    brand: '',
    model: '',
    specification: '',
    measurementUnitId: 0,
    unitCost: 0,
  });

  useEffect(() => {
    if (item) {
      fetchSupplyUnits();
      getCategories(item.group).then(setCategories);
      getLegends().then(setLegends);

      setForm({
        propertyNumber: item.suggestedPropertyNumber || '',
        categoryId: item.categoryId || item.category?.id || 0,
        legendId: 0,
        serialNumber: '',
        description: item.description || '',
        brand: '',
        model: '',
        specification: item.specification || '',
        measurementUnitId: item.measurementUnitId || item.measurementUnit?.id || 0,
        unitCost: item.unitCost || 0,
      });
      setSubmitted(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const err = (cond: boolean) => cond ? 'border-red-500 focus-visible:ring-red-500' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setSubmitted(true);
    if (!form.description.trim() || !form.legendId || !form.serialNumber.trim() || !form.brand.trim() || !form.model.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await bookPTAItem({
        bookingItemId: item.id,
        propertyNumber: form.propertyNumber.trim() || undefined,
        categoryId: form.categoryId || null,
        legendId: form.legendId || null,
        serialNumber: form.serialNumber.trim(),
        description: form.description.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        specification: form.specification.trim() || undefined,
        measurementUnitId: form.measurementUnitId || null,
        unitCost: form.unitCost,
      });
      toast.success('Asset has been booked');
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to book asset';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book {item?.group} Asset</DialogTitle>
          <DialogDescription>
            Review and complete the details before moving this item into the {item?.group} asset registry.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Property Number</Label>
              <Input
                value={form.propertyNumber}
                onChange={(e) => setForm(f => ({ ...f, propertyNumber: e.target.value }))}
                placeholder="Auto-suggested, editable"
              />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Legend <span className="text-red-500">*</span></Label>
              <select
                className={`w-full border rounded px-3 py-2 text-sm bg-background ${err(submitted && !form.legendId)}`}
                value={form.legendId}
                onChange={(e) => setForm(f => ({ ...f, legendId: Number(e.target.value) }))}
              >
                <option value={0}>Select Legend</option>
                {legends.map(l => (
                  <option key={l.id} value={l.id}>{l.name}{l.description ? ` — ${l.description}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Serial Number <span className="text-red-500">*</span></Label>
              <Input
                value={form.serialNumber}
                onChange={(e) => setForm(f => ({ ...f, serialNumber: e.target.value }))}
                className={err(submitted && !form.serialNumber.trim())}
              />
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
              <Label>Brand <span className="text-red-500">*</span></Label>
              <Input
                value={form.brand}
                onChange={(e) => setForm(f => ({ ...f, brand: e.target.value }))}
                className={err(submitted && !form.brand.trim())}
              />
            </div>
            <div className="space-y-2">
              <Label>Model <span className="text-red-500">*</span></Label>
              <Input
                value={form.model}
                onChange={(e) => setForm(f => ({ ...f, model: e.target.value }))}
                className={err(submitted && !form.model.trim())}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Specification <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              value={form.specification}
              onChange={(e) => setForm(f => ({ ...f, specification: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
