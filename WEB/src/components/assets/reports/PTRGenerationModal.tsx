import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search, FileText, Users, Package, Printer, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { cn } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { NormalizedEmployee, Asset } from '@/types/asset/UnifiedAsset';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getAllPTATransferList, getTransferDetailsByNumber } from '@/api/asset/transferApi';
import { PTRGenerator } from './PTRGenerator';
import { ptrPeopleFields } from './ptrReportData';
import { getEmployeeById } from '@/api/user-management/userApi';
import { normalizeEmployee } from '@/utils/employeeUtils';
import { toast } from 'sonner';

interface PTRGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: NormalizedEmployee[];
}

type Step = 'list' | 'details';

interface PTRRecord {
  ptrNumber: string;
  fromEmployee: string;
  toEmployee: string;
  itemCount: number;
  dateAssigned: string;
  transferType: string;
}

export function PTRGenerationModal({ isOpen, onClose, employees }: PTRGenerationModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('list');
  const [ptrRecords, setPtrRecords] = useState<PTRRecord[]>([]);
  const [ptrDetailsMap, setPtrDetailsMap] = useState<Map<string, any>>(new Map());
  const [selectedPTR, setSelectedPTR] = useState<string | null>(null);
  const [ptrDetails, setPtrDetails] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  // The official form leaves signature dates blank until the document is signed.
  const [signatureDate, setSignatureDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      resetModal();
      loadPTRRecords();
    }
    // Load once per opening; the API supplies report people and legacy details fetch the recipient by ID.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const resetModal = () => {
    setCurrentStep('list');
    setSelectedPTR(null);
    setPtrDetails(null);
    setSearchQuery('');
    setPreviewUrl('');
    setShowPreview(false);
    setSignatureDate('');
  };

  const loadPTRRecords = async () => {
    setLoading(true);
    try {
      const items = await getAllPTATransferList('PPE');
      const detailsMap = new Map<string, any>();
      const records: PTRRecord[] = [];
      for (const item of items) {
        const ptrNumber = item.ptrItrNumber?.trim();
        if (!ptrNumber) continue;
        const people = ptrPeopleFields(item, employees);
        detailsMap.set(ptrNumber, { ...item, ...people, rawEmployees: item,
          transferNumber: ptrNumber, transferType: item.status || '', items: [] });
        records.push({ ptrNumber, fromEmployee: people.fromEmployeeName,
          toEmployee: people.toEmployeeName, itemCount: Number(item.itemCount) || 0,
          dateAssigned: item.dateAssigned, transferType: item.status || '' });
      }
      setPtrRecords(records);
      setPtrDetailsMap(detailsMap);
    } catch (error) {
      setPtrRecords([]);
      toast.error('Unable to load PTR records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPTR = async (ptrNumber: string) => {
    const details = ptrDetailsMap.get(ptrNumber);
    if (!details) return;
    setLoadingDetails(true);
    setPtrDetails(null);
    try {
      const transferDetails = await getTransferDetailsByNumber(ptrNumber);
      const movements = transferDetails.movements || [];
      const representative = movements.find((m: any) => m.movementId === details.id) || movements[0];
      // New APIs return structured people on both list and details. Keep legacy
      // list slots only when the details endpoint does not return employee slots.
      const raw = representative && 'plantillaEmployeeId' in representative
        ? representative : details.rawEmployees;
      let people = ptrPeopleFields(raw, employees);
      // Older deployed APIs and a partially loaded parent employee list still
      // work: fetch the specific recipient instead of depending on page 1.
      if (people.toEmployeeId && !raw.plantillaEmployee && !raw.nonPlantillaEmployee) {
        const response = await getEmployeeById(people.toEmployeeId);
        const recipient = response.data?.find(e => Number(e.id) === people.toEmployeeId);
        if (recipient) people = ptrPeopleFields(raw, [...employees.filter(e => Number(e.id) !== people.toEmployeeId), normalizeEmployee(recipient)]);
      }
      const allItems: any[] = [];
      const seen = new Set<number>();
      for (const movement of movements) {
        for (const item of movement.items || []) {
          const id = Number(item.id);
          if (id > 0 && !seen.has(id)) {
            seen.add(id);
            allItems.push({ ...item, condition: movement.condition ?? item.condition ?? '' });
          }
        }
      }
      if (!allItems.length) throw new Error('No items were returned for this PTR.');
      setSelectedPTR(ptrNumber);
      setPtrDetails({ ...details, ...people, items: allItems,
        dateAssigned: representative?.dateAssigned || details.dateAssigned });
      setPtrRecords(records => records.map(record => record.ptrNumber === ptrNumber
        ? { ...record, fromEmployee: people.fromEmployeeName, toEmployee: people.toEmployeeName } : record));
      setCurrentStep('details');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load PTR details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const generatePreview = async () => {
    if (!ptrDetails) return;

    setLoadingPreview(true);
    try {
      const fromEmp: NormalizedEmployee = {
        id: ptrDetails.fromEmployeeId,
        firstName: ptrDetails.fromEmployee?.firstName || '',
        middleName: ptrDetails.fromEmployee?.middleName || '',
        lastName: ptrDetails.fromEmployee?.lastName || '',
        suffixName: ptrDetails.fromEmployee?.suffixName || '',
        employeeIdOriginal: '',
        employmentTypeId: 0,
        employmentTypeName: '',
        label: ptrDetails.fromEmployeeName
      };

      const toEmp: NormalizedEmployee = {
        id: ptrDetails.toEmployeeId,
        firstName: ptrDetails.toEmployee?.firstName || '',
        middleName: ptrDetails.toEmployee?.middleName || '',
        lastName: ptrDetails.toEmployee?.lastName || '',
        suffixName: ptrDetails.toEmployee?.suffixName || '',
        employeeIdOriginal: '',
        employmentTypeId: 0,
        employmentTypeName: '',
        label: ptrDetails.toEmployeeName
      };

      const nonPlantillaEmp: NormalizedEmployee | null = ptrDetails.nonPlantillaEmployee
        ? {
            id: ptrDetails.nonPlantillaEmployeeId || 0,
            firstName: ptrDetails.nonPlantillaEmployee.firstName || '',
            middleName: ptrDetails.nonPlantillaEmployee.middleName || '',
            lastName: ptrDetails.nonPlantillaEmployee.lastName || '',
            suffixName: ptrDetails.nonPlantillaEmployee.suffixName || '',
            employeeIdOriginal: '',
            employmentTypeId: 0,
            employmentTypeName: '',
            label: ptrDetails.nonPlantillaEmployeeName || '',
          }
        : null;

      const url = await PTRGenerator.generatePTRPreviewMultiple(
        fromEmp,
        toEmp,
        ptrDetails.items,
        ptrDetails.dateAssigned,
        ptrDetails.transferType || 'REASSIGNMENT',
        ptrDetails.transferNumber,
        signatureDate,
        nonPlantillaEmp,
        ptrDetails.toEmployeePositionOffice || ''
      );
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = async () => {
    if (!ptrDetails) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const fromEmp: NormalizedEmployee = {
        id: ptrDetails.fromEmployeeId,
        firstName: ptrDetails.fromEmployee?.firstName || '',
        middleName: ptrDetails.fromEmployee?.middleName || '',
        lastName: ptrDetails.fromEmployee?.lastName || '',
        suffixName: ptrDetails.fromEmployee?.suffixName || '',
        employeeIdOriginal: '',
        employmentTypeId: 0,
        employmentTypeName: '',
        label: ptrDetails.fromEmployeeName
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const toEmp: NormalizedEmployee = {
        id: ptrDetails.toEmployeeId,
        firstName: ptrDetails.toEmployee?.firstName || '',
        middleName: ptrDetails.toEmployee?.middleName || '',
        lastName: ptrDetails.toEmployee?.lastName || '',
        suffixName: ptrDetails.toEmployee?.suffixName || '',
        employeeIdOriginal: '',
        employmentTypeId: 0,
        employmentTypeName: '',
        label: ptrDetails.toEmployeeName
      };

      const blob = await fetch(previewUrl).then(r => r.blob());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedPTR}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      setShowPreview(false);
      onClose();
    } catch (error) {
      console.error('Failed to download PTR:', error);
    }
  };

  const handleDownloadExcel = async () => {
    if (!ptrDetails) return;

    const fromEmp: NormalizedEmployee = {
      id: ptrDetails.fromEmployeeId,
      firstName: ptrDetails.fromEmployee?.firstName || '',
      middleName: ptrDetails.fromEmployee?.middleName || '',
      lastName: ptrDetails.fromEmployee?.lastName || '',
      suffixName: ptrDetails.fromEmployee?.suffixName || '',
      employeeIdOriginal: '',
      employmentTypeId: 0,
      employmentTypeName: '',
      label: ptrDetails.fromEmployeeName
    };

    const toEmp: NormalizedEmployee = {
      id: ptrDetails.toEmployeeId,
      firstName: ptrDetails.toEmployee?.firstName || '',
      middleName: ptrDetails.toEmployee?.middleName || '',
      lastName: ptrDetails.toEmployee?.lastName || '',
      suffixName: ptrDetails.toEmployee?.suffixName || '',
      employeeIdOriginal: '',
      employmentTypeId: 0,
      employmentTypeName: '',
      label: ptrDetails.toEmployeeName
    };

    const nonPlantillaEmp: NormalizedEmployee | null = ptrDetails.nonPlantillaEmployee
      ? {
          id: ptrDetails.nonPlantillaEmployeeId || 0,
          firstName: ptrDetails.nonPlantillaEmployee.firstName || '',
          middleName: ptrDetails.nonPlantillaEmployee.middleName || '',
          lastName: ptrDetails.nonPlantillaEmployee.lastName || '',
          suffixName: ptrDetails.nonPlantillaEmployee.suffixName || '',
          employeeIdOriginal: '',
          employmentTypeId: 0,
          employmentTypeName: '',
          label: ptrDetails.nonPlantillaEmployeeName || '',
        }
      : null;

    await PTRGenerator.generateExcelFromDetails(
      fromEmp,
      toEmp,
      ptrDetails.items,
      ptrDetails.dateAssigned,
      ptrDetails.transferType || 'REASSIGNMENT',
      ptrDetails.transferNumber,
      nonPlantillaEmp,
      ptrDetails.toEmployeePositionOffice || ''
    );
  };

  const handleBack = () => {
    if (currentStep === 'details') {
      setCurrentStep('list');
      setSelectedPTR(null);
      setPtrDetails(null);
    }
  };

  const filteredPTRs = ptrRecords.filter(ptr =>
    ptr.ptrNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ptr.fromEmployee.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ptr.toEmployee.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'list':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Property Transfer Records (PTR)</h3>
              <span className="text-sm text-gray-500">{filteredPTRs.length} record(s)</span>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search PTR number, from/to employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading PTR records...</div>
            ) : filteredPTRs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border rounded-lg">
                No PTR records found
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {filteredPTRs.map((ptr) => (
                  <button
                    key={ptr.ptrNumber}
                    onClick={() => handleSelectPTR(ptr.ptrNumber)}
                    className="w-full p-4 text-left border rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors"
                    disabled={loadingDetails}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-orange-600" />
                          <span className="font-semibold text-sm">{ptr.ptrNumber}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Users className="w-3 h-3" />
                          <span>{ptr.fromEmployee}</span>
                          <ChevronRight className="w-3 h-3" />
                          <span>{ptr.toEmployee}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            <span>{ptr.itemCount} item(s)</span>
                          </div>
                          <span>{format(new Date(ptr.dateAssigned), 'MMMM d, yyyy')}</span>
                        </div>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'details':
        if (!ptrDetails) {
          return (
            <div className="text-center py-8 text-gray-500">Loading PTR details...</div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold">{selectedPTR}</h3>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">FROM</label>
                <p className="text-sm font-semibold">{ptrDetails.fromEmployeeName}</p>
              </div>
              
              <div className="flex items-center justify-center">
                <ChevronRight className="w-5 h-5 text-orange-600" />
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500">TO</label>
                <p className="text-sm font-semibold">{ptrDetails.toEmployeeName}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <label className="text-xs font-medium text-gray-500">Date</label>
                  <p className="text-sm">{format(new Date(ptrDetails.dateAssigned), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Type</label>
                  <p className="text-sm">{ptrDetails.transferType || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Items ({ptrDetails.items?.length || 0})
              </label>
              <div className="max-h-[30vh] overflow-y-auto space-y-2">
                {ptrDetails.items?.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-lg bg-white">
                    <p className="text-sm font-medium">{item.propertyNumber}</p>
                    <p className="text-xs text-gray-600">{item.description}</p>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      <span>₱{item.unitValue?.toLocaleString() || '0'}</span>
                      <span>•</span>
                      <span>{item.condition || 'Good'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1 pt-2">
              <label className="text-sm font-medium text-gray-700">Signature Date</label>
              <Input
                type="date"
                value={signatureDate}
                onChange={(e) => setSignatureDate(e.target.value)}
              />
            </div>          </div>
        );
    }
  };

  return (
    <>
      {/* Hide the dialog when preview is open */}
      {!showPreview && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-3xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>
                {currentStep === 'list' ? 'Select PTR Record' : `PTR Details - ${selectedPTR}`}
              </DialogTitle>
            </DialogHeader>

            <div className="py-4">
              {renderStepContent()}
            </div>

            <div className="flex justify-between gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 'list' || loadingDetails}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {currentStep === 'details' && (
                <Button
                  onClick={generatePreview}
                  disabled={!ptrDetails || loadingPreview}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Fullscreen Preview for PTR */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center">
          <div className="w-full max-w-6xl h-[90vh] flex flex-col bg-white rounded-lg shadow-xl relative">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-orange-600" />
                <span className="font-semibold text-lg text-slate-900">Preview Report - {selectedPTR}</span>
              </div>
              <button
                className="ml-auto text-slate-500 hover:text-red-600 transition-colors"
                onClick={() => setShowPreview(false)}
                disabled={loadingPreview}
                aria-label="Close Preview"
              >
                <ChevronLeft className="size-6" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
              {loadingPreview ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-4">
                    <ChevronRight className="size-8 animate-spin text-orange-600" />
                    <p className="text-muted-foreground">Generating preview...</p>
                  </div>
                </div>
              ) : previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-none"
                  title="PTR Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No preview available</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <Button variant="outline" onClick={() => setShowPreview(false)} disabled={loadingPreview}>
                <ChevronLeft className="size-4 mr-2" />
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (!previewUrl) return;
                  const w = window.open(previewUrl);
                  if (w) { w.addEventListener('load', () => w.print()); }
                }}
                disabled={loadingPreview || !previewUrl}
              >
                <Printer className="size-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" onClick={handleDownloadExcel} disabled={loadingPreview || !previewUrl}>
                <FileSpreadsheet className="size-4 mr-2" />
                Export to Excel
              </Button>
              <Button onClick={handleDownload} disabled={loadingPreview || !previewUrl} className="bg-orange-600 hover:bg-orange-700">
                <FileText className="size-4 mr-2" />
                Save as PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
