import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Package, DollarSign, User } from 'lucide-react';
import { PPEAsset } from '@/types/asset/ppe';

interface PPEFormProps {
  ppeAsset?: PPEAsset;
  onSubmit: (data: Omit<PPEAsset, 'id' | 'dateEncoded'>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function PPEForm({ ppeAsset, onSubmit, onCancel, isEditing = false }: PPEFormProps) {
  const [formData, setFormData] = useState({
    property_number: ppeAsset?.property_number || '',
    category: ppeAsset?.category || '',
    legend: ppeAsset?.legend || '',
    description: ppeAsset?.description || '',
    brand: ppeAsset?.brand || '',
    model: ppeAsset?.model || '',
    serial_number: ppeAsset?.serial_number || '',
    parts: ppeAsset?.parts || '',
    unit_of_measurement: ppeAsset?.unit_of_measurement || 'unit',
    unit_value: ppeAsset?.unit_value || 0,
    date_acquired: ppeAsset?.date_acquired || '',
    estimated_useful_life: ppeAsset?.estimated_useful_life || 5,
    date: new Date().toISOString().split('T')[0],
    par_itr_number: ppeAsset?.par_itr_number || '',
    plantilla_employee_id: ppeAsset?.plantilla_employee_id || '',
    non_plantilla_employee_id: ppeAsset?.non_plantilla_employee_id || '',
    actual_division: ppeAsset?.actual_division || '',
    condition: ppeAsset?.condition || 'Working',
    history: ppeAsset?.history || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.property_number || !formData.description || !formData.serial_number || !formData.date_acquired) {
      alert('Please fill in all required fields (Property Number, Description, Serial Number, Date Acquired)');
      return;
    }

    onSubmit(formData);
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
                id="property_number"
                value={formData.property_number}
                onChange={(e) => setFormData(prev => ({ ...prev, property_number: e.target.value }))}
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
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
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
                value={formData.parts}
                onChange={(e) => setFormData(prev => ({ ...prev, parts: e.target.value }))}
                placeholder="Component parts"
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
              <Select value={formData.unit_of_measurement} onValueChange={(value) => setFormData(prev => ({ ...prev, unit_of_measurement: value }))}>
                <SelectTrigger id="unit_of_measurement">
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
                id="unit_value"
                type="number"
                step="0.01"
                value={formData.unit_value}
                onChange={(e) => setFormData(prev => ({ ...prev, unit_value: parseFloat(e.target.value) || 0 }))}
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
                id="date_acquired"
                type="date"
                value={formData.date_acquired}
                onChange={(e) => setFormData(prev => ({ ...prev, date_acquired: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_useful_life">Estimated Useful Life (Years)</Label>
              <Input
                id="estimated_useful_life"
                type="number"
                value={formData.estimated_useful_life}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_useful_life: parseInt(e.target.value) || 5 }))}
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
                id="par_itr_number"
                value={formData.par_itr_number}
                onChange={(e) => setFormData(prev => ({ ...prev, par_itr_number: e.target.value }))}
                placeholder="PAR-2024-0001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual_division">Actual Division</Label>
              <Select value={formData.actual_division} onValueChange={(value) => setFormData(prev => ({ ...prev, actual_division: value }))}>
                <SelectTrigger id="actual_division">
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
                id="plantilla_employee_id"
                value={formData.plantilla_employee_id}
                onChange={(e) => setFormData(prev => ({ ...prev, plantilla_employee_id: e.target.value }))}
                placeholder="Employee ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="non_plantilla_employee_id">Non-Plantilla Employee ID</Label>
              <Input
                id="non_plantilla_employee_id"
                value={formData.non_plantilla_employee_id}
                onChange={(e) => setFormData(prev => ({ ...prev, non_plantilla_employee_id: e.target.value }))}
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


