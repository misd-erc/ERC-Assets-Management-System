// src/components/reports/ICSGenerator.tsx
import React from 'react';
import { pdf, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Asset, NormalizedEmployee } from '@/types/asset/UnifiedAsset';
import { UnifiedAssetService } from '@/services/UnifiedAssetService';
import { getEmployees } from '@/api/user-management/userApi';

/** Logo handling */
const logoSrc =
  typeof window !== 'undefined'
    ? `${window.location.origin}/images/erc-logo.png`
    : '/mnt/data/f2bc7bb8-25c5-47db-bc3b-9beb926dac1b.png';

/** Styles */
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
  logo: { width: 55, height: 55 },
  titleBlock: { flex: 1, textAlign: 'center' },
  headerSmall: { fontSize: 9 },
  headerTitle: { fontSize: 13, fontWeight: 'bold', marginTop: 2 },

  blueRule: {
    height: 4,
    backgroundColor: '#0A62C6',
    marginTop: 8,
    marginBottom: 10,
  },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLeft: { flex: 1 },
  metaRight: { width: 160 },
  metaLabel: { fontSize: 9, fontWeight: 'bold' },

  tableWrap: { marginTop: 8 },
  table: { borderWidth: 0.8, borderColor: '#000', borderStyle: 'solid' },
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
  cell: { padding: 3, fontSize: 8 },

  // PAR-style column widths
  colQty: { width: '6%' },
  colUnit: { width: '8%' },
  colDescription: { width: '40%' },
  colPropertyNo: { width: '20%' },
  colDateAcquired: { width: '14%' },
  colAmount: { width: '12%' },

  // PAR signature layout
  sigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  sigBlock: { width: '45%', textAlign: 'center' },
  sigTitle: { fontSize: 10, marginBottom: 8 },
  sigName: { fontSize: 10, marginBottom: 0 },
  sigLine: {
    borderBottomWidth: 1,
    borderColor: '#000',
    height: 18,
    marginTop: 0,
    marginBottom: 4,
  },
  sigSub: { fontSize: 8, marginBottom: 3, textAlign: 'left' },
});

/** Helpers */
function currency(val?: number | null): string {
  if (val == null) return '';
  return (
    'PHP' +
    new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  );
}

function truncate(text = '', max = 250) {
  return text.length > max ? text.substring(0, max) + '…' : text;
}

/** Row interface for ICS (same as PAR) */
interface ICSRow {
  qty: number;
  unit: string;
  description: string;
  propertyNo: string;
  dateAcquired: string;
  amount: number | null;
}

const ICSDocument = ({
  rows,
  employeeName,
}: {
  rows: ICSRow[];
  employeeName: string;
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
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

      {/* META */}
      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          <Text style={styles.metaLabel}>
            Entity Name: <Text>ENERGY REGULATORY COMMISSION</Text>
          </Text>
          <Text style={{ marginTop: 4 }}>
            Fund Cluster: _______________________
          </Text>
        </View>

        <View style={styles.metaRight}>
          <Text style={styles.metaLabel}>ICS No.: ______________</Text>
        </View>
      </View>

      {/* TABLE */}
      <View style={styles.tableWrap}>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.cell, styles.colQty]}>Qty</Text>
            <Text style={[styles.cell, styles.colUnit]}>Unit</Text>
            <Text style={[styles.cell, styles.colDescription]}>Description</Text>
            <Text style={[styles.cell, styles.colPropertyNo]}>Property Number</Text>
            <Text style={[styles.cell, styles.colDateAcquired]}>Date Acquired</Text>
            <Text style={[styles.cell, styles.colAmount]}>Amount</Text>
          </View>

          {rows.map((r, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.cell, styles.colQty]}>{r.qty}</Text>
              <Text style={[styles.cell, styles.colUnit]}>{r.unit}</Text>
              <Text style={[styles.cell, styles.colDescription]}>{truncate(r.description)}</Text>
              <Text style={[styles.cell, styles.colPropertyNo]}>{r.propertyNo}</Text>
              <Text style={[styles.cell, styles.colDateAcquired]}>{r.dateAcquired}</Text>
              <Text style={[styles.cell, styles.colAmount]}>{currency(r.amount)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* SIGNATURES (same as PAR) */}
      <View style={styles.sigRow}>
        {/* LEFT — RECEIVED BY */}
        <View style={styles.sigBlock}>
          <Text style={styles.sigTitle}>Received by:</Text>

          <Text style={styles.sigName}>{employeeName}</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigSub}>Signature over Printed Name of End User</Text>

          <View style={styles.sigLine} />
          <Text style={styles.sigSub}>Position/Office</Text>

          <View style={styles.sigLine} />
          <Text style={styles.sigSub}>Date</Text>
        </View>

        {/* RIGHT — ISSUED BY */}
        <View style={styles.sigBlock}>
          <Text style={styles.sigTitle}>Issued by:</Text>

          <Text style={styles.sigName}>CHERRYLYNN S. GONSALES</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigSub}>
            Signature over Printed Name of Supply and Property Custodian
          </Text>

          <View style={styles.sigLine} />
          <Text style={styles.sigSub}>Administrative Officer V - FAS, GSD</Text>

          <View style={styles.sigLine} />
          <Text style={styles.sigSub}>Date</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export class ICSGenerator {
  static async generateICSPreview(assets: Asset[], employee?: NormalizedEmployee): Promise<string> {
    if (!assets.length) throw new Error('No assets selected.');

    const rows: ICSRow[] = [];
    let employeeName = 'N/A';

    if (employee) {
      employeeName = `${employee.lastName}, ${employee.firstName}${employee.middleName ? ` ${employee.middleName}` : ''}${employee.suffixName ? ` ${employee.suffixName}` : ''}`.trim();
    } else {
      // Fallback to extracting from assets if no employee provided
      const empResp = await getEmployees(1, 10000);
      const employees = empResp.data.items;

      for (const asset of assets) {
        const full = await UnifiedAssetService.getById(asset.id);

        const latest = full.movements?.sort(
          (a, b) =>
            new Date(b.dateAssigned).getTime() -
            new Date(a.dateAssigned).getTime()
        )[0];

        const emp =
          employees.find((e: any) => e.id === latest?.plantillaEmployeeId) ||
          employees.find((e: any) => e.id === latest?.nonPlantillaEmployeeId);

        if (emp) {
          employeeName = `${emp.lastName}, ${emp.firstName} ${emp.middleName ?? ''}`;
          break; // Use the first found employee
        }
      }
    }

    for (const asset of assets) {
      const full = await UnifiedAssetService.getById(asset.id);

      rows.push({
        qty: 1,
        unit: full.unitOfMeasurement || 'Unit',
        description: full.description ?? '',
        propertyNo: full.propertyNumber ?? '',
        dateAcquired: full.dateAcquired
          ? new Date(full.dateAcquired).toISOString().slice(0, 10)
          : '',
        amount: full.unitValue ?? null,
      });
    }

    const blob = await pdf(<ICSDocument rows={rows} employeeName={employeeName} />).toBlob();
    return URL.createObjectURL(blob);
  }

  static async generateICS(assets: Asset[], employee: NormalizedEmployee) {
    if (!assets.length) throw new Error('No assets selected.');
    if (!employee) throw new Error('Employee must be selected.');

    const rows: ICSRow[] = [];
    const employeeName = `${employee.lastName}, ${employee.firstName}${employee.middleName ? ` ${employee.middleName}` : ''}${employee.suffixName ? ` ${employee.suffixName}` : ''}`.trim();

    for (const asset of assets) {
      const full = await UnifiedAssetService.getById(asset.id);

      rows.push({
        qty: 1,
        unit: full.unitOfMeasurement || 'Unit',
        description: full.description ?? '',
        propertyNo: full.propertyNumber ?? '',
        dateAcquired: full.dateAcquired
          ? new Date(full.dateAcquired).toISOString().slice(0, 10)
          : '',
        amount: full.unitValue ?? null,
      });
    }

    const blob = await pdf(<ICSDocument rows={rows} employeeName={employeeName} />).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ICS_${Date.now()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
