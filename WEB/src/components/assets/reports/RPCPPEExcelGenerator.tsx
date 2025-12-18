import React from 'react';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Asset } from '@/types/asset/UnifiedAsset';

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
});

export class RPCPPEPdfGenerator {
  static getAccountCode(categoryName?: string): string {
    const accountCodes: { [key: string]: string } = {
      'Office Equipment': '10605020 - Office Equipment',
      'Information and Communication Technology Equipment': '10605030 - Information and Communication Technology Equipment',
      'Communication Equipment': '10605070 - Communication Equipment',
      'Technical and Scientific Equipment': '10605140 - Technical and Scientific Equipment',
      'Motor Vehicles': '10606010 - Motor Vehicles',
      'Furniture and Fixtures': '10607010 - Furniture and Fixtures',
      'Sports Equipment': '10605130 - Sports Equipment',
    };

    return accountCodes[categoryName || ''] || '10605030 - Information and Communication Technology Equipment';
  }

  static async generate(assets: Asset[], year: number, categoryName?: string) {
    if (!assets?.length) return;

    const accountCode = this.getAccountCode(categoryName);

    // Calculate total amount
    const totalAmount = assets.reduce((sum, asset) => sum + (asset.unitValue || 0), 0);

    const doc = (
      <Document>
        <Page size="LEGAL" orientation="landscape" style={styles.page}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>
              REPORT ON THE PHYSICAL COUNT OF PROPERTY, PLANT AND EQUIPMENT
            </Text>
            <Text style={styles.subtitle}>
              Account Code {accountCode}
            </Text>
            <Text style={styles.subtitle}>As of December 31, {year}</Text>
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
                'QTY (CARD)',
                'QTY (PHYSICAL)',
                'SHORT/OVER QTY',
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
                  in good condition
                </Text>
              </View>
            ))}

            {/* TOTAL ROW */}
            <View style={styles.row}>
              <Text style={[styles.td, { width: this.colWidth(0) + this.colWidth(1) + this.colWidth(2) + this.colWidth(3) }]}>
                {' '}
              </Text>
              <Text style={[styles.td, styles.center, { width: this.colWidth(4) }]}>
                TOTAL
              </Text>
              <Text style={[styles.td, styles.center, { width: this.colWidth(5) }]}>
                {totalAmount.toLocaleString()}
              </Text>
              <Text style={[styles.td, { width: this.colWidth(6) + this.colWidth(7) + this.colWidth(8) + this.colWidth(9) + this.colWidth(10) + this.colWidth(11) }]}>
                {' '}
              </Text>
            </View>
          </View>
        </Page>
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = categoryName ? `RPCPPE_${year}_Category_${categoryName.replace(/\s+/g, '_')}.pdf` : `RPCPPE_${year}_All_Categories.pdf`;
    a.click();
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
