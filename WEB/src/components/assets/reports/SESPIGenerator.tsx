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
import { toast } from 'sonner';

/** TABLE CONSTANT */
const TABLE_WIDTH = 1000;

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
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    position: 'absolute',
    top: 0,
    right: 0,
  },

  title: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  entity: {
    marginTop: 10,
    marginBottom: 4,
  },

  fund: {
    marginBottom: 4,
  },

  division: {
    marginBottom: 8,
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
    padding: 4,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 7,
  },

  td: {
    borderRightWidth: 1,
    borderColor: '#000',
    padding: 4,
    fontSize: 7,
  },

  center: {
    textAlign: 'center',
  },

  signature: {
    width: TABLE_WIDTH,
    alignSelf: 'center',
    marginTop: 0,
    flexDirection: 'row',
    gap: 0,
    borderWidth: 1,
    borderColor: '#000',
    borderTopWidth: 0,
  },

  sigBlock: {
    flex: 1,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#000',
    padding: 8,
  },

  sigLine: {
    borderBottomWidth: 1,
    borderColor: '#000',
    width: 180,
    alignSelf: 'center',
    marginVertical: 6,
  },

  sigName: {
    fontSize: 8,
    fontWeight: 'bold',
  },

  sigTopText: {
    fontSize: 8,
  },

  sigLabel: {
    fontSize: 8,
  },

  sigText: {
    fontSize: 8,
  },
});

interface SESPIFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: NormalizedEmployee[];
  onGenerate: (date: Date, employee: NormalizedEmployee) => void;
}

export function SESPIFilterModal({ isOpen, onClose, employees, onGenerate }: SESPIFilterModalProps) {
  const [step, setStep] = useState<'employee' | 'date'>('employee');
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<NormalizedEmployee | null>(null);
  const [asOfDate, setAsOfDate] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setStep('employee');
      setSearch('');
      setSelectedEmployee(null);
      setAsOfDate('');
    }
  }, [isOpen]);

  const filtered = employees.filter(e =>
    e.label.toLowerCase().includes(search.toLowerCase()) ||
    e.employeeIdOriginal?.toLowerCase().includes(search.toLowerCase())
  );

  const handleGenerate = () => {
    if (!asOfDate) {
      toast.error('Please select a date');
      return;
    }
    if (!selectedEmployee) return;
    onGenerate(new Date(asOfDate), selectedEmployee);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'employee' ? 'Generate SESPI Report — Select Employee' : 'Generate SESPI Report — Select Date'}
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
                    onClick={() => setSelectedEmployee(emp)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedEmployee?.id === emp.id
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
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Employee: <span className="font-medium text-foreground">{selectedEmployee?.label}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="col-span-4"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={step === 'date' ? () => setStep('employee') : onClose}>
            {step === 'date' ? 'Back' : 'Cancel'}
          </Button>
          {step === 'employee' ? (
            <Button onClick={() => setStep('date')} disabled={!selectedEmployee}>
              Next
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={!asOfDate}>
              Generate Report
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export class SESPIExcelGenerator {
  /** COLUMN WIDTHS — MUST TOTAL 100% */
  private static colWidth(i: number) {
    const cols = [
      0.10, // ICS No.
      0.12, // Responsibility Center Code
      0.16, // Semi-expandable Property No.
      0.20, // Item Description
      0.06, // Unit
      0.08, // Quantity Issued
      0.12, // Date Acquired
      0.08, // Unit Cost
      0.08, // Amount
    ];
    return TABLE_WIDTH * cols[i];
  }

  static async generateSESPIPreview(asOfDate: Date, employeeId: number): Promise<string> {
    const seAssets = await PTAService.getAllForSEByEmployeeAndDate(employeeId, asOfDate);
    if (!seAssets.length) throw new Error('No SE assets found for the selected employee and date.');

    const doc = this.buildDocument(seAssets);
    const blob = await pdf(doc).toBlob();
    return URL.createObjectURL(blob);
  }

  static async generate(asOfDate: Date, employeeId: number) {
    const seAssets = await PTAService.getAllForSEByEmployeeAndDate(employeeId, asOfDate);

    const doc = this.buildDocument(seAssets);
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = '20._Annex-A.7-Report_of_SE_Property_Issued.pdf';
    a.click();
  }

  private static buildDocument(seAssets: any[]) {
    const processedAssets = seAssets.map(asset => {
      const latestMovement = asset.movements
        ?.filter((m: any) => m.parItrNumber)
        ?.sort(
          (a: any, b: any) =>
            new Date(b.dateAssigned).getTime() -
            new Date(a.dateAssigned).getTime()
        )[0];
      return { ...asset, latestMovement };
    });
    const sequenceMap = new Map<string, number>();
    const finalAssets = processedAssets.map(asset => {
      let icsNo = '';
      if (asset.latestMovement) {
        const dateAssigned = new Date(asset.latestMovement.dateAssigned);
        const year = dateAssigned.getFullYear();
        const month = String(dateAssigned.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;
        if (!sequenceMap.has(key)) sequenceMap.set(key, 1);
        const seq = sequenceMap.get(key)!;
        icsNo = `${key}-${String(seq).padStart(3, '0')}`;
        sequenceMap.set(key, seq + 1);
      }
      return { ...asset, icsNo };
    });
    return (
      <Document>
        <Page size="LEGAL" orientation="landscape" style={styles.page}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.annex}>Annex A.7</Text>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Registry SPI Semi-Expandable Property</Text>
            </View>
          </View>

          <Text style={styles.entity}>Entity Name: Energy Regulatory Commission</Text>
          <Text style={styles.fund}>Fund Cluster: Regular Agency Fund</Text>
          <Text style={styles.division}>To be filled out by the Property and Supply Division</Text>

          {/* TABLE */}
          <View style={styles.table}>
            {/* HEADER ROW */}
            <View style={styles.row}>
              {[
                'ICS No.',
                'Responsibility Center Code',
                'Semi-expendable Property No.',
                'Item Description',
                'Unit',
                'Quantity Issued',
                'Date Acquired',
                'Unit Cost',
                'Amount',
              ].map((h, i) => (
                <Text key={i} style={[styles.th, { width: this.colWidth(i) }]}>
                  {h}
                </Text>
              ))}
            </View>

            {/* DATA ROWS */}
            {finalAssets.map((asset, index) => (
              <View key={index} style={styles.row}>
                <Text style={[styles.td, styles.center, { width: this.colWidth(0) }]}>
                  {asset.icsNo}
                </Text>
                <Text style={[styles.td, { width: this.colWidth(1) }]} />
                <Text style={[styles.td, { width: this.colWidth(2) }]}>
                  {asset.propertyNumber}
                </Text>
                <Text style={[styles.td, { width: this.colWidth(3) }]}>
                  {asset.description}
                </Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(4) }]}>
                  {asset.unitOfMeasurement}
                </Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(5) }]}>
                  1
                </Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(6) }]}>
                  {asset.dateAcquired ? (() => { const d = new Date(asset.dateAcquired); return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`; })() : ''}
                </Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(7) }]}>
                  {asset.unitValue?.toFixed(2)}
                </Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(8) }]}>
                  {asset.unitValue?.toFixed(2)}
                </Text>
              </View>
            ))}

            {/* EMPTY ROWS */}
            {Array.from({ length: Math.max(0, 20 - finalAssets.length) }).map((_, i) => (
              <View key={i} style={styles.row}>
                {Array.from({ length: 9 }).map((_, c) => (
                  <Text key={c} style={[styles.td, { width: this.colWidth(c) }]} />
                ))}
              </View>
            ))}
          </View>

          {/* SIGNATURES */}
          <View style={styles.signature}>
            <View style={styles.sigBlock}>
              <Text style={styles.sigText}>
                I hereby certify the correctness of the information above.
              </Text>
              <Text style={styles.sigText}> </Text>
              <Text style={styles.sigName}>CHERRY LYNN S. GONZALES</Text>
              <View style={styles.sigLine} />
              <Text style={styles.sigText}>SUPPLY OFFICER</Text>
            </View>

            <View style={[styles.sigBlock, { borderRightWidth: 0 }]}>
              <Text style={styles.sigText}>Posted By:</Text>
              <View style={styles.sigLine} />
              <Text style={styles.sigText}>ACCOUNTING SECTION</Text>
            </View>
          </View>
        </Page>
      </Document>
    );
  }
}
