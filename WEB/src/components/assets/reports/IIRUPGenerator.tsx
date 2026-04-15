// IIRUPGenerator.tsx — IIRUP & IIRUSP report generator + selection modal

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, FileText, Download, X, Printer } from 'lucide-react';
import { toast } from 'sonner';

import {
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

import {
  getDisposals,
  type DisposalRecord,
} from '@/api/asset/disposalApi';

/* ─────────────────────────────── constants ─────────────────── */

const ENTITY_NAME = 'ENERGY REGULATORY COMMISSION';
const FUND_CLUSTER = 'Regular Agency Fund';
const ACCOUNTABLE_OFFICER = 'CHERRY LYNN S. GONZALES';
const DESIGNATION = 'Administrative Officer V';
const STATION = 'Ortigas, Pasig City';

const logoSrc =
  typeof window !== 'undefined'
    ? `${window.location.origin}/images/erc-logo.png`
    : '/images/erc-logo.png';

/* ─────────────────────────────── styles ────────────────────── */

const styles = StyleSheet.create({
  page: {
    padding: '10mm',
    fontSize: 7,
    fontFamily: 'Helvetica',
    flexDirection: 'column',
  },
  annex: {
    textAlign: 'right',
    fontSize: 7,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  logo: { width: 36, height: 36, marginRight: 8 },
  titleBlock: { flex: 1, textAlign: 'center' },
  docTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  docSubtitle: {
    fontSize: 7,
    textAlign: 'center',
    marginTop: 2,
  },
  blueRule: {
    height: 2,
    backgroundColor: '#0A62C6',
    marginTop: 3,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  metaLeft: { flex: 3 },
  metaCenter: { flex: 2 },
  metaRight: { flex: 1.5, textAlign: 'right' },
  metaText: { fontSize: 7 },
  metaBold: { fontSize: 7, fontFamily: 'Helvetica-Bold' },

  officerRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  officerBlock: { flex: 1, alignItems: 'center' },
  officerSpacer: { width: 10 },
  officerValue: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    borderBottomWidth: 0.8,
    borderBottomColor: '#000',
    paddingBottom: 1,
    minWidth: 80,
    textAlign: 'center',
  },
  officerLabel: { fontSize: 6, color: '#444', marginTop: 1, textAlign: 'center' },

  // Table
  table: { borderWidth: 0.6, borderColor: '#000', marginBottom: 6 },
  thRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 0.6,
    borderBottomColor: '#000',
  },
  tdRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.4,
    borderBottomColor: '#ccc',
    minHeight: 14,
    alignItems: 'center',
  },
  tfootRow: {
    flexDirection: 'row',
    backgroundColor: '#d8d8d8',
    borderTopWidth: 0.6,
    borderTopColor: '#000',
  },
  th: { padding: 2, fontSize: 6, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  td: { padding: 2, fontSize: 6.5, textAlign: 'center' },
  tdLeft: { padding: 2, fontSize: 6.5, textAlign: 'left' },
  tdRight: { padding: 2, fontSize: 6.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' },

  // col widths — IIRUP (10 cols)
  cNo: { width: '4%' },
  cYear: { width: '7%' },
  cPropNo: { width: '12%' },
  cDesc: { width: '22%' },
  cCost: { width: '10%' },
  cLife: { width: '7%' },
  cDeprAmt: { width: '10%' },
  cCond: { width: '10%' },
  cMethod: { width: '10%' },
  cRemarks: { width: '8%' },

  // col widths — IIRUSP (8 cols; no depreciation sub-cols)
  scNo: { width: '5%' },
  scYear: { width: '8%' },
  scPropNo: { width: '14%' },
  scDesc: { width: '28%' },
  scCost: { width: '12%' },
  scCond: { width: '12%' },
  scMethod: { width: '12%' },
  scRemarks: { width: '9%' },

  // cert + sigs
  certText: { fontSize: 6.5, marginBottom: 6 },
  sigRow: { flexDirection: 'row', marginTop: 12 },
  sigCol: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  sigColLabel: { fontSize: 6.5, alignSelf: 'flex-start', marginBottom: 14 },
  sigName: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 1,
    textAlign: 'center',
  },
  sigLine: {
    borderTopWidth: 0.8,
    borderTopColor: '#000',
    width: '100%',
    marginBottom: 1,
  },
  sigLabel: { fontSize: 5.5, color: '#444', textAlign: 'center' },
  sigDesig: { fontSize: 5.5, color: '#444', textAlign: 'center' },
});

/* ─────────────────────────────── helpers ───────────────────── */

function fmt(n?: number | null) {
  if (n == null) return '';
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function yearOf(dateStr?: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : String(d.getFullYear());
}

function fmtDate(dateStr?: string | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

/* ─────────────────────────────── PDF docs ──────────────────── */

const IIRUPDocument = ({ disposal }: { disposal: DisposalRecord }) => {
  const asOfDate = fmtDate(disposal.dateApproved ?? disposal.dateRequested);
  const total = disposal.items.reduce((s, i) => s + (i.pta?.unitValue ?? 0), 0);
  return (
    <Document>
      <Page size="LEGAL" orientation="landscape" style={styles.page}>
        <Text style={styles.annex}>Appendix 74</Text>

        {/* Header */}
        <View style={styles.headerRow}>
          <Image src={logoSrc} style={styles.logo} />
          <View style={styles.titleBlock}>
            <Text style={styles.docTitle}>
              INVENTORY AND INSPECTION REPORT OF UNSERVICEABLE PROPERTY
            </Text>
            <Text style={styles.docSubtitle}>As at {asOfDate}</Text>
          </View>
        </View>
        <View style={styles.blueRule} />

        {/* Meta */}
        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <Text style={styles.metaText}>
              Entity Name: <Text style={styles.metaBold}>{ENTITY_NAME}</Text>
            </Text>
          </View>
          <View style={styles.metaCenter}>
            <Text style={styles.metaText}>
              Fund Cluster: <Text style={styles.metaBold}>{FUND_CLUSTER}</Text>
            </Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaText}>
              IIRUP No.: <Text style={styles.metaBold}>{disposal.disposalNumber}</Text>
            </Text>
          </View>
        </View>

        {/* Officers */}
        <View style={styles.officerRow}>
          <View style={styles.officerBlock}>
            <Text style={styles.officerValue}>{ACCOUNTABLE_OFFICER}</Text>
            <Text style={styles.officerLabel}>Name</Text>
          </View>
          <View style={styles.officerSpacer} />
          <View style={styles.officerBlock}>
            <Text style={styles.officerValue}>{DESIGNATION}</Text>
            <Text style={styles.officerLabel}>Designation</Text>
          </View>
          <View style={styles.officerSpacer} />
          <View style={styles.officerBlock}>
            <Text style={styles.officerValue}>{STATION}</Text>
            <Text style={styles.officerLabel}>Station</Text>
          </View>
        </View>

        {/* Main table */}
        <View style={styles.table}>
          {/* Header row 1 */}
          <View style={styles.thRow}>
            <Text style={[styles.th, styles.cNo]}>No.</Text>
            <Text style={[styles.th, styles.cYear]}>Year{'\n'}Acquired</Text>
            <Text style={[styles.th, styles.cPropNo]}>Property{'\n'}Number</Text>
            <Text style={[styles.th, styles.cDesc]}>Description</Text>
            <Text style={[styles.th, styles.cCost]}>Acquisition{'\n'}Cost</Text>
            <Text style={[styles.th, { width: '17%' }]}>Accumulated Depreciation</Text>
            <Text style={[styles.th, styles.cCond]}>Condition</Text>
            <Text style={[styles.th, styles.cMethod]}>Recommended{'\n'}Disposal Method</Text>
            <Text style={[styles.th, styles.cRemarks]}>Remarks</Text>
          </View>
          {/* Header row 2 — sub-cols for Accum. Depreciation */}
          <View style={[styles.thRow, { borderTopWidth: 0 }]}>
            <View style={{ width: '55%' }} />
            <Text style={[styles.th, styles.cLife]}>Est. Useful{'\n'}Life</Text>
            <Text style={[styles.th, styles.cDeprAmt]}>Amount</Text>
            <View style={{ width: '28%' }} />
          </View>

          {/* Data rows */}
          {disposal.items.map((item, i) => (
            <View key={item.id} style={styles.tdRow}>
              <Text style={[styles.td, styles.cNo]}>{i + 1}</Text>
              <Text style={[styles.td, styles.cYear]}>{yearOf(item.pta?.dateAcquired)}</Text>
              <Text style={[styles.tdLeft, styles.cPropNo]}>{item.pta?.propertyNumber ?? ''}</Text>
              <Text style={[styles.tdLeft, styles.cDesc]}>{item.pta?.description ?? ''}</Text>
              <Text style={[styles.td, styles.cCost]}>{fmt(item.pta?.unitValue)}</Text>
              <Text style={[styles.td, styles.cLife]}></Text>
              <Text style={[styles.td, styles.cDeprAmt]}></Text>
              <Text style={[styles.td, styles.cCond]}></Text>
              <Text style={[styles.td, styles.cMethod]}></Text>
              <Text style={[styles.td, styles.cRemarks]}></Text>
            </View>
          ))}

          {/* Total row */}
          <View style={styles.tfootRow}>
            <Text style={[styles.tdRight, { width: '45%' }]}>TOTAL</Text>
            <Text style={[styles.td, styles.cCost]}>{fmt(total)}</Text>
            <Text style={[styles.td, styles.cLife]}></Text>
            <Text style={[styles.td, styles.cDeprAmt]}></Text>
            <Text style={[styles.td, styles.cCond]}></Text>
            <Text style={[styles.td, styles.cMethod]}></Text>
            <Text style={[styles.td, styles.cRemarks]}></Text>
          </View>
        </View>

        {/* Certification */}
        <Text style={styles.certText}>
          I hereby request disposal of the above-described properties.{' '}
          {'          '}
          We hereby certify that the properties enumerated above are no longer serviceable and are recommended for disposal.
        </Text>

        {/* Signatures */}
        <View style={styles.sigRow}>
          <View style={styles.sigCol}>
            <Text style={styles.sigColLabel}>Requested by:</Text>
            <Text style={styles.sigName}>{disposal.requestedByName ?? ''}</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>Signature over Printed Name</Text>
            <Text style={styles.sigDesig}>Accountable Officer/End-user</Text>
          </View>
          <View style={styles.sigCol}>
            <Text style={styles.sigColLabel}>Noted by:</Text>
            <Text style={styles.sigName}> </Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>Signature over Printed Name</Text>
            <Text style={styles.sigDesig}>Inspection Officer</Text>
          </View>
          <View style={styles.sigCol}>
            <Text style={styles.sigColLabel}>Approved:</Text>
            <Text style={styles.sigName}>{disposal.approvedByName ?? ' '}</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>Signature over Printed Name</Text>
            <Text style={styles.sigDesig}>Approving Authority</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

const IIRUSPDocument = ({ disposal }: { disposal: DisposalRecord }) => {
  const asOfDate = fmtDate(disposal.dateApproved ?? disposal.dateRequested);
  const total = disposal.items.reduce((s, i) => s + (i.pta?.unitValue ?? 0), 0);
  return (
    <Document>
      <Page size="LEGAL" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Image src={logoSrc} style={styles.logo} />
          <View style={styles.titleBlock}>
            <Text style={styles.docTitle}>
              INVENTORY AND INSPECTION REPORT OF UNSERVICEABLE SEMI-EXPENDABLE PROPERTY
            </Text>
            <Text style={styles.docSubtitle}>As of {asOfDate}</Text>
          </View>
        </View>
        <View style={styles.blueRule} />

        {/* Meta */}
        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <Text style={styles.metaText}>
              Entity Name: <Text style={styles.metaBold}>{ENTITY_NAME}</Text>
            </Text>
          </View>
          <View style={styles.metaCenter}>
            <Text style={styles.metaText}>
              Fund Cluster: <Text style={styles.metaBold}>{FUND_CLUSTER}</Text>
            </Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaText}>
              IIRUSP No.: <Text style={styles.metaBold}>{disposal.disposalNumber}</Text>
            </Text>
          </View>
        </View>

        {/* Officers */}
        <View style={styles.officerRow}>
          <View style={styles.officerBlock}>
            <Text style={styles.officerValue}>{ACCOUNTABLE_OFFICER}</Text>
            <Text style={styles.officerLabel}>Name</Text>
          </View>
          <View style={styles.officerSpacer} />
          <View style={styles.officerBlock}>
            <Text style={styles.officerValue}>{DESIGNATION}</Text>
            <Text style={styles.officerLabel}>Designation</Text>
          </View>
          <View style={styles.officerSpacer} />
          <View style={styles.officerBlock}>
            <Text style={styles.officerValue}>{STATION}</Text>
            <Text style={styles.officerLabel}>Station</Text>
          </View>
        </View>

        {/* Main table */}
        <View style={styles.table}>
          <View style={styles.thRow}>
            <Text style={[styles.th, styles.scNo]}>No.</Text>
            <Text style={[styles.th, styles.scYear]}>Year{'\n'}Acquired</Text>
            <Text style={[styles.th, styles.scPropNo]}>Property{'\n'}Number</Text>
            <Text style={[styles.th, styles.scDesc]}>Description</Text>
            <Text style={[styles.th, styles.scCost]}>Acquisition{'\n'}Cost</Text>
            <Text style={[styles.th, styles.scCond]}>Condition</Text>
            <Text style={[styles.th, styles.scMethod]}>Recommended{'\n'}Disposal Method</Text>
            <Text style={[styles.th, styles.scRemarks]}>Remarks</Text>
          </View>

          {disposal.items.map((item, i) => (
            <View key={item.id} style={styles.tdRow}>
              <Text style={[styles.td, styles.scNo]}>{i + 1}</Text>
              <Text style={[styles.td, styles.scYear]}>{yearOf(item.pta?.dateAcquired)}</Text>
              <Text style={[styles.tdLeft, styles.scPropNo]}>{item.pta?.propertyNumber ?? ''}</Text>
              <Text style={[styles.tdLeft, styles.scDesc]}>{item.pta?.description ?? ''}</Text>
              <Text style={[styles.td, styles.scCost]}>{fmt(item.pta?.unitValue)}</Text>
              <Text style={[styles.td, styles.scCond]}></Text>
              <Text style={[styles.td, styles.scMethod]}></Text>
              <Text style={[styles.td, styles.scRemarks]}></Text>
            </View>
          ))}

          <View style={styles.tfootRow}>
            <Text style={[styles.tdRight, { width: '55%' }]}>TOTAL</Text>
            <Text style={[styles.td, styles.scCost]}>{fmt(total)}</Text>
            <Text style={[styles.td, styles.scCond]}></Text>
            <Text style={[styles.td, styles.scMethod]}></Text>
            <Text style={[styles.td, styles.scRemarks]}></Text>
          </View>
        </View>

        {/* Certification */}
        <Text style={styles.certText}>
          I hereby request disposal of the above-described properties.{' '}
          {'          '}
          We hereby certify that the properties enumerated above are no longer serviceable and are recommended for disposal.
        </Text>

        {/* Signatures */}
        <View style={styles.sigRow}>
          <View style={styles.sigCol}>
            <Text style={styles.sigColLabel}>Requested by:</Text>
            <Text style={styles.sigName}>{disposal.requestedByName ?? ''}</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>Signature over Printed Name</Text>
            <Text style={styles.sigDesig}>Accountable Officer/End-user</Text>
          </View>
          <View style={styles.sigCol}>
            <Text style={styles.sigColLabel}>Noted by:</Text>
            <Text style={styles.sigName}> </Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>Signature over Printed Name</Text>
            <Text style={styles.sigDesig}>Inspection Officer</Text>
          </View>
          <View style={styles.sigCol}>
            <Text style={styles.sigColLabel}>Approved:</Text>
            <Text style={styles.sigName}>{disposal.approvedByName ?? ' '}</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>Signature over Printed Name</Text>
            <Text style={styles.sigDesig}>Approving Authority</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

/* ─────────────────────────────── generator class ──────────── */

export class IIRUPGenerator {
  static async generatePreview(disposal: DisposalRecord, type: 'IIRUP' | 'IIRUSP'): Promise<string> {
    const doc = type === 'IIRUP'
      ? <IIRUPDocument disposal={disposal} />
      : <IIRUSPDocument disposal={disposal} />;
    const blob = await pdf(doc).toBlob();
    return URL.createObjectURL(blob);
  }

  static async generate(disposal: DisposalRecord, type: 'IIRUP' | 'IIRUSP'): Promise<void> {
    const doc = type === 'IIRUP'
      ? <IIRUPDocument disposal={disposal} />
      : <IIRUSPDocument disposal={disposal} />;
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${disposal.disposalNumber}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

/* ─────────────────────────────── modal ─────────────────────── */

interface IIRUPGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'IIRUP' | 'IIRUSP';
}

export function IIRUPGenerationModal({ isOpen, onClose, reportType }: IIRUPGenerationModalProps) {
  const group = reportType === 'IIRUP' ? 'PPE' : 'SE';
  const [disposals, setDisposals] = useState<DisposalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDisposal, setSelectedDisposal] = useState<DisposalRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    setSelectedDisposal(null);
    setPreviewUrl('');
    setShowPreview(false);
    loadDisposals();
  }, [isOpen]);

  const loadDisposals = async () => {
    setLoading(true);
    try {
      const result = await getDisposals({ groupName: group, pageSize: 500 });
      setDisposals(result.items);
    } catch {
      toast.error('Failed to load disposal records');
    } finally {
      setLoading(false);
    }
  };

  const filtered = disposals.filter(d => {
    const q = search.toLowerCase();
    return (
      d.disposalNumber.toLowerCase().includes(q) ||
      (d.requestedByName ?? '').toLowerCase().includes(q) ||
      d.status.toLowerCase().includes(q)
    );
  });

  const handleSelect = async (disposal: DisposalRecord) => {
    setSelectedDisposal(disposal);
    setLoadingPreview(true);
    setShowPreview(true);
    try {
      const url = await IIRUPGenerator.generatePreview(disposal, reportType);
      setPreviewUrl(url);
    } catch {
      toast.error('Failed to generate preview');
      setShowPreview(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedDisposal) return;
    try {
      await IIRUPGenerator.generate(selectedDisposal, reportType);
      toast.success(`${reportType} PDF downloaded`);
      setShowPreview(false);
      onClose();
    } catch {
      toast.error('Failed to generate PDF');
    }
  };

  const statusColor = (status: string) => {
    if (status === 'Approved') return 'bg-green-100 text-green-700';
    if (status === 'Disposed') return 'bg-blue-100 text-blue-700';
    if (status === 'Rejected') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const title = reportType === 'IIRUP'
    ? 'Inventory and Inspection Report of Unserviceable Property (IIRUP)'
    : 'Inventory and Inspection Report of Unserviceable Semi-Expendable Property (IIRUSP)';

  return (
    <>
      {/* List dialog — hidden while preview is open */}
      {!showPreview && (
        <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle className="flex items-center gap-2 text-base">
                <FileText className="size-5 text-blue-600" />
                {title}
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col flex-1 min-h-0 px-6 pb-6">
              {/* Search */}
              <div className="relative my-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  className="pl-9"
                  placeholder="Search by disposal number, requested by, or status…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* List */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-sm text-slate-500">Loading records…</span>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <FileText className="size-10 mb-2" />
                    <p className="text-sm">No {group} disposal records found</p>
                  </div>
                ) : (
                  filtered.map(d => (
                    <button
                      key={d.id}
                      onClick={() => handleSelect(d)}
                      className="w-full text-left rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors p-4 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm text-slate-800 group-hover:text-blue-700">
                            {d.disposalNumber}
                          </p>
                          <p className="text-xs text-slate-500">
                            Requested by: {d.requestedByName ?? `User #${d.requestedBySystemUserId}`}
                            {' · '}
                            {new Date(d.dateRequested).toLocaleDateString('en-PH')}
                            {' · '}
                            {d.items.length} item{d.items.length !== 1 ? 's' : ''}
                          </p>
                          {d.reason && (
                            <p className="text-xs text-slate-400">Reason: {d.reason}</p>
                          )}
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(d.status)}`}>
                          {d.status}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Fullscreen preview — same pattern as PAR/PTR */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center">
          <div className="w-full max-w-6xl h-[90vh] flex flex-col bg-white rounded-lg shadow-xl relative">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-blue-600" />
                <span className="font-semibold text-lg text-slate-900">
                  Preview {reportType} — {selectedDisposal?.disposalNumber}
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
                    <Loader2 className="size-8 animate-spin text-blue-600" />
                    <p className="text-muted-foreground">Generating preview…</p>
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
              <Button variant="outline" onClick={() => setShowPreview(false)} disabled={loadingPreview}>
                <X className="size-4 mr-2" />
                Back to List
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
              <Button onClick={handleDownload} disabled={loadingPreview || !previewUrl}>
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
