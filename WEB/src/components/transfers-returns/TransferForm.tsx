import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MultiSelect } from '@/components/ui/multi-select';
import { EmployeeSelector } from './EmployeeSelector';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle, CheckCircle, ChevronRight, ChevronLeft, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  editMovementBulk,
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

type Step = 'from-employee' | 'select-items' | 'to-employee' | 'confirm';

export function TransferForm({ isOpen, onClose, transferType, onSuccess }: TransferFormProps) {
  // Step Management
  const [currentStep, setCurrentStep] = useState<Step>('from-employee');

  // Form State
  const [fromEmployee, setFromEmployee] = useState<ApiEmployee | null>(null);
  const [toEmployeeAccountable, setToEmployeeAccountable] = useState<ApiEmployee | null>(null);
  const [toSubEmployee, setToSubEmployee] = useState<ApiEmployee | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [itemConditions, setItemConditions] = useState<Record<string, string>>({});
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [reasonForTransfer, setReasonForTransfer] = useState('');

  // Generated numbers (editable before final save)
  const [generatedTransferNumber, setGeneratedTransferNumber] = useState('');
  const [generatedParIcsNumber, setGeneratedParIcsNumber] = useState('');

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

  const groupName = transferType === 'PTR' ? 'PPE' : 'SE';

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('from-employee');
      setFromEmployee(null);
      setToEmployeeAccountable(null);
      setToSubEmployee(null);
      setSelectedItems([]);
      setItemConditions({});
      setItemSearchQuery('');
      setReasonForTransfer('');
      setGeneratedTransferNumber('');
      setGeneratedParIcsNumber('');
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
        setSelectedItems([]);
        setItemSearchQuery('');
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleItemsChange = (itemIds: string[]) => {
    setSelectedItems(itemIds);
  };

  const isCurrentHolder = (item: any, employeeId: number | undefined): boolean => {
    if (!employeeId) return false;

    if (item.movements && Array.isArray(item.movements) && item.movements.length > 0) {
      const sorted = [...item.movements].sort((a, b) => {
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

    return (
      item.plantillaEmployeeId === employeeId ||
      item.nonPlantillaEmployeeId === employeeId
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hasBeenTransferredOut = (item: any): boolean => {
    if (!item.movements || !Array.isArray(item.movements) || item.movements.length === 0) {
      return false;
    }
    const sortedMovements = [...item.movements].sort((a, b) => {
      const dateA = new Date(a.dateAssigned).getTime();
      const dateB = new Date(b.dateAssigned).getTime();
      return dateB - dateA;
    });
    const latestMovement = sortedMovements[0];
    return !!latestMovement.toEmployee;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleNextStep = () => {
    if (currentStep === 'from-employee') {
      if (!fromEmployee) { toast.error('Please select a From Employee'); return; }
      setCurrentStep('select-items');
    } else if (currentStep === 'select-items') {
      if (selectedItems.length === 0) { toast.error('Please select at least one item'); return; }
      setCurrentStep('to-employee');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePrevStep = () => {
    if (currentStep === 'select-items') setCurrentStep('from-employee');
    else if (currentStep === 'to-employee') setCurrentStep('select-items');
    else if (currentStep === 'confirm') setCurrentStep('to-employee');
  };

  // Generate numbers then advance to confirm step
  const handleGenerateAndConfirm = async () => {
    const recipient = toEmployeeAccountable ?? toSubEmployee;
    if (!fromEmployee || selectedItems.length === 0 || !recipient) {
      toast.error('Please complete all steps');
      return;
    }

    if (toEmployeeAccountable && toSubEmployee && isPlantilla(toEmployeeAccountable) === isPlantilla(toSubEmployee)) {
      toast.error('Accountable Employee and Sub-PAR/ICS Employee must be different employee types (one Plantilla, one Non-Plantilla)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [transferNumber, parIcsNumber] = await Promise.all([
        generateTransferNumber(transferType),
        generateParIcsNumber(transferType === 'PTR' ? 'PAR' : 'ICS'),
      ]);

      if (!parIcsNumber) throw new Error('Failed to generate PAR/ICS number');

      setGeneratedTransferNumber(transferNumber);
      setGeneratedParIcsNumber(parIcsNumber);
      setCurrentStep('confirm');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate numbers';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Final save using the (possibly edited) generated numbers
  const handleFinalSave = async () => {
    const recipient = toEmployeeAccountable ?? toSubEmployee;

    if (!fromEmployee || selectedItems.length === 0 || !recipient) {
      toast.error('Please complete all steps');
      return;
    }

    if (toEmployeeAccountable && toSubEmployee && isPlantilla(toEmployeeAccountable) === isPlantilla(toSubEmployee)) {
      toast.error('Accountable Employee and Sub-PAR/ICS Employee must be different employee types (one Plantilla, one Non-Plantilla)');
      return;
    }

    if (!generatedTransferNumber.trim() || !generatedParIcsNumber.trim()) {
      toast.error('Transfer numbers cannot be empty');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Accountable Employee and the Sub-PAR/ICS Employee can each be either employment
      // type now (the two search boxes are no longer restricted), so figure out which one
      // is the Plantilla holder and which is the Non-Plantilla holder from their actual type.
      let plantillaEmployeeId: number | null = null;
      let nonPlantillaEmployeeId: number | null = null;
      [toEmployeeAccountable, toSubEmployee].forEach((emp) => {
        if (!emp) return;
        if (isPlantilla(emp)) plantillaEmployeeId = plantillaEmployeeId ?? emp.id;
        else nonPlantillaEmployeeId = nonPlantillaEmployeeId ?? emp.id;
      });

      const movements = selectedItems.map(itemId => {
        const item = employeeItems.find(i => String(i.id) === itemId);
        return {
          id: 0,
          ptaId: parseInt(itemId),
          dateAssigned: new Date().toISOString(),
          ptrItrNumber: generatedTransferNumber,
          parIcsNumber: generatedParIcsNumber,
          status: 'T',
          plantillaEmployeeId,
          nonPlantillaEmployeeId,
          condition: itemConditions[itemId] || item?.condition || 'Good',
          actualOfficeId: recipient?.office?.id || 0,
          actualDivisionId: recipient?.division?.id || 0,
          isActive: true,
          isCurrent: true,
          reasonForTransfer: reasonForTransfer.trim() || undefined,
        };
      });

      const previousMovements = selectedItems
        .map(itemId => {
          const item = employeeItems.find(i => String(i.id) === itemId);
          if (item?.movements && Array.isArray(item.movements) && item.movements.length > 0) {
            const sortedMovements = [...item.movements].sort((a, b) =>
              new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime()
            );
            const latest = sortedMovements[0];
            return {
              id: latest.id,
              ptaId: latest.ptaId,
              dateAssigned: latest.dateAssigned,
              ptrItrNumber: latest.ptrItrNumber || '',
              parIcsNumber: latest.parIcsNumber || '',
              rrppeRrspNumber: latest.rrppeRrspNumber || '',
              status: latest.status || 'T',
              plantillaEmployeeId: latest.plantillaEmployeeId || null,
              nonPlantillaEmployeeId: latest.nonPlantillaEmployeeId || null,
              condition: latest.condition || 'Good',
              actualOfficeId: latest.actualOfficeId || 0,
              actualDivisionId: latest.actualDivisionId || 0,
              isActive: true,
              isCurrent: false,
            };
          }
          return null;
        })
        .filter((m): m is NonNullable<typeof m> => m !== null);

      await editMovementBulk([...previousMovements, ...movements]);

      setSuccess(true);
      toast.success(`${transferType} created successfully for ${selectedItems.length} item(s)`);

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

  // Single unified employee list for Step 3 — searches across all employees regardless of
  // employment type, excluding whoever currently holds the items.
  const employeesForStep3 = fromEmployee
    ? employees.filter(e => e.id !== fromEmployee.id)
    : employees;

  const getStepNumber = () => {
    if (currentStep === 'from-employee') return 1;
    if (currentStep === 'select-items') return 2;
    if (currentStep === 'to-employee') return 3;
    if (currentStep === 'confirm') return 4;
    return 1;
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 'from-employee': return !!fromEmployee;
      case 'select-items': return selectedItems.length > 0;
      case 'to-employee': return !!toEmployeeAccountable || !!toSubEmployee;
      case 'confirm': return !!generatedTransferNumber.trim() && !!generatedParIcsNumber.trim();
      default: return false;
    }
  };

  const handleNext = () => {
    if (!canGoNext()) return;

    switch (currentStep) {
      case 'from-employee': setCurrentStep('select-items'); break;
      case 'select-items': {
        const initialConditions: Record<string, string> = {};
        selectedItems.forEach(itemId => {
          const item = employeeItems.find(i => String(i.id) === itemId);
          initialConditions[itemId] = item?.condition || 'Good';
        });
        setItemConditions(initialConditions);
        setCurrentStep('to-employee');
        break;
      }
      case 'to-employee': handleGenerateAndConfirm(); break;
      case 'confirm': handleFinalSave(); break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'select-items': setCurrentStep('from-employee'); break;
      case 'to-employee': setCurrentStep('select-items'); break;
      case 'confirm': setCurrentStep('to-employee'); break;
    }
  };

  const recipient = toEmployeeAccountable ?? toSubEmployee;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-6 border-b flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">{transferLabel}</DialogTitle>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Step {getStepNumber()} of 4</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(step => (
                <div
                  key={step}
                  className={`h-1 w-10 rounded-full transition-colors ${
                    step <= getStepNumber() ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
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
          <div className="py-8 px-6">
            <div className="flex items-start gap-4 p-6 bg-red-50 border-2 border-red-200 rounded-lg">
              <AlertCircle className="w-8 h-8 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-red-900 text-lg">Error Occurred</p>
                <p className="text-red-700 mt-2 whitespace-pre-wrap">{error}</p>
              </div>
            </div>
          </div>
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
              <div className="py-8 px-6">
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
              <div className="py-8 px-6">
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
                  ) : (() => {
                    const currentHolderItems = employeeItems.filter(item => isCurrentHolder(item, fromEmployee?.id));
                    const query = itemSearchQuery.trim().toLowerCase();
                    const filteredItems = query
                      ? currentHolderItems.filter(item =>
                          String(item.propertyNumber ?? '').toLowerCase().includes(query) ||
                          String(item.description ?? '').toLowerCase().includes(query) ||
                          String(item.serialNumber ?? '').toLowerCase().includes(query)
                        )
                      : currentHolderItems;

                    return (
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            value={itemSearchQuery}
                            onChange={(e) => setItemSearchQuery(e.target.value)}
                            placeholder="Search by property number, description, or serial number..."
                            className="pl-9"
                          />
                        </div>
                        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={filteredItems.length > 0 && filteredItems.every(item => selectedItems.includes(String(item.id)))}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  const newIds = filteredItems.map(i => String(i.id));
                                  setSelectedItems(prev => Array.from(new Set([...prev, ...newIds])));
                                } else {
                                  const filteredIds = new Set(filteredItems.map(i => String(i.id)));
                                  setSelectedItems(prev => prev.filter(id => !filteredIds.has(id)));
                                }
                              }}
                              className="w-5 h-5"
                            />
                            <span className="font-semibold text-gray-700 text-base">
                              Select All ({selectedItems.length}/{currentHolderItems.length})
                            </span>
                          </div>
                        </div>
                        {filteredItems.length === 0 ? (
                          <div className="p-6 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                            No items match your search.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[50vh] overflow-y-auto border border-gray-200 rounded-lg">
                            {filteredItems.map(item => (
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
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Step 3: To Employee */}
            {currentStep === 'to-employee' && (
              <div className="py-8 px-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">Select TO Employee</h3>
                    <p className="text-base text-gray-600">Choose the employee accountable for the items, and optionally a Sub-PAR/ICS employee</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-6">
                        <Label className="text-base font-bold text-amber-900 mb-3 block">Accountable Employee</Label>
                        <EmployeeSelector
                          employees={employeesForStep3}
                          value={toEmployeeAccountable?.id || null}
                          onSelect={(empId) => {
                            if (!empId) { setToEmployeeAccountable(null); return; }
                            const emp = employees.find(e => e.id === empId);
                            setToEmployeeAccountable(emp || null);
                          }}
                          placeholder="Search employee..."
                        />
                      </div>
                      {toEmployeeAccountable && (
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-lg p-4 space-y-2">
                          <p className="font-semibold text-amber-900">{toEmployeeAccountable.firstName} {toEmployeeAccountable.lastName}</p>
                          {toEmployeeAccountable.officeName && <p className="text-sm text-amber-800"><strong>Office:</strong> {toEmployeeAccountable.officeName}</p>}
                          {toEmployeeAccountable.divisionName && <p className="text-sm text-amber-800"><strong>Division:</strong> {toEmployeeAccountable.divisionName}</p>}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6">
                        <Label className="text-base font-bold text-purple-900 mb-3 block">Sub-PAR/ICS Employee</Label>
                        <EmployeeSelector
                          employees={employeesForStep3}
                          value={toSubEmployee?.id || null}
                          onSelect={(empId) => {
                            if (!empId) { setToSubEmployee(null); return; }
                            const emp = employees.find(e => e.id === empId);
                            setToSubEmployee(emp || null);
                          }}
                          placeholder="Search employee..."
                        />
                      </div>
                      {toSubEmployee && (
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-4 space-y-2">
                          <p className="font-semibold text-purple-900">{toSubEmployee.firstName} {toSubEmployee.lastName}</p>
                          {toSubEmployee.officeName && <p className="text-sm text-purple-800"><strong>Office:</strong> {toSubEmployee.officeName}</p>}
                          {toSubEmployee.divisionName && <p className="text-sm text-purple-800"><strong>Division:</strong> {toSubEmployee.divisionName}</p>}
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
                      <div className="bg-white border border-slate-200 rounded p-4 space-y-2">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Items &amp; Condition</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedItems.map(itemId => {
                            const item = employeeItems.find(i => String(i.id) === itemId);
                            if (!item) return null;
                            return (
                              <div key={itemId} className="flex items-center gap-3 py-2 border-b last:border-0">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-800 truncate">{item.propertyNumber}</p>
                                  <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                </div>
                                <Select
                                  value={itemConditions[itemId] || 'Good'}
                                  onValueChange={(val) => setItemConditions(prev => ({ ...prev, [itemId]: val }))}
                                >
                                  <SelectTrigger className="w-36 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Working">Working</SelectItem>
                                    <SelectItem value="Serviceable">Serviceable</SelectItem>
                                    <SelectItem value="Not Working">Not Working</SelectItem>
                                    <SelectItem value="Unserviceable">Unserviceable</SelectItem>
                                    <SelectItem value="Good">Good</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-gray-500 uppercase font-semibold">Reason for Transfer</Label>
                        <Textarea
                          value={reasonForTransfer}
                          onChange={(e) => setReasonForTransfer(e.target.value)}
                          placeholder="Optional — briefly explain why these items are being transferred..."
                          className="bg-white"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Confirm — review and edit generated numbers before saving */}
            {currentStep === 'confirm' && (
              <div className="py-8 px-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <FileText className="w-7 h-7 text-blue-600" />
                      <h3 className="text-2xl font-bold text-gray-900">Review Generated Numbers</h3>
                    </div>
                    <p className="text-base text-gray-600">
                      The system generated the numbers below. You can edit them before saving if they are incorrect.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-5 space-y-3">
                      <Label className="text-base font-bold text-blue-900 block">
                        {transferType} Number
                      </Label>
                      <Input
                        value={generatedTransferNumber}
                        onChange={(e) => setGeneratedTransferNumber(e.target.value)}
                        className="text-base font-mono font-semibold h-11 border-blue-300 focus:border-blue-500"
                        placeholder="e.g. 2026-07-001"
                      />
                      <p className="text-xs text-blue-700">Format: yyyy-mm-NNN</p>
                    </div>

                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-5 space-y-3">
                      <Label className="text-base font-bold text-green-900 block">
                        {transferType === 'PTR' ? 'PAR' : 'ICS'} Number
                      </Label>
                      <Input
                        value={generatedParIcsNumber}
                        onChange={(e) => setGeneratedParIcsNumber(e.target.value)}
                        className="text-base font-mono font-semibold h-11 border-green-300 focus:border-green-500"
                        placeholder={`e.g. ${transferType === 'PTR' ? 'PAR' : 'ICS'}-2026-07-001`}
                      />
                      <p className="text-xs text-green-700">Format: {transferType === 'PTR' ? 'PAR' : 'ICS'}-yyyy-mm-NNN</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-3">
                    <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">Transfer Summary</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">From</p>
                        <p className="font-semibold text-slate-900 mt-1">{fromEmployee?.firstName} {fromEmployee?.lastName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">To</p>
                        <p className="font-semibold text-slate-900 mt-1">
                          {recipient?.firstName} {recipient?.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Items</p>
                        <p className="font-bold text-blue-600 text-lg mt-1">{selectedItems.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        </div>

        {/* Navigation Buttons — kept outside the scrollable area so they're always visible */}
        {!success && !dataLoading && (
          <div className="flex justify-between pt-6 px-6 pb-6 border-t gap-4 flex-shrink-0">
            {error ? (
              <Button
                variant="outline"
                onClick={() => setError(null)}
                className="px-6 py-2"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            ) : (
              <>
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
                  {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                  {currentStep === 'confirm' ? (
                    'Save Transfer'
                  ) : currentStep === 'to-employee' ? (
                    <>
                      Review & Confirm
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
