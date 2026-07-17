import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeSelector } from './EmployeeSelector';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle, CheckCircle, ChevronRight, ChevronLeft, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  editMovementBulk,
  generateReturnNumber,
  getAssetsByEmployee,
} from '@/api/asset/transferApi';
import { getEmployees } from '@/api/user-management/userApi';
import { getOffices } from '@/api/office-management/officeApi';
import { getDivisions } from '@/api/office-management/divisionApi';
import { getConditions } from '@/api/asset/inventoryApi';
import { ApiEmployee } from '@/types/transfer';
import { VwOffice, VwDivision } from '@/types';

interface ReturnFormProps {
  isOpen: boolean;
  onClose: () => void;
  returnType: 'RRPPE' | 'RRSP'; // RRPPE for PPE, RRSP for SE
  onSuccess?: () => void;
}

type Step = 'from-employee' | 'select-items-and-condition' | 'confirm';

// Fixed return recipient (Cherry Lynn S. Gonzales, ID: 521)
const FIXED_RETURN_RECIPIENT = {
  id: 521,
  name: 'Cherry Lynn S. Gonzales',
  employmentType: 'Plantilla',
  office: 'Financial Administrative Service (FAS)',
  division: 'General Services Division (GSD)',
};

export function ReturnForm({ isOpen, onClose, returnType, onSuccess }: ReturnFormProps) {
  // Step Management
  const [currentStep, setCurrentStep] = useState<Step>('from-employee');

  // Form State
  const [fromEmployee, setFromEmployee] = useState<ApiEmployee | null>(null);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: { selected: boolean; condition: string } }>({});
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // Generated number (editable before final save)
  const [generatedReturnNumber, setGeneratedReturnNumber] = useState('');

  // Data Loading States
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [employeeItems, setEmployeeItems] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [offices, setOffices] = useState<VwOffice[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [divisions, setDivisions] = useState<VwDivision[]>([]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [conditions, setConditions] = useState<string[]>([]);

  const groupName = returnType === 'RRPPE' ? 'PPE' : 'SE';

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('from-employee');
      setFromEmployee(null);
      setSelectedItems({});
      setItemSearchQuery('');
      setGeneratedReturnNumber('');
      setError(null);
      setSuccess(false);
      setLoading(false);
      setItemsLoading(false);
    }
  }, [isOpen]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true);
        setError(null);

        const empResponse = await getEmployees();
        setEmployees(empResponse.data?.items || []);

        const officesData = await getOffices();
        setOffices(officesData || []);

        const divisionsData = await getDivisions();
        setDivisions(divisionsData || []);

        const conditionsData = await getConditions();
        setConditions(conditionsData || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load data';
        setError(message);
        toast.error(message);
      } finally {
        setDataLoading(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Load items when fromEmployee changes
  useEffect(() => {
    const loadItems = async () => {
      if (!fromEmployee) {
        setEmployeeItems([]);
        setSelectedItems({});
        return;
      }

      try {
        setItemsLoading(true);
        setError(null);

        const items = await getAssetsByEmployee(fromEmployee.id, groupName);
        const validItems = items.filter((item: any) => item && item.id);
        setEmployeeItems(validItems);
        setSelectedItems({});
        setItemSearchQuery('');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load employee items';
        setError(message);
        toast.error(message);
        setEmployeeItems([]);
      } finally {
        setItemsLoading(false);
      }
    };

    loadItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromEmployee]);

  const handleEmployeeSelect = (employeeId: number) => {
    const emp = employees.find(e => e.id === employeeId);
    setFromEmployee(emp || null);
  };

  const handleItemChange = (itemId: string, selected?: boolean, condition?: string) => {
    setSelectedItems((prev) => {
      const current = prev[itemId] || { selected: false, condition: 'Good' };
      return {
        ...prev,
        [itemId]: {
          selected: selected !== undefined ? selected : current.selected,
          condition: condition !== undefined ? condition : current.condition,
        },
      };
    });
  };

  const handleNext = () => {
    if (!fromEmployee) {
      toast.error('Please select an employee');
      return;
    }
    if (employeeItems.length === 0) {
      toast.error('No items available for this employee');
      return;
    }
    setCurrentStep('select-items-and-condition');
  };

  const handleBack = () => {
    if (currentStep === 'select-items-and-condition') setCurrentStep('from-employee');
    else if (currentStep === 'confirm') setCurrentStep('select-items-and-condition');
  };

  // Generate return number then advance to confirm step
  const handleGenerateAndConfirm = async () => {
    const selectedItemIds = Object.entries(selectedItems)
      .filter(([, data]) => data.selected)
      .map(([itemId]) => itemId);

    if (selectedItemIds.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const returnNumber = await generateReturnNumber(returnType);
      setGeneratedReturnNumber(returnNumber);
      setCurrentStep('confirm');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate return number';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Final save using the (possibly edited) generated number
  const handleFinalSave = async () => {
    if (!fromEmployee) {
      toast.error('Please select an employee');
      return;
    }

    if (!generatedReturnNumber.trim()) {
      toast.error('Return number cannot be empty');
      return;
    }

    const selectedItemIds = Object.entries(selectedItems)
      .filter(([, data]) => data.selected)
      .map(([itemId]) => itemId);

    if (selectedItemIds.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const bulkMovements: Parameters<typeof editMovementBulk>[0] = [];

      for (const itemId of selectedItemIds) {
        const item = employeeItems.find((i) => String(i.id) === itemId);
        const itemCondition = selectedItems[itemId]?.condition || item?.condition || 'Good';

        if (item?.movements && Array.isArray(item.movements) && item.movements.length > 0) {
          const sortedMovements = [...item.movements].sort(
            (a, b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime()
          );
          const last = sortedMovements[0];
          bulkMovements.push({
            id: last.id,
            ptaId: last.ptaId,
            dateAssigned: last.dateAssigned,
            ptrItrNumber: last.ptrItrNumber || '',
            rrppeRrspNumber: last.rrppeRrspNumber || '',
            parIcsNumber: last.parIcsNumber || '',
            status: last.status || 'T',
            plantillaEmployeeId: last.plantillaEmployeeId || null,
            nonPlantillaEmployeeId: last.nonPlantillaEmployeeId || null,
            condition: last.condition || 'Good',
            actualOfficeId: last.actualOfficeId || 0,
            actualDivisionId: last.actualDivisionId || 0,
            isActive: true,
            isCurrent: false,
          });
        }

        bulkMovements.push({
          id: 0,
          ptaId: parseInt(itemId),
          dateAssigned: new Date().toISOString(),
          ptrItrNumber: '',
          rrppeRrspNumber: generatedReturnNumber,
          parIcsNumber: item?.parIcsNumber || '',
          status: 'R',
          plantillaEmployeeId: FIXED_RETURN_RECIPIENT.id,
          nonPlantillaEmployeeId: null,
          condition: itemCondition,
          actualOfficeId: 1,
          actualDivisionId: 1,
          isActive: true,
          isCurrent: true,
        });
      }

      await editMovementBulk(bulkMovements);

      setSuccess(true);
      toast.success(`Return record created successfully: ${generatedReturnNumber}`);

      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create return record';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedEmployeeName = fromEmployee
    ? `${fromEmployee.firstName} ${fromEmployee.lastName}`.trim()
    : '';
  const selectedEmployeeOffice = fromEmployee?.office ? (typeof fromEmployee.office === 'string' ? fromEmployee.office : fromEmployee.office.name) : 'Unknown';
  const selectedEmployeePosition = fromEmployee?.position ? (typeof fromEmployee.position === 'string' ? fromEmployee.position : fromEmployee.position.name) : fromEmployee?.positionName || 'N/A';

  const selectedItemIds = Object.entries(selectedItems).filter(([, d]) => d.selected).map(([id]) => id);

  const filteredEmployeeItems = (() => {
    const query = itemSearchQuery.trim().toLowerCase();
    if (!query) return employeeItems;
    return employeeItems.filter((item) =>
      String(item.propertyNumber ?? '').toLowerCase().includes(query) ||
      String(item.description ?? '').toLowerCase().includes(query) ||
      String(item.serialNumber ?? '').toLowerCase().includes(query)
    );
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{returnType === 'RRPPE' ? 'Return PPE' : 'Return SE'}</DialogTitle>
          <DialogDescription>
            Create a return record for {groupName} items.
            Items will be transferred to the Central Return Storage.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>Return record created successfully!</span>
          </div>
        )}

        {dataLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step 1: Select From Employee */}
            {currentStep === 'from-employee' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Select Employee Returning {groupName}
                  </Label>
                  <EmployeeSelector
                    employees={employees}
                    value={fromEmployee?.id || null}
                    onSelect={handleEmployeeSelect}
                    placeholder="Search employee..."
                  />
                </div>

                {fromEmployee && (
                  <Card className="bg-slate-50 border-slate-200">
                    <CardContent className="pt-4">
                      <div className="space-y-2 text-sm">
                        <p><span className="font-semibold">Name:</span> {selectedEmployeeName}</p>
                        <p><span className="font-semibold">Position:</span> {selectedEmployeePosition}</p>
                        <p><span className="font-semibold">Office:</span> {selectedEmployeeOffice}</p>
                        <p><span className="font-semibold">Items Available:</span> {employeeItems.length} {groupName} item(s)</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Step 2: Select Items and Set Condition */}
            {currentStep === 'select-items-and-condition' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold mb-4">
                    Select Items to Return &amp; Set Condition
                  </h3>

                  {itemsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : employeeItems.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      No {groupName} items available for this employee
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          value={itemSearchQuery}
                          onChange={(e) => setItemSearchQuery(e.target.value)}
                          placeholder="Search by property number, description, or serial number..."
                          className="pl-9"
                        />
                      </div>
                      {filteredEmployeeItems.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 border border-dashed border-slate-200 rounded-lg">
                          No items match your search.
                        </div>
                      ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                      {filteredEmployeeItems.map((item) => (
                        <Card key={item.id} className="p-4 border-slate-200 hover:border-slate-300">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={selectedItems[String(item.id)]?.selected || false}
                                onCheckedChange={(checked) =>
                                  handleItemChange(String(item.id), Boolean(checked))
                                }
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <p className="font-semibold text-sm">{item.description ? (typeof item.description === 'string' ? item.description : item.description.toString()) : 'N/A'}</p>
                                <p className="text-xs text-slate-500">
                                  Property #: {item.propertyNumber ? (typeof item.propertyNumber === 'string' ? item.propertyNumber : item.propertyNumber.toString()) : 'N/A'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Category: {item.category ? (typeof item.category === 'string' ? item.category : item.category.toString()) : 'N/A'} | Group: {item.group ? (typeof item.group === 'string' ? item.group : item.group.toString()) : 'N/A'}
                                </p>
                              </div>
                            </div>

                            {selectedItems[String(item.id)]?.selected && (
                              <div className="ml-8 space-y-2 pt-2 border-t border-slate-200">
                                <Label htmlFor={`condition-${item.id}`} className="text-xs font-medium">
                                  Item Condition
                                </Label>
                                <Select
                                  value={selectedItems[String(item.id)]?.condition || 'Good'}
                                  onValueChange={(value) =>
                                    handleItemChange(String(item.id), undefined, value)
                                  }
                                >
                                  <SelectTrigger id={`condition-${item.id}`} className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {conditions.length > 0
                                      ? conditions.map(c => (
                                          <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))
                                      : (
                                          <SelectItem value={selectedItems[String(item.id)]?.condition || 'Good'}>
                                            {selectedItems[String(item.id)]?.condition || 'Good'}
                                          </SelectItem>
                                        )
                                    }
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                      </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Return Recipient Info */}
                <Card className="bg-blue-50 border-blue-200 p-4">
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-blue-900">Return Recipient (Fixed)</p>
                    <p className="text-blue-800"><span className="font-medium">Name:</span> {FIXED_RETURN_RECIPIENT.name}</p>
                    <p className="text-blue-800"><span className="font-medium">Type:</span> {FIXED_RETURN_RECIPIENT.employmentType}</p>
                    <p className="text-blue-800"><span className="font-medium">Office:</span> {FIXED_RETURN_RECIPIENT.office}</p>
                  </div>
                </Card>
              </div>
            )}

            {/* Step 3: Confirm — review and edit the generated return number */}
            {currentStep === 'confirm' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Review Generated Number</h3>
                    <p className="text-sm text-gray-600">You can edit the number below if it is incorrect before saving.</p>
                  </div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-5 space-y-3">
                  <Label className="text-base font-bold text-blue-900 block">
                    {returnType} Number ({returnType === 'RRPPE' ? 'Report on the Return of PPE' : 'Report on the Return of Semi-Expendable Property'})
                  </Label>
                  <Input
                    value={generatedReturnNumber}
                    onChange={(e) => setGeneratedReturnNumber(e.target.value)}
                    className="text-base font-mono font-semibold h-11 border-blue-300 focus:border-blue-500"
                    placeholder={`e.g. ${returnType}-2026-07-001`}
                  />
                  <p className="text-xs text-blue-700">Format: {returnType}-yyyy-mm-NNN</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-sm">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Return Summary</p>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Employee</p>
                      <p className="font-semibold text-slate-900 mt-1">{selectedEmployeeName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Items Selected</p>
                      <p className="font-bold text-blue-600 text-lg mt-1">{selectedItemIds.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              {currentStep !== 'from-employee' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}

              {currentStep === 'from-employee' && (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!fromEmployee || itemsLoading || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}

              {currentStep === 'select-items-and-condition' && (
                <Button
                  type="button"
                  onClick={handleGenerateAndConfirm}
                  disabled={loading || Object.values(selectedItems).every((v) => !v.selected)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Review &amp; Confirm
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              )}

              {currentStep === 'confirm' && (
                <Button
                  type="button"
                  onClick={handleFinalSave}
                  disabled={loading || !generatedReturnNumber.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Return Record
                    </>
                  )}
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
