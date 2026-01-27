import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { EmployeeSelector } from './EmployeeSelector';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  editMovement,
  generateTransferNumber,
  getAssetsByEmployee,
} from '@/api/asset/transferApi';
import { getEmployees } from '@/api/user-management/userApi';
import { getOffices } from '@/api/office-management/officeApi';
import { getDivisions } from '@/api/office-management/divisionApi';
import { ApiEmployee } from '@/types/transfer';
import { VwOffice, VwDivision } from '@/types';

interface TransferFormProps {
  isOpen: boolean;
  onClose: () => void;
  transferType: 'PTR' | 'ITR'; // PTR for PPE, ITR for SE
  onSuccess?: () => void;
}

type Step = 'from-employee' | 'select-items' | 'to-employee';

export function TransferForm({ isOpen, onClose, transferType, onSuccess }: TransferFormProps) {
  // Step Management
  const [currentStep, setCurrentStep] = useState<Step>('from-employee');

  // Form State
  const [fromEmployee, setFromEmployee] = useState<ApiEmployee | null>(null);
  const [toPlantillaEmployee, setToPlantillaEmployee] = useState<ApiEmployee | null>(null);
  const [toNonPlantillaEmployee, setToNonPlantillaEmployee] = useState<ApiEmployee | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

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

  const groupName = transferType === 'PTR' ? 'PPE' : 'SE';

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

  // Load items when from employee is selected
  useEffect(() => {
    const loadItemsForEmployee = async () => {
      if (!fromEmployee?.id) {
        setEmployeeItems([]);
        return;
      }

      try {
        setItemsLoading(true);
        setError(null);
        const items = await getAssetsByEmployee(fromEmployee.id, groupName);
        setEmployeeItems(items);
        setSelectedItems([]); // Reset selected items when changing employee
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load items for employee';
        setError(message);
        toast.error(message);
        setEmployeeItems([]);
      } finally {
        setItemsLoading(false);
      }
    };

    loadItemsForEmployee();
  }, [fromEmployee?.id, groupName]);

  // Handle items selection
  const handleItemsChange = (itemIds: string[]) => {
    setSelectedItems(itemIds);
  };

  // Check if employee is the current holder based on most recent dateAssigned in movements
  const isCurrentHolder = (item: any, employeeId: number | undefined): boolean => {
    if (!employeeId) return false;
    
    // If item has movements array, find the most recent one by dateAssigned
    if (item.movements && Array.isArray(item.movements) && item.movements.length > 0) {
      const sortedMovements = [...item.movements].sort((a, b) => {
        const dateA = new Date(a.dateAssigned).getTime();
        const dateB = new Date(b.dateAssigned).getTime();
        return dateB - dateA; // Most recent first
      });
      
      const latestMovement = sortedMovements[0];
      // Check if the latest movement has this employee as the holder
      const isPlantilla = latestMovement.plantillaEmployeeId === employeeId;
      const isNonPlantilla = latestMovement.nonPlantillaEmployeeId === employeeId;
      return isPlantilla || isNonPlantilla;
    }
    
    // If no movements, assume employee loaded from getAssetsByEmployee is the holder
    return true;
  };

  // Check if item has been transferred out (has a toEmployee assigned)
  const hasBeenTransferredOut = (item: any): boolean => {
    if (!item.movements || !Array.isArray(item.movements) || item.movements.length === 0) {
      return false;
    }
    
    // Get the most recent movement
    const sortedMovements = [...item.movements].sort((a, b) => {
      const dateA = new Date(a.dateAssigned).getTime();
      const dateB = new Date(b.dateAssigned).getTime();
      return dateB - dateA; // Most recent first
    });
    
    const latestMovement = sortedMovements[0];
    // Check if the latest movement has a toEmployee assigned
    return !!latestMovement.toEmployee;
  };

  // Navigate to next step
  const handleNextStep = () => {
    if (currentStep === 'from-employee') {
      if (!fromEmployee) {
        toast.error('Please select a From Employee');
        return;
      }
      setCurrentStep('select-items');
    } else if (currentStep === 'select-items') {
      if (selectedItems.length === 0) {
        toast.error('Please select at least one item');
        return;
      }
      setCurrentStep('to-employee');
    }
  };

  // Navigate to previous step
  const handlePrevStep = () => {
    if (currentStep === 'select-items') {
      setCurrentStep('from-employee');
    } else if (currentStep === 'to-employee') {
      setCurrentStep('select-items');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const recipient = toPlantillaEmployee ?? toNonPlantillaEmployee;

    if (!fromEmployee || selectedItems.length === 0 || !recipient) {
      toast.error('Please complete all steps');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Generate transfer number
      const transferNumber = generateTransferNumber(transferType);

      // Create movement records for each selected item
      const movements = selectedItems.map(itemId => {
        const item = employeeItems.find(i => String(i.id) === itemId);
        const plantillaId = toPlantillaEmployee?.id || 0;
        const nonPlantillaId = toNonPlantillaEmployee?.id || 0;
        return {
          id: 0,
          ptaId: parseInt(itemId),
          dateAssigned: new Date().toISOString(),
          ptrItrNumber: transferNumber,
          parIcsNumber: item?.parIcsNumber || '',
          status: 'T',
          plantillaEmployeeId: plantillaId,
          nonPlantillaEmployeeId: nonPlantillaId,
          condition: item?.condition || 'Good',
          actualOfficeId: recipient?.office?.id || 0,
          actualDivisionId: recipient?.division?.id || 0,
          isActive: true,
          model: item?.model || '',
        };
      });

      // Submit all movements
      for (const movement of movements) {
        await editMovement(movement);
      }

      setSuccess(true);
      toast.success(`${transferType} created successfully for ${selectedItems.length} item(s)`);

      // Reset form
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save transfer record';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const transferLabel = transferType === 'PTR' ? 'Property Transfer Record (PPE)' : 'Inventory Transfer Record (SE)';

  const getEmploymentTypeName = (emp: ApiEmployee) => {
    const name = emp.employmentTypeName || emp.employmentType?.name || '';
    return name.toLowerCase();
  };

  const normalizeType = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '');

  const isPlantilla = (emp: ApiEmployee) => {
    if (emp.employmentType?.id) return emp.employmentType.id === 1;
    const type = normalizeType(getEmploymentTypeName(emp));
    return type === 'plantilla';
  };

  const isNonPlantilla = (emp: ApiEmployee) => {
    if (emp.employmentType?.id) return emp.employmentType.id !== 1;
    const type = normalizeType(getEmploymentTypeName(emp));
    return type.includes('nonplantilla');
  };

  const plantillaEmployees = employees.filter(e => {
    if (isNonPlantilla(e)) return false;
    if (isPlantilla(e)) return true;
    return true;
  });

  const nonPlantillaEmployees = employees.filter(e => {
    if (isNonPlantilla(e)) return true;
    if (isPlantilla(e)) return false;
    return true;
  });

  // Filter employees who are current holders for Step 3 (To Employee)
  const getCurrentHolderEmployees = (type: 'plantilla' | 'nonplantilla') => {
    const currentEmployeeId = fromEmployee?.id;
    if (!currentEmployeeId) {
      return type === 'plantilla' ? plantillaEmployees : nonPlantillaEmployees;
    }

    // Get all employees who currently hold any items of the selected group
    const allEmployeeIds = new Set<number>();
    selectedItems.forEach(itemId => {
      const item = employeeItems.find(i => String(i.id) === itemId);
      if (item && item.currentHolderId) {
        allEmployeeIds.add(item.currentHolderId);
      }
    });

    // Filter to only show employees who have items (current holders)
    // Also exclude the from employee
    const filteredList = (type === 'plantilla' ? plantillaEmployees : nonPlantillaEmployees)
      .filter(e => e.id !== currentEmployeeId);

    return filteredList;
  };

  const plantillaEmployeesForStep3 = getCurrentHolderEmployees('plantilla');
  const nonPlantillaEmployeesForStep3 = getCurrentHolderEmployees('nonplantilla');

  const getStepNumber = () => {
    if (currentStep === 'from-employee') return 1;
    if (currentStep === 'select-items') return 2;
    if (currentStep === 'to-employee') return 3;
    return 1;
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 'from-employee': return !!fromEmployee;
      case 'select-items': return selectedItems.length > 0;
      case 'to-employee': return !!toPlantillaEmployee || !!toNonPlantillaEmployee;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!canGoNext()) return;

    switch (currentStep) {
      case 'from-employee': setCurrentStep('select-items'); break;
      case 'select-items': setCurrentStep('to-employee'); break;
      case 'to-employee': handleSubmit(new Event('submit') as any); break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'select-items': setCurrentStep('from-employee'); break;
      case 'to-employee': setCurrentStep('select-items'); break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{transferLabel} - Step {getStepNumber()} of 3</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8">
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-900">Success</p>
                <p className="text-sm text-green-700">{transferType} has been created successfully for {selectedItems.length} item(s)</p>
              </div>
            </div>
          </div>
        ) : error ? (
          <>
            <div className="py-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setError(null)}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </>
        ) : dataLoading ? (
          <div className="py-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Step 1: From Employee */}
            {currentStep === 'from-employee' && (
              <div className="py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Select FROM Employee</h3>
                  <p className="text-sm text-gray-600">Choose the employee who currently holds the items</p>
                  <EmployeeSelector
                    employees={employees}
                    value={fromEmployee?.id || null}
                    onSelect={(empId) => {
                      const emp = employees.find(e => e.id === empId);
                      setFromEmployee(emp || null);
                    }}
                    placeholder="Search for employee..."
                  />
                  {fromEmployee && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded space-y-1">
                      <p className="text-sm"><strong>Selected:</strong> {fromEmployee.firstName} {fromEmployee.lastName}</p>
                      {fromEmployee.officeName && <p className="text-sm text-gray-600"><strong>Office:</strong> {fromEmployee.officeName}</p>}
                      {fromEmployee.divisionName && <p className="text-sm text-gray-600"><strong>Division:</strong> {fromEmployee.divisionName}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Select Items */}
            {currentStep === 'select-items' && (
              <div className="py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Select Items to Transfer</h3>
                  <p className="text-sm text-gray-600">
                    {fromEmployee?.firstName} {fromEmployee?.lastName} currently holds {employeeItems.filter(item => isCurrentHolder(item, fromEmployee?.id)).length} item(s)
                  </p>
                  
                  {itemsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      <span className="text-sm">Loading items...</span>
                    </div>
                  ) : employeeItems.filter(item => isCurrentHolder(item, fromEmployee?.id)).length === 0 ? (
                    <div className="p-4 text-center text-gray-500 border rounded-lg">
                      No items currently held by this employee
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 border-b mb-2">
                        <Checkbox
                          checked={selectedItems.length === employeeItems.filter(item => isCurrentHolder(item, fromEmployee?.id)).length && employeeItems.filter(item => isCurrentHolder(item, fromEmployee?.id)).length > 0}
                          onCheckedChange={(checked) => {
                            const availableItems = employeeItems.filter(item => isCurrentHolder(item, fromEmployee?.id));
                            if (checked) {
                              setSelectedItems(availableItems.map(i => String(i.id)));
                            } else {
                              setSelectedItems([]);
                            }
                          }}
                        />
                        <span className="text-sm font-medium">
                          Select All ({selectedItems.length}/{employeeItems.filter(item => isCurrentHolder(item, fromEmployee?.id)).length})
                        </span>
                      </div>
                      <div className="space-y-1">
                        {employeeItems
                          .filter(item => isCurrentHolder(item, fromEmployee?.id))
                          .map(item => (
                          <div key={item.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              checked={selectedItems.includes(String(item.id))}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedItems([...selectedItems, String(item.id)]);
                                } else {
                                  setSelectedItems(selectedItems.filter(id => id !== String(item.id)));
                                }
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.propertyNumber}</p>
                              <p className="text-xs text-gray-500 truncate">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: To Employee */}
            {currentStep === 'to-employee' && (
              <div className="py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Select TO Employees</h3>
                  <p className="text-sm text-gray-600">Choose the plantilla and/or non-plantilla employee who will receive the items</p>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Plantilla Employee</Label>
                      <EmployeeSelector
                        employees={plantillaEmployeesForStep3}
                        value={toPlantillaEmployee?.id || null}
                        onSelect={(empId) => {
                          if (!empId) {
                            setToPlantillaEmployee(null);
                            return;
                          }
                          const emp = employees.find(e => e.id === empId);
                          setToPlantillaEmployee(emp || null);
                        }}
                        placeholder="Search plantilla employee..."
                      />
                      {toPlantillaEmployee && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded space-y-1">
                          <p className="text-sm"><strong>Selected:</strong> {toPlantillaEmployee.firstName} {toPlantillaEmployee.lastName}</p>
                          {toPlantillaEmployee.officeName && <p className="text-sm text-gray-600"><strong>Office:</strong> {toPlantillaEmployee.officeName}</p>}
                          {toPlantillaEmployee.divisionName && <p className="text-sm text-gray-600"><strong>Division:</strong> {toPlantillaEmployee.divisionName}</p>}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Non-Plantilla Employee</Label>
                      <EmployeeSelector
                        employees={nonPlantillaEmployeesForStep3}
                        value={toNonPlantillaEmployee?.id || null}
                        onSelect={(empId) => {
                          if (!empId) {
                            setToNonPlantillaEmployee(null);
                            return;
                          }
                          const emp = employees.find(e => e.id === empId);
                          setToNonPlantillaEmployee(emp || null);
                        }}
                        placeholder="Search non-plantilla employee..."
                      />
                      {toNonPlantillaEmployee && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded space-y-1">
                          <p className="text-sm"><strong>Selected:</strong> {toNonPlantillaEmployee.firstName} {toNonPlantillaEmployee.lastName}</p>
                          {toNonPlantillaEmployee.officeName && <p className="text-sm text-gray-600"><strong>Office:</strong> {toNonPlantillaEmployee.officeName}</p>}
                          {toNonPlantillaEmployee.divisionName && <p className="text-sm text-gray-600"><strong>Division:</strong> {toNonPlantillaEmployee.divisionName}</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedItems.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-lg space-y-2 text-sm">
                      <p><strong>From:</strong> {fromEmployee?.firstName} {fromEmployee?.lastName}</p>
                      <p><strong>To (Plantilla):</strong> {toPlantillaEmployee?.firstName || '-'} {toPlantillaEmployee?.lastName || ''}</p>
                      <p><strong>To (Non-Plantilla):</strong> {toNonPlantillaEmployee?.firstName || '-'} {toNonPlantillaEmployee?.lastName || ''}</p>
                      <p><strong>Items:</strong> {selectedItems.length} item(s)</p>
                      <p><strong>Type:</strong> {transferLabel}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 'from-employee' || loading}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canGoNext() || loading || itemsLoading}
              >
                {currentStep === 'to-employee' ? (
                  <>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Complete Transfer
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
