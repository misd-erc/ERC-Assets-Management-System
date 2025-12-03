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

interface AssetCreateFormProps {
  onSubmit: (data: Omit<Asset, 'id'>) => void;
  onCancel: () => void;
}

export function AssetCreateForm({ onSubmit, onCancel }: AssetCreateFormProps) {
  const { systemUserId } = useAuthStore();
  const { userProfile } = useUserProfile();

  const [formData, setFormData] = useState<Omit<Asset, 'id'>>({
    group: 'PPE',
    propertyNumber: '',
    category: null,
    legend: null,
    description: '',
    brand: '',
    model: '',
    serialNumber: '',
    parts: [],
    unitOfMeasurement: '',
    unitValue: 0,
    dateAcquired: '',
    estimatedUsefulLife: 5,
    movements: [],
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

  // Set default office and division from user profile for new assets
  useEffect(() => {
    if (userProfile && offices.length > 0 && divisions.length > 0 && accountabilityEntries.length > 0) {
      // Only set defaults if the current entry doesn't have values already
      if (accountabilityEntries[0] && accountabilityEntries[0].actualOfficeId === 0 && accountabilityEntries[0].actualDivisionId === 0) {
        setAccountabilityEntries(prev => prev.map((entry, index) =>
          index === 0 ? { ...entry, actualOfficeId: userProfile.office?.id || 0, actualDivisionId: userProfile.division?.id || 0 } : entry
        ));
      }
    }
  }, [userProfile, offices, divisions, accountabilityEntries.length]);

  useEffect(() => {
    // Initialize with default entry for new assets
    setAccountabilityEntries([{
      id: 0,
      ptaId: 0,
      dateAssigned: new Date().toISOString(),
      parItrNumber: '',
      plantillaEmployeeId: null,
      nonPlantillaEmployeeId: null,
      actualOfficeId: 0,
      actualDivisionId: 0,
      condition: 'Working',
    }]);
  }, []);

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
      parts: [...prev.parts, { id: null, ptaId: 0, name: '', serialNumber: '', isActive: true }]
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
        ptaId: 0,
        dateAssigned: new Date().toISOString(),
        parItrNumber: '',
        plantillaEmployeeId: null,
        nonPlantillaEmployeeId: null,
        actualOfficeId: 0,
        actualDivisionId: 0,
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

    const label = `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ''}${suffixName ? ` ${suffixName}` : ''}${employeeIdOriginal ? ` — ${employeeIdOriginal}` : ''} (${employmentTypeName})`;

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
        mode="create"
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
          Create Asset
        </Button>
      </div>
    </form>
  );
}
