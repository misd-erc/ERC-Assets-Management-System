// src/components/reports/ICSGenerator.tsx
import React from 'react';
import { pdf, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Asset } from '@/types/asset/UnifiedAsset';
import { UnifiedAssetService } from '@/services/UnifiedAssetService';
import { getEmployees } from '@/api/user-management/userApi';

/** Logo handling */
const logoSrc =
  typeof window !== 'undefined'
    ? `${window.location.origin}/images/erc-logo.png`
    : '/mnt/data/f2bc7bb8-25c5-47db-bc3b-9beb926dac1b.png';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    fontFamily: 'Helvetica',
    flexDirection: 'column',
  },

  appendix: {
    position: 'absolute',
    right: 20,
    top: 10,
    fontSize: 8,
    fontStyle: 'italic',
  },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  logo: {
    width: 55,
    height: 55,
  },
  titleBlock: {
    flex: 1,
    textAlign: 'center',
  },
  headerSmall: {
    fontSize: 9,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },

  blueRule: {
    height: 4,
    backgroundColor: '#0A62C6',
    marginTop: 8,
    marginBottom: 10,
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLeft: {
    flex: 1,
  },
  metaRight: {
    width: 160,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  metaValue: {
    fontSize: 9,
  },

  tableWrap: {
    flex: 1,
    marginTop: 8,
  },
  table: {
    borderWidth: 0.8,
    borderColor: '#000',
    borderStyle: 'solid',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 0.8,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
    minHeight: 20,
    alignItems: 'center',
  },
  cell: {
    padding: 3,
    fontSize: 8,
  },

  colQty: { width: '7%' },
  colUnit: { width: '7%' },
  colUnitCost: { width: '12%' },
  colTotalCost: { width: '12%' },
  colDescription: { width: '40%' },
  colInvNo: { width: '14%' },
  colUsefulLife: { width: '8%' },

  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    marginTop: 'auto',
  },
  signatureBlock: {
    width: '45%',
  },
  signatureLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  signatureLine: {
    borderBottomWidth: 0.8,
    borderColor: '#000',
    height: 20,
    marginBottom: 4,
  },
  signatureSub: {
    fontSize: 8,
  },
});

/** Format currency (PHP) */
function currency(val?: number | null): string {
  if (val == null) return '';
  return "PHP " + new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);
}


/** Truncate long descriptions */
function truncate(text = '', max = 250) {
  if (text.length <= max) return text;
  return text.substring(0, max) + '…';
}

interface ICSRow {
  qty: number;
  unit: string;
  unitCost: number | null;
  totalCost: number | null;
  description: string;
  invNo: string;
  usefulLife: string;
}

const ICSDocument = ({
  rows,
  entityName,
  fundCluster = '',
  icsNumber = '',
}: {
  rows: ICSRow[];
  entityName: string;
  fundCluster?: string;
  icsNumber?: string;
}) => {
  const rowsPerPage = 18;
  const pages: ICSRow[][] = [];

  for (let i = 0; i < rows.length; i += rowsPerPage) {
    pages.push(rows.slice(i, i + rowsPerPage));
  }

  return (
    <Document>
      {pages.map((pageRows, index) => (
        <Page key={index} size="A4" style={styles.page}>
          <Text style={styles.appendix}>Appendix 59</Text>

          {/* Header */}
          <View style={styles.headerContainer}>
            <Image src={logoSrc} style={styles.logo} />
            <View style={styles.titleBlock}>
              <Text style={styles.headerSmall}>Republic of the Philippines</Text>
              <Text style={styles.headerTitle}>INVENTORY CUSTODIAN SLIP</Text>
            </View>
          </View>

          <View style={styles.blueRule} />

          {/* Entity / ICS No */}
          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              <Text style={styles.metaLabel}>
                Entity Name: <Text style={styles.metaValue}>{entityName}</Text>
              </Text>
              <Text style={{ marginTop: 4 }}>
                Fund Cluster: <Text style={styles.metaValue}>{fundCluster}</Text>
              </Text>
            </View>

            <View style={styles.metaRight}>
              <Text style={styles.metaLabel}>ICS No.: {icsNumber}</Text>
            </View>
          </View>

          {/* Table */}
          <View style={styles.tableWrap}>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.cell, styles.colQty]}>Qty</Text>
                <Text style={[styles.cell, styles.colUnit]}>Unit</Text>
                <Text style={[styles.cell, styles.colUnitCost]}>Unit Cost</Text>
                <Text style={[styles.cell, styles.colTotalCost]}>Total Cost</Text>
                <Text style={[styles.cell, styles.colDescription]}>Description</Text>
                <Text style={[styles.cell, styles.colInvNo]}>Inventory Item No.</Text>
                <Text style={[styles.cell, styles.colUsefulLife]}>Useful Life</Text>
              </View>

              {pageRows.map((r, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.cell, styles.colQty]}>{r.qty}</Text>
                  <Text style={[styles.cell, styles.colUnit]}>{r.unit}</Text>
                  <Text style={[styles.cell, styles.colUnitCost]}>{currency(r.unitCost)}</Text>
                  <Text style={[styles.cell, styles.colTotalCost]}>{currency(r.totalCost)}</Text>
                  <Text style={[styles.cell, styles.colDescription]}>{truncate(r.description)}</Text>
                  <Text style={[styles.cell, styles.colInvNo]}>{r.invNo}</Text>
                  <Text style={[styles.cell, styles.colUsefulLife]}>{r.usefulLife}</Text>
                </View>
              ))}
            </View>

            {/* Signatures - Last Page Only */}
            {index === pages.length - 1 && (
              <View style={styles.signatureSection}>
                <View style={styles.signatureBlock}>
                  <Text style={styles.signatureLabel}>Issued By:</Text>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureSub}>Office / Position</Text>
                </View>

                <View style={styles.signatureBlock}>
                  <Text style={styles.signatureLabel}>Received By:</Text>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureSub}>Date</Text>
                </View>
              </View>
            )}
          </View>
        </Page>
      ))}
    </Document>
  );
};

export class ICSGenerator {
  static async generateICS(assets: Asset[]) {
    if (!assets || assets.length === 0) {
      throw new Error('No assets selected');
    }

    // Fetch employees
    const employeesResp = await getEmployees(1, 10000);
    const employees = employeesResp.data.items;

    const rows: ICSRow[] = [];
    let entityName = 'N/A';

    for (const asset of assets) {
      const full = await UnifiedAssetService.getById(asset.id);

      // Get latest movement
      const latestMovement =
        full.movements?.sort(
          (a, b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime()
        )[0];

      // Get employee
      let emp = null;
      if (latestMovement) {
        emp =
          employees.find((e: any) => e.id === latestMovement.plantillaEmployeeId) ||
          employees.find((e: any) => e.id === latestMovement.nonPlantillaEmployeeId);
      }

      // Build employee name
      entityName = emp
        ? `${emp.lastName}, ${emp.firstName} ${emp.middleName ?? ''}`.trim()
        : 'N/A';

      rows.push({
        qty: 1,
        unit: full.unitOfMeasurement || 'Unit',
        unitCost: full.unitValue ?? null,
        totalCost: full.unitValue ?? null,
        description: full.description || '',
        invNo: full.propertyNumber || '',
        usefulLife:
          full.estimatedUsefulLife != null
            ? String(full.estimatedUsefulLife)
            : '',
      });
    }

    // Generate PDF
    const blob = await pdf(
      <ICSDocument rows={rows} entityName={entityName} />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ICS_${rows.length}_${Date.now()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
