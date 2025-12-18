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

import { NormalizedEmployee, Asset } from '@/types/asset/UnifiedAsset';
import { getEmployeeAssets } from '@/api/inventoryApi';
import { ITRGenerator } from './ITRGenerator';
import { ReportPreviewModal } from './ReportPreviewModal';

interface ITRGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: NormalizedEmployee[];
}

type Step = 'from' | 'to' | 'date' | 'transferType' | 'assets' | 'preview';

export function ITRGenerationModal({ isOpen, onClose, employees }: ITRGenerationModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('from');
  const [fromEmployee, setFromEmployee] = useState<NormalizedEmployee | null>(null);
  const [toEmployee, setToEmployee] = useState<NormalizedEmployee | null>(null);
  const [transferDate, setTransferDate] = useState<Date>(new Date());
  const [transferType, setTransferType] = useState<'DONATION' | 'REASSIGNMENT' | 'RELOCATE' | 'OTHERS'>('REASSIGNMENT');
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      resetModal();
    }
  }, [isOpen]);

  const resetModal = () => {
    setCurrentStep('from');
    setFromEmployee(null);
    setToEmployee(null);
    setTransferDate(new Date());
    setAvailableAssets([]);
    setSelectedAssets([]);
    setPreviewUrl('');
    setShowPreview(false);
  };

  const handleFromEmployeeSelect = async (emp: NormalizedEmployee) => {
    setFromEmployee(emp);
    setLoadingAssets(true);

    try {
      // Fetch SE assets
      const seAssets = await getEmployeeAssets(emp.id, 'SE');
      setAvailableAssets(seAssets);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      setAvailableAssets([]);
    }

    setLoadingAssets(false);
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

  const handleAssetToggle = (asset: Asset, checked: boolean) => {
    if (checked) {
      setSelectedAssets(prev => [...prev, asset]);
    } else {
      setSelectedAssets(prev => prev.filter(a => a.id !== asset.id));
    }
  };

  const handleAssetsNext = () => {
    if (selectedAssets.length === 0) {
      alert('Please select at least one asset');
      return;
    }
    setCurrentStep('preview');
    generatePreview();
  };

  const generatePreview = async () => {
    if (!fromEmployee || !toEmployee) return;

    setLoadingPreview(true);
    try {
      const url = await ITRGenerator.generateITRPreview(
        fromEmployee,
        toEmployee,
        transferDate.toISOString().slice(0, 10),
        selectedAssets,
        transferType
      );
      setPreviewUrl(url);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
    setLoadingPreview(false);
  };

  const handleConfirm = async () => {
    if (!fromEmployee || !toEmployee) return;

    try {
      await ITRGenerator.generateITR(
        fromEmployee,
        toEmployee,
        transferDate.toISOString().slice(0, 10),
        selectedAssets,
        transferType
      );
      onClose();
    } catch (error) {
      console.error('Failed to generate ITR:', error);
    }
  };

  const canProceedFromTo = fromEmployee && toEmployee && fromEmployee.id !== toEmployee.id;

  const renderStepContent = () => {
    switch (currentStep) {
      case 'from':
        const filteredFromEmployees = employees.filter(emp =>
          emp.label.toLowerCase().includes(fromSearch.toLowerCase())
        );
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select FROM Employee</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search employees..."
                value={fromSearch}
                onChange={(e) => setFromSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {filteredFromEmployees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => handleFromEmployeeSelect(emp)}
                  className="p-3 text-left border rounded hover:bg-gray-50"
                >
                  {emp.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'to':
        const filteredToEmployees = employees
          .filter(emp => emp.id !== fromEmployee?.id)
          .filter(emp => emp.label.toLowerCase().includes(toSearch.toLowerCase()));
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select TO Employee</h3>
            <p className="text-sm text-gray-600">From: {fromEmployee?.label}</p>
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
              From: {fromEmployee?.label} → To: {toEmployee?.label}
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
              From: {fromEmployee?.label} → To: {toEmployee?.label} on {format(transferDate, "PPP")}
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

      case 'assets':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Assets to Transfer</h3>
            <p className="text-sm text-gray-600">
              From: {fromEmployee?.label} → To: {toEmployee?.label} on {format(transferDate, "PPP")}
            </p>
            {loadingAssets ? (
              <div>Loading assets...</div>
            ) : availableAssets.length === 0 ? (
              <div>No assets found for this employee</div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all-assets"
                    checked={selectedAssets.length === availableAssets.length && availableAssets.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedAssets(availableAssets);
                      } else {
                        setSelectedAssets([]);
                      }
                    }}
                  />
                  <label
                    htmlFor="select-all-assets"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Select All
                  </label>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {availableAssets.map(asset => (
                    <div key={asset.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`asset-${asset.id}`}
                        checked={selectedAssets.some(a => a.id === asset.id)}
                        onCheckedChange={(checked) =>
                          handleAssetToggle(asset, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`asset-${asset.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {asset.propertyNumber} - {asset.description}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview ITR</h3>
            <p className="text-sm text-gray-600">
              Transferring {selectedAssets.length} asset(s) from {fromEmployee?.label} to {toEmployee?.label}
            </p>
            {loadingPreview ? (
              <div>Generating preview...</div>
            ) : (
              <ReportPreviewModal
                isOpen={showPreview}
                pdfUrl={previewUrl}
                reportType="ITR"
                isLoading={false}
                onClose={() => setShowPreview(false)}
                onConfirm={handleConfirm}
              />
            )}
          </div>
        );
    }
  };

  const getStepNumber = (step: Step) => {
    const steps: Step[] = ['from', 'to', 'date', 'transferType', 'assets', 'preview'];
    return steps.indexOf(step) + 1;
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 'from': return !!fromEmployee;
      case 'to': return canProceedFromTo;
      case 'date': return !!transferDate;
      case 'transferType': return !!transferType;
      case 'assets': return selectedAssets.length > 0;
      case 'preview': return !!previewUrl;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!canGoNext()) return;

    switch (currentStep) {
      case 'from': setCurrentStep('to'); break;
      case 'to': setCurrentStep('date'); break;
      case 'date': setCurrentStep('transferType'); break;
      case 'transferType': setCurrentStep('assets'); break;
      case 'assets': handleAssetsNext(); break;
      case 'preview': setShowPreview(true); break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'to': setCurrentStep('from'); break;
      case 'date': setCurrentStep('to'); break;
      case 'transferType': setCurrentStep('date'); break;
      case 'assets': setCurrentStep('transferType'); break;
      case 'preview': setCurrentStep('assets'); break;
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
              disabled={currentStep === 'from'}
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
