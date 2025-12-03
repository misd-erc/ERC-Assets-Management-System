import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Package, DollarSign, User, Plus, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Asset, UnifiedMovement, NormalizedEmployee, Part } from '@/types/asset/UnifiedAsset';
import { getOffices } from '@/api/office-management/officeApi';
import { getDivisions } from '@/api/office-management/divisionApi';
import { VwOffice, VwDivision } from '@/types/office';
import { useAuthStore } from '@/store/auth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getCategories, getLegends } from '@/api/inventoryApi';
import { getEmployees } from '@/api/user-management/userApi';
import { UnifiedAssetService } from '@/services/UnifiedAssetService';
import { SharedAssetFields } from '@/components/assets/forms/SharedAssetFields';

interface AssetEditFormProps {
  asset: Asset;
  onSubmit: (data: Omit<Asset, 'id'>) => void;
  onCancel: () => void;
}

export function AssetEditForm({ asset, onSubmit, onCancel }: AssetEditFormProps) {
  const { systemUserId } = useAuthStore();
  const { userProfile } = useUserProfile();

  const [formData, setFormData] = useState<Omit<Asset, 'id'>>({
    group: asset.group,
    propertyNumber: asset.propertyNumber || '',
    category: asset.category,
    legend: asset.legend,
    description: asset.description || '',
    brand: asset.brand || '',
    model: asset.model || '',
    serialNumber: asset.serialNumber || '',
    parts: asset.parts || [],
    unitOfMeasurement: asset.unitOfMeasurement || '',
    unitValue: asset.unitValue || 0,
    dateAcquired: asset.dateAcquired || '',
    estimatedUsefulLife: asset.estimatedUsefulLife || 5,
    movements: asset.movements || [],
  });

  const [accountabilityEntries, setAccountabilityEntries] = useState<UnifiedMovement[]>([]);
  const [offices, setOffices] = useState<VwOffice[]>([]);
  const [divisions, setDivisions] = useState<VwDivision[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [legends, setLegends] = useState<string[]>([]);
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
        category: asset.category,
        legend: asset.legend,
        description: asset.description || '',
        brand: asset.brand || '',
        model: asset.model || '',
        serialNumber: asset.serialNumber || '',
        parts: asset.parts || [],
        unitOfMeasurement: asset.unitOfMeasurement || '',
        unitValue: asset.unitValue || 0,
        dateAcquired: asset.dateAcquired || '',
        estimatedUsefulLife: asset.estimatedUsefulLife || 5,
        movements: asset.movements || [],
      });

      // Initialize accountability entries from movements
      if (asset.movements && asset.movements.length > 0) {
        setAccountabilityEntries(asset.movements);
      } else {
        // Default entry
        setAccountabilityEntries([{
          id: Date.now(),
          ptaId: asset.id,
          dateAssigned: new Date().toISOString(),
          parItrNumber: '',
          plantillaEmployeeId: null,
          nonPlantillaEmployeeId: null,
          office: { id: 0, name: '', acronym: '' },
          division: { id: 0, name: '', acronym: '' },
          condition: 'Working',
        }]);
      }
    }
  }, [asset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.propertyNumber?.trim() || !formData.description?.trim() || !formData.brand?.trim() || !formData.model?.trim() || !formData.serialNumber?.trim() || !formData.unitOfMeasurement?.trim()) {
      alert('Property Number, Description, Brand, Model, Serial Number, and Unit of Measurement are required');
      return;
    }

    // Determine group based on unit value
    const group = formData.unitValue >= 50000 ? 'SE' : 'PPE';

    const submitData: Omit<Asset, 'id'> = {
      ...formData,
      group,
      movements: accountabilityEntries,
    };

    onSubmit(submitData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updatedData = { ...prev, [field]: value };

      // Automatically set group based on unit value
      if (field === 'unitValue') {
        updatedData.group = value >= 50000 ? 'SE' : 'PPE';
      }

      return updatedData;
    });
  };

  const handleAddPart = () => {
    setFormData((prev) => ({
      ...prev,
      parts: [...prev.parts, { id: null, ptaId: asset.id, name: '', serialNumber: '', isActive: true }]
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
        parItrNumber: '',
        plantillaEmployeeId: null,
        nonPlantillaEmployeeId: null,
        office: { id: 0, name: '', acronym: '' },
        division: { id: 0, name: '', acronym: '' },
        condition: 'Working',
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

  function handleEmployeeSelect(index: number, employeeId: number) {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) {
      handleAccountabilityEntryChange(index, 'plantillaEmployeeId', 0);
      handleAccountabilityEntryChange(index, 'nonPlantillaEmployeeId', 0);
      return;
    }

    if (emp.employmentTypeId === 1) {
      handleAccountabilityEntryChange(index, 'plantillaEmployeeId', employeeId);
      handleAccountabilityEntryChange(index, 'nonPlantillaEmployeeId', 0);
    } else {
      handleAccountabilityEntryChange(index, 'plantillaEmployeeId', 0);
      handleAccountabilityEntryChange(index, 'nonPlantillaEmployeeId', employeeId);
    }
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
        handleEmployeeSelect={handleEmployeeSelect}
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

