import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Package, DollarSign, User, Plus, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Asset, UnifiedMovement, NormalizedEmployee, Part, FormAsset } from '@/types/asset/UnifiedAsset';
import { getOffices } from '@/api/office-management/officeApi';
import { getDivisions } from '@/api/office-management/divisionApi';
import { VwOffice, VwDivision } from '@/types/office';
import { useAuthStore } from '@/store/auth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getCategories, getLegends } from '@/api/asset/inventoryApi';
import { getEmployees } from '@/api/user-management/userApi';
import { UnifiedAssetService } from '@/services/UnifiedAssetService';
import { SharedAssetFields } from '@/components/assets/forms/SharedAssetFields';
import { toast } from 'sonner';

interface AssetEditFormProps {
  asset: Asset;
  onSubmit: (data: Asset) => void;
  onCancel: () => void;
  onSuccess?: () => void;
}

export function AssetEditForm({ asset, onSubmit, onCancel, onSuccess }: AssetEditFormProps) {
  const { systemUserId } = useAuthStore();
  const { userProfile } = useUserProfile();

  const [formData, setFormData] = useState<FormAsset>({
    group: asset.group,
    propertyNumber: asset.propertyNumber || '',
    categoryId: asset.category?.id || 0,
    legendId: asset.legend?.id || 0,
    description: asset.description || '',
    brand: asset.brand || '',
    model: asset.model || '',
    serialNumber: asset.serialNumber || '',
    parts: asset.parts || [],
    unitOfMeasurement: asset.unitOfMeasurement || '',
    unitValue: asset.unitValue || 0,
    dateAcquired: asset.dateAcquired || '',
    estimatedUsefulLife: asset.estimatedUsefulLife || 5,
    fiscalDate: asset.fiscalDate || new Date().toISOString().split('T')[0],
    condition: asset.condition || 'Working',
    movements: asset.movements || [],
  });

  const [showAccountabilitySection, setShowAccountabilitySection] = useState(() => !!(asset.movements && asset.movements.length > 0));
  const [accountabilityEntries, setAccountabilityEntries] = useState<UnifiedMovement[]>([]);
  const [offices, setOffices] = useState<VwOffice[]>([]);
  const [divisions, setDivisions] = useState<VwDivision[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [legends, setLegends] = useState<{ id: number; name: string }[]>([]);
  const [employees, setEmployees] = useState<NormalizedEmployee[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [officesData, divisionsData] = await Promise.all([
          getOffices(),
          getDivisions()
        ]);
        setOffices(officesData);
        setDivisions(divisionsData);
      } catch (error) {
        console.error('Failed to load offices and divisions:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchLegends();
    fetchEmployees();
  }, []);

  useEffect(() => {
    setEmployeeOptions(employees.filter(emp => emp.id != null).map(emp => ({ value: emp.id.toString(), label: emp.label })));
  }, [employees]);

  useEffect(() => {
    if (asset) {
      setFormData({
        group: asset.group,
        propertyNumber: asset.propertyNumber || '',
        categoryId: asset.category?.id || 0,
        legendId: asset.legend?.id || 0,
        description: asset.description || '',
        brand: asset.brand || '',
        model: asset.model || '',
        serialNumber: asset.serialNumber || '',
        parts: asset.parts || [],
        unitOfMeasurement: asset.unitOfMeasurement || '',
        unitValue: asset.unitValue || 0,
        dateAcquired: asset.dateAcquired || '',
        estimatedUsefulLife: asset.estimatedUsefulLife || 5,
        fiscalDate: asset.fiscalDate || new Date().toISOString().split('T')[0],
        condition: asset.condition || 'Working',
        movements: asset.movements || [],
      });

      // Initialize accountability entries from movements
      if (asset.movements && asset.movements.length > 0) {
        setAccountabilityEntries(asset.movements);
        setShowAccountabilitySection(true);
      } else {
        setAccountabilityEntries([]);
        setShowAccountabilitySection(false);
      }
    }
  }, [asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.propertyNumber?.trim() || !formData.description?.trim() || !formData.brand?.trim() || !formData.model?.trim() || !formData.serialNumber?.trim() || !formData.unitOfMeasurement?.trim()) {
      toast.error('Property Number, Description, Brand, Model, Serial Number, and Unit of Measurement are required');
      return;
    }

    // Determine group based on unit value
    const group = formData.unitValue <= 49999 ? 'SE' : 'PPE';

    // Prepare parts with correct id and ptaId (ptaId always asset.id for edit)
    const preparedParts: Part[] = formData.parts.map(part => ({
      id: part.id || null,
      ptaId: asset.id,
      name: part.name,
      serialNumber: part.serialNumber,
      isActive: part.isActive ?? true,
    }));

    // Prepare movements with correct id and ptaId (ptaId always asset.id for edit)
    // Filter out any null/undefined entries
    const preparedMovements: any[] = showAccountabilitySection
      ? accountabilityEntries
          .filter(movement => movement != null)
          .map(movement => ({
        id: movement.id || 0, // Use 0 for new movements, existing id for edits
        ptaId: asset.id,
        dateAssigned: movement.dateAssigned || new Date().toISOString(),
        ptrItrNumber: movement.ptrItrNumber || '',
        parIcsNumber: movement.parIcsNumber || '',
        plantillaEmployeeId: movement.plantillaEmployeeId || 0,
        nonPlantillaEmployeeId: movement.nonPlantillaEmployeeId || 0,
        actualOfficeId: movement.actualOfficeId || 0,
        actualDivisionId: movement.actualDivisionId || 0,
        condition: movement.condition || 'Working',
      }))
      : [];

    const finalPayload: Asset = {
      id: asset.id,
      group: group as 'PPE' | 'SE',
      propertyNumber: formData.propertyNumber,
      category: categories.find(c => c.id === formData.categoryId) ? {
        id: formData.categoryId,
        name: categories.find(c => c.id === formData.categoryId)?.name || '',
        generalCode: '',
        isActive: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      } : asset.category,
      legend: formData.legendId && legends.find(l => l.id === formData.legendId) ? {
        id: formData.legendId,
        name: legends.find(l => l.id === formData.legendId)?.name || '',
        generalCode: '',
        isActive: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      } : null,
      description: formData.description,
      brand: formData.brand || null,
      model: formData.model || null,
      serialNumber: formData.serialNumber || null,
      parts: preparedParts,
      unitOfMeasurement: formData.unitOfMeasurement,
      unitValue: formData.unitValue,
      dateAcquired: formData.dateAcquired,
      estimatedUsefulLife: formData.estimatedUsefulLife,
      fiscalDate: formData.fiscalDate ?? new Date().toISOString().split('T')[0],
      movements: preparedMovements,
      condition: formData.condition,
      isActive: asset.isActive,
      isDeleted: asset.isDeleted,
      createdAt: asset.createdAt,
    };

    try {
      await UnifiedAssetService.update(asset.id, finalPayload);
      toast.success('Asset updated successfully');
      onCancel(); // Close the dialog
      onSuccess?.(); // Trigger reload
    } catch (error) {
      console.error('Error updating asset:', error);
      toast.error('Failed to update asset');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updatedData = { ...prev, [field]: value };

      // Automatically set group based on unit value
      if (field === 'unitValue') {
        updatedData.group = value <= 49999 ? 'SE' : 'PPE';
      }

      return updatedData;
    });
  };

  const handleAddPart = () => {
    setFormData((prev) => ({
      ...prev,
      parts: [...prev.parts, { id: 0, ptaId: asset.id, name: '', serialNumber: '', isActive: true }]
    }));
  };

  const handleRemovePart = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index)
    }));
  };

  const handlePartChange = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      parts: prev.parts.map((part, i) =>
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  const handleAddAccountabilityEntry = () => {
    setAccountabilityEntries((prev) => [
      ...prev,
      {
        id: 0,
        ptaId: asset.id,
        dateAssigned: new Date().toISOString(),
        ptrItrNumber: '',
        parIcsNumber: '',
        plantillaEmployeeId: 0,
        nonPlantillaEmployeeId: 0,
        actualOfficeId: 0,
        actualDivisionId: 0,
        condition: 'Working',
        isActive: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      }
    ]);
  };

  const handleRemoveAccountabilityEntry = (index: number) => {
    if (accountabilityEntries.length > 1) {
      setAccountabilityEntries((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleAccountabilityEntryChange = (index: number, field: string, value: any) => {
    setAccountabilityEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  function normalizeEmployee(e: any): NormalizedEmployee {
    const firstName = e.firstName ?? "";
    const middleName = e.middleName ?? "";
    const lastName = e.lastName ?? "";
    const suffixName = e.suffixName ?? "";
    const employeeIdOriginal = e.employeeIdOriginal ?? "";
    const employmentTypeId = e.employmentType?.id ?? 1;
    const employmentTypeName = employmentTypeId === 1 ? 'Plantilla' : 'Non-Plantilla';

    const label = `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ''}${suffixName ? ` ${suffixName}` : ''}${employeeIdOriginal ? ` â€” ${employeeIdOriginal}` : ''} (${employmentTypeName})`;

    return {
      id: e.id,
      firstName,
      middleName,
      lastName,
      suffixName,
      employeeIdOriginal,
      employmentTypeId,
      label,
    };
  }

  function handlePlantillaEmployeeSelect(index: number, employeeId: number) {
    handleAccountabilityEntryChange(index, 'plantillaEmployeeId', employeeId);
  }

  function handleNonPlantillaEmployeeSelect(index: number, employeeId: number) {
    handleAccountabilityEntryChange(index, 'nonPlantillaEmployeeId', employeeId);
  }

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchLegends = async () => {
    try {
      const data = await getLegends();
      setLegends(data);
    } catch (error) {
      console.error('Failed to fetch legends:', error);
    }
  };

  async function fetchEmployees() {
    const response = await getEmployees();
    setEmployees(response.data.items.map(normalizeEmployee));
  }

  const getUnitOfMeasurementOptions = () => {
    return [
      { value: 'Piece', label: 'Piece' },
      { value: 'Set', label: 'Set' },
      { value: 'Unit', label: 'Unit' },
      { value: 'Box', label: 'Box' }
    ];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      <SharedAssetFields
        mode="edit"
        formData={formData}
        setFormData={setFormData}
        accountabilityEntries={accountabilityEntries}
        setAccountabilityEntries={setAccountabilityEntries}
        showAccountabilitySection={showAccountabilitySection}
        onToggleAccountabilitySection={() => {
          setShowAccountabilitySection(prev => {
            if (!prev && accountabilityEntries.length === 0) {
              setAccountabilityEntries([{
                id: 0,
                ptaId: asset.id,
                dateAssigned: new Date().toISOString(),
                ptrItrNumber: '',
                parIcsNumber: '',
                plantillaEmployeeId: 0,
                nonPlantillaEmployeeId: 0,
                actualOfficeId: 0,
                actualDivisionId: 0,
                condition: 'Working',
                isActive: true,
                isDeleted: false,
                createdAt: new Date().toISOString(),
              }]);
            }
            return !prev;
          });
        }}
        handlePlantillaEmployeeSelect={handlePlantillaEmployeeSelect}
        handleNonPlantillaEmployeeSelect={handleNonPlantillaEmployeeSelect}
        employees={employees}
        categories={categories}
        legends={legends}
        offices={offices}
        divisions={divisions}
        handleInputChange={handleInputChange}
        handlePartChange={handlePartChange}
        handleAddPart={handleAddPart}
        handleRemovePart={handleRemovePart}
        handleAddAccountabilityEntry={handleAddAccountabilityEntry}
        handleRemoveAccountabilityEntry={handleRemoveAccountabilityEntry}
        handleAccountabilityEntryChange={handleAccountabilityEntryChange}
        getUnitOfMeasurementOptions={getUnitOfMeasurementOptions}
      />

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Update Asset
        </Button>
      </div>
    </form>
  );
}

