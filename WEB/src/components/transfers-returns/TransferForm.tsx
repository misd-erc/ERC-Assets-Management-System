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
  generateParIcsNumber,
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

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('from-employee');
      setFromEmployee(null);
      setToPlantillaEmployee(null);
      setToNonPlantillaEmployee(null);
      setSelectedItems([]);
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

  // Check if item is currently held by employee.
  // Do NOT rely on the isCurrent flag — it can be stale or incorrectly set.
  // Instead, take the latest movement by createdAt/id and verify the employee match.
  const isCurrentHolder = (item: any, employeeId: number | undefined): boolean => {
    if (!employeeId) return false;

    if (item.movements && Array.isArray(item.movements) && item.movements.length > 0) {
      const sorted = [...item.movements].sort((a, b) => {
        // Prefer createdAt, fall back to dateAssigned, then id
        const tA = a.createdAt
          ? new Date(a.createdAt).getTime()
          : new Date(a.dateAssigned ?? 0).getTime();
        const tB = b.createdAt
          ? new Date(b.createdAt).getTime()
          : new Date(b.dateAssigned ?? 0).getTime();
        if (tB !== tA) return tB - tA;
        return (b.id ?? 0) - (a.id ?? 0);
      });

      const latest = sorted[0];
      return (
        latest.plantillaEmployeeId === employeeId ||
        latest.nonPlantillaEmployeeId === employeeId
      );
    }

    // No movements recorded — fall back to direct assignment fields if present
    return (
      item.plantillaEmployeeId === employeeId ||
      item.nonPlantillaEmployeeId === employeeId
    );
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

      // Generate transfer and PAR/ICS numbers (async calls to backend)
      const [transferNumber, parIcsNumber] = await Promise.all([
        generateTransferNumber(transferType),
        generateParIcsNumber(transferType === 'PTR' ? 'PAR' : 'ICS'),
      ]);

      if (!parIcsNumber) {
        throw new Error('Failed to generate PAR/ICS number');
      }

      // Create movement records for each selected item
      const movements = selectedItems.map(itemId => {
        const item = employeeItems.find(i => String(i.id) === itemId);
        return {
          id: 0,
          ptaId: parseInt(itemId),
          dateAssigned: new Date().toISOString(),
          ptrItrNumber: transferNumber,
          parIcsNumber,
          status: 'T',
          plantillaEmployeeId: toPlantillaEmployee?.id || null,
          nonPlantillaEmployeeId: toNonPlantillaEmployee?.id || null,
          condition: item?.condition || 'Good',
          actualOfficeId: recipient?.office?.id || 0,
          actualDivisionId: recipient?.division?.id || 0,
          isActive: true,
          isCurrent: true, // New movement is current
        };
      });

      // Get the previous movements to mark as not current
      const previousMovements = selectedItems.map(itemId => {
        const item = employeeItems.find(i => String(i.id) === itemId);
        if (item?.movements && Array.isArray(item.movements) && item.movements.length > 0) {
          const sortedMovements = [...item.movements].sort((a, b) => {
            const dateA = new Date(a.dateAssigned).getTime();
            const dateB = new Date(b.dateAssigned).getTime();
            return dateB - dateA;
          });
          const latestMovement = sortedMovements[0];
          return {
            ...latestMovement,
            status: latestMovement.status || 'T', // Preserve original status, default to 'T' for transfer
            plantillaEmployeeId: latestMovement.plantillaEmployeeId || null,
            nonPlantillaEmployeeId: latestMovement.nonPlantillaEmployeeId || null,
            isCurrent: false, // Mark previous as not current
          };
        }
        return null;
      }).filter(m => m !== null);

      // Submit all previous movements updates
      for (const movement of previousMovements) {
        await editMovement(movement);
      }

      // Submit all new movements
      for (const movement of movements) {
        await editMovement(movement);
      }

      setSuccess(true);
      toast.success(`${transferType} created successfully for ${selectedItems.length} item(s)`);

      // Reset form
      setTimeout(() => {
        onClose();
        onSuccess?.(); // This will trigger API call to refresh the movement list
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
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6 border-b">
          <DialogTitle className="text-2xl font-bold">{transferLabel}</DialogTitle>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Step {getStepNumber()} of 3</p>
            <div className="flex gap-1">
              {[1, 2, 3].map(step => (
                <div
                  key={step}
                  className={`h-1 w-12 rounded-full transition-colors ${
                    step <= getStepNumber() ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </DialogHeader>

        {success ? (
          <div className="py-12 px-6">
            <div className="flex flex-col items-center justify-center gap-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
              <div className="text-center space-y-2">
                <p className="font-bold text-2xl text-green-900">Success!</p>
                <p className="text-lg text-green-700">{transferType} has been created successfully</p>
                <p className="text-sm text-green-600">for {selectedItems.length} item(s)</p>
              </div>
            </div>
          </div>
        ) : error ? (
          <>
            <div className="py-8 px-6 max-h-[70vh] overflow-y-auto">
              <div className="flex items-start gap-4 p-6 bg-red-50 border-2 border-red-200 rounded-lg">
                <AlertCircle className="w-8 h-8 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-red-900 text-lg">Error Occurred</p>
                  <p className="text-red-700 mt-2 whitespace-pre-wrap">{error}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setError(null)}
                className="px-6 py-2"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </>
        ) : dataLoading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
              <p className="text-lg text-muted-foreground">Loading data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Step 1: From Employee */}
            {currentStep === 'from-employee' && (
              <div className="py-8 px-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">Select FROM Employee</h3>
                    <p className="text-base text-gray-600">Choose the employee who currently holds the items</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <Label className="text-base font-semibold text-gray-700 mb-3 block">Employee Name</Label>
                    <EmployeeSelector
                      employees={employees}
                      value={fromEmployee?.id || null}
                      onSelect={(empId) => {
                        const emp = employees.find(e => e.id === empId);
                        setFromEmployee(emp || null);
                      }}
                      placeholder="Search for employee..."
                    />
                  </div>
                  {fromEmployee && (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6 space-y-3">
                      <p className="text-lg"><strong className="text-blue-900">Selected:</strong> <span className="text-blue-800">{fromEmployee.firstName} {fromEmployee.lastName}</span></p>
                      {fromEmployee.officeName && <p className="text-base text-blue-800"><strong>Office:</strong> {fromEmployee.officeName}</p>}
                      {fromEmployee.divisionName && <p className="text-base text-blue-800"><strong>Division:</strong> {fromEmployee.divisionName}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Select Items */}
            {currentStep === 'select-items' && (
              <div className="py-8 px-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">Select Items to Transfer</h3>
                    <p className="text-base text-gray-600">
                      {fromEmployee?.firstName} {fromEmployee?.lastName} currently holds <span className="font-bold text-blue-600">{employeeItems.filter(item => isCurrentHolder(item, fromEmployee?.id)).length}</span> item(s)
                    </p>
                  </div>
                  
                  {itemsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin mr-3 text-blue-600" />
                      <span className="text-lg">Loading items...</span>
                    </div>
                  ) : employeeItems.filter(item => isCurrentHolder(item, fromEmployee?.id)).length === 0 ? (
                    <div className="p-8 text-center text-gray-600 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <p className="text-lg font-semibold">No items currently held by this employee</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
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
                            className="w-5 h-5"
                          />
                          <span className="font-semibold text-gray-700 text-base">
                            Select All ({selectedItems.length}/{employeeItems.filter(item => isCurrentHolder(item, fromEmployee?.id)).length})
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-[50vh] overflow-y-auto border border-gray-200 rounded-lg">
                        {employeeItems
                          .filter(item => isCurrentHolder(item, fromEmployee?.id))
                          .map(item => (
                          <div key={item.id} className="flex items-start gap-3 p-4 hover:bg-blue-50 transition-colors border-b last:border-0">
                            <Checkbox
                              checked={selectedItems.includes(String(item.id))}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedItems([...selectedItems, String(item.id)]);
                                } else {
                                  setSelectedItems(selectedItems.filter(id => id !== String(item.id)));
                                }
                              }}
                              className="w-5 h-5 mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900">{item.propertyNumber}</p>
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              {item.serialNumber && <p className="text-xs text-gray-500 mt-1"><strong>SN:</strong> {item.serialNumber}</p>}
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
              <div className="py-8 px-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">Select TO Employees</h3>
                    <p className="text-base text-gray-600">Choose the plantilla and/or non-plantilla employee who will receive the items</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-6">
                        <Label className="text-base font-bold text-amber-900 mb-3 block">👤 Plantilla Employee</Label>
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
                      </div>
                      {toPlantillaEmployee && (
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-lg p-4 space-y-2">
                          <p className="font-semibold text-amber-900">{toPlantillaEmployee.firstName} {toPlantillaEmployee.lastName}</p>
                          {toPlantillaEmployee.officeName && <p className="text-sm text-amber-800"><strong>Office:</strong> {toPlantillaEmployee.officeName}</p>}
                          {toPlantillaEmployee.divisionName && <p className="text-sm text-amber-800"><strong>Division:</strong> {toPlantillaEmployee.divisionName}</p>}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6">
                        <Label className="text-base font-bold text-purple-900 mb-3 block">👤 Non-Plantilla Employee</Label>
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
                      </div>
                      {toNonPlantillaEmployee && (
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-4 space-y-2">
                          <p className="font-semibold text-purple-900">{toNonPlantillaEmployee.firstName} {toNonPlantillaEmployee.lastName}</p>
                          {toNonPlantillaEmployee.officeName && <p className="text-sm text-purple-800"><strong>Office:</strong> {toNonPlantillaEmployee.officeName}</p>}
                          {toNonPlantillaEmployee.divisionName && <p className="text-sm text-purple-800"><strong>Division:</strong> {toNonPlantillaEmployee.divisionName}</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedItems.length > 0 && (
                    <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-6 space-y-3">
                      <h4 className="font-bold text-slate-900 text-lg">Transfer Summary</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white border border-slate-200 rounded p-4">
                          <p className="text-xs text-gray-500 uppercase font-semibold">From</p>
                          <p className="text-lg font-bold text-slate-900 mt-1">{fromEmployee?.firstName} {fromEmployee?.lastName}</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded p-4">
                          <p className="text-xs text-gray-500 uppercase font-semibold">Items</p>
                          <p className="text-lg font-bold text-blue-600 mt-1">{selectedItems.length} item(s)</p>
                        </div>
                      </div>
                      <div className="bg-white border border-slate-200 rounded p-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Transfer Type</p>
                        <p className="text-base font-semibold text-slate-900 px-3 py-1 bg-blue-100 inline-block rounded">{transferLabel}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 px-6 border-t gap-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 'from-employee' || loading}
                className="px-8 py-6 text-base font-semibold"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canGoNext() || loading || itemsLoading}
                className="px-8 py-6 text-base font-semibold bg-blue-600 hover:bg-blue-700"
              >
                {currentStep === 'to-employee' ? (
                  <>
                    {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                    Complete Transfer
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-5 h-5 ml-2" />
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
