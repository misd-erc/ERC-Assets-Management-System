import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Package, DollarSign, User, Plus, X, Calendar } from 'lucide-react';
import { SEAsset, SEAccountabilityBlock } from '@/types/supply/se';

interface SEFormProps {
  seAsset?: SEAsset;
  onSubmit: (data: Omit<SEAsset, 'id' | 'dateEncoded' | 'movementHistory' | 'rrspHistory'>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function SEForm({ seAsset, onSubmit, onCancel, isEditing = false }: SEFormProps) {
  const [formData, setFormData] = useState({
    se_property_number: seAsset?.se_property_number || '',
    category: seAsset?.category || '',
    legend: seAsset?.legend || '',
    description: seAsset?.description || '',
    brand: seAsset?.brand || '',
    model: seAsset?.model || '',
    serial_number: seAsset?.serial_number || '',
    parts_accessories: seAsset?.parts_accessories || '',
    unit_of_measurement: seAsset?.unit_of_measurement || 'unit',
    unit_value: seAsset?.unit_value || 0,
    date_acquired: seAsset?.date_acquired || '',
    warranty_status: seAsset?.warranty_status || 'Unknown',
    accountabilityBlocks: seAsset?.accountabilityBlocks || [],
    status: seAsset?.status || 'Active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.se_property_number || !formData.description) {
      alert('Please fill in all required fields (SE Property Number, Description)');
      return;
    }

    // Validate unit value is below 50,000
    if (formData.unit_value >= 50000) {
      alert('Unit value for Semi-Expendable must be below â‚±50,000');
      return;
    }

    // Validate date is not in the future
    const acquiredDate = new Date(formData.date_acquired);
    if (acquiredDate > new Date()) {
      alert('Date acquired cannot be in the future');
      return;
    }

    // Validate current holder exists
    const currentBlock = formData.accountabilityBlocks.find(b => b.label === 'Current Holder');
    if (!currentBlock || (!currentBlock.plantilla_employee_id && !currentBlock.non_plantilla_employee_id)) {
      alert('Current holder information is required');
      return;
    }

    onSubmit(formData);
  };

  const addAccountabilityBlock = () => {
    const newBlock: SEAccountabilityBlock = {
      id: Date.now().toString(),
      itr_rrsp_number: '',
      plantilla_employee_id: '',
      non_plantilla_employee_id: '',
      division_section: '',
      condition: 'Working',
      date_issued_returned: new Date().toISOString().split('T')[0],
      remarks: '',
      label: 'Previous Holder',
      type: 'ITR'
    };

    setFormData(prev => ({
      ...prev,
      accountabilityBlocks: [...prev.accountabilityBlocks, newBlock]
    }));
  };

  const removeAccountabilityBlock = (id: string) => {
    setFormData(prev => ({
      ...prev,
      accountabilityBlocks: prev.accountabilityBlocks.filter(b => b.id !== id)
    }));
  };

  const updateAccountabilityBlock = (id: string, updates: Partial<SEAccountabilityBlock>) => {
    setFormData(prev => ({
      ...prev,
      accountabilityBlocks: prev.accountabilityBlocks.map(b =>
        b.id === id ? { ...b, ...updates } : b
      )
    }));
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
              <Label htmlFor="se_property_number">
                SE Property Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="se_property_number"
                value={formData.se_property_number}
                onChange={(e) => setFormData(prev => ({ ...prev, se_property_number: e.target.value }))}
                placeholder="e.g., SE-2024-0001"
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
                  <SelectItem value="Furniture">Furniture</SelectItem>
                  <SelectItem value="Tools">Tools</SelectItem>
                  <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                  <SelectItem value="Linen">Linen</SelectItem>
                  <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                  <SelectItem value="Communication Equipment">Communication Equipment</SelectItem>
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
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                placeholder="Serial/identification number"
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
              <Label htmlFor="parts_accessories">Parts/Accessories</Label>
              <Input
                id="parts_accessories"
                value={formData.parts_accessories}
                onChange={(e) => setFormData(prev => ({ ...prev, parts_accessories: e.target.value }))}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                max="49999.99"
              />
              <p className="text-xs text-slate-500">Must be below â‚±50,000</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty_status">Warranty Status</Label>
              <Select value={formData.warranty_status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, warranty_status: value }))}>
                <SelectTrigger id="warranty_status">
                  <SelectValue placeholder="Select warranty status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="In Warranty">In Warranty</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
        </CardContent>
      </Card>

      {/* C. Accountability Blocks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5 text-blue-600" />
            Accountability History
          </CardTitle>
          <CardDescription>Track assignment and transfer history</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.accountabilityBlocks.map((block, index) => (
            <div key={block.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={block.label === 'Current Holder' ? 'default' : 'secondary'}>
                    {block.label}
                  </Badge>
                  {block.type && (
                    <Badge variant="outline">{block.type}</Badge>
                  )}
                </div>
                {block.label !== 'Current Holder' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAccountabilityBlock(block.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ITR/RRSP Number</Label>
                  <Input
                    value={block.itr_rrsp_number}
                    onChange={(e) => updateAccountabilityBlock(block.id, { itr_rrsp_number: e.target.value })}
                    placeholder="Document number"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Plantilla Employee ID</Label>
                  <Input
                    value={block.plantilla_employee_id}
                    onChange={(e) => updateAccountabilityBlock(block.id, { plantilla_employee_id: e.target.value })}
                    placeholder="Employee ID"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Non-Plantilla Employee ID</Label>
                  <Input
                    value={block.non_plantilla_employee_id}
                    onChange={(e) => updateAccountabilityBlock(block.id, { non_plantilla_employee_id: e.target.value })}
                    placeholder="Employee ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Division/Section</Label>
                  <Select
                    value={block.division_section}
                    onValueChange={(value) => updateAccountabilityBlock(block.id, { division_section: value })}
                  >
                    <SelectTrigger>
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
                  <Label>Condition</Label>
                  <Select
                    value={block.condition}
                    onValueChange={(value: any) => updateAccountabilityBlock(block.id, { condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Working">Working</SelectItem>
                      <SelectItem value="Not Working">Not Working</SelectItem>
                      <SelectItem value="For Repair">For Repair</SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
                      <SelectItem value="Unserviceable">Unserviceable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Issued/Returned</Label>
                  <Input
                    type="date"
                    value={block.date_issued_returned}
                    onChange={(e) => updateAccountabilityBlock(block.id, { date_issued_returned: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  value={block.remarks}
                  onChange={(e) => updateAccountabilityBlock(block.id, { remarks: e.target.value })}
                  placeholder="Additional remarks"
                  rows={2}
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addAccountabilityBlock}
            className="w-full gap-2"
          >
            <Plus className="size-4" />
            Add Accountability Entry
          </Button>
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
          {isEditing ? 'Update SE Asset' : 'Add SE Asset'}
        </Button>
      </div>
    </form>
  );
}


