import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Package, DollarSign, User, Plus, X } from 'lucide-react';
import { PPEAsset } from '@/types/asset/PPEAsset';
import { SEAsset } from '@/types/supply/se';
import { AssetType } from '@/services/assetService';
import { getOffices } from '@/api/office-management/officeApi';
import { getDivisions } from '@/api/office-management/divisionApi';
import { VwOffice, VwDivision } from '@/types/office';
import { useAuthStore } from '@/store/auth';
import { useUserProfile } from '@/hooks/useUserProfile';

interface AssetsFormProps {
  type: AssetType;
  asset?: PPEAsset | SEAsset;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function AssetsForm({ type, asset, onSubmit, onCancel, isEditing = false }: AssetsFormProps) {
  const { systemUserId } = useAuthStore();
  const { userProfile } = useUserProfile();

  const [formData, setFormData] = useState<any>({
    // Common fields
    category: '',
    description: '',
    brand: '',
    model: '',
    condition: 'Working',
    group: '', // Add group field

    // PPE specific fields
    propertyNumber: '',
    legend: '',
    serialNumber: '',
    parts: [] as {id: number, name: string, serialNumber: string}[],
    unitOfMeasurement: '',
    unitValue: 0,
    dateAcquired: '',
    estimatedUsefulLife: 5,
    parItrNumber: '',
    plantillaEmployeeId: '',
    nonPlantillaEmployeeId: '',
    actualDivision: '',

    // SE specific fields
    se_property_number: '',
    serial_number: '',
    unit_value: 0,
    date_acquired: '',
    status: 'Active',
  });

  const [accountabilityEntries, setAccountabilityEntries] = useState<any[]>([]);
  const [offices, setOffices] = useState<VwOffice[]>([]);
  const [divisions, setDivisions] = useState<VwDivision[]>([]);

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

  // Set default office and division from user profile for new assets
  useEffect(() => {
    if (!isEditing && userProfile && offices.length > 0 && divisions.length > 0 && accountabilityEntries.length > 0) {
      const userOfficeId = userProfile.office?.id?.toString() || '';
      const userDivisionId = userProfile.division?.id?.toString() || '';

      // Only set defaults if the current entry doesn't have values already
      if (accountabilityEntries[0] && !accountabilityEntries[0].actualOfficeId && !accountabilityEntries[0].actualDivisionId) {
        setAccountabilityEntries(prev => prev.map((entry, index) =>
          index === 0 ? { ...entry, actualOfficeId: userOfficeId, actualDivisionId: userDivisionId } : entry
        ));
      }
    }
  }, [userProfile, offices, divisions, isEditing, accountabilityEntries.length]);

  useEffect(() => {
    if (asset && isEditing) {
      if (type === 'ppe') {
        const ppeAsset = asset as PPEAsset;
        setFormData({
          propertyNumber: ppeAsset.propertyNumber || '',
          category: typeof ppeAsset.category === 'object' && ppeAsset.category !== null ? (ppeAsset.category as any).id : ppeAsset.category || '',
          legend: typeof ppeAsset.legend === 'object' && ppeAsset.legend !== null ? (ppeAsset.legend as any).id : ppeAsset.legend || '',
          description: ppeAsset.description || '',
          brand: ppeAsset.brand || '',
          model: ppeAsset.model || '',
          serialNumber: ppeAsset.serialNumber || '',
          parts: Array.isArray(ppeAsset.parts) ? ppeAsset.parts.map((part: any) => ({
            id: part.id,
            name: part.name || '',
            serialNumber: part.serialNumber || ''
          })) : [],
          unitOfMeasurement: ppeAsset.unitOfMeasurement || '',
          unitValue: ppeAsset.unitValue || 0,
          dateAcquired: ppeAsset.dateAcquired || '',
          estimatedUsefulLife: ppeAsset.estimatedUsefulLife || 5,
          parItrNumber: ppeAsset.movements && ppeAsset.movements.length > 0 ? ppeAsset.movements[0].parItrNumber || '' : '',
          plantillaEmployeeId: ppeAsset.movements && ppeAsset.movements.length > 0 ? ppeAsset.movements[0].plantillaEmployeeIdOriginal || '' : '',
          nonPlantillaEmployeeId: ppeAsset.movements && ppeAsset.movements.length > 0 ? ppeAsset.movements[0].nonPlantillaEmployeeIdOriginal || '' : '',
          actualDivision: ppeAsset.movements && ppeAsset.movements.length > 0 && typeof ppeAsset.movements[0].division === 'object' && ppeAsset.movements[0].division !== null ? ppeAsset.movements[0].division.name : '',
          condition: ppeAsset.movements && ppeAsset.movements.length > 0 ? ppeAsset.movements[0].condition || 'Working' : 'Working',
        });

        // Initialize accountability entries from movements
        if (ppeAsset.movements && ppeAsset.movements.length > 0) {
          const entries = ppeAsset.movements.map(movement => ({
            id: movement.id,
            dateAssigned: movement.dateAssigned || new Date().toISOString(),
            parItrNumber: movement.parItrNumber || '',
            plantillaEmployeeId: movement.plantillaEmployeeIdOriginal || '',
            nonPlantillaEmployeeId: movement.nonPlantillaEmployeeIdOriginal || '',
            actualOfficeId: movement.office?.id || '',
            actualDivisionId: movement.division?.id || '',
            condition: movement.condition || 'Working',
          }));
          setAccountabilityEntries(entries);
        } else {
          // Default entry
          setAccountabilityEntries([{
            id: 0,
            dateAssigned: new Date().toISOString(),
            parItrNumber: '',
            plantillaEmployeeId: '',
            nonPlantillaEmployeeId: '',
            actualOfficeId: '',
            actualDivisionId: '',
            condition: 'Working',
          }]);
        }
      } else {
        const seAsset = asset as SEAsset;
        setFormData({
          se_property_number: seAsset.se_property_number || '',
          category: seAsset.category || '',
          serial_number: seAsset.serial_number || '',
          brand: seAsset.brand || '',
          model: seAsset.model || '',
          unit_value: seAsset.unit_value || 0,
          date_acquired: seAsset.date_acquired || '',
          description: seAsset.description || '',
          status: seAsset.status || 'Active',
          parts_accessories: seAsset.parts_accessories || '',
        });

        // Initialize accountability entries from accountabilityBlocks
        if (seAsset.accountabilityBlocks && seAsset.accountabilityBlocks.length > 0) {
          const entries = seAsset.accountabilityBlocks.map(block => ({
            dateAssigned: block.date_issued_returned || new Date().toISOString(),
            parItrNumber: block.itr_rrsp_number || '',
            plantillaEmployeeId: block.plantilla_employee_id || '',
            nonPlantillaEmployeeId: block.non_plantilla_employee_id || '',
            actualOfficeId: '', // SE doesn't have office/division in the same way
            actualDivisionId: '', // SE uses division_section as string
            condition: block.condition || 'Working',
          }));
          setAccountabilityEntries(entries);
        } else {
          // Default entry
          setAccountabilityEntries([{
            dateAssigned: new Date().toISOString(),
            parItrNumber: '',
            plantillaEmployeeId: '',
            nonPlantillaEmployeeId: '',
            actualOfficeId: '',
            actualDivisionId: '',
            condition: 'Working',
          }]);
        }
      }
    } else {
      // For new assets, initialize with default entry
      setAccountabilityEntries([{
        dateAssigned: new Date().toISOString(),
        parItrNumber: '',
        plantillaEmployeeId: '',
        nonPlantillaEmployeeId: '',
        actualOfficeId: '',
        actualDivisionId: '',
        condition: 'Working',
      }]);
    }
  }, [asset, isEditing, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'ppe') {
      // Validate required PPE fields
      if (!formData.propertyNumber || !formData.description) {
        alert('Property Number and Description are required');
        return;
      }

      // Use the first accountability entry (current holder) for submission
      const currentEntry = accountabilityEntries[0] || {};

      const submitData = {
        propertyNumber: formData.propertyNumber,
        category: formData.category,
        legend: formData.legend,
        description: formData.description,
        brand: formData.brand,
        model: formData.model,
        serialNumber: formData.serialNumber,
        parts: formData.parts,
        unitOfMeasurement: formData.unitOfMeasurement,
        unitValue: formData.unitValue,
        dateAcquired: formData.dateAcquired,
        estimatedUsefulLife: formData.estimatedUsefulLife,
        group: 'PPE',
        movements: accountabilityEntries.map(entry => ({
          id: entry.id,
          parItrNumber: entry.parItrNumber,
          plantillaEmployeeIdOriginal: entry.plantillaEmployeeId,
          nonPlantillaEmployeeIdOriginal: entry.nonPlantillaEmployeeId,
          office: entry.actualOfficeId ? { id: entry.actualOfficeId } : null,
          division: entry.actualDivisionId ? { id: entry.actualDivisionId } : null,
          condition: entry.condition,
          dateAssigned: entry.dateAssigned,
        })),
      };

      onSubmit(submitData);
    } else {
      // Validate required SE fields
      if (!formData.se_property_number || !formData.description) {
        alert('SE Property Number and Description are required');
        return;
      }

      // Validate unit value is below 50,000
      if (formData.unit_value >= 50000) {
        alert('Unit value for Semi-Expendable must be below ₱50,000');
        return;
      }

      const submitData = {
        se_property_number: formData.se_property_number,
        category: formData.category,
        serial_number: formData.serial_number,
        brand: formData.brand,
        model: formData.model,
        unit_value: formData.unit_value,
        date_acquired: formData.date_acquired,
        description: formData.description,
        status: formData.status,
        group: 'SE',
        accountabilityBlocks: accountabilityEntries.map(entry => ({
          itr_rrsp_number: entry.parItrNumber,
          plantilla_employee_id: entry.plantillaEmployeeId || null,
          non_plantilla_employee_id: entry.nonPlantillaEmployeeId || null,
          division_section: entry.actualDivisionId ? divisions.find(d => d.id.toString() === entry.actualDivisionId)?.name || '' : '',
          condition: entry.condition || 'Working',
          date_issued_returned: entry.dateAssigned,
        })),
      };

      onSubmit(submitData);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      const updatedData = { ...prev, [field]: value };

      // Automatically set group based on unit value
      if (field === 'unitValue' || field === 'unit_value') {
        const unitValue = field === 'unitValue' ? value : prev.unitValue;
        const unit_value = field === 'unit_value' ? value : prev.unit_value;
        const actualValue = type === 'ppe' ? unitValue : unit_value;

        if (actualValue <= 49999) {
          updatedData.group = 'PPE';
        } else if (actualValue >= 50000) {
          updatedData.group = 'SE';
        }
      }

      return updatedData;
    });
  };

  const handleAddPart = () => {
    setFormData((prev: any) => ({
      ...prev,
      parts: [...prev.parts, { id: 0, name: '', serialNumber: '' }]
    }));
  };

  const handleRemovePart = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      parts: prev.parts.filter((_: any, i: number) => i !== index)
    }));
  };

  const handlePartChange = (index: number, field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      parts: prev.parts.map((part: any, i: number) =>
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  const handleAddAccountabilityEntry = () => {
    setAccountabilityEntries((prev) => [
      ...prev,
      {
        dateAssigned: new Date().toISOString(),
        parItrNumber: '',
        plantillaEmployeeId: '',
        nonPlantillaEmployeeId: '',
        actualOfficeId: '',
        actualDivisionId: '',
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

  const getCategoryOptions = () => {
    return [
      { value: 'ICT Equipment', label: 'ICT Equipment' },
      { value: 'Office Equipment', label: 'Office Equipment' },
      { value: 'Motor Vehicle', label: 'Motor Vehicle' },
      { value: 'Furniture and Fixtures', label: 'Furniture and Fixtures' },
      { value: 'Communication Equipment', label: 'Communication Equipment' },
      { value: 'Technical and Scientific Equipment', label: 'Technical and Scientific Equipment' },
      { value: 'Sports Equipment', label: 'Sports Equipment' }
    ];
  };

  const getLegendOptions = () => {
    return [
      { value: 'Office Equipment', label: 'Office Equipment' },
      { value: 'IT Equipment', label: 'IT Equipment' },
      { value: 'Motor Vehicle', label: 'Motor Vehicle' },
      { value: 'Furniture', label: 'Furniture' }
    ];
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
            Basic information about the {type.toUpperCase()} asset
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="propertyNumber">
                {type === 'ppe' ? 'Property Number' : 'SE Property Number'} *
              </Label>
              <Input
                id="propertyNumber"
                value={type === 'ppe' ? formData.propertyNumber : formData.se_property_number}
                onChange={(e) => handleInputChange(type === 'ppe' ? 'propertyNumber' : 'se_property_number', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {getCategoryOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {type === 'ppe' && (
              <div className="space-y-2">
                <Label htmlFor="legend">Legend</Label>
                <Select
                  value={formData.legend}
                  onValueChange={(value) => handleInputChange('legend', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select legend" />
                  </SelectTrigger>
                  <SelectContent>
                    {getLegendOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                value={type === 'ppe' ? formData.serialNumber : formData.serial_number}
                onChange={(e) => handleInputChange(type === 'ppe' ? 'serialNumber' : 'serial_number', e.target.value)}
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
              {formData.parts.map((part: any, index: number) => (
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {type === 'ppe' && (
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
            )}

            <div className="space-y-2">
              <Label htmlFor="unitValue">Unit Value *</Label>
              <Input
                id="unitValue"
                type="number"
                step="0.01"
                value={type === 'ppe' ? formData.unitValue : formData.unit_value}
                onChange={(e) => handleInputChange(type === 'ppe' ? 'unitValue' : 'unit_value', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateAcquired">Date Acquired *</Label>
              <Input
                id="dateAcquired"
                type="date"
                value={type === 'ppe' ? formData.dateAcquired : formData.date_acquired}
                onChange={(e) => handleInputChange(type === 'ppe' ? 'dateAcquired' : 'date_acquired', e.target.value)}
                required
              />
            </div>

            {type === 'ppe' && (
              <div className="space-y-2">
                <Label htmlFor="estimatedUsefulLife">Estimated Useful Life (years)</Label>
                <Input
                  id="estimatedUsefulLife"
                  type="number"
                  value={formData.estimatedUsefulLife}
                  onChange={(e) => handleInputChange('estimatedUsefulLife', parseInt(e.target.value) || 5)}
                />
              </div>
            )}
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
                      value={entry.plantillaEmployeeId}
                      onChange={(e) => handleAccountabilityEntryChange(index, 'plantillaEmployeeId', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`nonPlantillaEmployeeId-${index}`}>Non-Plantilla Employee ID</Label>
                    <Input
                      id={`nonPlantillaEmployeeId-${index}`}
                      value={entry.nonPlantillaEmployeeId}
                      onChange={(e) => handleAccountabilityEntryChange(index, 'nonPlantillaEmployeeId', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`actualOffice-${index}`}>Office</Label>
                    <Select
                      value={entry.actualOfficeId}
                      onValueChange={(value) => handleAccountabilityEntryChange(index, 'actualOfficeId', value)}
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
                      value={entry.actualDivisionId}
                      onValueChange={(value) => handleAccountabilityEntryChange(index, 'actualDivisionId', value)}
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
                        {type === 'se' && <SelectItem value="Unserviceable">Unserviceable</SelectItem>}
                        {type === 'ppe' && (
                          <>
                            <SelectItem value="IIRUP">IIRUP</SelectItem>
                            <SelectItem value="Disposed">Disposed</SelectItem>
                            <SelectItem value="Missing">Missing</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {type === 'se' && (
            <div className="mt-6 space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Returned">Returned</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                  <SelectItem value="Unserviceable">Unserviceable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditing ? 'Update' : 'Create'} {type.toUpperCase()} Asset
        </Button>
      </div>
    </form>
  );
}
