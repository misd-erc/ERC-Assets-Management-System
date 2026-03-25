// src/components/reports/ICSGenerator.tsx
import React from "react";
import {
  pdf,
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
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

function formatShortDate(dateStr?: string) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[1]}-${parts[2]}-${parts[0]}`;
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: "Helvetica",
    fontSize: 9,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 0,
  },

  logo: { width: 40, height: 40 },

  headerTitleBlock: {
    flex: 1,
    textAlign: "center",
  },

  headerTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 0,
  },

  blueRule: {
    height: 2,
    backgroundColor: "#0A62C6",
    marginTop: 2,
    marginBottom: 4,
  },

  info: {
    marginBottom: 6,
  },

  table: {
    marginTop: 12,
    marginBottom: 0,
    borderWidth: 0.8,
    borderColor: "#000",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#efefef",
    borderBottomWidth: 0.8,
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    minHeight: 20,
    alignItems: "center",
  },

  cell: { padding: 4 },

  colQty: { width: "7%" },
  colUnit: { width: "9%" },
  colDesc: { width: "34%" },
  colProp: { width: "22%" },
  colDateAcq: { width: "13%" },
  colValue: { width: "15%" },

  // SIGNATURES
  sigRow: {
    flexDirection: "row",
    borderTopWidth: 0.8,
    borderBottomWidth: 0.8,
    borderLeftWidth: 0.8,
    borderRightWidth: 0.8,
    borderColor: "#000",
    minHeight: 100,
    marginTop: 0,
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

interface ICSRow {
  qty: number;
  unit: string;
  description: string;
  propertyNo: string;
  dateAcquired: string;
  value: number | null;
}

const ICSDocument = ({
  rows,
  employeeName,
  position,
  office,
  icsNumber,
  nonPlantillaEmployeeName,
  signatureDate,
}: {
  rows: ICSRow[];
  employeeName: string;
  position: string;
  office: string;
  icsNumber?: string;
  nonPlantillaEmployeeName?: string;
  signatureDate?: string;
}) => (
  <Document>
    <Page size="A4" style={styles.page}>

      {/* HEADER */}
      <View style={styles.headerRow}>
        <Image src={logoSrc} style={styles.logo} />
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>INVENTORY CUSTODIAN SLIP</Text>
          {icsNumber && (
            <Text style={{ fontSize: 10, marginTop: 4 }}>ICS No.: {icsNumber}</Text>
          )}
        </View>
      </View>
      <View style={styles.blueRule} />

      <Text style={styles.info}>Fund Cluster: Regular Agency Fund</Text>

      {/* TABLE */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.cell, styles.colQty]}>Qty</Text>
          <Text style={[styles.cell, styles.colUnit]}>Unit</Text>
          <Text style={[styles.cell, styles.colDesc]}>Description</Text>
          <Text style={[styles.cell, styles.colProp]}>Property Number</Text>
          <Text style={[styles.cell, styles.colDateAcq]}>Date Acquired</Text>
          <Text style={[styles.cell, styles.colValue]}>Value</Text>
        </View>

        {rows.map((r, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.cell, styles.colQty]}>{r.qty}</Text>
            <Text style={[styles.cell, styles.colUnit]}>{r.unit}</Text>
            <Text style={[styles.cell, styles.colDesc]}>{r.description}</Text>
            <Text style={[styles.cell, styles.colProp]}>{r.propertyNo}</Text>
            <Text style={[styles.cell, styles.colDateAcq]}>{r.dateAcquired || ""}</Text>
            <Text style={[styles.cell, styles.colValue]}>
              {r.value != null
                ? r.value.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : ""}
            </Text>
          </View>
        ))}
      </View>

      {/* SIGNATURE SECTION */}
      <View style={styles.sigRow}>

        {/* RECEIVED BY */}
        <View style={styles.sigBlock}>
          <Text style={styles.sigTitle}>Received by:</Text>
          <Text style={[styles.sigName, { marginTop: 25, marginBottom: -8 }]}>{employeeName}</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Signature over Printed Name of End User</Text>
          <Text style={[styles.sigTopText, { marginBottom: 0, marginTop: 6 }]}>{position} - {office}</Text>
          <View style={[styles.sigDateLine, { marginTop: -8, marginBottom: 6 }]} />
          <Text style={[styles.sigLabel, { marginBottom: 8, marginTop: 4 }]}>Position/Office</Text>
          <View>
            {signatureDate ? <Text style={[styles.sigDateValue, { textAlign: "center" }]}>{formatShortDate(signatureDate)}</Text> : null}
            <View style={styles.sigDateRow}>
              <View style={styles.sigDateLine} />
            </View>
            <Text style={styles.sigDateLabel}>DATE</Text>
          </View>
        </View>

        {/* ISSUED BY */}
        <View style={styles.sigBlockLast}>
          <Text style={styles.sigTitle}>Issued by:</Text>
          <Text style={[styles.sigName, { marginTop: 25, marginBottom: -8 }]}>CHERRY LYNN S. GONZALES</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Signature over Printed Name of Supply and Property Custodian</Text>
          <Text style={[styles.sigTopText, { marginBottom: 0, marginTop: 6 }]}>Administrative Officer V – FAS, GSD</Text>
          <View style={[styles.sigDateLine, { marginTop: -8, marginBottom: 6 }]} />
          <Text style={[styles.sigLabel, { marginBottom: 8, marginTop: 0 }]}>Position/Office</Text>
          <View>
            {signatureDate ? <Text style={[styles.sigDateValue, { textAlign: "center" }]}>{formatShortDate(signatureDate)}</Text> : null}
            <View style={styles.sigDateRow}>
              <View style={styles.sigDateLine} />
            </View>
            <Text style={styles.sigDateLabel}>DATE</Text>
          </View>
        </View>
      </View>

      {/* SUB-ICS */}
      <View style={{ flexDirection: "row", marginTop: 8 }}>
        <Text style={{ fontSize: 8, fontWeight: "bold" }}>
          Sub-ICS :{nonPlantillaEmployeeName ? ` ${nonPlantillaEmployeeName.toUpperCase()}` : ""}
        </Text>
      </View>
    </Page>
  </Document>
);

export class ICSGenerator {
  // Helper to generate ICS number in format YYYY-MM-SEQ
  static generateICSNumber(seq = 1) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const seqStr = String(seq).padStart(3, '0');
    return `${year}-${month}-${seqStr}`;
  }

  static async generateICSPreview(item: Asset, movement: UnifiedMovement | null, icsNumber?: string, signatureDate?: string): Promise<string> {
    if (!item) {
      alert('No item selected. Cannot generate ICS preview.');
      return '';
    }

    const rows: ICSRow[] = [];
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
      dateAcquired: item.dateAcquired
        ? new Date(item.dateAcquired).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
        : "",
      value: item.unitValue ?? null,
    });

    // Use provided ICS number or auto-generate
    const number = icsNumber || ICSGenerator.generateICSNumber();
    const blob = await pdf(
      <ICSDocument
        rows={rows}
        employeeName={employeeName}
        position={position}
        office={office}
        icsNumber={number}
        nonPlantillaEmployeeName={nonPlantillaEmployeeName}
        signatureDate={signatureDate}
      />
    ).toBlob();
    return URL.createObjectURL(blob);
  }

  static async generateICS(item: Asset, movement: UnifiedMovement | null) {
    if (!item) {
      alert('No item selected. Cannot generate ICS report.');
      return;
    }

    const rows: ICSRow[] = [];
    
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
      dateAcquired: item.dateAcquired
        ? new Date(item.dateAcquired).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
        : "",
      value: item.unitValue ?? null,
    });

    const blob = await pdf(
      <ICSDocument
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
    link.download = `ICS_${Date.now()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /** Generate and download an ICS PDF from issuance records (SE group). */
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

    const rows: ICSRow[] = records.map((r) => ({
      qty: 1,
      unit: r.unitOfMeasurement ?? 'Unit',
      description: r.itemName ?? '',
      propertyNo: r.propertyNumber ?? '',
      dateAcquired: r.dateAcquired
        ? new Date(r.dateAcquired).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
        : '',
      value: r.unitValue ?? null,
    }));

    const blob = await pdf(
      <ICSDocument
        rows={rows}
        employeeName={employeeName}
        position={position}
        office={office}
        icsNumber={first.parIcsNumber}
        nonPlantillaEmployeeName={nonPlantillaEmployeeName}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ICS_${first.parIcsNumber}_${Date.now()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
