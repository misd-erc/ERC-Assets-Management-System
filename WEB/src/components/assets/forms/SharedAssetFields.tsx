import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Package, DollarSign, User, Plus, X, RotateCcw } from 'lucide-react';
import ReactSelect from 'react-select';
import { FormAsset, UnifiedMovement, NormalizedEmployee, Part } from '@/types/asset/UnifiedAsset';
import { VwOffice, VwDivision } from '@/types/office';


interface SharedAssetFieldsProps {
  mode: 'create' | 'edit';
  formData: FormAsset;
  setFormData: React.Dispatch<React.SetStateAction<FormAsset>>;
  accountabilityEntries: UnifiedMovement[];
  setAccountabilityEntries: React.Dispatch<React.SetStateAction<UnifiedMovement[]>>;
  handlePlantillaEmployeeSelect: (index: number, employeeId: number) => void;
  handleNonPlantillaEmployeeSelect: (index: number, employeeId: number) => void;
  employees: NormalizedEmployee[];
  categories: { id: number; name: string }[];
  legends: { id: number; name: string; description?: string }[];
  offices: VwOffice[];
  divisions: VwDivision[];
  handleInputChange: (field: string, value: any) => void;
  handlePartChange: (index: number, field: string, value: string) => void;
  handleAddPart: () => void;
  handleRemovePart: (index: number) => void;
  handleAddAccountabilityEntry: () => void;
  handleRemoveAccountabilityEntry: (index: number) => void;
  handleRestoreAccountabilityEntry?: (index: number) => void;
  handleAccountabilityEntryChange: (index: number, field: string, value: any) => void;
  getUnitOfMeasurementOptions: () => { value: string; label: string }[];
  showAccountabilitySection?: boolean;
  onToggleAccountabilitySection?: () => void;
}

export function SharedAssetFields({
  mode,
  formData,
  setFormData,
  accountabilityEntries,
  setAccountabilityEntries,
  handlePlantillaEmployeeSelect,
  handleNonPlantillaEmployeeSelect,
  employees,
  categories,
  legends,
  offices,
  divisions,
  handleInputChange,
  handlePartChange,
  handleAddPart,
  handleRemovePart,
  handleAddAccountabilityEntry,
  handleRemoveAccountabilityEntry,
  handleRestoreAccountabilityEntry,
  handleAccountabilityEntryChange,
  getUnitOfMeasurementOptions,
  showAccountabilitySection,
  onToggleAccountabilitySection,
}: SharedAssetFieldsProps) {
  const plantillaEmployeeOptions = employees.filter(emp => emp.id != null && emp.employmentTypeId === 1).map(emp => ({ value: emp.id.toString(), label: emp.label }));
  const nonPlantillaEmployeeOptions = employees.filter(emp => emp.id != null && emp.employmentTypeId !== 1).map(emp => ({ value: emp.id.toString(), label: emp.label }));

  // Convert a UTC ISO string to "YYYY-MM-DDTHH:mm" in local time (for datetime-local inputs)
  const toLocalDatetimeInput = (utcString: string) => {
    // Force UTC parsing if the string has no timezone marker (ASP.NET may omit the 'Z')
    const normalized = /Z|[+-]\d{2}:\d{2}$/.test(utcString) ? utcString : utcString + 'Z';
    const d = new Date(normalized);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <>
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
                required={mode === 'create'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.categoryId?.toString() ?? undefined}
                onValueChange={(value) => handleInputChange('categoryId', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="legend">Legend</Label>
              <Select
                value={formData.legendId?.toString() ?? undefined}
                onValueChange={(value) => handleInputChange('legendId', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select legend" />
                </SelectTrigger>
                <SelectContent>
                  {legends.map(legend => (
                    <SelectItem key={legend.id} value={legend.id.toString()}>
                      <span>{legend.name}</span>
                      {legend.description && (
                        <span className="ml-2 text-xs text-slate-400">{legend.description}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number *</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber || ''}
                onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                required={mode === 'create'}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required={mode === 'create'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                value={formData.brand || ''}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                required={mode === 'create'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={formData.model || ''}
                onChange={(e) => handleInputChange('model', e.target.value)}
                required={mode === 'create'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscalDate">Fiscal Date</Label>
              <Input
                id="fiscalDate"
                type="date"
                value={formData.fiscalDate || ''}
                onChange={(e) => handleInputChange('fiscalDate', e.target.value)}
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
              <Label htmlFor="unitOfMeasurement">Unit of Measurement *</Label>
              <Select
                value={formData.unitOfMeasurement}
                onValueChange={(value) => handleInputChange('unitOfMeasurement', value)}
                required={mode === 'create'}
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
                required={mode === 'create'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateAcquired">Date Acquired *</Label>
              <Input
                id="dateAcquired"
                type="date"
                value={formData.dateAcquired ? new Date(formData.dateAcquired).toISOString().split('T')[0] : ''}
                onChange={(e) => handleInputChange('dateAcquired', e.target.value)}
                required={mode === 'create'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedUsefulLife">Estimated Useful Life (years) *</Label>
              <Input
                id="estimatedUsefulLife"
                type="number"
                value={formData.estimatedUsefulLife ?? ''}
                onChange={(e) => handleInputChange('estimatedUsefulLife', parseInt(e.target.value) || 5)}
                required={mode === 'create'}
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
            <div className="flex items-center gap-2">
              {onToggleAccountabilitySection && (
                // In edit mode: only show the button when section is hidden (to expand it)
                // In create mode: show both expand and collapse states
                (!showAccountabilitySection || mode === 'create') && (
                  <Button
                    type="button"
                    variant={showAccountabilitySection ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={onToggleAccountabilitySection}
                  >
                    {showAccountabilitySection ? (
                      <><X className="size-4 mr-1" /> Remove</>
                    ) : (
                      <><Plus className="size-4 mr-1" /> Add Accountability</>
                    )}
                  </Button>
                )
              )}
              {(showAccountabilitySection === undefined || showAccountabilitySection) && (
                <Button type="button" variant="outline" size="sm" onClick={handleAddAccountabilityEntry}>
                  <Plus className="size-4 mr-2" />
                  Add Entry
                </Button>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            {!showAccountabilitySection
              ? 'Optional — add accountability info only if the item already has an assigned holder.'
              : 'Current assignment and responsibility details (multiple entries for movement history)'}
          </CardDescription>
        </CardHeader>
        {(showAccountabilitySection === undefined || showAccountabilitySection) && (
          <CardContent>
          <div className="space-y-6">
            {accountabilityEntries.map((entry, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${
                  entry.isActive === false
                    ? 'bg-red-50 border-red-200 opacity-60'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">
                      {index === 0 ? 'Current Holder' : `Previous Holder ${index}`}
                    </h4>
                    {entry.isActive === false && (
                      <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                        Deleted
                      </span>
                    )}
                  </div>
                  {entry.isActive === false ? (
                    handleRestoreAccountabilityEntry && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreAccountabilityEntry(index)}
                        className="text-green-600 hover:text-green-700 border-green-400"
                      >
                        <RotateCcw className="size-4 mr-1" /> Restore
                      </Button>
                    )
                  ) : (
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
                <fieldset disabled={entry.isActive === false} className="contents">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor={`dateAssigned-${index}`}>Date Assigned *</Label>
                    <Input
                      id={`dateAssigned-${index}`}
                      type="date"
                      value={entry.dateAssigned ? toLocalDatetimeInput(entry.dateAssigned).split('T')[0] : ''}
                      onChange={(e) => handleAccountabilityEntryChange(index, 'dateAssigned', new Date(e.target.value).toISOString())}
                      required={mode === 'create'}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 md:col-span-1">
                    <div className="space-y-2">
                      <Label htmlFor={`ptrItrNumber-${index}`}>PTR/ITR Number *</Label>
                      <Input
                        id={`ptrItrNumber-${index}`}
                        value={entry.ptrItrNumber}
                        onChange={(e) => handleAccountabilityEntryChange(index, 'ptrItrNumber', e.target.value)}
                        required={mode === 'create'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`parIcsNumber-${index}`}>PAR/ICS Number *</Label>
                      <Input
                        id={`parIcsNumber-${index}`}
                        value={entry.parIcsNumber}
                        onChange={(e) => handleAccountabilityEntryChange(index, 'parIcsNumber', e.target.value)}
                        required={mode === 'create'}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor={`rrppeRrspNumber-${index}`}>RRPPE/RRSP Number</Label>
                    <Input
                      id={`rrppeRrspNumber-${index}`}
                      value={entry.rrppeRrspNumber ?? ''}
                      onChange={(e) => handleAccountabilityEntryChange(index, 'rrppeRrspNumber', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 md:col-span-2">
                    <div className="flex flex-col gap-2">
                      <Label>Accountable Employee (Plantilla) *</Label>
                      <ReactSelect
                        options={plantillaEmployeeOptions}
                        value={plantillaEmployeeOptions.find(option =>
                          option.value === String(entry.plantillaEmployeeId)
                        ) || null}
                        onChange={(selected) => {
                          if (selected) {
                            handlePlantillaEmployeeSelect(index, parseInt(selected.value));
                          } else {
                            handlePlantillaEmployeeSelect(index, 0);
                          }
                        }}
                        placeholder="Select plantilla employee"
                        isClearable
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Sub Accountable Employee (Non-Plantilla)</Label>
                      <ReactSelect
                        options={nonPlantillaEmployeeOptions}
                        value={nonPlantillaEmployeeOptions.find(option =>
                          option.value === String(entry.nonPlantillaEmployeeId)
                        ) || null}
                        onChange={(selected) => {
                          if (selected) {
                            handleNonPlantillaEmployeeSelect(index, parseInt(selected.value));
                          } else {
                            handleNonPlantillaEmployeeSelect(index, 0);
                          }
                        }}
                        placeholder="Select non-plantilla employee"
                        isClearable
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 md:col-span-2">
                    <div className="space-y-2">
                      <Label htmlFor={`actualOffice-${index}`}>Office *</Label>
                      <Select
                        value={entry.actualOfficeId?.toString() ?? ''}
                        onValueChange={(value) => {
                          handleAccountabilityEntryChange(index, 'actualOfficeId', parseInt(value));
                          handleAccountabilityEntryChange(index, 'actualDivisionId', 0);
                        }}
                        required={mode === 'create'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select office" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {offices.map(office => (
                            <SelectItem key={office.id} value={office.id.toString()}>
                              {office.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`actualDivision-${index}`}>Division *</Label>
                      <Select
                        value={entry.actualDivisionId?.toString() ?? ''}
                        onValueChange={(value) => {
                          handleAccountabilityEntryChange(index, 'actualDivisionId', parseInt(value));
                        }}
                        required={mode === 'create'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select division" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {divisions
                            .filter(d => !entry.actualOfficeId || d.office?.id === entry.actualOfficeId)
                            .map(division => (
                              <SelectItem key={division.id} value={division.id.toString()}>
                                {division.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`condition-${index}`}>Condition *</Label>
                    <Select
                      value={entry.condition}
                      onValueChange={(value) => handleAccountabilityEntryChange(index, 'condition', value)}
                      required={mode === 'create'}
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
                </fieldset>
              </div>
            ))}
          </div>
        </CardContent>
        )}
      </Card>
    </>
  );
}
