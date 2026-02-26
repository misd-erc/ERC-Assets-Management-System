import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeSelector } from './EmployeeSelector';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  editMovement,
  generateReturnNumber,
  getAssetsByEmployee,
} from '@/api/asset/transferApi';
import { getEmployees } from '@/api/user-management/userApi';
import { getOffices } from '@/api/office-management/officeApi';
import { getDivisions } from '@/api/office-management/divisionApi';
import { ApiEmployee } from '@/types/transfer';
import { VwOffice, VwDivision } from '@/types';

interface ReturnFormProps {
  isOpen: boolean;
  onClose: () => void;
  returnType: 'RRPPE' | 'RRSP'; // RRPPE for PPE, RRSP for SE
  onSuccess?: () => void;
}

type Step = 'from-employee' | 'select-items-and-condition';

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

  // Data Loading States
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [employeeItems, setEmployeeItems] = useState<any[]>([]);
  const [offices, setOffices] = useState<VwOffice[]>([]);
  const [divisions, setDivisions] = useState<VwDivision[]>([]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);

  const groupName = returnType === 'RRPPE' ? 'PPE' : 'SE';

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('from-employee');
      setFromEmployee(null);
      setSelectedItems({});
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

        // Load employees
        const empResponse = await getEmployees();
        setEmployees(empResponse.data?.items || []);

        // Load offices
        const officesData = await getOffices();
        setOffices(officesData || []);

        // Load divisions
        const divisionsData = await getDivisions();
        setDivisions(divisionsData || []);
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

        // Fetch assets for the selected employee
        const items = await getAssetsByEmployee(fromEmployee.id, groupName);

        // Filter out items that don't have active movements
        const validItems = items.filter((item: any) => item && item.id);
        setEmployeeItems(validItems);

        // Reset selected items when employee changes
        setSelectedItems({});
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
  }, [fromEmployee]);

  // Handle employee selection
  const handleEmployeeSelect = (employeeId: number) => {
    const emp = employees.find(e => e.id === employeeId);
    setFromEmployee(emp || null);
  };

  // Handle item selection or condition change
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

  // Handle next button
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

  // Handle back button
  const handleBack = () => {
    if (currentStep === 'select-items-and-condition') {
      setCurrentStep('from-employee');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromEmployee) {
      toast.error('Please select an employee');
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

      // Generate return number (async call to backend)
      const returnNumber = await generateReturnNumber(returnType);

      // Create and submit movement records for each selected item
      const submitPromises = selectedItemIds.map(async (itemId) => {
        const item = employeeItems.find((i) => String(i.id) === itemId);
        const itemCondition = selectedItems[itemId]?.condition || item?.condition || 'Good';

        // New return movement
        const newMovement = {
          id: 0,
          ptaId: parseInt(itemId),
          dateAssigned: new Date().toISOString(),
          ptrItrNumber: '', // RRPPE or RRSP (the type)
          rrppeRrspNumber: returnNumber, // The actual return number (RRPPE-2026-02-001)
          parIcsNumber: item?.parIcsNumber || '',
          status: 'R', // Status is always "Return" for return records
          plantillaEmployeeId: FIXED_RETURN_RECIPIENT.id, // Fixed recipient ID
          nonPlantillaEmployeeId: null,
          condition: itemCondition, // User-specified condition from form
          actualOfficeId: 1, // Return storage location
          actualDivisionId: 1, // Return storage division
          isActive: true,
          isCurrent: true, // New movement is current
        };

        // Submit new movement
        await editMovement(newMovement as any);

        // Get the previous movement to mark as not current
        if (item?.movements && Array.isArray(item.movements) && item.movements.length > 0) {
          const sortedMovements = [...item.movements].sort((a, b) => {
            const dateA = new Date(a.dateAssigned).getTime();
            const dateB = new Date(b.dateAssigned).getTime();
            return dateB - dateA; // Most recent first
          });
          const lastMovement = sortedMovements[0];

          // Update previous movement to mark as not current
          await editMovement({
            id: lastMovement.id,
            ptaId: lastMovement.ptaId,
            dateAssigned: lastMovement.dateAssigned,
            ptrItrNumber: lastMovement.ptrItrNumber,
            rrppeRrspNumber: lastMovement.rrppeRrspNumber,
            parIcsNumber: lastMovement.parIcsNumber,
            status: lastMovement.status || 'T',
            plantillaEmployeeId: lastMovement.plantillaEmployeeId,
            nonPlantillaEmployeeId: lastMovement.nonPlantillaEmployeeId,
            condition: lastMovement.condition,
            actualOfficeId: lastMovement.actualOfficeId,
            actualDivisionId: lastMovement.actualDivisionId,
            isActive: true,
            isCurrent: false, // Mark as not current
          } as any);
        }
      });

      await Promise.all(submitPromises);

      setSuccess(true);
      toast.success(`Return record created successfully: ${returnNumber}`);

      // Close form after a short delay
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl">
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
          <form onSubmit={handleSubmit} className="space-y-6">
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
                        <p>
                          <span className="font-semibold">Name:</span> {selectedEmployeeName}
                        </p>
                        <p>
                          <span className="font-semibold">Position:</span> {selectedEmployeePosition}
                        </p>
                        <p>
                          <span className="font-semibold">Office:</span> {selectedEmployeeOffice}
                        </p>
                        <p>
                          <span className="font-semibold">Items Available:</span> {employeeItems.length} {groupName} item(s)
                        </p>
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
                    Select Items to Return & Set Condition
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
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {employeeItems.map((item) => (
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
                                    <SelectItem value="Good">Good</SelectItem>
                                    <SelectItem value="Fair">Fair</SelectItem>
                                    <SelectItem value="Poor">Poor</SelectItem>
                                    <SelectItem value="Damaged">Damaged</SelectItem>
                                    <SelectItem value="Salvage">Salvage</SelectItem>
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

                {/* Return Recipient Info */}
                <Card className="bg-blue-50 border-blue-200 p-4">
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-blue-900">Return Recipient (Fixed)</p>
                    <p className="text-blue-800">
                      <span className="font-medium">Name:</span> {FIXED_RETURN_RECIPIENT.name}
                    </p>
                    <p className="text-blue-800">
                      <span className="font-medium">Type:</span> {FIXED_RETURN_RECIPIENT.employmentType}
                    </p>
                    <p className="text-blue-800">
                      <span className="font-medium">Office:</span> {FIXED_RETURN_RECIPIENT.office}
                    </p>
                  </div>
                </Card>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              {currentStep === 'select-items-and-condition' && (
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
                  type="submit"
                  disabled={loading || Object.values(selectedItems).every((v) => !v.selected)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Return...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Create Return Record
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
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
