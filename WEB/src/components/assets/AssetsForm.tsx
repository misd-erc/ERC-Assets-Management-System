import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Package, DollarSign, User } from 'lucide-react';
import { PPEAsset } from '@/types/asset/PPEAsset';
import { SEAsset } from '@/types/supply/se';
import { AssetType } from '@/services/assetService';

interface AssetsFormProps {
  type: AssetType;
  asset?: PPEAsset | SEAsset;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function AssetsForm({ type, asset, onSubmit, onCancel, isEditing = false }: AssetsFormProps) {
  const [formData, setFormData] = useState<any>({
    // Common fields
    category: '',
    description: '',
    brand: '',
    model: '',
    condition: 'Working',

    // PPE specific fields
    propertyNumber: '',
    legend: '',
    serialNumber: '',
    parts: [],
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
          parts: Array.isArray(ppeAsset.parts) ? ppeAsset.parts : [],
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
        });
      }
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
        movements: [{
          parItrNumber: formData.parItrNumber,
          plantillaEmployeeIdOriginal: formData.plantillaEmployeeId,
          nonPlantillaEmployeeIdOriginal: formData.nonPlantillaEmployeeId,
          division: { name: formData.actualDivision },
          condition: formData.condition,
          dateAssigned: new Date().toISOString(),
        }],
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
        accountabilityBlocks: [{
          plantilla_employee_id: formData.plantillaEmployeeId || null,
          non_plantilla_employee_id: formData.nonPlantillaEmployeeId || null,
          division_section: formData.actualDivision || '',
          condition: formData.condition || 'Working',
          date_assigned: new Date().toISOString(),
        }],
      };

      onSubmit(submitData);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
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
    <form onSubmit={handleSubmit} className="space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <CardTitle className="flex items-center gap-2">
            <User className="size-5 text-blue-600" />
            Accountability Information
          </CardTitle>
          <CardDescription>
            Current assignment and responsibility details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plantillaEmployeeId">Plantilla Employee ID</Label>
              <Input
                id="plantillaEmployeeId"
                value={formData.plantillaEmployeeId}
                onChange={(e) => handleInputChange('plantillaEmployeeId', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nonPlantillaEmployeeId">Non-Plantilla Employee ID</Label>
              <Input
                id="nonPlantillaEmployeeId"
                value={formData.nonPlantillaEmployeeId}
                onChange={(e) => handleInputChange('nonPlantillaEmployeeId', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actualDivision">Division/Section</Label>
              <Input
                id="actualDivision"
                value={formData.actualDivision}
                onChange={(e) => handleInputChange('actualDivision', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => handleInputChange('condition', value)}
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

            {type === 'se' && (
              <div className="space-y-2">
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
          </div>
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
