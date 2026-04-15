import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Search,
  FileText,
  ChevronLeft,
  Package,
  Printer,
  Download,
  X,
} from 'lucide-react';
import { listIssuances } from '@/api/asset/issuanceApi';
import { IssuanceRecord } from '@/types/issuance';
import { PARGenerator } from './PARGenerator';
import { ICSGenerator } from './ICSGenerator';
import { toast } from 'sonner';

type ReportType = 'PAR' | 'ICS';

interface PARICSListModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
}

interface ParIcsGroup {
  parIcsNumber: string;
  itemCount: number;
  employeeName: string;
  employeeIdOriginal?: string;
  subEmployeeName?: string;
  issuedDate: string;
  officeName?: string;
  records: IssuanceRecord[];
}

export function PARICSListModal({ isOpen, onClose, reportType }: PARICSListModalProps) {
  const [records, setRecords] = useState<IssuanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<ParIcsGroup | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [signatureDate, setSignatureDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    if (isOpen) {
      resetState();
      loadRecords();
    }
  }, [isOpen]);

  const resetState = () => {
    setRecords([]);
    setSelectedGroup(null);
    setSearch('');
    setPreviewUrl('');
    setShowPreview(false);
    setSignatureDate(new Date().toISOString().slice(0, 10));
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const group = reportType === 'PAR' ? 'PPE' : 'SE';
      const result = await listIssuances({ group, pageNumber: 1, pageSize: 5000 });
      setRecords(result.items);
    } catch (err) {
      console.error('Failed to load issuance records:', err);
      toast.error('Failed to load issuance records');
    } finally {
      setLoading(false);
    }
  };

  const groups = useMemo(() => {
    const map = new Map<string, ParIcsGroup>();
    for (const r of records) {
      if (!r.parIcsNumber) continue;
      const existing = map.get(r.parIcsNumber);
      if (existing) {
        existing.records.push(r);
        existing.itemCount = existing.records.length;
      } else {
        map.set(r.parIcsNumber, {
          parIcsNumber: r.parIcsNumber,
          itemCount: 1,
          employeeName: r.employeeName,
          employeeIdOriginal: r.employeeIdOriginal,
          subEmployeeName: r.subEmployeeName,
          issuedDate: r.issuedDate,
          officeName: r.officeName,
          records: [r],
        });
      }
    }
    return Array.from(map.values());
  }, [records]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups.filter(
      (g) =>
        g.parIcsNumber.toLowerCase().includes(q) ||
        g.employeeName.toLowerCase().includes(q) ||
        (g.employeeIdOriginal?.toLowerCase().includes(q) ?? false)
    );
  }, [groups, search]);

  const handleSelectGroup = (group: ParIcsGroup) => {
    setSelectedGroup(group);
  };

  const generatePreview = async () => {
    if (!selectedGroup) return;
    setLoadingPreview(true);
    try {
      let url: string;
      if (reportType === 'PAR') {
        url = await PARGenerator.generatePreviewFromIssuanceRecords(
          selectedGroup.records,
          signatureDate
        );
      } else {
        url = await ICSGenerator.generatePreviewFromIssuanceRecords(
          selectedGroup.records,
          signatureDate
        );
      }
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (err) {
      console.error('Failed to generate preview:', err);
      toast.error('Failed to generate preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = async () => {
    if (!previewUrl || !selectedGroup) return;
    const blob = await fetch(previewUrl).then((r) => r.blob());
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_${selectedGroup.parIcsNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${reportType} PDF saved`);
  };

  const handlePrint = () => {
    if (!previewUrl) return;
    const w = window.open(previewUrl);
    if (w) {
      w.addEventListener('load', () => w.print());
    }
  };

  const title =
    reportType === 'PAR'
      ? 'Property Acknowledgement Receipt (PAR)'
      : 'Inventory Custodian Slip (ICS)';

  // Detail view for selected group
  const renderDetail = () => {
    if (!selectedGroup) return null;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{selectedGroup.parIcsNumber}</h3>
          <Badge variant="secondary">{selectedGroup.itemCount} item(s)</Badge>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Employee</p>
              <p className="text-sm font-semibold">{selectedGroup.employeeName}</p>
              {selectedGroup.employeeIdOriginal && (
                <p className="text-xs text-muted-foreground">
                  ID: {selectedGroup.employeeIdOriginal}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Date Issued</p>
              <p className="text-sm">
                {selectedGroup.issuedDate
                  ? new Date(selectedGroup.issuedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
          </div>
          {selectedGroup.officeName && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Office</p>
              <p className="text-sm">{selectedGroup.officeName}</p>
            </div>
          )}
          {selectedGroup.subEmployeeName && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Sub-{reportType === 'PAR' ? 'PAR' : 'ICS'} (Non-Plantilla)
              </p>
              <p className="text-sm">{selectedGroup.subEmployeeName}</p>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">
            Items ({selectedGroup.itemCount})
          </p>
          <div className="max-h-[35vh] overflow-y-auto space-y-2">
            {selectedGroup.records.map((r, idx) => (
              <div key={idx} className="p-3 border rounded-lg bg-white">
                <p className="text-sm font-semibold">{r.propertyNumber || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">{r.itemName || 'N/A'}</p>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  {r.unitValue != null && (
                    <span>₱{r.unitValue.toLocaleString()}</span>
                  )}
                  {r.category && (
                    <>
                      <span>•</span>
                      <span>{r.category}</span>
                    </>
                  )}
                  {r.dateAcquired && (
                    <>
                      <span>•</span>
                      <span>{new Date(r.dateAcquired).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
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

  // List view
  const renderList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {reportType} Records
        </h3>
        <span className="text-sm text-muted-foreground">
          {filteredGroups.length} group(s)
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 h-4 w-4" />
        <Input
          placeholder={`Search ${reportType} number or employee...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          Loading records...
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-10 border rounded-lg text-muted-foreground">
          No {reportType} records found
        </div>
      ) : (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {filteredGroups.map((g) => (
            <button
              key={g.parIcsNumber}
              className="w-full p-4 text-left border rounded-lg hover:bg-primary/5 hover:border-primary/50 transition-colors"
              onClick={() => handleSelectGroup(g)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">{g.parIcsNumber}</span>
                    <Badge variant="secondary" className="text-xs">
                      <Package className="w-3 h-3 mr-1" />
                      {g.itemCount} item(s)
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {g.employeeName}
                    {g.officeName ? ` — ${g.officeName}` : ''}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Issued:{' '}
                    {g.issuedDate
                      ? new Date(g.issuedDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Main dialog — hidden while preview is open */}
      {!showPreview && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-3xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {selectedGroup
                  ? `${reportType} Details — ${selectedGroup.parIcsNumber}`
                  : `Select ${reportType} Record`}
              </DialogTitle>
            </DialogHeader>

            <div className="py-4">
              {selectedGroup ? renderDetail() : renderList()}
            </div>

            <div className="flex justify-between gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedGroup) {
                    setSelectedGroup(null);
                  } else {
                    onClose();
                  }
                }}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {selectedGroup ? 'Back' : 'Close'}
              </Button>

              {selectedGroup && (
                <Button
                  onClick={generatePreview}
                  disabled={loadingPreview}
                  className={
                    reportType === 'PAR'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }
                >
                  {loadingPreview ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  Generate Report
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Fullscreen Preview */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center">
          <div className="w-full max-w-6xl h-[90vh] flex flex-col bg-white rounded-lg shadow-xl relative">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <span className="font-semibold text-lg text-slate-900">
                  Preview {title} — {selectedGroup?.parIcsNumber}
                </span>
              </div>
              <button
                className="ml-auto text-slate-500 hover:text-red-600 transition-colors"
                onClick={() => setShowPreview(false)}
                disabled={loadingPreview}
                aria-label="Close Preview"
              >
                <X className="size-6" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
              {loadingPreview ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Generating preview...</p>
                  </div>
                </div>
              ) : previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-none"
                  title={`${reportType} Preview`}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No preview available</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
                disabled={loadingPreview}
              >
                <X className="size-4 mr-2" />
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                disabled={loadingPreview || !previewUrl}
              >
                <Printer className="size-4 mr-2" />
                Print
              </Button>
              <Button
                onClick={handleDownload}
                disabled={loadingPreview || !previewUrl}
              >
                <Download className="size-4 mr-2" />
                Save as PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
