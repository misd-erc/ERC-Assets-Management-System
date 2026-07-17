import React from 'react';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Asset } from '@/types/asset/UnifiedAsset';
import { getCategories } from '@/api/asset/inventoryApi';
import { RPCPPESignatories, DEFAULT_RPCPPE_SIGNATORIES } from './RPCPPEFilterModal';
import { downloadReportExcel } from '@/utils/reportExcelExport';

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
  },

  td: {
    borderWidth: 1,
    padding: 2,
  },

  center: {
    textAlign: 'center',
  },

  sigBlockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },

  sigBlockCol: {
    width: '31%',
  },

  sigBlockLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  sigEntry: {
    marginBottom: 16,
  },

  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    width: '100%',
    marginTop: 1,
    marginBottom: 2,
    minHeight: 3,
  },

  sigName: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  sigDesignation: {
    fontSize: 7,
    textAlign: 'center',
  },
});

const renderSignatureBlock = (signatories: RPCPPESignatories) => (
  <View style={styles.sigBlockRow}>
    <View style={styles.sigBlockCol}>
      <Text style={styles.sigBlockLabel}>Certified Correct by:</Text>
      <View style={styles.sigEntry}>
        <Text style={styles.sigName}>{signatories.inventoryChairperson.name || ' '}</Text>
        <View style={styles.sigLine} />
        <Text style={styles.sigDesignation}>{signatories.inventoryChairperson.designation}</Text>
      </View>
      <View style={styles.sigEntry}>
        <Text style={styles.sigName}>{signatories.inventoryViceChairperson.name || ' '}</Text>
        <View style={styles.sigLine} />
        <Text style={styles.sigDesignation}>{signatories.inventoryViceChairperson.designation}</Text>
      </View>
    </View>

    <View style={styles.sigBlockCol}>
      <Text style={styles.sigBlockLabel}>Approved by:</Text>
      <View style={styles.sigEntry}>
        <Text style={styles.sigName}>{signatories.chairpersonAndCEO.name || ' '}</Text>
        <View style={styles.sigLine} />
        <Text style={styles.sigDesignation}>{signatories.chairpersonAndCEO.designation}</Text>
      </View>
    </View>

    <View style={styles.sigBlockCol}>
      <Text style={styles.sigBlockLabel}>Verified by:</Text>
      <View style={styles.sigEntry}>
        <Text style={styles.sigName}>{signatories.coaRepresentative.name || ' '}</Text>
        <View style={styles.sigLine} />
        <Text style={styles.sigDesignation}>{signatories.coaRepresentative.designation}</Text>
      </View>
    </View>
  </View>
);

export class RPCPPEPdfGenerator {
  // Cache para sa categories with generalCode
  private static categoryCache: { id: number; name: string; generalCode?: string }[] | null = null;

  static async getCategoryName(categoryId?: number): Promise<string | undefined> {
    if (!categoryId) return undefined;

    // Load categories from API if not cached
    if (!this.categoryCache) {
      try {
        this.categoryCache = await getCategories();
      } catch (error) {
        console.error('Error fetching categories:', error);
        this.categoryCache = [];
      }
    }

    // Find category by ID from the fetched list
    const category = this.categoryCache?.find(cat => cat.id === categoryId);
    return category?.name;
  }

  static async getAccountCode(categoryId?: number): Promise<string> {
    if (!categoryId) return '';

    // Load categories from API if not cached
    if (!this.categoryCache) {
      try {
        this.categoryCache = await getCategories();
      } catch (error) {
        console.error('Error fetching categories:', error);
        this.categoryCache = [];
      }
    }

    // Find category by ID and return generalCode
    const category = this.categoryCache?.find(cat => cat.id === categoryId);
    return category?.generalCode || '';
  }

  static async generate(assets: Asset[], asOfDate: Date, categoryId?: number, signatories: RPCPPESignatories = DEFAULT_RPCPPE_SIGNATORIES) {
    if (!assets?.length) return;

    const categoryName = await this.getCategoryName(categoryId);
    const accountCode = await this.getAccountCode(categoryId);

    // Calculate total amount
    const totalAmount = assets.reduce((sum, asset) => sum + (asset.unitValue || 0), 0);

    // Format the date for display
    const displayDateStr = asOfDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const doc = (
      <Document>
        <Page size="LEGAL" orientation="landscape" style={styles.page}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>
              REPORT ON THE PHYSICAL COUNT OF PROPERTY, PLANT AND EQUIPMENT
            </Text>
            <Text style={styles.subtitle}>
              {categoryName ? `Account Code ${accountCode} - ${categoryName}` : 'All Categories'}
            </Text>
            <Text style={styles.subtitle}>As of {displayDateStr}</Text>
          </View>

          <Text style={styles.info}>Fund Cluster: Regular Agency Fund</Text>
          <Text style={styles.info}>
            For which CHERRY LYNN S. GONZALES, Administrative Officer V, Energy Regulatory
            Commission is accountable having assumed such accountability on AUGUST 2018.
          </Text>

          {/* TABLE */}
          <View style={styles.table}>
            <View style={styles.row}>
              {[
                'ARTICLE',
                'DESCRIPTION',
                'PROPERTY NUMBER (OLD)/(NEW)',
                'UNIT',
                'UNIT VALUE',
                'DATE ACQUIRED',
                'QUANTITY (PER PROPERTY CARD)',
                'QUANTITY (PER PHYSICAL COUNT)',
                'SHORTAGE/OVERAGE (QUANTITY)',
                'SHORTAGE/OVERAGE (VALUE)',
                'REMARKS',
              ].map((h, i) => (
                <Text key={i} style={[styles.th, { width: this.colWidth(i) }]}>
                  {h}
                </Text>
              ))}
            </View>

            {assets.map((asset, index) => (
              <View key={asset.id} style={styles.row}>
                <Text style={[styles.td, styles.center, { width: this.colWidth(0) }]}>
                  {index + 1}
                </Text>
                <Text style={[styles.td, { width: this.colWidth(1) }]}>
                  {asset.description}
                </Text>
                <Text style={[styles.td, { width: this.colWidth(2) }]}>
                  {asset.propertyNumber || ''}
                </Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(3) }]}>
                  {asset.unitOfMeasurement}
                </Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(4) }]}>
                  {asset.unitValue?.toLocaleString()}
                </Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(5) }]}>
                  {this.formatDate(asset.dateAcquired)}
                </Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(6) }]}>1</Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(7) }]}>1</Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(8) }]}>-</Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(9) }]}>-</Text>
                <Text style={[styles.td, { width: this.colWidth(10) }]}>
                  {asset.condition || ''}
                </Text>
              </View>
            ))}

            {/* TOTAL ROW */}
            <View style={styles.row}>
              <Text style={[styles.td, { width: this.colWidth(0) + this.colWidth(1) + this.colWidth(2) }]}>
                {' '}
              </Text>
              <Text style={[styles.td, styles.center, { width: this.colWidth(3) }]}>
                TOTAL
              </Text>
              <Text style={[styles.td, styles.center, { width: this.colWidth(4) }]}>
                {totalAmount.toLocaleString()}
              </Text>
              <Text style={[styles.td, { width: this.colWidth(5) + this.colWidth(6) + this.colWidth(7) + this.colWidth(8) + this.colWidth(9) + this.colWidth(10) }]}>
                {' '}
              </Text>
            </View>
          </View>

          {renderSignatureBlock(signatories)}
        </Page>
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const filenameDateStr = asOfDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    a.download = categoryName ? `RPCPPE_${filenameDateStr}_Category_${categoryName.replace(/\s+/g, '_')}.pdf` : `RPCPPE_${filenameDateStr}_All_Categories.pdf`;
    a.click();
  }

  static async generatePreview(assets: Asset[], asOfDate: Date, categoryIdOrName?: string | number, signatories: RPCPPESignatories = DEFAULT_RPCPPE_SIGNATORIES): Promise<string> {
    if (!assets?.length) return '';

    // If categoryIdOrName is a number or numeric string, fetch the category name
    let categoryId: number | undefined = undefined;
    let categoryName: string | undefined = undefined;
    if (categoryIdOrName) {
      if (typeof categoryIdOrName === 'number') {
        categoryId = categoryIdOrName;
        categoryName = await this.getCategoryName(categoryId);
      } else {
        const parsedId = parseInt(categoryIdOrName, 10);
        if (!isNaN(parsedId)) {
          categoryId = parsedId;
          categoryName = await this.getCategoryName(categoryId);
        } else {
          categoryName = categoryIdOrName;
        }
      }
    }

    const accountCode = await this.getAccountCode(categoryId);

    // Calculate total amount
    const totalAmount = assets.reduce((sum, asset) => sum + (asset.unitValue || 0), 0);

    // Format the date for display
    const displayDateStr = asOfDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const doc = (
      <Document>
        <Page size="LEGAL" orientation="landscape" style={styles.page}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>
              REPORT ON THE PHYSICAL COUNT OF PROPERTY, PLANT AND EQUIPMENT
            </Text>
            <Text style={styles.subtitle}>
              {categoryName ? `Account Code ${accountCode} - ${categoryName}` : 'All Categories'}
            </Text>
            <Text style={styles.subtitle}>As of {displayDateStr}</Text>
          </View>

          <Text style={styles.info}>Fund Cluster: Regular Agency Fund</Text>
          <Text style={styles.info}>
            For which CHERRY LYNN S. GONZALES, Administrative Officer V, Energy Regulatory
            Commission is accountable having assumed such accountability on AUGUST 2018.
          </Text>

          {/* TABLE */}
          <View style={styles.table}>
            <View style={styles.row}>
              {[
                'ARTICLE',
                'DESCRIPTION',
                'PROPERTY NUMBER (OLD)/(NEW)',
                'UNIT',
                'UNIT VALUE',
                'DATE ACQUIRED',
                'QUANTITY (PER PROPERTY CARD)',
                'QUANTITY (PER PHYSICAL COUNT)',
                'SHORT/OVER QUANTITY',
                'SHORT/OVER VALUE',
                'REMARKS',
              ].map((h, i) => (
                <Text key={i} style={[styles.th, { width: this.colWidth(i) }]}>
                  {h}
                </Text>
              ))}
            </View>

            {assets.map((asset, index) => (
              <View key={asset.id} style={styles.row}>
                <Text style={[styles.td, styles.center, { width: this.colWidth(0) }]}>
                  {index + 1}
                </Text>
                <Text style={[styles.td, { width: this.colWidth(1) }]}>
                  {asset.description}
                </Text>
                <Text style={[styles.td, { width: this.colWidth(2) }]}>
                  {asset.propertyNumber || ''}
                </Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(3) }]}>
                  {asset.unitOfMeasurement}
                </Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(4) }]}>
                  {asset.unitValue?.toLocaleString()}
                </Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(5) }]}>
                  {this.formatDate(asset.dateAcquired)}
                </Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(6) }]}>1</Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(7) }]}>1</Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(8) }]}>-</Text>
                <Text style={[styles.td, styles.center, { width: this.colWidth(9) }]}>-</Text>
                <Text style={[styles.td, { width: this.colWidth(10) }]}>
                  {asset.condition || ''}
                </Text>
              </View>
            ))}

            {/* TOTAL ROW */}
            <View style={styles.row}>
              <Text style={[styles.td, { width: this.colWidth(0) + this.colWidth(1) + this.colWidth(2) }]}>
                {' '}
              </Text>
              <Text style={[styles.td, styles.center, { width: this.colWidth(3) }]}>
                TOTAL
              </Text>
              <Text style={[styles.td, styles.center, { width: this.colWidth(4) }]}>
                {totalAmount.toLocaleString()}
              </Text>
              <Text style={[styles.td, { width: this.colWidth(5) + this.colWidth(6) + this.colWidth(7) + this.colWidth(8) + this.colWidth(9) + this.colWidth(10) }]}>
                {' '}
              </Text>
            </View>
          </View>

          {renderSignatureBlock(signatories)}
        </Page>
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    return URL.createObjectURL(blob);
  }

  static async generateExcel(assets: Asset[], asOfDate: Date, categoryId?: number, signatories: RPCPPESignatories = DEFAULT_RPCPPE_SIGNATORIES) {
    if (!assets?.length) return;

    const categoryName = await this.getCategoryName(categoryId);
    const accountCode = await this.getAccountCode(categoryId);
    const totalAmount = assets.reduce((sum, asset) => sum + (asset.unitValue || 0), 0);
    const displayDateStr = asOfDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const filenameDateStr = asOfDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');

    await downloadReportExcel({
      filename: categoryName ? `RPCPPE_${filenameDateStr}_Category_${categoryName.replace(/\s+/g, '_')}.xlsx` : `RPCPPE_${filenameDateStr}_All_Categories.xlsx`,
      sheetName: 'RPCPPE',
      titleLines: [
        'REPORT ON THE PHYSICAL COUNT OF PROPERTY, PLANT AND EQUIPMENT',
        categoryName ? `Account Code ${accountCode} - ${categoryName}` : 'All Categories',
        `As of ${displayDateStr}`,
      ],
      infoLines: [
        'Fund Cluster: Regular Agency Fund',
        'For which CHERRY LYNN S. GONZALES, Administrative Officer V, Energy Regulatory Commission is accountable having assumed such accountability on AUGUST 2018.',
      ],
      columns: [
        'ARTICLE', 'DESCRIPTION', 'PROPERTY NUMBER (OLD)/(NEW)', 'UNIT', 'UNIT VALUE', 'DATE ACQUIRED',
        'QUANTITY (PER PROPERTY CARD)', 'QUANTITY (PER PHYSICAL COUNT)', 'SHORTAGE/OVERAGE (QUANTITY)',
        'SHORTAGE/OVERAGE (VALUE)', 'REMARKS',
      ],
      rows: assets.map((asset, index) => [
        index + 1,
        asset.description,
        asset.propertyNumber || '',
        asset.unitOfMeasurement,
        asset.unitValue?.toLocaleString(),
        this.formatDate(asset.dateAcquired),
        1,
        1,
        '-',
        '-',
        asset.condition || '',
      ]),
      totalRow: ['', '', '', 'TOTAL', totalAmount.toLocaleString(), '', '', '', '', '', ''],
      signatoryRows: [[
        {
          role: 'Certified Correct by:',
          people: [
            { name: signatories.inventoryChairperson.name, designation: signatories.inventoryChairperson.designation },
            { name: signatories.inventoryViceChairperson.name, designation: signatories.inventoryViceChairperson.designation },
          ],
        },
        { role: 'Approved by:', name: signatories.chairpersonAndCEO.name, designation: signatories.chairpersonAndCEO.designation },
        { role: 'Verified by:', name: signatories.coaRepresentative.name, designation: signatories.coaRepresentative.designation },
      ]],
    });
  }

  private static formatDate(date?: string) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  }

  private static colWidth(i: number) {
    return [
      30,  // ARTICLE
      170, // DESCRIPTION
      230, // PROPERTY NUMBER (OLD)/(NEW)
      50,  // UNIT
      70,  // VALUE
      70,  // DATE
      60,  // CARD
      70,  // PHYSICAL
      75,  // SHORT QTY
      85,  // SHORT VALUE
      120, // REMARKS
    ][i];
  }
}
