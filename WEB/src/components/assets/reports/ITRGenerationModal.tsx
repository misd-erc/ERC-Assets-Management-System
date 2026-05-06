import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search, FileText, Users, Package, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import { NormalizedEmployee, Asset } from '@/types/asset/UnifiedAsset';
import { getITRTransferList, getTransferDetailsByNumber } from '@/api/asset/transferApi';
import { ITRGenerator } from './ITRGenerator';

interface ITRGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: NormalizedEmployee[];
}

type Step = 'list' | 'details';

interface ITRRecord {
  itrNumber: string;
  fromEmployee: string;
  toEmployee: string;
  itemCount: number;
  dateAssigned: string;
  transferType: string;
}

export function ITRGenerationModal({ isOpen, onClose, employees }: ITRGenerationModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('list');
  const [itrRecords, setItrRecords] = useState<ITRRecord[]>([]);
  const [itrDetailsMap, setItrDetailsMap] = useState<Map<string, any>>(new Map());
  const [selectedITR, setSelectedITR] = useState<string | null>(null);
  const [itrDetails, setItrDetails] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (isOpen) {
      resetModal();
      loadITRRecords();
    }
  }, [isOpen]);

  const resetModal = () => {
    setCurrentStep('list');
    setSelectedITR(null);
    setItrDetails(null);
    setSearchQuery('');
    setPreviewUrl('');
    setShowPreview(false);
    setSignatureDate(new Date().toISOString().slice(0, 10));
  };

  const loadITRRecords = async () => {
    setLoading(true);
    try {
      const response = await getITRTransferList(1, 1000);
      console.log('ITR Transfer List Response:', response);
      console.log('ITR Items:', response.items);

      // Create a map to store full details by ITR number
      const detailsMap = new Map();

      // Group by ITR number
      const grouped = response.items?.reduce((acc: any, item: any) => {
        const itrNum = item.ptrItrNumber;
        if (!itrNum) return acc;

        const existing = acc[itrNum];
        const existingDetails = detailsMap.get(itrNum);

        const mergeItems = (base: any[], incoming: any[]) => {
          const merged = [...(base || [])];
          (incoming || []).forEach(it => {
            const found = merged.find(m => (m.id != null && m.id === it.id) || (m.propertyNumber && m.propertyNumber === it.propertyNumber));
            if (!found) merged.push(it);
          });
          return merged;
        };

        // transfer/list returns a single `item` object per movement row
        const incomingItems = item.item ? [item.item] : [];
        const mergedItems = mergeItems(existingDetails?.items || [], incomingItems);

        // Resolve to employee name string and id
        const toEmpFullName = item.plantillaEmployeeName || item.nonPlantillaEmployeeName || 'Unknown';
        const toEmpId = item.plantillaEmployeeId ?? item.nonPlantillaEmployeeId;

        // Split full name into parts for the PDF generator
        const toEmpParts = toEmpFullName.trim().split(/\s+/);
        const toEmpObj = {
          firstName: toEmpParts[0] || '',
          middleName: toEmpParts.length > 2 ? toEmpParts.slice(1, -1).join(' ') : '',
          lastName: toEmpParts.length > 1 ? toEmpParts[toEmpParts.length - 1] : ''
        };

        // Track non-plantilla employee separately for Sub-ICS
        const nonPlantillaFullName = item.nonPlantillaEmployeeName || null;
        const nonPlantillaId = item.nonPlantillaEmployeeId || null;
        const nonPlantillaParts = nonPlantillaFullName ? nonPlantillaFullName.trim().split(/\s+/) : null;
        const nonPlantillaObj = nonPlantillaParts ? {
          firstName: nonPlantillaParts[0] || '',
          middleName: nonPlantillaParts.length > 2 ? nonPlantillaParts.slice(1, -1).join(' ') : '',
          lastName: nonPlantillaParts.length > 1 ? nonPlantillaParts[nonPlantillaParts.length - 1] : ''
        } : null;

        const baseRecord = existing || {
          itrNumber: itrNum,
          fromEmployee: existingDetails?.fromEmployeeName || 'N/A',
          toEmployee: toEmpFullName,
          itemCount: 0,
          dateAssigned: item.dateAssigned,
          transferType: item.status || 'N/A'
        };

        const updatedRecord = {
          ...baseRecord,
          toEmployee: toEmpFullName,
          itemCount: mergedItems.length,
          dateAssigned: baseRecord.dateAssigned || item.dateAssigned,
          transferType: baseRecord.transferType || item.status || 'N/A'
        };

        acc[itrNum] = updatedRecord;

        detailsMap.set(itrNum, {
          transferNumber: itrNum,
          transferType: updatedRecord.transferType || 'TRANSFER',
          fromEmployeeId: existingDetails?.fromEmployeeId,
          fromEmployeeName: existingDetails?.fromEmployeeName || 'N/A',
          fromEmployee: existingDetails?.fromEmployee || { firstName: 'N/A', middleName: '', lastName: '' },
          toEmployeeId: toEmpId ?? existingDetails?.toEmployeeId,
          toEmployeeName: toEmpFullName,
          toEmployee: toEmpObj,
          nonPlantillaEmployeeId: nonPlantillaId ?? existingDetails?.nonPlantillaEmployeeId,
          nonPlantillaEmployeeName: nonPlantillaFullName ?? existingDetails?.nonPlantillaEmployeeName,
          nonPlantillaEmployee: nonPlantillaObj ?? existingDetails?.nonPlantillaEmployee,
          items: mergedItems,
          dateAssigned: updatedRecord.dateAssigned,
          remarks: item.remarks || existingDetails?.remarks,
          status: item.status || existingDetails?.status
        });

        return acc;
      }, {});

      console.log('Grouped ITR records:', grouped);
      const records = Object.values(grouped || {}) as ITRRecord[];
      console.log('Final ITR records array:', records);
      setItrRecords(records);
      setItrDetailsMap(detailsMap);
    } catch (error) {
      console.error('Failed to load ITR records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectITR = async (itrNumber: string) => {
    setSelectedITR(itrNumber);
    
    // Use the details we already loaded instead of making another API call
    const details = itrDetailsMap.get(itrNumber);
    if (details) {
      setItrDetails(details);
      setCurrentStep('details');
    }
  };

  const generatePreview = async () => {
    if (!itrDetails) return;

    setLoadingPreview(true);
    try {
      const fromEmp: NormalizedEmployee = {
        id: itrDetails.fromEmployeeId,
        firstName: itrDetails.fromEmployee?.firstName || '',
        middleName: itrDetails.fromEmployee?.middleName || '',
        lastName: itrDetails.fromEmployee?.lastName || '',
        suffixName: itrDetails.fromEmployee?.suffixName || '',
        employeeIdOriginal: '',
        employmentTypeId: 0,
        employmentTypeName: '',
        label: itrDetails.fromEmployeeName
      };

      const toEmp: NormalizedEmployee = {
        id: itrDetails.toEmployeeId,
        firstName: itrDetails.toEmployee?.firstName || '',
        middleName: itrDetails.toEmployee?.middleName || '',
        lastName: itrDetails.toEmployee?.lastName || '',
        suffixName: itrDetails.toEmployee?.suffixName || '',
        employeeIdOriginal: '',
        employmentTypeId: 0,
        employmentTypeName: '',
        label: itrDetails.toEmployeeName
      };

      const nonPlantillaEmp: NormalizedEmployee | null = itrDetails.nonPlantillaEmployee
        ? {
            id: itrDetails.nonPlantillaEmployeeId || 0,
            firstName: itrDetails.nonPlantillaEmployee.firstName || '',
            middleName: itrDetails.nonPlantillaEmployee.middleName || '',
            lastName: itrDetails.nonPlantillaEmployee.lastName || '',
            suffixName: '',
            employeeIdOriginal: '',
            employmentTypeId: 0,
            employmentTypeName: '',
            label: itrDetails.nonPlantillaEmployeeName || '',
          }
        : null;

      const url = await ITRGenerator.generateITRPreviewMultiple(
        fromEmp,
        toEmp,
        itrDetails.items,
        itrDetails.dateAssigned,
        itrDetails.transferType || 'REASSIGNMENT',
        itrDetails.transferNumber,
        signatureDate,
        nonPlantillaEmp
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
    if (!itrDetails) return;

    try {
      const fromEmp: NormalizedEmployee = {
        id: itrDetails.fromEmployeeId,
        firstName: itrDetails.fromEmployee?.firstName || '',
        middleName: itrDetails.fromEmployee?.middleName || '',
        lastName: itrDetails.fromEmployee?.lastName || '',
        suffixName: itrDetails.fromEmployee?.suffixName || '',
        employeeIdOriginal: '',
        employmentTypeId: 0,
        employmentTypeName: '',
        label: itrDetails.fromEmployeeName
      };

      const toEmp: NormalizedEmployee = {
        id: itrDetails.toEmployeeId,
        firstName: itrDetails.toEmployee?.firstName || '',
        middleName: itrDetails.toEmployee?.middleName || '',
        lastName: itrDetails.toEmployee?.lastName || '',
        suffixName: itrDetails.toEmployee?.suffixName || '',
        employeeIdOriginal: '',
        employmentTypeId: 0,
        employmentTypeName: '',
        label: itrDetails.toEmployeeName
      };

      const blob = await fetch(previewUrl).then(r => r.blob());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedITR}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      setShowPreview(false);
      onClose();
    } catch (error) {
      console.error('Failed to download ITR:', error);
    }
  };

  const handleBack = () => {
    if (currentStep === 'details') {
      setCurrentStep('list');
      setSelectedITR(null);
      setItrDetails(null);
    }
  };

  const filteredITRs = itrRecords.filter(itr =>
    itr.itrNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    itr.fromEmployee.toLowerCase().includes(searchQuery.toLowerCase()) ||
    itr.toEmployee.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'list':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Inventory Transfer Records (ITR)</h3>
              <span className="text-sm text-gray-500">{filteredITRs.length} record(s)</span>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search ITR number, from/to employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading ITR records...</div>
            ) : filteredITRs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border rounded-lg">
                No ITR records found
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {filteredITRs.map((itr) => (
                  <button
                    key={itr.itrNumber}
                    onClick={() => handleSelectITR(itr.itrNumber)}
                    className="w-full p-4 text-left border rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-colors"
                    disabled={loadingDetails}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-teal-600" />
                          <span className="font-semibold text-sm">{itr.itrNumber}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Users className="w-3 h-3" />
                          <span>{itr.fromEmployee}</span>
                          <ChevronRight className="w-3 h-3" />
                          <span>{itr.toEmployee}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            <span>{itr.itemCount} item(s)</span>
                          </div>
                          <span>{format(new Date(itr.dateAssigned), 'MMM dd, yyyy')}</span>
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
        if (!itrDetails) {
          return (
            <div className="text-center py-8 text-gray-500">Loading ITR details...</div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold">{selectedITR}</h3>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">FROM</label>
                <p className="text-sm font-semibold">{itrDetails.fromEmployeeName}</p>
              </div>
              
              <div className="flex items-center justify-center">
                <ChevronRight className="w-5 h-5 text-teal-600" />
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500">TO</label>
                <p className="text-sm font-semibold">{itrDetails.toEmployeeName}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <label className="text-xs font-medium text-gray-500">Date</label>
                  <p className="text-sm">{format(new Date(itrDetails.dateAssigned), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Type</label>
                  <p className="text-sm">{itrDetails.transferType || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Items ({itrDetails.items?.length || 0})
              </label>
              <div className="max-h-[30vh] overflow-y-auto space-y-2">
                {itrDetails.items?.map((item: any, idx: number) => (
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

      default:
        return null;
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
                {currentStep === 'list' ? 'Select ITR Record' : `ITR Details - ${selectedITR}`}
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
                  disabled={!itrDetails || loadingPreview}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Fullscreen Preview for ITR */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center">
          <div className="w-full max-w-6xl h-[90vh] flex flex-col bg-white rounded-lg shadow-xl relative">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <ChevronRight className="size-5 text-teal-600" />
                <span className="font-semibold text-lg text-slate-900">Preview Inventory Transfer Report (ITR)</span>
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
                    <ChevronRight className="size-8 animate-spin text-teal-600" />
                    <p className="text-muted-foreground">Generating preview...</p>
                  </div>
                </div>
              ) : previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] border-none rounded-b-lg"
                  title="ITR Preview"
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
              <Button onClick={handleDownload} disabled={loadingPreview || !previewUrl} className="bg-teal-600 hover:bg-teal-700">
                <ChevronRight className="size-4 mr-2" />
                Save as PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
