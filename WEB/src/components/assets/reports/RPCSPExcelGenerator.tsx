import React from 'react';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { getCategories } from '@/api/asset/inventoryApi';
import { listIssuances } from '@/api/asset/issuanceApi';
import { listSePpeItemsNoMovement } from '@/api/asset/ptaMovementApi';
import { RPCSPReportType } from './RPCSPFilterModal';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },

  header: {
    textAlign: 'center',
    marginBottom: 6,
  },

  title: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  subtitle: {
    fontSize: 9,
    marginTop: 2,
  },

  info: {
    marginBottom: 6,
  },

  table: {
    borderWidth: 1,
    borderColor: '#000',
  },

  row: {
    flexDirection: 'row',
  },

  th: {
    borderWidth: 1,
    padding: 2,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 6.5,
  },

  td: {
    borderWidth: 1,
    padding: 2,
  },

  center: {
    textAlign: 'center',
  },

  sigRow: {
    flexDirection: 'row',
    marginTop: 30,
  },

  sigBlock: {
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 6,
  },

  sigLine: {
    borderBottomWidth: 1,
    borderColor: '#000',
    marginTop: 24,
    marginBottom: 2,
  },

  sigLabel: {
    fontSize: 7.5,
    textAlign: 'center',
  },
});

/** A single row on the RPCSP table, regardless of whether it came from an issuance record or an on-stock item. */
export interface RPCSPRow {
  description: string;
  propertyNumber: string;
  unitOfMeasurement: string;
  unitValue: number;
  /** Condition (On Stock) or accountable employee (Issued). */
  remarks: string;
}

const COL_WIDTHS = [30, 175, 155, 45, 60, 65, 65, 80, 90, 130]; // sums to ~895

const COLUMN_HEADERS = [
  'ARTICLE',
  'DESCRIPTION',
  'SEMI-EXPENDABLE PROPERTY NO.',
  'UNIT OF MEASURE',
  'UNIT VALUE',
  'BALANCE PER CARD (QTY)',
  'ON HAND PER CARD (QTY)',
  'SHORT/OVER QUANTITY',
  'SHORT/OVER VALUE',
  'REMARKS',
];

const REPORT_TYPE_LABEL: Record<RPCSPReportType, string> = {
  ISSUED: 'Semi-Expendable Property Issued to Employees',
  ONSTOCK: 'Semi-Expendable Property On Stock',
};

export class RPCSPPdfGenerator {
  private static categoryCache: { id: number; name: string; generalCode?: string }[] | null = null;

  private static async getCategoryName(categoryId?: number): Promise<string | undefined> {
    if (!categoryId) return undefined;
    if (!this.categoryCache) {
      try {
        this.categoryCache = await getCategories('SE');
      } catch (error) {
        console.error('Error fetching SE categories:', error);
        this.categoryCache = [];
      }
    }
    return this.categoryCache?.find((cat) => cat.id === categoryId)?.name;
  }

  /** Fetch SE rows for the given report type, optionally scoped to one category. */
  static async getRows(reportType: RPCSPReportType, categoryId?: number): Promise<RPCSPRow[]> {
    const categoryName = await this.getCategoryName(categoryId);

    if (reportType === 'ISSUED') {
      const probe = await listIssuances({ group: 'SE', pageNumber: 1, pageSize: 1 });
      if (probe.totalCount === 0) return [];
      const result = await listIssuances({ group: 'SE', pageNumber: 1, pageSize: probe.totalCount });
      const items = categoryName ? result.items.filter((r) => r.category === categoryName) : result.items;
      return items.map((r) => ({
        description: r.itemName,
        propertyNumber: r.propertyNumber || '',
        unitOfMeasurement: r.unitOfMeasurement || '',
        unitValue: r.unitValue ?? 0,
        // "notes" is where the item's condition is actually stored (the movement's
        // Condition field persists to the same Remarks column IssuanceRecord.notes reads from).
        remarks: r.notes || r.condition || '',
      }));
    }

    const allItems = await listSePpeItemsNoMovement('SE');
    const items = categoryName ? allItems.filter((i) => i.category === categoryName) : allItems;
    return items.map((i) => ({
      description: i.description,
      propertyNumber: i.propertyNumber || '',
      unitOfMeasurement: i.unitOfMeasurement || '',
      unitValue: i.unitValue ?? 0,
      remarks: i.condition || '',
    }));
  }

  private static colWidth(i: number) {
    return COL_WIDTHS[i];
  }

  private static buildDocument(rows: RPCSPRow[], reportType: RPCSPReportType, asOfDate: Date, categoryName?: string) {
    const totalAmount = rows.reduce((sum, r) => sum + (r.unitValue || 0), 0);
    const displayDateStr = asOfDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <Document>
        <Page size="LEGAL" orientation="landscape" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>
              REPORT ON THE PHYSICAL COUNT OF SEMI-EXPENDABLE PROPERTY
            </Text>
            <Text style={styles.subtitle}>
              {REPORT_TYPE_LABEL[reportType]}
              {categoryName ? ` — ${categoryName}` : ''}
            </Text>
            <Text style={styles.subtitle}>As at {displayDateStr}</Text>
          </View>

          <Text style={styles.info}>Fund Cluster: Regular Agency Fund</Text>
          <Text style={styles.info}>
            For which CHERRY LYNN S. GONZALES, Administrative Officer V, Energy Regulatory
            Commission is accountable having assumed such accountability on AUGUST 2018.
          </Text>

          <View style={styles.table}>
            <View style={styles.row}>
              {COLUMN_HEADERS.map((h, i) => (
                <Text key={i} style={[styles.th, { width: this.colWidth(i) }]}>
                  {h}
                </Text>
              ))}
            </View>

            {rows.map((row, index) => (
              <View key={index} style={styles.row}>
                <Text style={[styles.td, styles.center, { width: this.colWidth(0) }]}>
                  {index + 1}
                </Text>
                <Text style={[styles.td, { width: this.colWidth(1) }]}>{row.description}</Text>
                <Text style={[styles.td, { width: this.colWidth(2) }]}>{row.propertyNumber}</Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(3) }]}>
                  {row.unitOfMeasurement}
                </Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(4) }]}>
                  {row.unitValue?.toLocaleString()}
                </Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(5) }]}>1</Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(6) }]}>1</Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(7) }]}>-</Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(8) }]}>-</Text>
                <Text style={[styles.td, { width: this.colWidth(9) }]}>{row.remarks}</Text>
              </View>
            ))}

            <View style={styles.row}>
              <Text style={[styles.td, { width: this.colWidth(0) + this.colWidth(1) + this.colWidth(2) + this.colWidth(3) }]}>
                {' '}
              </Text>
              <Text style={[styles.td, styles.center, { width: this.colWidth(4) }]}>
                {totalAmount.toLocaleString()}
              </Text>
              <Text
                style={[
                  styles.td,
                  { width: this.colWidth(5) + this.colWidth(6) + this.colWidth(7) + this.colWidth(8) + this.colWidth(9) },
                ]}
              >
                {' '}
              </Text>
            </View>
          </View>

          <View style={styles.sigRow}>
            <View style={styles.sigBlock}>
              <Text style={styles.sigLabel}>Certified Correct by:</Text>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>
                Signature over Printed Name of Inventory Committee Chair and Members
              </Text>
            </View>
            <View style={styles.sigBlock}>
              <Text style={styles.sigLabel}>Approved by:</Text>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>
                Signature over Printed Name of Head of Agency/Entity or Authorized Representative
              </Text>
            </View>
            <View style={styles.sigBlock}>
              <Text style={styles.sigLabel}>Witnessed by:</Text>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>Signature over Printed Name of COA Representative</Text>
            </View>
          </View>
        </Page>
      </Document>
    );
  }

  /** Download a PDF built from already-fetched rows (see getRows). */
  static async generate(rows: RPCSPRow[], reportType: RPCSPReportType, asOfDate: Date, categoryId?: number) {
    if (!rows.length) return;
    const categoryName = await this.getCategoryName(categoryId);

    const doc = this.buildDocument(rows, reportType, asOfDate, categoryName);
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const filenameDateStr = asOfDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    const typeLabel = reportType === 'ISSUED' ? 'Issued' : 'OnStock';
    a.download = categoryName
      ? `RPCSP_${typeLabel}_${filenameDateStr}_${categoryName.replace(/\s+/g, '_')}.pdf`
      : `RPCSP_${typeLabel}_${filenameDateStr}_All_Categories.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Build a preview blob URL from already-fetched rows (see getRows). */
  static async generatePreview(rows: RPCSPRow[], reportType: RPCSPReportType, asOfDate: Date, categoryId?: number): Promise<string> {
    if (!rows.length) return '';
    const categoryName = await this.getCategoryName(categoryId);

    const doc = this.buildDocument(rows, reportType, asOfDate, categoryName);
    const blob = await pdf(doc).toBlob();
    return URL.createObjectURL(blob);
  }
}
