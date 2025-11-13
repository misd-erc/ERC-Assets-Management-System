import { useState } from 'react';
import { SupplyItem } from '@/types/supply/supply';
import { useData } from '@/hooks/data/useData';
import { generateItemCode } from '@/utils/generators';
import { toast } from 'sonner';

export interface SupplyFormData {
  itemCode: string;
  description: string;
  category: string;
  unit: string;
  currentStock: number;
  reorderPoint: number;
  unitCost: number;
  location: string;
  supplier: string;
}

export const useSupplyForm = () => {
  const { addSupply, updateSupply } = useData();

  const [formData, setFormData] = useState<SupplyFormData>({
    itemCode: '',
    description: '',
    category: '',
    unit: '',
    currentStock: 0,
    reorderPoint: 0,
    unitCost: 0,
    location: '',
    supplier: '',
  });

  const resetForm = () => {
    setFormData({
      itemCode: generateItemCode(),
      description: '',
      category: '',
      unit: '',
      currentStock: 0,
      reorderPoint: 0,
      unitCost: 0,
      location: '',
      supplier: '',
    });
  };

  const loadSupply = (supply: SupplyItem) => {
    setFormData({
      itemCode: supply.itemCode,
      description: supply.description,
      category: supply.category || '',
      unit: supply.unit,
      currentStock: supply.currentStock,
      reorderPoint: supply.reorderPoint || 0,
      unitCost: supply.unitCost || 0,
      location: supply.location || '',
      supplier: supply.supplier || '',
    });
  };

  const handleSubmit = (editingSupply?: SupplyItem) => {
    if (!formData.description.trim() || !formData.category) {
      toast.error('Description and category are required');
      return false;
    }

    const supplyData: Omit<SupplyItem, 'id'> = {
      stockNumber: 'STK-' + formData.itemCode,
      itemCode: formData.itemCode,
      description: formData.description,
      category: formData.category,
      unit: formData.unit,
      currentStock: formData.currentStock,
      reorderPoint: formData.reorderPoint,
      unitCost: formData.unitCost,
      location: formData.location,
      supplier: formData.supplier,
      totalValue: formData.currentStock * formData.unitCost,
      lastRestocked: new Date().toISOString().split('T')[0],
    };

    try {
      if (editingSupply) {
        updateSupply(editingSupply.id, supplyData);
        toast.success('Supply item updated successfully');
      } else {
        addSupply(supplyData);
        toast.success('Supply item added successfully');
      }
      resetForm();
      return true;
    } catch (error) {
      toast.error('Failed to save supply item');
      return false;
    }
  };

  return {
    formData,
    setFormData,
    resetForm,
    loadSupply,
    handleSubmit,
  };
};




