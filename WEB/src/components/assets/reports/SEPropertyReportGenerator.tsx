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

interface SEPropertyReportOptions {
  asOfDate: Date;
  serialNo?: string;
}

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

  metaRow: {
    width: TABLE_WIDTH,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
  },

  metaLeft: {
    width: 640,
  },

  metaRight: {
    width: 240,
  },

  metaRightLine: {
    flexDirection: 'row',
    marginBottom: 4,
  },

  metaLabel: {
    width: 70,
    fontSize: 8,
  },

  metaValue: {
    flex: 1,
    fontSize: 8,
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

interface SEPropertyReportFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (options: SEPropertyReportOptions) => void;
}

export function SEPropertyReportFilterModal({ isOpen, onClose, onGenerate }: SEPropertyReportFilterModalProps) {
  const [asOfDate, setAsOfDate] = useState('');
  const [serialNo, setSerialNo] = useState('');

  const handleGenerate = () => {
    if (!asOfDate) {
      toast.error('Please select a date');
      return;
    }

    onGenerate({
      asOfDate: new Date(asOfDate),
      serialNo: serialNo.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate SE Property Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="se-property-serial-number" className="col-span-4">Serial No.</Label>
            <Input
              id="se-property-serial-number"
              type="text"
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value)}
              className="col-span-4"
              placeholder="Enter serial number"
            />

            <Label htmlFor="se-property-date" className="col-span-4">Date</Label>
            <Input
              id="se-property-date"
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="col-span-4"
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

export class SEPropertyReportGenerator {
  /** COLUMN WIDTHS — MUST TOTAL 100% */
  private static colWidth(i: number) {
    const cols = [
      0.12, // ICS No.
      0.15, // Responsibility Center Code
      0.18, // Semi-expandable Property No.
      0.25, // Item Description
      0.07, // Unit
      0.10, // Quantity Issued
      0.06, // Unit Cost
      0.07, // Amount
    ];
    return TABLE_WIDTH * cols[i];
  }

  private static formatHeaderDate(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  static async generatePreview(options: SEPropertyReportOptions): Promise<string> {
    const seAssets = await PTAService.getAllForSE(options.asOfDate);
    if (!seAssets.length) throw new Error('No SE assets found for the selected date.');

    const doc = this.buildDocument(seAssets, options);
    const blob = await pdf(doc).toBlob();
    return URL.createObjectURL(blob);
  }

  static async generate(options: SEPropertyReportOptions) {
    const seAssets = await PTAService.getAllForSE(options.asOfDate);

    const doc = this.buildDocument(seAssets, options);
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = '20._Annex-A.7-Report_of_SE_Property_Issued.pdf';
    a.click();
  }

  private static buildDocument(seAssets: any[], options: SEPropertyReportOptions) {
    const finalAssets = seAssets.map(asset => {
      const latestMovement = asset.movements
        ?.filter((m: any) => m.parIcsNumber)
        ?.sort(
          (a: any, b: any) =>
            new Date(b.dateAssigned).getTime() -
            new Date(a.dateAssigned).getTime()
        )[0];
      const icsNo = latestMovement?.parIcsNumber || '';
      return { ...asset, latestMovement, icsNo };
    });
    return (
      <Document>
        <Page size="LEGAL" orientation="landscape" style={styles.page}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.annex}>Annex A.7</Text>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Report of Semi-Expandable Property Issued</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              <Text style={styles.entity}>Entity Name: Energy Regulatory Commission</Text>
              <Text style={styles.fund}>Fund Cluster: Regular Agency Fund</Text>
            </View>
            <View style={styles.metaRight}>
              <View style={styles.metaRightLine}>
                <Text style={styles.metaLabel}>Serial No:</Text>
                <Text style={styles.metaValue}>{options.serialNo}</Text>
              </View>
              <View style={styles.metaRightLine}>
                <Text style={styles.metaLabel}>Date:</Text>
                <Text style={styles.metaValue}>{this.formatHeaderDate(options.asOfDate)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.division}>To be filled out by the Property and Supply Division</Text>
            <Text style={styles.division}>To be filled out by the Accounting Division</Text>
          </View>

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
                <Text style={[styles.td, styles.center, { width: this.colWidth(1) }]}>
                  {asset.latestMovement?.office?.generalCode ?? ''}
                </Text>
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
