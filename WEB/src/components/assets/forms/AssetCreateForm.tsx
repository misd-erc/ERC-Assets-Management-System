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
import { toast } from 'sonner';

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
    categoryId: 0,
    legendId: 0,
    description: '',
    brand: '',
    model: '',
    serialNumber: '',
    parts: [],
    unitOfMeasurement: '',
    unitValue: 0,
    dateAcquired: '',
    estimatedUsefulLife: 5,
    fiscalYear: 0,
    condition: 'Working',
    movements: [],
  });

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
      plantillaEmployeeId: 0,
      nonPlantillaEmployeeId: 0,
      actualOfficeId: 0,
      actualDivisionId: 0,
      condition: 'Working',
      isActive: true,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    }]);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate Item Identification required fields
    if (!formData.propertyNumber?.trim() || !formData.description?.trim() || !formData.brand?.trim() || !formData.model?.trim() || !formData.serialNumber?.trim()) {
      toast.error('Property Number, Description, Brand, Model, and Serial Number are required');
      return;
    }

    // Validate Classification Details required fields
    if (!formData.unitOfMeasurement?.trim()) {
      toast.error('Unit of Measurement is required');
      return;
    }
    if (!formData.unitValue || formData.unitValue <= 0) {
      toast.error('Unit Value is required and must be greater than 0');
      return;
    }
    if (!formData.dateAcquired?.trim()) {
      toast.error('Date Acquired is required');
      return;
    }
    if (!formData.estimatedUsefulLife || formData.estimatedUsefulLife <= 0) {
      toast.error('Estimated Useful Life is required and must be greater than 0');
      return;
    }

    // Validate Accountability Information required fields
    for (let i = 0; i < accountabilityEntries.length; i++) {
      const entry = accountabilityEntries[i];
      const entryLabel = i === 0 ? 'Current Holder' : `Previous Holder ${i}`;
      
      if (!entry.dateAssigned) {
        toast.error(`Date Assigned is required for ${entryLabel}`);
        return;
      }
      
      if (!entry.parItrNumber?.trim()) {
        toast.error(`PAR/ITR Number is required for ${entryLabel}`);
        return;
      }
      
      // Validate PTR number format (PTR-YYYY-MM-DD-XXXX)
    
      
      if (entry.plantillaEmployeeId === 0) {
        toast.error(`Accountable Employee (Plantilla) is required for ${entryLabel}`);
        return;
      }
      
      if (entry.nonPlantillaEmployeeId === 0) {
        toast.error(`Sub Accountable Employee (Non-Plantilla) is required for ${entryLabel}`);
        return;
      }
      
    }

    // Determine group based on unit value
    const group = formData.unitValue <= 49999 ? 'SE' : 'PPE';

    const submitData: Omit<Asset, 'id'> = {
      ...formData,
      group,
      // Keep asset.condition in sync with current holder's condition
      condition: accountabilityEntries[0]?.condition || formData.condition || 'Working',
      movements: accountabilityEntries,
    };

    onSubmit(submitData);
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
        mode="create"
        formData={formData}
        setFormData={setFormData}
        accountabilityEntries={accountabilityEntries}
        setAccountabilityEntries={setAccountabilityEntries}
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
          Create Asset
        </Button>
      </div>
    </form>
  );
}
