import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Package, DollarSign, User, Plus, X } from 'lucide-react';
import { Asset, UnifiedMovement } from '@/types/asset/UnifiedAsset';
import { getOffices } from '@/api/office-management/officeApi';
import { getDivisions } from '@/api/office-management/divisionApi';
import { VwOffice, VwDivision } from '@/types/office';
import { useAuthStore } from '@/store/auth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getCategories, getLegends } from '@/api/inventoryApi';

interface AssetsFormProps {
  asset?: Asset;
  onSubmit: (data: Omit<Asset, 'id'>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function AssetsForm({ asset, onSubmit, onCancel, isEditing = false }: AssetsFormProps) {
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
  }, []);

  // Set default office and division from user profile for new assets
  useEffect(() => {
    if (!isEditing && userProfile && offices.length > 0 && divisions.length > 0 && accountabilityEntries.length > 0) {
      const userOffice = offices.find(o => o.id === userProfile.office?.id);
      const userDivision = divisions.find(d => d.id === userProfile.division?.id);

      // Only set defaults if the current entry doesn't have values already
      if (accountabilityEntries[0] && accountabilityEntries[0].office.id === 0 && accountabilityEntries[0].division.id === 0) {
        setAccountabilityEntries(prev => prev.map((entry, index) =>
          index === 0 ? { ...entry, office: userOffice || entry.office, division: userDivision || entry.division } : entry
        ));
      }
    }
  }, [userProfile, offices, divisions, isEditing, accountabilityEntries.length]);

  useEffect(() => {
    if (asset && isEditing) {
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
          ptaId: 0,
          dateAssigned: new Date().toISOString(),
          parItrNumber: '',
          plantillaEmployeeId: null,
          nonPlantillaEmployeeId: null,
          office: { id: 0, name: '', acronym: '' },
          division: { id: 0, name: '', acronym: '' },
          condition: 'Working',
        }]);
      }
    } else {
      // For new assets, initialize with default entry
      setAccountabilityEntries([{
        id: Date.now(),
        ptaId: 0,
        dateAssigned: new Date().toISOString(),
        parItrNumber: '',
        plantillaEmployeeId: null,
        nonPlantillaEmployeeId: null,
        office: { id: 0, name: '', acronym: '' },
        division: { id: 0, name: '', acronym: '' },
        condition: 'Working',
      }]);
    }
  }, [asset, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields - check for non-empty strings
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
      parts: [...prev.parts, { id: 0, ptaId: 0, name: '', serialNumber: '', isActive: true }]
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
        id: Date.now(),
        ptaId: 0,
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
      {/* Item Identification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5 text-blue-600" />
            Item Identification
          </CardTitle>
          <CardDescription>
            Basic information about the asset
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="propertyNumber">
                Property Number *
              </Label>
              <Input
                id="propertyNumber"
                value={formData.propertyNumber}
                onChange={(e) => handleInputChange('propertyNumber', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category ?? undefined}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="legend">Legend</Label>
              <Select
                value={formData.legend ?? undefined}
                onValueChange={(value) => handleInputChange('legend', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select legend" />
                </SelectTrigger>
                <SelectContent>
                  {legends.map(legend => (
                    <SelectItem key={legend} value={legend}>
                      {legend}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => handleInputChange('serialNumber', e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="size-5 text-blue-600" />
              Parts
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddPart}>
              <Plus className="size-4 mr-2" />
              Add Parts
            </Button>
          </CardTitle>
          <CardDescription>
            Add components or parts that make up this asset
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formData.parts.length === 0 ? (
            <p className="text-sm text-gray-500">No parts added yet. Click "Add Parts" to add components.</p>
          ) : (
            <div className="space-y-4">
              {formData.parts.map((part, index) => (
                <div key={index} className="flex items-end gap-4 p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`part-name-${index}`}>Name</Label>
                    <Input
                      id={`part-name-${index}`}
                      value={part.name}
                      onChange={(e) => handlePartChange(index, 'name', e.target.value)}
                      placeholder="Enter part name"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`part-serial-${index}`}>Serial Number</Label>
                    <Input
                      id={`part-serial-${index}`}
                      value={part.serialNumber}
                      onChange={(e) => handlePartChange(index, 'serialNumber', e.target.value)}
                      placeholder="Enter serial number"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemovePart(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Classification Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="size-5 text-blue-600" />
            Classification Details
          </CardTitle>
          <CardDescription>
            Financial and lifecycle information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitOfMeasurement">Unit of Measurement</Label>
              <Select
                value={formData.unitOfMeasurement}
                onValueChange={(value) => handleInputChange('unitOfMeasurement', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {getUnitOfMeasurementOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitValue">Unit Value *</Label>
              <Input
                id="unitValue"
                type="number"
                step="0.01"
                value={formData.unitValue}
                onChange={(e) => handleInputChange('unitValue', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateAcquired">Date Acquired *</Label>
              <Input
                id="dateAcquired"
                type="date"
                value={formData.dateAcquired}
                onChange={(e) => handleInputChange('dateAcquired', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedUsefulLife">Estimated Useful Life (years)</Label>
              <Input
                id="estimatedUsefulLife"
                type="number"
                value={formData.estimatedUsefulLife ?? ''}
                onChange={(e) => handleInputChange('estimatedUsefulLife', parseInt(e.target.value) || 5)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accountability Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="size-5 text-blue-600" />
              Accountability Information
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddAccountabilityEntry}>
              <Plus className="size-4 mr-2" />
              Add Entry
            </Button>
          </CardTitle>
          <CardDescription>
            Current assignment and responsibility details (multiple entries for movement history)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {accountabilityEntries.map((entry, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-sm">
                    {index === 0 ? 'Current Holder' : `Previous Holder ${index}`}
                  </h4>
                  {accountabilityEntries.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveAccountabilityEntry(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`dateAssigned-${index}`}>Date Assigned</Label>
                    <Input
                      id={`dateAssigned-${index}`}
                      type="datetime-local"
                      value={entry.dateAssigned ? new Date(entry.dateAssigned).toISOString().slice(0, 16) : ''}
                      onChange={(e) => handleAccountabilityEntryChange(index, 'dateAssigned', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`parItrNumber-${index}`}>PAR/ITR Number</Label>
                    <Input
                      id={`parItrNumber-${index}`}
                      value={entry.parItrNumber}
                      onChange={(e) => handleAccountabilityEntryChange(index, 'parItrNumber', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`plantillaEmployeeId-${index}`}>Plantilla Employee ID</Label>
                    <Input
                      id={`plantillaEmployeeId-${index}`}
                      value={(entry.plantillaEmployeeId?.toString() || '') as string | undefined}
                      onChange={(e) => handleAccountabilityEntryChange(index, 'plantillaEmployeeId', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`nonPlantillaEmployeeId-${index}`}>Non-Plantilla Employee ID</Label>
                    <Input
                      id={`nonPlantillaEmployeeId-${index}`}
                      value={(entry.nonPlantillaEmployeeId?.toString() || '') as string | undefined}
                      onChange={(e) => handleAccountabilityEntryChange(index, 'nonPlantillaEmployeeId', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`actualOffice-${index}`}>Office</Label>
                    <Select
                      value={(entry.office.id ?? 0).toString()}
                      onValueChange={(value) => {
                        const selectedOffice = offices.find(o => o.id.toString() === value);
                        handleAccountabilityEntryChange(index, 'office', selectedOffice || { id: 0, name: '', acronym: '' });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select office" />
                      </SelectTrigger>
                      <SelectContent>
                        {offices.map(office => (
                          <SelectItem key={office.id} value={office.id.toString()}>
                            {office.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`actualDivision-${index}`}>Division</Label>
                    <Select
                      value={entry.division.id?.toString() || ''}
                      onValueChange={(value) => {
                        const selectedDivision = divisions.find(d => d.id.toString() === value);
                        handleAccountabilityEntryChange(index, 'division', selectedDivision || { id: 0, name: '', acronym: '' });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select division" />
                      </SelectTrigger>
                      <SelectContent>
                        {divisions.map(division => (
                          <SelectItem key={division.id} value={division.id.toString()}>
                            {division.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`condition-${index}`}>Condition</Label>
                    <Select
                      value={entry.condition}
                      onValueChange={(value) => handleAccountabilityEntryChange(index, 'condition', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Working">Working</SelectItem>
                        <SelectItem value="Not Working">Not Working</SelectItem>
                        <SelectItem value="IIRUP">IIRUP</SelectItem>
                        <SelectItem value="Disposed">Disposed</SelectItem>
                        <SelectItem value="Missing">Missing</SelectItem>
                        <SelectItem value="Unserviceable">Unserviceable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditing ? 'Update' : 'Create'} Asset
        </Button>
      </div>
    </form>
  );
}
