import React, { useState, useEffect } from 'react';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { PTAService } from '@/services/PTAService';
import { NormalizedEmployee } from '@/types/asset/UnifiedAsset';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/** ── Layout ── */
const TABLE_WIDTH = 1000;

/** Column absolute widths (total = TABLE_WIDTH) */
const COLS = {
  date: 62,
  icsNo: 78,
  propNo: 80,
  description: 140,
  eul: 38,
  issuedQty: 32,
  issuedOfficer: 108,
  returnedQty: 32,
  returnedOfficer: 90,
  reissuedQty: 32,
  reissuedOfficer: 90,
  disposedQty: 38,
  balanceQty: 38,
  amount: 58,
  remarks: 84,
};
// 62+78+80+140+38+32+108+32+90+32+90+38+38+58+84 = 1000 ✓

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 10,
    position: 'relative',
  },
  headerContent: {
    textAlign: 'center',
  },
  annex: {
    fontSize: 9,
    fontWeight: 'bold',
    position: 'absolute',
    top: 0,
    right: 0,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  metaRow: {
    marginTop: 4,
    fontSize: 8,
  },
  table: {
    width: TABLE_WIDTH,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  th: {
    borderRightWidth: 1,
    borderColor: '#000',
    padding: 3,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 6.5,
  },
  td: {
    borderRightWidth: 1,
    borderColor: '#000',
    padding: 3,
    fontSize: 6,
  },
  center: {
    textAlign: 'center',
  },
});

/** Truncate text to a max length */
function trunc(text: string, max: number): string {
  if (!text) return '';
  return text.length > max ? text.substring(0, max) + '…' : text;
}

/** Format a date string as "Jan 5, 2023" */
function fmtDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter Modal
// ─────────────────────────────────────────────────────────────────────────────
interface RegistrySPIEmployeeFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: NormalizedEmployee[];
  onGenerate: (employee: NormalizedEmployee, date: Date, assets: any[]) => void;
}

interface DateGroup {
  dateLabel: string;
  dateValue: string;
  assetCount: number;
}

export function RegistrySPIEmployeeFilterModal({
  isOpen,
  onClose,
  employees,
  onGenerate,
}: RegistrySPIEmployeeFilterModalProps) {
  const [step, setStep] = useState<'employee' | 'date'>('employee');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<NormalizedEmployee | null>(null);
  const [dateGroups, setDateGroups] = useState<DateGroup[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loadingDates, setLoadingDates] = useState(false);
  const [fetchedAssets, setFetchedAssets] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setStep('employee');
      setSearch('');
      setSelected(null);
      setDateGroups([]);
      setSelectedDate(null);
      setFetchedAssets([]);
    }
  }, [isOpen]);

  const filtered = employees.filter(e =>
    e.label.toLowerCase().includes(search.toLowerCase()) ||
    e.employeeIdOriginal?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEmployeeNext = async () => {
    if (!selected) return;
    setLoadingDates(true);
    try {
      const assets = await PTAService.getAllForSEByEmployee(selected.id);
      const map = new Map<string, number>();
      for (const asset of assets) {
        const currentMovement = asset.movements?.find(m => m.isActive) || asset.movements?.[0];
        const dateKey = currentMovement?.dateAssigned?.split('T')[0];
        if (!dateKey) continue;
        map.set(dateKey, (map.get(dateKey) ?? 0) + 1);
      }
      const groups: DateGroup[] = Array.from(map.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([dateValue, assetCount]) => ({
          dateValue,
          dateLabel: new Date(dateValue + 'T00:00:00').toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          }),
          assetCount,
        }));
      if (groups.length === 0) {
        toast.error('No SE assets found for this employee.');
        return;
      }
      setFetchedAssets(assets);
      setDateGroups(groups);
      setSelectedDate(null);
      setStep('date');
    } catch {
      toast.error('Failed to load assets for this employee.');
    } finally {
      setLoadingDates(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'employee' ? 'Generate Registry SPI — Select Employee' : 'Generate Registry SPI — Select Date'}
          </DialogTitle>
        </DialogHeader>

        {step === 'employee' ? (
          <div className="space-y-3">
            <Input
              placeholder="Search employee name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <ScrollArea className="h-64 border rounded-md">
              <div className="p-2 space-y-1">
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No employees found</p>
                ) : filtered.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => setSelected(emp)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selected?.id === emp.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="font-medium">{emp.label}</div>
                    {emp.employeeIdOriginal && (
                      <div className="text-xs opacity-70">{emp.employeeIdOriginal}</div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Employee: <span className="font-medium text-foreground">{selected?.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">Select a date to generate the report for assets acquired on that date.</p>
            <ScrollArea className="h-64 border rounded-md">
              <div className="p-2 space-y-1">
                {dateGroups.map(group => (
                  <button
                    key={group.dateValue}
                    onClick={() => setSelectedDate(group.dateValue)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                      selectedDate === group.dateValue
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <span className="font-medium">{group.dateLabel}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedDate === group.dateValue
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {group.assetCount} {group.assetCount === 1 ? 'item' : 'items'}
                    </span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={step === 'date' ? () => setStep('employee') : onClose}>
            {step === 'date' ? 'Back' : 'Cancel'}
          </Button>
          {step === 'employee' ? (
            <Button onClick={handleEmployeeNext} disabled={!selected || loadingDates}>
              {loadingDates ? 'Loading...' : 'Next'}
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (!selected || !selectedDate) return;
                const filtered = fetchedAssets.filter(asset => {
                  const mv = asset.movements?.find((m: any) => m.isActive) || asset.movements?.[0];
                  return mv?.dateAssigned?.split('T')[0] === selectedDate;
                });
                onGenerate(selected, new Date(selectedDate + 'T00:00:00'), filtered);
              }}
              disabled={!selectedDate}
            >
              Generate Report
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generator
// ─────────────────────────────────────────────────────────────────────────────
export class RegistrySPIByEmployeeGenerator {

  static async generatePreview(employee: NormalizedEmployee, date: Date, preloadedAssets?: any[]): Promise<string> {
    const assets = preloadedAssets ?? await PTAService.getAllForSEByEmployeeAndDate(employee.id, date);
    if (!assets.length) {
      throw new Error(`No SE assets found issued to ${employee.label} for the selected date.`);
    }
    const doc = this.buildDocument(assets, employee);
    const blob = await pdf(doc).toBlob();
    return URL.createObjectURL(blob);
  }

  static async generate(employee: NormalizedEmployee, date: Date, preloadedAssets?: any[]) {
    const assets = preloadedAssets ?? await PTAService.getAllForSEByEmployeeAndDate(employee.id, date);
    const doc = this.buildDocument(assets, employee);
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Registry_SPI_${employee.label.replace(/\s+/g, '_')}.pdf`;
    a.click();
  }

  private static buildDocument(assets: any[], employee: NormalizedEmployee) {
    const fullName = [
      employee.firstName,
      employee.middleName,
      employee.lastName,
      employee.suffixName,
    ].filter(Boolean).join(' ').toUpperCase();

    return (
      <Document>
        <Page size="LEGAL" orientation="landscape" style={styles.page}>
          {/* ── HEADER ── */}
          <View style={styles.header}>
            <Text style={styles.annex}>Annex A.4</Text>
            <View style={styles.headerContent}>
              <Text style={styles.title}>REGISTRY OF SEMI-EXPENDABLE PROPERTY ISSUED</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={{ fontSize: 8 }}>Entity Name: Energy Regulatory Commission</Text>
            <Text style={{ fontSize: 8 }}>Fund Cluster: Regular Agency Fund</Text>
          </View>
          <Text style={styles.metaRow}>Employee: {fullName}</Text>

          {/* ── TABLE ── */}
          <View style={styles.table}>

            {/* HEADER ROW 1 — group labels */}
            <View style={styles.row}>
              {/* Date — spans both header rows (rendered with full content in row 1, empty in row 2) */}
              <Text style={[styles.th, { width: COLS.date }]}>Date</Text>
              {/* Reference group */}
              <Text style={[styles.th, { width: COLS.icsNo + COLS.propNo, textAlign: 'center' }]}>Reference</Text>
              {/* Description */}
              <Text style={[styles.th, { width: COLS.description }]}>Item Description</Text>
              {/* Estimated Useful Life */}
              <Text style={[styles.th, { width: COLS.eul }]}>Est. Useful Life</Text>
              {/* Issued group */}
              <Text style={[styles.th, { width: COLS.issuedQty + COLS.issuedOfficer, textAlign: 'center' }]}>Issued</Text>
              {/* Returned group */}
              <Text style={[styles.th, { width: COLS.returnedQty + COLS.returnedOfficer, textAlign: 'center' }]}>Returned</Text>
              {/* Re-issued group */}
              <Text style={[styles.th, { width: COLS.reissuedQty + COLS.reissuedOfficer, textAlign: 'center' }]}>Re-issued</Text>
              {/* Disposed */}
              <Text style={[styles.th, { width: COLS.disposedQty }]}>Disposed</Text>
              {/* Balance */}
              <Text style={[styles.th, { width: COLS.balanceQty }]}>Balance</Text>
              {/* Amount */}
              <Text style={[styles.th, { width: COLS.amount }]}>Amount</Text>
              {/* Remarks */}
              <Text style={[styles.th, { width: COLS.remarks, borderRightWidth: 0 }]}>Remarks</Text>
            </View>

            {/* HEADER ROW 2 — sub labels */}
            <View style={styles.row}>
              <Text style={[styles.th, { width: COLS.date }]} />
              <Text style={[styles.th, { width: COLS.icsNo }]}>ICS/RRSP No.</Text>
              <Text style={[styles.th, { width: COLS.propNo }]}>Property No.</Text>
              <Text style={[styles.th, { width: COLS.description }]} />
              <Text style={[styles.th, { width: COLS.eul }]} />
              <Text style={[styles.th, { width: COLS.issuedQty }]}>Qty.</Text>
              <Text style={[styles.th, { width: COLS.issuedOfficer }]}>Office/Officer</Text>
              <Text style={[styles.th, { width: COLS.returnedQty }]}>Qty.</Text>
              <Text style={[styles.th, { width: COLS.returnedOfficer }]}>Office/Officer</Text>
              <Text style={[styles.th, { width: COLS.reissuedQty }]}>Qty.</Text>
              <Text style={[styles.th, { width: COLS.reissuedOfficer }]}>Office/Officer</Text>
              <Text style={[styles.th, { width: COLS.disposedQty }]}>Qty.</Text>
              <Text style={[styles.th, { width: COLS.balanceQty }]}>Qty.</Text>
              <Text style={[styles.th, { width: COLS.amount }]} />
              <Text style={[styles.th, { width: COLS.remarks, borderRightWidth: 0 }]} />
            </View>

            {/* DATA ROWS */}
            {assets.map((asset, idx) => {
              const issuanceMovement = [...(asset.movements || [])]
                .filter((m: any) => m.isActive && !m.isDeleted)
                .sort((a: any, b: any) =>
                  new Date(b.dateAssigned || b.createdAt).getTime() -
                  new Date(a.dateAssigned || a.createdAt).getTime()
                )[0];

              const dateStr = fmtDate(issuanceMovement?.dateAssigned || asset.dateAcquired);
              const icsNo = issuanceMovement?.parIcsNumber || '';
              const condition = issuanceMovement?.condition || '';

              return (
                <View key={idx} style={styles.row}>
                  <Text style={[styles.td, styles.center, { width: COLS.date }]}>{dateStr}</Text>
                  <Text style={[styles.td, { width: COLS.icsNo }]}>{trunc(icsNo, 18)}</Text>
                  <Text style={[styles.td, { width: COLS.propNo }]}>{trunc(asset.propertyNumber, 18)}</Text>
                  <Text style={[styles.td, { width: COLS.description }]}>{trunc(asset.description, 55)}</Text>
                  <Text style={[styles.td, styles.center, { width: COLS.eul }]}>
                    {asset.estimatedUsefulLife || ''}
                  </Text>
                  <Text style={[styles.td, styles.center, { width: COLS.issuedQty }]}>1</Text>
                  <Text style={[styles.td, { width: COLS.issuedOfficer }]}>{trunc(fullName, 28)}</Text>
                  <Text style={[styles.td, styles.center, { width: COLS.returnedQty }]} />
                  <Text style={[styles.td, { width: COLS.returnedOfficer }]} />
                  <Text style={[styles.td, styles.center, { width: COLS.reissuedQty }]} />
                  <Text style={[styles.td, { width: COLS.reissuedOfficer }]} />
                  <Text style={[styles.td, styles.center, { width: COLS.disposedQty }]} />
                  <Text style={[styles.td, styles.center, { width: COLS.balanceQty }]}>1</Text>
                  <Text style={[styles.td, styles.center, { width: COLS.amount }]}>
                    {asset.unitValue?.toFixed(2)}
                  </Text>
                  <Text style={[styles.td, { width: COLS.remarks, borderRightWidth: 0 }]}>{condition}</Text>
                </View>
              );
            })}

            {/* EMPTY FILLER ROWS */}
            {Array.from({ length: Math.max(0, 15 - assets.length) }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.row}>
                <Text style={[styles.td, { width: COLS.date }]} />
                <Text style={[styles.td, { width: COLS.icsNo }]} />
                <Text style={[styles.td, { width: COLS.propNo }]} />
                <Text style={[styles.td, { width: COLS.description }]} />
                <Text style={[styles.td, { width: COLS.eul }]} />
                <Text style={[styles.td, { width: COLS.issuedQty }]} />
                <Text style={[styles.td, { width: COLS.issuedOfficer }]} />
                <Text style={[styles.td, { width: COLS.returnedQty }]} />
                <Text style={[styles.td, { width: COLS.returnedOfficer }]} />
                <Text style={[styles.td, { width: COLS.reissuedQty }]} />
                <Text style={[styles.td, { width: COLS.reissuedOfficer }]} />
                <Text style={[styles.td, { width: COLS.disposedQty }]} />
                <Text style={[styles.td, { width: COLS.balanceQty }]} />
                <Text style={[styles.td, { width: COLS.amount }]} />
                <Text style={[styles.td, { width: COLS.remarks, borderRightWidth: 0 }]} />
              </View>
            ))}
          </View>

          {/* SIGNATURE BLOCK */}
          <View style={{
            width: TABLE_WIDTH,
            alignSelf: 'center',
            marginTop: 0,
            flexDirection: 'row',
            borderWidth: 1,
            borderColor: '#000',
            borderTopWidth: 0,
          }}>
            <View style={{ flex: 1, textAlign: 'center', borderRightWidth: 1, borderColor: '#000', padding: 8 }}>
              <Text style={{ fontSize: 8 }}>I hereby certify the correctness of the information above.</Text>
              <Text style={{ fontSize: 8 }}> </Text>
              <Text style={{ fontSize: 8, fontWeight: 'bold' }}>CHERRY LYNN S. GONZALES</Text>
              <View style={{ borderBottomWidth: 1, borderColor: '#000', width: 180, alignSelf: 'center', marginVertical: 6 }} />
              <Text style={{ fontSize: 8 }}>SUPPLY OFFICER</Text>
            </View>
            <View style={{ flex: 1, textAlign: 'center', padding: 8 }}>
              <Text style={{ fontSize: 8 }}>Posted By:</Text>
              <View style={{ borderBottomWidth: 1, borderColor: '#000', width: 180, alignSelf: 'center', marginVertical: 6 }} />
              <Text style={{ fontSize: 8 }}>ACCOUNTING SECTION</Text>
            </View>
          </View>
        </Page>
      </Document>
    );
  }
}
