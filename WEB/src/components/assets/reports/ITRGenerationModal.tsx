import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import { NormalizedEmployee, Asset, UnifiedMovement } from '@/types/asset/UnifiedAsset';
import { getEmployeeAssets } from '@/api/inventoryApi';
import { ITRGenerator } from './ITRGenerator';
import { ReportPreviewModal } from './ReportPreviewModal';
import { ItemSelectModal } from './ItemSelectModal';
import { ItemMovementsModal } from './ItemMovementsModal';

interface ITRGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: NormalizedEmployee[];
}

type Step = 'selectItem' | 'selectMovement' | 'to' | 'date' | 'transferType' | 'preview';

export function ITRGenerationModal({ isOpen, onClose, employees }: ITRGenerationModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('selectItem');
  const [selectedItem, setSelectedItem] = useState<Asset | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<UnifiedMovement | null>(null);
  const [toEmployee, setToEmployee] = useState<NormalizedEmployee | null>(null);
  const [transferDate, setTransferDate] = useState<Date>(new Date());
  const [transferType, setTransferType] = useState<'DONATION' | 'REASSIGNMENT' | 'RELOCATE' | 'OTHERS'>('REASSIGNMENT');
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [toSearch, setToSearch] = useState('');
  const [showItemSelectModal, setShowItemSelectModal] = useState(false);
  const [showItemMovementsModal, setShowItemMovementsModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetModal();
    }
  }, [isOpen]);

  const resetModal = () => {
    setCurrentStep('selectItem');
    setSelectedItem(null);
    setSelectedMovement(null);
    setToEmployee(null);
    setTransferDate(new Date());
    setPreviewUrl('');
    setShowPreview(false);
    setShowItemSelectModal(false);
    setShowItemMovementsModal(false);
  };

  const handleItemSelect = (item: Asset) => {
    setSelectedItem(item);
    setShowItemSelectModal(false);
    setShowItemMovementsModal(true);
  };

  const handleMovementSelect = (item: Asset, movement: UnifiedMovement | null) => {
    setSelectedItem(item);
    setSelectedMovement(movement);
    setShowItemMovementsModal(false);
    setCurrentStep('to');
  };

  const handleToEmployeeSelect = (emp: NormalizedEmployee) => {
    setToEmployee(emp);
    setCurrentStep('date');
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setTransferDate(date);
      setCurrentStep('transferType');
    }
  };

  const generatePreview = async () => {
    if (!selectedItem || !toEmployee) return;

    setLoadingPreview(true);
    try {
      const url = await ITRGenerator.generateITRPreview(
        selectedItem,
        selectedMovement,
        toEmployee,
        transferDate.toISOString().slice(0, 10),
        transferType
      );
      setPreviewUrl(url);
      setCurrentStep('preview');
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
    setLoadingPreview(false);
  };

  const handleConfirm = async () => {
    if (!selectedItem || !toEmployee) return;

    try {
      await ITRGenerator.generateITR(
        selectedItem,
        selectedMovement,
        toEmployee,
        transferDate.toISOString().slice(0, 10),
        transferType
      );
      onClose();
    } catch (error) {
      console.error('Failed to generate ITR:', error);
    }
  };

  const canProceedToEmployee = toEmployee && selectedItem && toEmployee.id !== (selectedMovement?.plantillaEmployeeId || selectedMovement?.nonPlantillaEmployeeId);

  const renderStepContent = () => {
    switch (currentStep) {
      case 'selectItem':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select SE Item to Transfer</h3>
            <Button
              onClick={() => setShowItemSelectModal(true)}
              className="w-full"
            >
              {selectedItem ? `${selectedItem.propertyNumber} (Selected)` : 'Click to Select Item'}
            </Button>
            {selectedItem && (
              <div className="p-3 border rounded-lg bg-slate-50">
                <p className="text-sm"><strong>Item:</strong> {selectedItem.propertyNumber}</p>
                <p className="text-sm"><strong>Description:</strong> {selectedItem.description}</p>
              </div>
            )}
          </div>
        );

      case 'selectMovement':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Item Movement</h3>
            <p className="text-sm text-gray-600">Item: {selectedItem?.propertyNumber}</p>
            <Button
              onClick={() => setShowItemMovementsModal(true)}
              className="w-full"
            >
              {selectedMovement ? 'Movement Selected' : 'Click to Select Movement'}
            </Button>
          </div>
        );

      case 'to':
        const filteredToEmployees = employees
          .filter(emp => emp.id !== (selectedMovement?.plantillaEmployeeId || selectedMovement?.nonPlantillaEmployeeId))
          .filter(emp => emp.label.toLowerCase().includes(toSearch.toLowerCase()));
        
        const fromEmployeeName = selectedMovement?.employee 
          ? (Array.isArray(selectedMovement.employee) 
              ? selectedMovement.employee[0] 
              : selectedMovement.employee)
          : null;
        
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select TO Employee</h3>
            <p className="text-sm text-gray-600">
              From: {fromEmployeeName ? `${fromEmployeeName.lastName}, ${fromEmployeeName.firstName}` : 'N/A'}
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search employees..."
                value={toSearch}
                onChange={(e) => setToSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {filteredToEmployees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => handleToEmployeeSelect(emp)}
                  className="p-3 text-left border rounded hover:bg-gray-50"
                >
                  {emp.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'date':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Transfer Date</h3>
            <p className="text-sm text-gray-600">
              To: {toEmployee?.label}
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !transferDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {transferDate ? format(transferDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={transferDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        );

      case 'transferType':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Transfer Type</h3>
            <p className="text-sm text-gray-600">
              From: {selectedMovement ? 'Selected' : 'N/A'} → To: {toEmployee?.label}
            </p>
            <div className="space-y-2">
              {[
                { value: 'DONATION', label: 'Donation' },
                { value: 'REASSIGNMENT', label: 'Reassignment' },
                { value: 'RELOCATE', label: 'Relocate' },
                { value: 'OTHERS', label: 'Others' },
              ].map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={type.value}
                    name="transferType"
                    value={type.value}
                    checked={transferType === type.value}
                    onChange={(e) => setTransferType(e.target.value as typeof transferType)}
                    className="w-4 h-4"
                  />
                  <label htmlFor={type.value} className="text-sm font-medium">
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview ITR</h3>
            <p className="text-sm text-gray-600">
              Transferring {selectedItem?.propertyNumber} to {toEmployee?.label}
            </p>
            {loadingPreview ? (
              <div>Generating preview...</div>
            ) : null}
          </div>
        );
    }
  };

  const getStepNumber = (step: Step) => {
    const steps: Step[] = ['selectItem', 'selectMovement', 'to', 'date', 'transferType', 'preview'];
    return steps.indexOf(step) + 1;
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 'selectItem': return !!selectedItem;
      case 'selectMovement': return !!selectedMovement;
      case 'to': return canProceedToEmployee;
      case 'date': return !!transferDate;
      case 'transferType': return !!transferType;
      case 'preview': return !!previewUrl;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!canGoNext()) return;

    switch (currentStep) {
      case 'selectItem': setCurrentStep('selectMovement'); break;
      case 'selectMovement': setCurrentStep('to'); break;
      case 'to': setCurrentStep('date'); break;
      case 'date': setCurrentStep('transferType'); break;
      case 'transferType': generatePreview(); break;
      case 'preview': setShowPreview(true); break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'selectMovement': setCurrentStep('selectItem'); break;
      case 'to': setCurrentStep('selectMovement'); break;
      case 'date': setCurrentStep('to'); break;
      case 'transferType': setCurrentStep('date'); break;
      case 'preview': setCurrentStep('transferType'); break;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Generate ITR - Step {getStepNumber(currentStep)} of 6
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {renderStepContent()}
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 'selectItem'}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canGoNext()}
            >
              {currentStep === 'preview' ? 'Generate ITR' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ItemSelectModal
        isOpen={currentStep === 'selectItem' && isOpen}
        onSelect={handleItemSelect}
        onClose={() => {}}
        groupType="SE"
      />

      <ItemMovementsModal
        isOpen={currentStep === 'selectMovement'}
        item={selectedItem}
        onConfirm={handleMovementSelect}
        onClose={() => {}}
      />

      <ReportPreviewModal
        isOpen={showPreview}
        pdfUrl={previewUrl}
        reportType="ITR"
        isLoading={loadingPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
