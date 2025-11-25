import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Package, DollarSign, User } from 'lucide-react';
import { PPEAsset } from '@/types/asset/PPEAsset';

interface PPEFormProps {
  ppeAsset?: PPEAsset;
  onSubmit: (data: Omit<PPEAsset, 'id' | 'dateEncoded'>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function PPEForm({ ppeAsset, onSubmit, onCancel, isEditing = false }: PPEFormProps) {
  const [formData, setFormData] = useState({
    propertyNumber: ppeAsset?.propertyNumber || '',
    category: ppeAsset?.category || '',
    legend: ppeAsset?.legend || '',
    description: ppeAsset?.description || '',
    brand: ppeAsset?.brand || '',
    model: ppeAsset?.model || '',
    serialNumber: ppeAsset?.serialNumber || '',
    parts: ppeAsset?.parts || [],
    unitOfMeasurement: ppeAsset?.unitOfMeasurement || 'unit',
    unitValue: ppeAsset?.unitValue || 0,
    dateAcquired: ppeAsset?.dateAcquired || '',
    estimatedUsefulLife: ppeAsset?.estimatedUsefulLife || 5,
    date: new Date().toISOString().split('T')[0],
    parItrNumber: ppeAsset?.parItrNumber || '',
    plantillaEmployeeId: ppeAsset?.plantillaEmployeeId || '',
    nonPlantillaEmployeeId: ppeAsset?.nonPlantillaEmployeeId || '',
    actualDivision: ppeAsset?.actualDivision || '',
    condition: ppeAsset?.condition || 'Working',
    history: ppeAsset?.history || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.propertyNumber || !formData.description || !formData.serialNumber || !formData.dateAcquired) {
      alert('Please fill in all required fields (Property Number, Description, Serial Number, Date Acquired)');
      return;
    }

    onSubmit({
      ...formData,
      movements: ppeAsset?.movements || [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* A. Item Identification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5 text-blue-600" />
            Item Identification
          </CardTitle>
          <CardDescription>Basic identification and classification details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property_number">
                Property Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="propertyNumber"
                value={formData.propertyNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, propertyNumber: e.target.value }))}
                placeholder="e.g., PPE-2024-0001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ICT Equipment">ICT Equipment</SelectItem>
                  <SelectItem value="Office Equipment">Office Equipment</SelectItem>
                  <SelectItem value="Motor Vehicle">Motor Vehicle</SelectItem>
                  <SelectItem value="Furniture and Fixtures">Furniture and Fixtures</SelectItem>
                  <SelectItem value="Communication Equipment">Communication Equipment</SelectItem>
                  <SelectItem value="Technical and Scientific Equipment">Technical and Scientific Equipment</SelectItem>
                  <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="legend">Legend</Label>
              <Select value={formData.legend} onValueChange={(value) => setFormData(prev => ({ ...prev, legend: value }))}>
                <SelectTrigger id="legend">
                  <SelectValue placeholder="Select legend" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A - Administrative</SelectItem>
                  <SelectItem value="B">B - Building</SelectItem>
                  <SelectItem value="C">C - Communication</SelectItem>
                  <SelectItem value="F">F - Furniture</SelectItem>
                  <SelectItem value="I">I - IT Equipment</SelectItem>
                  <SelectItem value="M">M - Motor Vehicle</SelectItem>
                  <SelectItem value="O">O - Office Equipment</SelectItem>
                  <SelectItem value="T">T - Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serial_number">
                Serial Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                placeholder="Serial/identification number"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the asset"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="Brand/manufacturer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                placeholder="Model number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parts">Parts</Label>
              <Input
                id="parts"
                value={Array.isArray(formData.parts) ? formData.parts.join(', ') : formData.parts}
                onChange={(e) => setFormData(prev => ({ ...prev, parts: e.target.value.split(',').map(p => p.trim()) }))}
                placeholder="Component parts (comma separated)"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* B. Classification Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="size-5 text-blue-600" />
            Classification Details
          </CardTitle>
          <CardDescription>Financial and lifecycle information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit_of_measurement">Unit of Measurement</Label>
              <Select value={formData.unitOfMeasurement} onValueChange={(value) => setFormData(prev => ({ ...prev, unitOfMeasurement: value }))}>
                <SelectTrigger id="unitOfMeasurement">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit">Unit</SelectItem>
                  <SelectItem value="set">Set</SelectItem>
                  <SelectItem value="piece">Piece</SelectItem>
                  <SelectItem value="lot">Lot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_value">Unit Value (â‚±)</Label>
              <Input
                id="unitValue"
                type="number"
                step="0.01"
                value={formData.unitValue}
                onChange={(e) => setFormData(prev => ({ ...prev, unitValue: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_acquired">
                Date Acquired <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateAcquired"
                type="date"
                value={formData.dateAcquired}
                onChange={(e) => setFormData(prev => ({ ...prev, dateAcquired: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_useful_life">Estimated Useful Life (Years)</Label>
              <Input
                id="estimatedUsefulLife"
                type="number"
                value={formData.estimatedUsefulLife}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedUsefulLife: parseInt(e.target.value) || 5 }))}
                placeholder="5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* C. Accountability Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5 text-blue-600" />
            Accountability Section
          </CardTitle>
          <CardDescription>Assignment and responsibility details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="par_itr_number">PAR/ITR Number</Label>
              <Input
                id="parItrNumber"
                value={formData.parItrNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, parItrNumber: e.target.value }))}
                placeholder="PAR-2024-0001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual_division">Actual Division</Label>
              <Select value={formData.actualDivision} onValueChange={(value) => setFormData(prev => ({ ...prev, actualDivision: value }))}>
                <SelectTrigger id="actualDivision">
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Office of the Chairman and CEO">Office of the Chairman and CEO</SelectItem>
                  <SelectItem value="Legal Service">Legal Service</SelectItem>
                  <SelectItem value="Administrative Service">Administrative Service</SelectItem>
                  <SelectItem value="Finance Service">Finance Service</SelectItem>
                  <SelectItem value="Technical Service">Technical Service</SelectItem>
                  <SelectItem value="Planning and Policy Service">Planning and Policy Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plantilla_employee_id">Plantilla Employee ID</Label>
              <Input
                id="plantillaEmployeeId"
                value={formData.plantillaEmployeeId}
                onChange={(e) => setFormData(prev => ({ ...prev, plantillaEmployeeId: e.target.value }))}
                placeholder="Employee ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="non_plantilla_employee_id">Non-Plantilla Employee ID</Label>
              <Input
                id="nonPlantillaEmployeeId"
                value={formData.nonPlantillaEmployeeId}
                onChange={(e) => setFormData(prev => ({ ...prev, nonPlantillaEmployeeId: e.target.value }))}
                placeholder="Employee ID"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select value={formData.condition} onValueChange={(value: any) => setFormData(prev => ({ ...prev, condition: value }))}>
                <SelectTrigger id="condition">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Working">Working</SelectItem>
                  <SelectItem value="Not Working">Not Working</SelectItem>
                  <SelectItem value="IIRUP">IIRUP (Issued for Repair Under Process)</SelectItem>
                  <SelectItem value="Disposed">Disposed</SelectItem>
                  <SelectItem value="Missing">Missing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          {isEditing ? 'Update PPE Asset' : 'Add PPE Asset'}
        </Button>
      </div>
    </form>
  );
}


