import { useState } from 'react';
import { useData } from '../hooks/data/useData';
import { generateRISNumber } from '../utils/generators';
import { toast } from 'sonner';

export interface RISFormData {
  requester: string;
  department: string;
  items: Array<{
    supplyId: string;
    quantityRequested: number;
    purpose: string;
  }>;
  remarks: string;
}

export const useRISForm = () => {
  const { addRISRequest, supplies } = useData();

  const [formData, setFormData] = useState<RISFormData>({
    requester: '',
    department: '',
    items: [{ supplyId: '', quantityRequested: 0, purpose: '' }],
    remarks: '',
  });

  const resetForm = () => {
    setFormData({
      requester: '',
      department: '',
      items: [{ supplyId: '', quantityRequested: 0, purpose: '' }],
      remarks: '',
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { supplyId: '', quantityRequested: 0, purpose: '' }],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleSubmit = () => {
    if (!formData.requester.trim() || !formData.department) {
      toast.error('Requester and department are required');
      return false;
    }

    if (
      formData.items.length === 0 ||
      formData.items.some((item) => !item.supplyId || item.quantityRequested <= 0)
    ) {
      toast.error('At least one valid item is required');
      return false;
    }

    const totalValue = formData.items.reduce((sum, item) => {
      const supply = supplies.find((s) => s.id === item.supplyId);
      return sum + (supply ? (supply.unitCost ?? 0) * item.quantityRequested : 0);
    }, 0);

    const risData = {
      risNumber: generateRISNumber(),
      requester: formData.requester,
      department: formData.department,
      dateRequested: new Date().toISOString(), // ✅ must be a string
      items: formData.items.map((item) => {
        const supply = supplies.find((s) => s.id === item.supplyId);
        return {
          id: Date.now().toString() + Math.random(),
          supplyId: item.supplyId,
          description: supply?.description || '', // ✅ use description, not name
          unit: supply?.unit || '',
          quantityRequested: item.quantityRequested,
          purpose: item.purpose,
          unitCost: supply?.unitCost || 0,
        };
      }),
      status: 'pending' as const,
      totalEstimatedValue: totalValue,
      remarks: formData.remarks,
    };

    try {
      addRISRequest(risData);
      toast.success('RIS Request created successfully');
      resetForm();
      return true;
    } catch (error) {
      toast.error('Failed to create RIS request');
      return false;
    }
  };

  return {
    formData,
    setFormData,
    resetForm,
    addItem,
    removeItem,
    updateItem,
    handleSubmit,
  };
};
