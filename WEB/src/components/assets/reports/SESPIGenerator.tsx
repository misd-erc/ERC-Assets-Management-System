import React, { useState } from 'react';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { PTAService } from '@/services/PTAService';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    textAlign: 'center',
    marginBottom: 10,
  },

  annex: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
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
    marginTop: 20,
    flexDirection: 'row',
  },

  sigBlock: {
    flex: 1,
    textAlign: 'center',
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
  onGenerate: (date: Date) => void;
}

export function SESPIFilterModal({ isOpen, onClose, onGenerate }: SESPIFilterModalProps) {
  const [asOfDate, setAsOfDate] = useState('');

  const handleGenerate = () => {
    if (!asOfDate) {
      toast.error('Please select a date');
      return;
    }
    onGenerate(new Date(asOfDate));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate SESPI Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">As of Date</Label>
            <Input 
              type="date" 
              value={asOfDate} 
              onChange={(e) => setAsOfDate(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleGenerate}>Generate Report</Button>
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
      0.14, // Responsibility Center Code
      0.18, // Semi-expandable Property No.
      0.24, // Item Description
      0.06, // Unit
      0.10, // Quantity Issued
      0.09, // Unit Cost
      0.09, // Amount
    ];
    return TABLE_WIDTH * cols[i];
  }

  static async generateSESPIPreview(asOfDate: Date): Promise<string> {
    const seAssets = await PTAService.getAllForSE(asOfDate);

    const doc = this.buildDocument(seAssets);
    const blob = await pdf(doc).toBlob();
    return URL.createObjectURL(blob);
  }

  static async generate(asOfDate: Date) {
    const seAssets = await PTAService.getAllForSE(asOfDate);

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
            <Text style={styles.title}>Report of Semi-Expandable Property Issued</Text>
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
                  {asset.unitValue?.toFixed(2)}
                </Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(7) }]}>
                  {asset.unitValue?.toFixed(2)}
                </Text>
              </View>
            ))}

            {/* EMPTY ROWS */}
            {Array.from({ length: Math.max(0, 20 - finalAssets.length) }).map((_, i) => (
              <View key={i} style={styles.row}>
                {Array.from({ length: 8 }).map((_, c) => (
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

            <View style={styles.sigBlock}>
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
