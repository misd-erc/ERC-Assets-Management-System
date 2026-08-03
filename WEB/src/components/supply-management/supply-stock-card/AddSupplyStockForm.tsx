import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { SearchableSelect } from './SearchableSelect';
import { useSupplyItem, useSupplyUnit, useSupplyStorageLocation, useVendor } from '@/hooks';
import { getCategories } from '@/api/asset/inventoryApi';
import { getSupplyItemById } from '@/api';
import { SupplyItem } from '@/types';

interface AddSupplyStockFormProps {
  stockNumber: string;
  description: string;
  unitId?: number;
  editId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const safeFormatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr || dateStr.startsWith('0001')) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

export const AddSupplyStockForm = ({
  stockNumber,
  description,
  unitId,
  editId,
  onSuccess,
  onCancel,
}: AddSupplyStockFormProps) => {
  const { addSupplyItem, updateSupplyItem } = useSupplyItem();
  const { units, fetchSupplyUnits } = useSupplyUnit();
  const { storagelocations, fetchSupplyStorageLocations } = useSupplyStorageLocation();
  const { vendors, fetchVendors } = useVendor();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  const [itemForm, setItemForm] = useState<Partial<SupplyItem>>({
    code: stockNumber,
    description: description,
    categoryId: 0,
    measurementUnitId: unitId || 0,
    quantity: 0,
    unitCost: 0,
    reorderPoint: 0,
    storageLocationId: 0,
    vendorId: 0,
    isActive: true,
    createdAt: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    fetchSupplyUnits();
    fetchSupplyStorageLocations();
    fetchVendors();

    getCategories('Supply')
      .then(setCategories)
      .catch((err) => console.error("Failed to load categories", err));
  }, [fetchSupplyUnits, fetchSupplyStorageLocations, fetchVendors]);

  useEffect(() => {
    if (editId && editId > 0) {
      setLoading(true);
      getSupplyItemById(editId)
        .then((item) => {
          if (item) {
            const newForm = {
              code: item.code,
              description: item.description,
              categoryId: item.categoryId ?? item.category?.id ?? 0,
              measurementUnitId: item.measurementUnitId ?? item.measurementUnit?.id ?? 0,
              quantity: item.quantity || 0,
              unitCost: item.unitCost || 0,
              reorderPoint: item.reorderPoint || 0,
              storageLocationId: item.storageLocationId ?? item.storageLocation?.id ?? 0,
              vendorId: item.vendorId ?? item.vendor?.id ?? 0,
              isActive: item.isActive,
              createdAt: safeFormatDate(item.createdAt) || new Date().toISOString().slice(0, 10),
            };
            setItemForm(newForm);
          }
        })
        .catch((err) => console.error("Failed to load supply item details", err))
        .finally(() => setLoading(false));
    } else if (!editId) {
      setItemForm({
        code: stockNumber,
        description: description,
        categoryId: 0,
        measurementUnitId: unitId || 0,
        quantity: 0,
        unitCost: 0,
        reorderPoint: 0,
        storageLocationId: 0,
        vendorId: 0,
        isActive: true,
        createdAt: new Date().toISOString().slice(0, 10),
      });
    }
  }, [stockNumber, description, unitId, editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitAddItem(true);
  };

  const handleSaveAndAddAnother = async (e: React.MouseEvent) => {
    e.preventDefault();
    await submitAddItem(false);
  };

  const submitAddItem = async (closeAfterSave: boolean) => {
    if (!itemForm.categoryId) {
      toast.error('Category is required');
      return;
    }
    if (!itemForm.measurementUnitId) {
      toast.error('Measurement Unit is required');
      return;
    }
    if (!itemForm.storageLocationId) {
      toast.error('Storage Location is required');
      return;
    }
    if (!itemForm.vendorId) {
      toast.error('Vendor is required');
      return;
    }

    setLoading(true);
    try {
      if (editId && editId > 0) {
        await updateSupplyItem(editId, itemForm);
        toast.success('Supply item stock updated successfully');
      } else {
        await addSupplyItem(itemForm);
        toast.success('Supply item stock added successfully');
      }
      onSuccess();
      if (closeAfterSave) {
        onCancel();
      } else {
        setItemForm(prev => ({
          ...prev,
          quantity: 0,
          unitCost: 0,
          reorderPoint: 0,
        }));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save supply item stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Item Code</Label>
          <Input value={itemForm.code} disabled className="bg-slate-50 border-slate-200 text-slate-500" />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Description</Label>
          <Input value={itemForm.description} disabled className="bg-slate-50 border-slate-200 text-slate-500" />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Category <span className="text-red-500">*</span></Label>
          <SearchableSelect
            value={itemForm.categoryId || 0}
            onChange={(val) => setItemForm({ ...itemForm, categoryId: val })}
            options={categories}
            placeholder="Select category"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Measurement Unit <span className="text-red-500">*</span></Label>
          <SearchableSelect
            value={itemForm.measurementUnitId || 0}
            onChange={(val) => setItemForm({ ...itemForm, measurementUnitId: val })}
            options={units}
            placeholder="Select unit"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Quantity</Label>
          <Input
            type="number"
            value={itemForm.quantity === 0 ? "" : itemForm.quantity}
            onChange={(e) => {
              const val = e.target.value;
              setItemForm({ ...itemForm, quantity: val === "" ? 0 : Number(val) });
            }}
            onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
            className="bg-white border-slate-200 text-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            min={0}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Unit Cost</Label>
          <Input
            type="number"
            step="0.01"
            value={itemForm.unitCost === 0 ? "" : itemForm.unitCost}
            onChange={(e) => {
              const val = e.target.value;
              setItemForm({ ...itemForm, unitCost: val === "" ? 0 : Number(val) });
            }}
            onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
            className="bg-white border-slate-200 text-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            min={0}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Reorder Point</Label>
          <Input
            type="number"
            value={itemForm.reorderPoint === 0 ? "" : itemForm.reorderPoint}
            onChange={(e) => {
              const val = e.target.value;
              setItemForm({ ...itemForm, reorderPoint: val === "" ? 0 : Number(val) });
            }}
            onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
            className="bg-white border-slate-200 text-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            min={0}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Storage Location <span className="text-red-500">*</span></Label>
          <SearchableSelect
            value={itemForm.storageLocationId || 0}
            onChange={(val) => setItemForm({ ...itemForm, storageLocationId: val })}
            options={storagelocations}
            placeholder="Select storage location"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Vendor <span className="text-red-500">*</span></Label>
          <SearchableSelect
            value={itemForm.vendorId || 0}
            onChange={(val) => setItemForm({ ...itemForm, vendorId: val })}
            options={vendors}
            placeholder="Select vendor"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Created At</Label>
          <Input
            type="date"
            value={itemForm.createdAt || ''}
            onChange={(e) => setItemForm({ ...itemForm, createdAt: e.target.value })}
            className="bg-white border-slate-200 text-slate-900"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end w-full border-t pt-4 mt-2 border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        {!editId && (
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={handleSaveAndAddAnother}
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
          >
            Save & Add Another
          </Button>
        )}
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {editId ? 'Update' : 'Save'}
        </Button>
      </div>
    </form>
  );
};
