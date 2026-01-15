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
import { getEmployeeAssets } from "@/api/inventoryApi";

const logoSrc =
  typeof window !== "undefined"
    ? `${window.location.origin}/images/erc-logo.png`
    : "/mnt/data/erc-logo.png";

// (Removed remote font registration to avoid fetch failures.)

// Auto insert today's date (long format)
const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: "Helvetica",
    fontSize: 9,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  logo: { width: 55, height: 55 },

  headerTitleBlock: {
    flex: 1,
    textAlign: "center",
  },

  headerTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },

  blueRule: {
    height: 4,
    backgroundColor: "#0A62C6",
    marginTop: 8,
    marginBottom: 10,
  },

  info: {
    marginBottom: 6,
  },

  table: {
    marginTop: 12,
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

  colQty: { width: "8%" },
  colUnit: { width: "10%" },
  colDesc: { width: "42%" },
  colProp: { width: "25%" },
  colValue: { width: "15%" },

  // SIGNATURES
  sigRow: {
    flexDirection: "row",
    gap: 0,
    marginTop: 24,
  },

  sigBlock: {
    flex: 1,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#000",
    padding: 8,
    marginHorizontal: -1,
  },

  sigTitle: {
    fontSize: 11,
    marginBottom: 8,
  },

  sigName: { fontSize: 10 },

  sigTopText: {
    fontSize: 9,
    marginTop: 8,
    marginBottom: 2,
  },

  sigLine: {
    borderBottomWidth: 1,
    height: 18,
    marginBottom: 4,
  },

  sigLabel: { fontSize: 8, marginBottom: 6 },
});

interface ICSRow {
  qty: number;
  unit: string;
  description: string;
  propertyNo: string;
  value: number | null;
}

const ICSDocument = ({
  rows,
  employeeName,
  position,
  office,
  icsNumber,
}: {
  rows: ICSRow[];
  employeeName: string;
  position: string;
  office: string;
  icsNumber?: string;
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
          <Text style={[styles.cell, styles.colValue]}>Value</Text>
        </View>

        {rows.map((r, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.cell, styles.colQty]}>{r.qty}</Text>
            <Text style={[styles.cell, styles.colUnit]}>{r.unit}</Text>
            <Text style={[styles.cell, styles.colDesc]}>{r.description}</Text>
            <Text style={[styles.cell, styles.colProp]}>{r.propertyNo}</Text>
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
          <Text style={styles.sigName}>{employeeName}</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Signature over Printed Name of End User</Text>
          <Text style={styles.sigTopText}>{position} - {office}</Text>
          <Text style={styles.sigTopText}>{today}</Text>
        </View>

        {/* ISSUED BY */}
        <View style={styles.sigBlock}>
          <Text style={styles.sigTitle}>Issued by:</Text>
          <Text style={styles.sigName}>CHERRY LYNN S. GONZALES</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Signature over Printed Name of Supply and Property Custodian</Text>
          <Text style={styles.sigTopText}>Administrative Officer V – FAS, GSD</Text>
          <Text style={styles.sigTopText}>{today}</Text>
        </View>
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

  static async generateICSPreview(item: Asset, movement: UnifiedMovement | null, icsNumber?: string): Promise<string> {
    if (!item) {
      alert('No item selected. Cannot generate ICS preview.');
      return '';
    }

    const rows: ICSRow[] = [];
    // Build employee name from movement data if available
    let employeeName = 'N/A';
    let position = 'N/A';
    let office = 'N/A';

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
    }

    rows.push({
      qty: 1,
      unit: item.unitOfMeasurement ?? "Unit",
      description: item.description ?? "",
      propertyNo: item.propertyNumber ?? "",
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
    }

    rows.push({
      qty: 1,
      unit: item.unitOfMeasurement ?? "Unit",
      description: item.description ?? "",
      propertyNo: item.propertyNumber ?? "",
      value: item.unitValue ?? null,
    });

    const blob = await pdf(
      <ICSDocument
        rows={rows}
        employeeName={employeeName}
        position={position}
        office={office}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ICS_${Date.now()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
