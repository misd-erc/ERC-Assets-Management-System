// src/components/assets/reports/PTRGenerator.tsx
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
import { getEmployeeById } from "@/api/user-management/userApi";
import { ppeApi } from "@/api/ppe";
import { seApi } from "@/api/se";

const logoSrc =
  typeof window !== "undefined"
    ? `${window.location.origin}/images/erc-logo.png`
    : "/mnt/data/erc-logo.png";

const today = new Date().toISOString().slice(0, 10);

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    fontFamily: "Helvetica",
    flexDirection: "column",
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

  colDateAcquired: { width: "15%" },
  colPropertyNo: { width: "20%" },
  colDescription: { width: "40%" },
  colAmount: { width: "15%" },
  colCondition: { width: "10%" },

  sigRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },

  sigBlock: {
    width: "30%",
    textAlign: "center",
  },

  sigTitle: { fontSize: 10, marginBottom: 8 },

  sigName: { fontSize: 10, textAlign: "center" },

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

interface PTRRow {
  dateAcquired: string;
  propertyNo: string;
  description: string;
  amount: number | null;
  condition: string;
}

const PTRDocument = ({
  rows,
  ptrNumber,
  transferDate,
  fromEmployee,
  toEmployee,
}: {
  rows: PTRRow[];
  ptrNumber: string;
  transferDate: string;
  fromEmployee: NormalizedEmployee;
  toEmployee: NormalizedEmployee;
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.headerContainer}>
        <Image src={logoSrc} style={styles.logo} />
        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle}>PROPERTY TRANSFER REPORT</Text>
        </View>
      </View>

      <View style={styles.blueRule} />

      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          <Text style={styles.metaLabel}>
            Entity Name: ENERGY REGULATORY COMMISSION
          </Text>
          <Text style={{ marginTop: 4 }}>
            From Accountable Officer: {fromEmployee.lastName}, {fromEmployee.firstName}
          </Text>
          <Text style={{ marginTop: 4 }}>
            To Accountable Officer: {toEmployee.lastName}, {toEmployee.firstName}
          </Text>
        </View>

        <View style={styles.metaRight}>
          <Text style={styles.metaLabel}>PTR No.: {ptrNumber}</Text>
          <Text style={{ marginTop: 4 }}>Date: {transferDate}</Text>
        </View>
      </View>

      <View style={styles.tableWrap}>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.cell, styles.colDateAcquired]}>Date Acquired</Text>
            <Text style={[styles.cell, styles.colPropertyNo]}>Property Number</Text>
            <Text style={[styles.cell, styles.colDescription]}>Description</Text>
            <Text style={[styles.cell, styles.colAmount]}>Amount</Text>
            <Text style={[styles.cell, styles.colCondition]}>Condition</Text>
          </View>

          {rows.map((r, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.cell, styles.colDateAcquired]}>{r.dateAcquired}</Text>
              <Text style={[styles.cell, styles.colPropertyNo]}>{r.propertyNo}</Text>
              <Text style={[styles.cell, styles.colDescription]}>{truncate(r.description)}</Text>
              <Text style={[styles.cell, styles.colAmount]}>{currency(r.amount)}</Text>
              <Text style={[styles.cell, styles.colCondition]}>{r.condition}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sigRow}>
        <View style={styles.sigBlock}>
          <Text style={styles.sigTitle}>Approved By:</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Signature over Printed Name</Text>
        </View>

        <View style={styles.sigBlock}>
          <Text style={styles.sigTitle}>Released By:</Text>
          <Text style={styles.sigName}>{fromEmployee.lastName}, {fromEmployee.firstName}</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Signature over Printed Name</Text>
        </View>

        <View style={styles.sigBlock}>
          <Text style={styles.sigTitle}>Received By:</Text>
          <Text style={styles.sigName}>{toEmployee.lastName}, {toEmployee.firstName}</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Signature over Printed Name</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export class PTRGenerator {
  static async generatePTRPreview(
    fromEmployee: NormalizedEmployee,
    toEmployee: NormalizedEmployee,
    transferDate: string,
    selectedAssets: Asset[]
  ): Promise<string> {
    const ptrNumber = this.generatePTRNumber();
    const rows: PTRRow[] = [];

    for (const asset of selectedAssets) {
      const latestMovement = asset.movements
        .filter(m => m.isActive)
        .sort((a, b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime())[0];

      rows.push({
        dateAcquired: asset.dateAcquired?.slice(0, 10) ?? "",
        propertyNo: asset.propertyNumber ?? "",
        description: asset.description ?? "",
        amount: asset.unitValue ?? null,
        condition: latestMovement?.condition ?? "Good",
      });
    }

    const blob = await pdf(
      <PTRDocument
        rows={rows}
        ptrNumber={ptrNumber}
        transferDate={transferDate}
        fromEmployee={fromEmployee}
        toEmployee={toEmployee}
      />
    ).toBlob();

    return URL.createObjectURL(blob);
  }

  static async generatePTR(
    fromEmployee: NormalizedEmployee,
    toEmployee: NormalizedEmployee,
    transferDate: string,
    selectedAssets: Asset[]
  ) {
    const ptrNumber = this.generatePTRNumber();
    const rows: PTRRow[] = [];

    for (const asset of selectedAssets) {
      const latestMovement = asset.movements
        .filter(m => m.isActive)
        .sort((a, b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime())[0];

      rows.push({
        dateAcquired: asset.dateAcquired?.slice(0, 10) ?? "",
        propertyNo: asset.propertyNumber ?? "",
        description: asset.description ?? "",
        amount: asset.unitValue ?? null,
        condition: latestMovement?.condition ?? "Good",
      });

      // Update movement for each asset
      if (asset.group === 'PPE') {
        await ppeApi.editMovement({
          id: latestMovement?.id || 0,
          ptaId: asset.id,
          dateAssigned: transferDate,
          parItrNumber: ptrNumber,
          plantillaEmployeeId: toEmployee.id,
          nonPlantillaEmployeeId: 0,
          condition: latestMovement?.condition ?? "Good",
          actualOfficeId: latestMovement?.actualOfficeId || 0,
          actualDivisionId: latestMovement?.actualDivisionId || 0,
          isActive: true,
          actionBySystemUserId: parseInt(localStorage.getItem('systemUserId') || '0'),
          sessionKey: localStorage.getItem('sessionToken') || '',
          model: asset.model || '',
        });
      } else {
        await seApi.editMovement({
          id: latestMovement?.id || 0,
          ptaId: asset.id,
          dateAssigned: transferDate,
          parItrNumber: ptrNumber,
          plantillaEmployeeId: toEmployee.id.toString(),
          nonPlantillaEmployeeId: null,
          condition: latestMovement?.condition ?? "Good",
          actualOfficeId: latestMovement?.actualOfficeId || 0,
          actualDivisionId: latestMovement?.actualDivisionId || 0,
          isActive: true,
          actionBySystemUserId: parseInt(localStorage.getItem('systemUserId') || '0'),
          sessionKey: localStorage.getItem('sessionToken') || '',
          model: asset.model || '',
        });
      }
    }

    const blob = await pdf(
      <PTRDocument
        rows={rows}
        ptrNumber={ptrNumber}
        transferDate={transferDate}
        fromEmployee={fromEmployee}
        toEmployee={toEmployee}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PTR_${ptrNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private static generatePTRNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = now.getTime();
    return `PTR-${year}${month}${day}-${time}`;
  }
}
