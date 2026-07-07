import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSupplyUnit } from '@/hooks';
import { getCategories } from '@/api/asset/inventoryApi';
import { getEmployees } from '@/api/user-management/userApi';
import { ApiEmployee } from '@/types/transfer';
import { EmployeeSelector } from '@/components/transfers-returns/EmployeeSelector';
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
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    propertyNumber: '',
    categoryId: 0,
    description: '',
    specification: '',
    measurementUnitId: 0,
    unitCost: 0,
    plantillaEmployeeId: null as number | null,
    nonPlantillaEmployeeId: null as number | null,
  });

  useEffect(() => {
    if (item) {
      fetchSupplyUnits();
      getCategories(item.group).then(setCategories);

      setEmployeesLoading(true);
      getEmployees().then(res => setEmployees(res.data?.items || [])).finally(() => setEmployeesLoading(false));

      setForm({
        propertyNumber: item.suggestedPropertyNumber || '',
        categoryId: item.categoryId || item.category?.id || 0,
        description: item.description || '',
        specification: item.specification || '',
        measurementUnitId: item.measurementUnitId || item.measurementUnit?.id || 0,
        unitCost: item.unitCost || 0,
        plantillaEmployeeId: null,
        nonPlantillaEmployeeId: null,
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

    const plantillaEmployee = employees.find(e => e.id === form.plantillaEmployeeId);
    const nonPlantillaEmployee = employees.find(e => e.id === form.nonPlantillaEmployeeId);
    const custodianEmployee = plantillaEmployee || nonPlantillaEmployee;

    try {
      setSaving(true);
      await bookPTAItem({
        bookingItemId: item.id,
        propertyNumber: form.propertyNumber.trim() || undefined,
        categoryId: form.categoryId || null,
        description: form.description.trim(),
        specification: form.specification.trim() || undefined,
        measurementUnitId: form.measurementUnitId || null,
        unitCost: form.unitCost,
        plantillaEmployeeId: form.plantillaEmployeeId,
        nonPlantillaEmployeeId: form.nonPlantillaEmployeeId,
        actualOfficeId: custodianEmployee?.office?.id ?? null,
        actualDivisionId: custodianEmployee?.division?.id ?? null,
        dateAssigned: custodianEmployee ? new Date().toISOString() : undefined,
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

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              required
            />
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

          <div className="p-4 bg-slate-50/50 border rounded-md space-y-4">
            <p className="text-sm font-medium text-slate-700">Assign Custodian <span className="text-muted-foreground font-normal">(optional)</span></p>
            <div className="space-y-2">
              <Label>Plantilla Employee</Label>
              {employeesLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading employees…
                </div>
              ) : (
                <EmployeeSelector
                  employees={employees.filter(e => e.employmentType ? e.employmentType.id === 1 : true)}
                  value={form.plantillaEmployeeId}
                  onSelect={(id) => setForm(f => ({ ...f, plantillaEmployeeId: id }))}
                  placeholder="Search plantilla employee…"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Non-Plantilla Employee</Label>
              {employeesLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading employees…
                </div>
              ) : (
                <EmployeeSelector
                  employees={employees.filter(e => e.employmentType ? e.employmentType.id !== 1 : true)}
                  value={form.nonPlantillaEmployeeId}
                  onSelect={(id) => setForm(f => ({ ...f, nonPlantillaEmployeeId: id }))}
                  placeholder="Search non-plantilla employee…"
                />
              )}
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
