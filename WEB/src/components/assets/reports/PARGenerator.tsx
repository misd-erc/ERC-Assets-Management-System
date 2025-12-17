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
import { Asset, NormalizedEmployee } from "@/types/asset/UnifiedAsset";
import { getEmployeeById, getEmployees } from "@/api/user-management/userApi";
import { UnifiedAssetService } from "@/services/UnifiedAssetService";
import { getEmployeeAssets } from "@/api/inventoryApi";

const logoSrc =
  typeof window !== "undefined"
    ? `${window.location.origin}/images/erc-logo.png`
    : "/mnt/data/erc-logo.png";

// Auto-date
const today = new Date().toISOString().slice(0, 10);

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
    marginTop: 12,
  },

  logo: { width: 55, height: 55 },

  titleBlock: { flex: 1, textAlign: "center" },

  headerTitle: { fontSize: 14, fontWeight: "bold", marginTop: 2 },

  blueRule: {
    height: 4,
    backgroundColor: "#0A62C6",
    marginTop: 8,
    marginBottom: 10,
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
    justifyContent: "space-between",
    marginTop: 25,
  },

  sigBlock: {
    width: "45%",
    textAlign: "center",
  },

  sigTitle: { fontSize: 10, marginBottom: 8 },

  sigName: { fontSize: 10, textAlign: "center" },

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
  },

  sigLabel: { fontSize: 8, marginBottom: 6, textAlign: "center" },
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
}: {
  rows: PARRow[];
  employeeName: string;
  position: string;
  office: string;
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.appendix}>Appendix 59</Text>

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Image src={logoSrc} style={styles.logo} />
        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle}>PROPERTY ACKNOWLEDGMENT RECEIPT</Text>
        </View>
      </View>

      <View style={styles.blueRule} />

      {/* META */}
      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          <Text style={styles.metaLabel}>
            Entity Name: ENERGY REGULATORY COMMISSION
          </Text>
          <Text style={{ marginTop: 4 }}>Fund Cluster: _______________________</Text>
        </View>

        <View style={styles.metaRight}>
          <Text style={styles.metaLabel}>PAR No.: ______________</Text>
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

          <Text style={styles.sigName}>{employeeName}</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Signature over Printed Name of End User</Text>

          <Text style={styles.sigTopText}>{position} - {office}</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Position/Office</Text>

          <Text style={styles.sigTopText}>{today}</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Date</Text>
        </View>

        {/* ISSUED BY */}
        <View style={styles.sigBlock}>
          <Text style={styles.sigTitle}>Issued by:</Text>

          <Text style={styles.sigName}>CHERRYLYNN S. GONSALES</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>
            Signature over Printed Name of Supply and Property Custodian
          </Text>

          <Text style={styles.sigTopText}>Administrative Officer V – FAS, GSD</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Position/Office</Text>

          <Text style={styles.sigTopText}>{today}</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Date</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export class PARGenerator {
  static async generatePARPreview(assets: Asset[], employee?: NormalizedEmployee): Promise<string> {
    if (!assets.length) throw new Error('No assets selected.');

    const rows: PARRow[] = [];
    let employeeName = 'N/A';
    let position = 'N/A';
    let office = 'N/A';

    if (employee) {
      employeeName = `${employee.lastName}, ${employee.firstName}${employee.middleName ? ` ${employee.middleName}` : ''}${employee.suffixName ? ` ${employee.suffixName}` : ''}`.trim();

      // Fetch employee details to get position and office
      const empResp = await getEmployeeById(employee.id);
      if (empResp.success && empResp.data.length > 0) {
        const empData = empResp.data[0];
        position = empData.position?.name || 'N/A';
        office = empData.office?.name || 'N/A';
      }
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
          position = emp.position?.name || 'N/A';
          office = emp.office?.name || 'N/A';
          break; // Use the first found employee
        }
      }
    }

    for (const asset of assets) {
      const full = await UnifiedAssetService.getById(asset.id);

      rows.push({
        qty: 1,
        unit: full.unitOfMeasurement ?? "Unit",
        description: full.description ?? "",
        propertyNo: full.propertyNumber ?? "",
        dateAcquired: full.dateAcquired?.slice(0, 10) ?? "",
        amount: full.unitValue ?? null,
      });
    }

    const blob = await pdf(
      <PARDocument
        rows={rows}
        employeeName={employeeName}
        position={position}
        office={office}
      />
    ).toBlob();

    return URL.createObjectURL(blob);
  }

  static async generatePAR(employee: NormalizedEmployee) {
    const assets = await getEmployeeAssets(employee.id, 'PPE');
    if (!assets.length) {
      alert('No PPE assets found for this employee. Cannot generate PAR report.');
      return;
    }
    if (!employee) throw new Error('Employee must be selected.');

    const rows: PARRow[] = [];
    const employeeName = `${employee.lastName}, ${employee.firstName}${employee.middleName ? ` ${employee.middleName}` : ''}${employee.suffixName ? ` ${employee.suffixName}` : ''}`.trim();

    // Fetch employee details to get position and office
    const empResp = await getEmployeeById(employee.id);
    let position = 'N/A';
    let office = 'N/A';
    if (empResp.success && empResp.data.length > 0) {
      const empData = empResp.data[0];
      position = empData.position?.name || 'N/A';
      office = empData.office?.name || 'N/A';
    }

    for (const asset of assets) {
      rows.push({
        qty: 1,
        unit: asset.unitOfMeasurement ?? "Unit",
        description: asset.description ?? "",
        propertyNo: asset.propertyNumber ?? "",
        dateAcquired: asset.dateAcquired?.slice(0, 10) ?? "",
        amount: asset.unitValue ?? null,
      });
    }

    const blob = await pdf(
      <PARDocument
        rows={rows}
        employeeName={employeeName}
        position={position}
        office={office}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PAR_${Date.now()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
