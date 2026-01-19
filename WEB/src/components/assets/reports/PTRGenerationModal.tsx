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
import { PTRGenerator } from './PTRGenerator';
import { ReportPreviewModal } from './ReportPreviewModal';

interface PTRGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: NormalizedEmployee[];
}

type Step = 'from' | 'to' | 'date' | 'transferType' | 'assets' | 'preview';

export function PTRGenerationModal({ isOpen, onClose, employees }: PTRGenerationModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('from');
  const [fromEmployee, setFromEmployee] = useState<NormalizedEmployee | null>(null);
  const [toEmployee, setToEmployee] = useState<NormalizedEmployee | null>(null);
  const [transferDate, setTransferDate] = useState<Date>(new Date());
  const [transferType, setTransferType] = useState<'DONATION' | 'REASSIGNMENT' | 'RELOCATE' | 'OTHERS'>('REASSIGNMENT');
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [toSearch, setToSearch] = useState('');
  const [fromSearch, setFromSearch] = useState('');

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
    setTransferType('REASSIGNMENT');
    setPreviewUrl('');
    setShowPreview(false);
    setAvailableAssets([]);
    setSelectedAssets([]);
    setFromSearch('');
    setToSearch('');
  };

  const handleFromEmployeeSelect = async (emp: NormalizedEmployee) => {
    setFromEmployee(emp);
    setFromSearch('');
    
    // Load assets for this employee
    setLoadingAssets(true);
    try {
      const assets = await getEmployeeAssets(emp.id, 'PPE');
      setAvailableAssets(assets);
    } catch (error) {
      console.error('Failed to load employee assets:', error);
    } finally {
      setLoadingAssets(false);
    }
    
    setCurrentStep('to');
  };

  const handleToEmployeeSelect = (emp: NormalizedEmployee) => {
    setToEmployee(emp);
    setToSearch('');
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
      setSelectedAssets([...selectedAssets, asset]);
    } else {
      setSelectedAssets(selectedAssets.filter(a => a.id !== asset.id));
    }
  };

  const handleAssetsNext = () => {
    if (selectedAssets.length > 0) {
      generatePreview();
    }
  };

  const generatePreview = async () => {
    if (!fromEmployee || !toEmployee) return;

    setLoadingPreview(true);
    try {
      const dateStr = format(transferDate, 'yyyy-MM-dd');
      const url = await PTRGenerator.generatePTRPreviewMultiple(
        fromEmployee,
        toEmployee,
        selectedAssets,
        dateStr,
        transferType
      );
      setPreviewUrl(url);
      setCurrentStep('preview');
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirm = async () => {
    if (!fromEmployee || !toEmployee) return;

    try {
      const dateStr = format(transferDate, 'PPP');
      await PTRGenerator.generatePTRMultiple(
        fromEmployee,
        toEmployee,
        selectedAssets,
        dateStr,
        transferType
      );
      onClose();
    } catch (error) {
      console.error('Failed to generate PTR:', error);
    }
  };

  const getStepNumber = (step: Step) => {
    const steps: Step[] = ['from', 'to', 'date', 'transferType', 'assets', 'preview'];
    return steps.indexOf(step) + 1;
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 'from': return !!fromEmployee;
      case 'to': return !!toEmployee;
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
                  disabled={loadingAssets}
                >
                  {emp.label}
                </button>
              ))}
            </div>
            {loadingAssets && <div className="text-sm text-gray-500">Loading assets...</div>}
          </div>
        );

      case 'to':
        const filteredToEmployees = employees
          .filter(emp => emp.id !== fromEmployee?.id)
          .filter(emp => emp.label.toLowerCase().includes(toSearch.toLowerCase()));

        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select TO Employee</h3>
            <p className="text-sm text-gray-600">
              From: {fromEmployee?.label}
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
              {fromEmployee?.label} → {toEmployee?.label}
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
              {fromEmployee?.label} → {toEmployee?.label} on {format(transferDate, "PPP")}
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
            <h3 className="text-lg font-semibold">Select Items to Transfer</h3>
            <p className="text-sm text-gray-600">
              {fromEmployee?.label} has {availableAssets.length} item(s) available
            </p>
            {availableAssets.length === 0 ? (
              <div className="p-4 text-center text-gray-500 border rounded-lg">
                No items available for this employee
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 border-b mb-2">
                  <Checkbox
                    checked={selectedAssets.length === availableAssets.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedAssets(availableAssets);
                      } else {
                        setSelectedAssets([]);
                      }
                    }}
                  />
                  <span className="text-sm font-medium">
                    Select All ({selectedAssets.length}/{availableAssets.length})
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {availableAssets.map(asset => (
                    <div key={asset.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        checked={selectedAssets.some(a => a.id === asset.id)}
                        onCheckedChange={(checked) =>
                          handleAssetToggle(asset, checked as boolean)
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {asset.propertyNumber}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {asset.description}
                        </p>
                      </div>
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
            <h3 className="text-lg font-semibold">Preview PTR</h3>
            <div className="space-y-2 text-sm bg-slate-50 p-4 rounded-lg">
              <p>
                <strong>From:</strong> {fromEmployee?.label}
              </p>
              <p>
                <strong>To:</strong> {toEmployee?.label}
              </p>
              <p>
                <strong>Date:</strong> {format(transferDate, "PPP")}
              </p>
              <p>
                <strong>Type:</strong> {transferType}
              </p>
              <p>
                <strong>Items:</strong> {selectedAssets.length} item(s)
              </p>
            </div>
            {loadingPreview ? (
              <div className="text-sm text-gray-500">Generating preview...</div>
            ) : null}
          </div>
        );
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Generate PTR - Step {getStepNumber(currentStep)} of 6
              </DialogTitle>
            </DialogHeader>

            {/* Make the main step area scrollable so long lists don't push the footer off-screen */}
            <div className="py-4 max-h-[60vh] overflow-y-auto">
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
                {currentStep === 'preview' ? 'Generate PTR' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </DialogContent>
      </Dialog>

      <ReportPreviewModal
        isOpen={showPreview}
        pdfUrl={previewUrl}
        reportType="PTR"
        isLoading={loadingPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
