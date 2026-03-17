// src/components/reports/PARGenerator.tsx
import React from "react";
import {
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { Asset, NormalizedEmployee, UnifiedMovement } from "@/types/asset/UnifiedAsset";
import { getEmployeeById, getEmployees } from "@/api/user-management/userApi";
import { UnifiedAssetService } from "@/services/UnifiedAssetService";
import { getEmployeeAssets } from "@/api/asset/inventoryApi";
import { IssuanceRecord } from "@/types/issuance";

const logoSrc =
  typeof window !== "undefined"
    ? `${window.location.origin}/images/erc-logo.png`
    : "/mnt/data/erc-logo.png";

// Auto-date (long format)
const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    fontFamily: "Helvetica",
    flexDirection: "column",
  },

  appendix: {
    position: "absolute",
    right: 20,
    top: 10,
    fontSize: 8,
    fontStyle: "italic",
  },

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 0,
  },

  logo: { width: 40, height: 40 },

  titleBlock: { flex: 1, textAlign: "center" },

  headerTitle: { fontSize: 12, fontWeight: "bold", marginTop: 0 },

  blueRule: {
    height: 2,
    backgroundColor: "#0A62C6",
    marginTop: 2,
    marginBottom: 4,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  metaLeft: { flex: 1 },

  metaRight: { width: 160 },

  metaLabel: { fontSize: 9, fontWeight: "bold" },

  tableWrap: { marginTop: 8 },

  table: { borderWidth: 0.8, borderColor: "#000" },

  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 0.8,
    borderColor: "#000",
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
    minHeight: 20,
    alignItems: "center",
  },

  cell: { padding: 3, fontSize: 8 },

  colQty: { width: "6%" },
  colUnit: { width: "8%" },
  colDescription: { width: "40%" },
  colPropertyNo: { width: "20%" },
  colDateAcquired: { width: "14%" },
  colAmount: { width: "12%" },

  // SIGNATURE SECTION
  sigRow: {
    flexDirection: "row",
    borderTopWidth: 0.8,
    borderBottomWidth: 0.8,
    borderLeftWidth: 0.8,
    borderRightWidth: 0.8,
    borderColor: "#000",
    minHeight: 100,
  },

  sigBlock: {
    flex: 1,
    textAlign: "center",
    borderRightWidth: 0.8,
    borderColor: "#000",
    padding: 8,
  },

  sigBlockLast: {
    flex: 1,
    textAlign: "center",
    borderColor: "#000",
    padding: 8,
  },

  sigTitle: { fontSize: 10, marginBottom: 8, textAlign: "left" },

  sigName: { fontSize: 10, textAlign: "center", marginBottom: 0, marginTop: -2 },

  sigTopText: {
    fontSize: 9,
    marginBottom: 2,
    marginTop: 8,
    textAlign: "center",
  },

  sigLine: {
    borderBottomWidth: 1,
    borderColor: "#000",
    height: 18,
    marginBottom: 4,
    marginTop: -8,
  },

  sigLabel: { fontSize: 8, marginBottom: 6, textAlign: "center", marginTop: -2 },

  sigDateRow: {
    marginTop: 8,
  },

  sigDateLine: {
    borderBottomWidth: 1,
    borderColor: "#000",
    height: 10,
  },

  sigDateValue: { fontSize: 8 },

  sigDateLabel: { fontSize: 8, textAlign: "center", marginTop: 2 },
});

function currency(val?: number | null) {
  if (val == null) return "";
  return (
    "PHP" +
    new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2 }).format(val)
  );
}

function truncate(text = "", max = 250) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

interface PARRow {
  qty: number;
  unit: string;
  description: string;
  propertyNo: string;
  dateAcquired: string;
  amount: number | null;
}

const PARDocument = ({
  rows,
  employeeName,
  position,
  office,
  parNumber,
  nonPlantillaEmployeeName,
}: {
  rows: PARRow[];
  employeeName: string;
  position: string;
  office: string;
  parNumber?: string;
  nonPlantillaEmployeeName?: string;
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.appendix}>Appendix 59</Text>

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Image src={logoSrc} style={styles.logo} />
        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle}>PROPERTY ACKNOWLEDGEMENT RECEIPT</Text>
        </View>
      </View>

      <View style={styles.blueRule} />

      {/* META */}
      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          <Text style={styles.metaLabel}>
            Entity Name: ENERGY REGULATORY COMMISSION
          </Text>
          <Text style={{ marginTop: 4 }}>Fund Cluster: Regular Agency Fund</Text>
        </View>

        <View style={styles.metaRight}>
          <Text style={styles.metaLabel}>PAR No.: {parNumber || '______________'}</Text>
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

      {/* SIGNATURES */}
      <View style={styles.sigRow}>
        {/* RECEIVED BY */}
        <View style={styles.sigBlock}>
          <Text style={styles.sigTitle}>Received by:</Text>
          <Text style={[styles.sigName, { marginTop: 25 }]}>{employeeName?.toUpperCase()}</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Signature over Printed Name of End User</Text>
          <Text style={[styles.sigTopText, { marginBottom: 4, marginTop: 6 }]}>{position} - {office}</Text>
          <View style={[styles.sigDateLine, { marginTop: -8, marginBottom: 2 }]} />
          <Text style={[styles.sigLabel, { marginBottom: 8, marginTop: 2 }]}>Position/Office</Text>
          <View>
            <View style={styles.sigDateRow}>
              <View style={styles.sigDateLine} />
            </View>
            <Text style={styles.sigDateLabel}>DATE</Text>
          </View>
        </View>

        {/* ISSUED BY */}
        <View style={styles.sigBlockLast}>
          <Text style={styles.sigTitle}>Issued by:</Text>
          <Text style={[styles.sigName, { marginTop: 25 }]}>CHERRY LYNN S. GONZALES</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Signature over Printed Name of Property Custodian</Text>
          <Text style={styles.sigTopText}>Administrative Officer V – FAS, GSD</Text>
           <View style={[styles.sigDateLine, { marginTop: -8, marginBottom: 2 }]} />
          <Text style={[styles.sigLabel, { marginBottom: 8, marginTop: 2 }]}>Position/Office</Text>
          <View>
            <View style={styles.sigDateRow}>
              <View style={styles.sigDateLine} />
            </View>
            <Text style={styles.sigDateLabel}>DATE</Text>
          </View>
        </View>
      </View>

      {/* SUB-PAR */}
      <View style={{ flexDirection: "row", marginTop: 8 }}>
        <Text style={{ fontSize: 8, fontWeight: "bold" }}>
          Sub-PAR :{nonPlantillaEmployeeName ? ` ${nonPlantillaEmployeeName.toUpperCase()}` : ""}
        </Text>
      </View>
    </Page>
  </Document>
);

export class PARGenerator {
  // Helper to generate PAR number in format YYYY-MM-SEQ
  static generatePARNumber(seq = 1) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const seqStr = String(seq).padStart(3, '0');
    return `${year}-${month}-${seqStr}`;
  }

  static async generatePARPreview(item: Asset, movement: UnifiedMovement | null, parNumber?: string): Promise<string> {
    if (!item) {
      alert('No item selected. Cannot generate PAR preview.');
      return '';
    }

    const rows: PARRow[] = [];
    // Build employee name from movement data if available
    let employeeName = 'N/A';
    let position = 'N/A';
    let office = 'N/A';
    let nonPlantillaEmployeeName = '';

    if (movement) {
      // Try to get employee details from movement
      const employeeId = movement.plantillaEmployeeId || movement.nonPlantillaEmployeeId;
      if (employeeId) {
        const empResp = await getEmployeeById(employeeId);
        if (empResp.success && empResp.data.length > 0) {
          const empData = empResp.data[0];
          employeeName = `${empData.firstName}${empData.middleName ? ` ${empData.middleName}` : ''} ${empData.lastName}${empData.suffixName ? ` ${empData.suffixName}` : ''}`.trim();
          position = empData.position?.name || 'N/A';
          office = empData.office?.name || 'N/A';
        }
      }
      if (movement.nonPlantillaEmployeeId) {
        const npResp = await getEmployeeById(movement.nonPlantillaEmployeeId);
        if (npResp.success && npResp.data.length > 0) {
          const npData = npResp.data[0];
          nonPlantillaEmployeeName = `${npData.lastName}, ${npData.firstName}${npData.middleName ? ` ${npData.middleName}` : ''}${npData.suffixName ? ` ${npData.suffixName}` : ''}`.trim();
        }
      }
    }

    rows.push({
      qty: 1,
      unit: item.unitOfMeasurement ?? "Unit",
      description: item.description ?? "",
      propertyNo: item.propertyNumber ?? "",
      dateAcquired: item.dateAcquired?.slice(0, 10) ?? "",
      amount: item.unitValue ?? null,
    });

    // Use provided PAR number or auto-generate
    const number = parNumber || PARGenerator.generatePARNumber();
    const blob = await pdf(
      <PARDocument
        rows={rows}
        employeeName={employeeName}
        position={position}
        office={office}
        parNumber={number}
        nonPlantillaEmployeeName={nonPlantillaEmployeeName}
      />
    ).toBlob();
    return URL.createObjectURL(blob);
  }

  static async generatePAR(item: Asset, movement: UnifiedMovement | null) {
    if (!item) {
      alert('No item selected. Cannot generate PAR report.');
      return;
    }

    const rows: PARRow[] = [];
    
    // Build employee name from movement data if available
    let employeeName = 'N/A';
    let position = 'N/A';
    let office = 'N/A';
    let nonPlantillaEmployeeName = '';

    if (movement) {
      // Try to get employee details from movement
      const employeeId = movement.plantillaEmployeeId || movement.nonPlantillaEmployeeId;
      if (employeeId) {
        const empResp = await getEmployeeById(employeeId);
        if (empResp.success && empResp.data.length > 0) {
          const empData = empResp.data[0];
          employeeName = `${empData.lastName}, ${empData.firstName}${empData.middleName ? ` ${empData.middleName}` : ''}${empData.suffixName ? ` ${empData.suffixName}` : ''}`.trim();
          position = empData.position?.name || 'N/A';
          office = empData.office?.name || 'N/A';
        }
      }
      if (movement.nonPlantillaEmployeeId) {
        const npResp = await getEmployeeById(movement.nonPlantillaEmployeeId);
        if (npResp.success && npResp.data.length > 0) {
          const npData = npResp.data[0];
          nonPlantillaEmployeeName = `${npData.lastName}, ${npData.firstName}${npData.middleName ? ` ${npData.middleName}` : ''}${npData.suffixName ? ` ${npData.suffixName}` : ''}`.trim();
        }
      }
    }

    rows.push({
      qty: 1,
      unit: item.unitOfMeasurement ?? "Unit",
      description: item.description ?? "",
      propertyNo: item.propertyNumber ?? "",
      dateAcquired: item.dateAcquired?.slice(0, 10) ?? "",
      amount: item.unitValue ?? null,
    });

    const blob = await pdf(
      <PARDocument
        rows={rows}
        employeeName={employeeName}
        position={position}
        office={office}
        nonPlantillaEmployeeName={nonPlantillaEmployeeName}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PAR_${Date.now()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /** Generate and download a PAR PDF from issuance records (PPE group). */
  static async generateFromIssuanceRecords(records: IssuanceRecord[]): Promise<void> {
    if (!records.length) return;
    const first = records[0];

    let employeeName = first.employeeName || 'N/A';
    let position = 'N/A';
    let office = first.officeName || 'N/A';
    let nonPlantillaEmployeeName = first.subEmployeeName || '';

    if (first.employeeId) {
      try {
        const empResp = await getEmployeeById(first.employeeId);
        if (empResp.success && empResp.data.length > 0) {
          const empData = empResp.data[0];
          employeeName = `${empData.lastName}, ${empData.firstName}${empData.middleName ? ` ${empData.middleName}` : ''}${empData.suffixName ? ` ${empData.suffixName}` : ''}`.trim();
          position = empData.position?.name || 'N/A';
          office = empData.office?.name || first.officeName || 'N/A';
        }
      } catch { /* use fallback values */ }
    }

    if (first.subEmployeeId && !nonPlantillaEmployeeName) {
      try {
        const npResp = await getEmployeeById(first.subEmployeeId);
        if (npResp.success && npResp.data.length > 0) {
          const npData = npResp.data[0];
          nonPlantillaEmployeeName = `${npData.lastName}, ${npData.firstName}${npData.middleName ? ` ${npData.middleName}` : ''}${npData.suffixName ? ` ${npData.suffixName}` : ''}`.trim();
        }
      } catch { /* use fallback */ }
    }

    const rows: PARRow[] = records.map((r) => ({
      qty: 1,
      unit: r.unitOfMeasurement ?? 'Unit',
      description: r.itemName ?? '',
      propertyNo: r.propertyNumber ?? '',
      dateAcquired: r.dateAcquired?.slice(0, 10) ?? '',
      amount: r.unitValue ?? null,
    }));

    const blob = await pdf(
      <PARDocument
        rows={rows}
        employeeName={employeeName}
        position={position}
        office={office}
        parNumber={first.parIcsNumber}
        nonPlantillaEmployeeName={nonPlantillaEmployeeName}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PAR_${first.parIcsNumber}_${Date.now()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
