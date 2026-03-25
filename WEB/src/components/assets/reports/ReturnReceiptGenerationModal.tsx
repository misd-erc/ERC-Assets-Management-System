import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { getRRPPEMovements, getRRSPMovements } from '@/api/asset/transferApi';
import { ReturnReceiptGenerator } from './ReturnReceiptGenerator';

type ReturnType = 'RRPPE' | 'RRSP';

interface ReturnReceiptGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnType: ReturnType;
}

type Step = 'list' | 'details';

interface ReturnRecord {
  number: string;
  returnedBy: string;
  itemCount: number;
  dateAssigned: string;
}

export function ReturnReceiptGenerationModal({ isOpen, onClose, returnType }: ReturnReceiptGenerationModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('list');
  const [records, setRecords] = useState<ReturnRecord[]>([]);
  const [detailsMap, setDetailsMap] = useState<Map<string, any>>(new Map());
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (isOpen) {
      resetState();
      loadRecords();
    }
  }, [isOpen]);

  const resetState = () => {
    setCurrentStep('list');
    setRecords([]);
    setDetailsMap(new Map());
    setSelected(null);
    setDetails(null);
    setSearch('');
    setPreviewUrl('');
    setShowPreview(false);
    setSignatureDate(new Date().toISOString().slice(0, 10));
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const apiFn = returnType === 'RRPPE' ? getRRPPEMovements : getRRSPMovements;
      const response = await apiFn(undefined, 1, 1000);

      const grouped = new Map<string, ReturnRecord>();
      const detailMap = new Map<string, any>();

      (response.items || []).forEach((item: any) => {
        const number = item.rrppeRrspNumber || item.rrpperrspNumber || '';
        if (!number || !number.toUpperCase().startsWith(returnType)) return;

        const existingDetail = detailMap.get(number);
        const mergedItems = [...(existingDetail?.items || []), ...(item.items || [])];
        const uniqueItems = mergedItems.reduce((acc: any[], it: any) => {
          const exists = acc.find(x => (x.id != null && x.id === it.id) || (x.propertyNumber && x.propertyNumber === it.propertyNumber));
          if (!exists) acc.push(it);
          return acc;
        }, []);

        const returnedBy = item.employee?.[0]?.fullName || existingDetail?.returnedBy || 'Unknown';

        detailMap.set(number, {
          number,
          items: uniqueItems,
          dateAssigned: item.dateAssigned || existingDetail?.dateAssigned,
          returnedBy,
          returnedByPosition: item.employee?.[0]?.position?.name || item.employee?.[0]?.employeeType || existingDetail?.returnedByPosition || '',
        });

        grouped.set(number, {
          number,
          returnedBy,
          itemCount: uniqueItems.length,
          dateAssigned: item.dateAssigned,
        });
      });

      setRecords(Array.from(grouped.values()));
      setDetailsMap(detailMap);
    } catch (err) {
      console.error('Failed to load return records', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(r => r.number.toLowerCase().includes(q));
  }, [records, search]);

  const handleSelect = (number: string) => {
    setSelected(number);
    const d = detailsMap.get(number);
    setDetails(d || null);
    setCurrentStep('details');
  };

  const generatePreview = async () => {
    if (!details) return;
    setLoadingPreview(true);
    try {
      const url = await ReturnReceiptGenerator.generateReturnPreview(
        returnType,
        details.items || [],
        details.number,
        details.dateAssigned || new Date().toISOString(),
        details.returnedBy,
        details.returnedByPosition,
        undefined,
        signatureDate
      );
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (err) {
      console.error('Failed to generate return receipt preview', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const download = async () => {
    if (!details) return;
    const blob = await fetch(previewUrl).then(r => r.blob());
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = `${details.number || returnType}-receipt.pdf`;
    a.click();
    URL.revokeObjectURL(dlUrl);
  };

  const title = returnType === 'RRPPE' ? 'RRPPE Returns' : 'RRSP Returns';

  const renderStepContent = () => {
    if (currentStep === 'list') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Select {returnType} Record</h3>
            <span className="text-sm text-muted-foreground">{filteredRecords.length} record(s)</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 h-4 w-4" />
            <Input
              placeholder={`Search ${returnType} number...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={loadRecords} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading records...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-10 border rounded-lg text-muted-foreground">No records found</div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {filteredRecords.map((r) => (
                <button
                  key={r.number}
                  className="w-full p-4 text-left border rounded-lg hover:bg-primary/5 hover:border-primary/50 transition-colors"
                  onClick={() => handleSelect(r.number)}
                  disabled={loadingPreview}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-sm">{r.number}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Returned by {r.returnedBy}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{r.itemCount} item(s)</span>
                        <span>•</span>
                        <span>{r.dateAssigned ? new Date(r.dateAssigned).toLocaleDateString() : '—'}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground mt-1" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (!details) {
      return (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading details...
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{details.number}</h3>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Returned By</p>
              <p className="text-sm font-semibold">{details.returnedBy}</p>
              <p className="text-xs text-muted-foreground">{details.returnedByPosition || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Date</p>
              <p className="text-sm">{details.dateAssigned ? new Date(details.dateAssigned).toLocaleDateString() : '—'}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Items ({details.items?.length || 0})</p>
          <div className="max-h-[35vh] overflow-y-auto space-y-2">
            {details.items?.length ? (
              details.items.map((it: any, idx: number) => (
                <div key={idx} className="p-3 border rounded-lg bg-white">
                  <p className="text-sm font-semibold">{it.propertyNumber || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">{it.description || 'N/A'}</p>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{details.returnedBy}</span>
                    <span>•</span>
                    <span>{it.condition || it.remarks || '—'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground py-6 text-center border rounded-lg">
                No items found
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1 pt-2">
          <p className="text-sm font-medium text-gray-700">Signature Date</p>
          <Input
            type="date"
            value={signatureDate}
            onChange={(e) => setSignatureDate(e.target.value)}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {!showPreview && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-3xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" /> {title}
              </DialogTitle>
            </DialogHeader>

            <div className="py-4">{renderStepContent()}</div>

            <div className="flex justify-between gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  if (currentStep === 'details') {
                    setCurrentStep('list');
                    setSelected(null);
                    setDetails(null);
                  } else {
                    onClose();
                  }
                }}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {currentStep === 'details' && (
                <Button onClick={generatePreview} disabled={!details || loadingPreview}>
                  {loadingPreview ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                  Generate Report
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
          <div className="w-full max-w-6xl h-[90vh] flex flex-col bg-white rounded-lg shadow-xl relative">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-semibold text-lg text-slate-900">Preview Report - {selected}</span>
              </div>
              <button
                className="ml-auto text-slate-500 hover:text-red-600 transition-colors"
                onClick={() => setShowPreview(false)}
                disabled={loadingPreview}
                aria-label="Close Preview"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
              {loadingPreview ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-4">
                    <ChevronRight className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Generating preview...</p>
                  </div>
                </div>
              ) : previewUrl ? (
                <iframe src={previewUrl} className="w-full h-full border-none" title={`${returnType} Preview`} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No preview available</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <Button variant="outline" onClick={() => setShowPreview(false)} disabled={loadingPreview}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={download} disabled={loadingPreview || !previewUrl}>
                <FileText className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}