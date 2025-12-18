// src/components/assets/reports/ITRGenerator.tsx
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
import { Asset } from "@/types/asset/UnifiedAsset";

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

  assetInfoContainer: {
    marginBottom: 12,
  },

  assetInfoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },

  assetInfoLabel: { fontSize: 9, fontWeight: "bold", width: 120 },

  assetInfoValue: { fontSize: 9, flex: 1 },

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

  colDate: { width: "12%" },
  colParItrNumber: { width: "18%" },
  colFromEmployee: { width: "20%" },
  colToEmployee: { width: "20%" },
  colOfficeDivision: { width: "15%" },
  colCondition: { width: "15%" },

  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },

  footerBlock: {
    width: "45%",
    textAlign: "center",
  },

  footerTitle: { fontSize: 10, marginBottom: 8 },

  footerName: { fontSize: 10, textAlign: "center" },

  footerLine: {
    borderBottomWidth: 1,
    borderColor: "#000",
    height: 18,
    marginBottom: 4,
  },

  footerLabel: { fontSize: 8, marginBottom: 6, textAlign: "center" },
});

function truncate(text = "", max = 250) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

interface ITRRow {
  date: string;
  parItrNumber: string;
  fromEmployee: string;
  toEmployee: string;
  officeDivision: string;
  condition: string;
}

const ITRDocument = ({
  asset,
  movements,
}: {
  asset: Asset;
  movements: ITRRow[];
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.headerContainer}>
        <Image src={logoSrc} style={styles.logo} />
        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle}>INVENTORY TRANSFER REPORT</Text>
        </View>
      </View>

      <View style={styles.blueRule} />

      <View style={styles.assetInfoContainer}>
        <View style={styles.assetInfoRow}>
          <Text style={styles.assetInfoLabel}>Property Number:</Text>
          <Text style={styles.assetInfoValue}>{asset.propertyNumber}</Text>
        </View>
        <View style={styles.assetInfoRow}>
          <Text style={styles.assetInfoLabel}>Description:</Text>
          <Text style={styles.assetInfoValue}>{asset.description}</Text>
        </View>
        <View style={styles.assetInfoRow}>
          <Text style={styles.assetInfoLabel}>Category:</Text>
          <Text style={styles.assetInfoValue}>{asset.category}</Text>
        </View>
        <View style={styles.assetInfoRow}>
          <Text style={styles.assetInfoLabel}>Acquisition Date:</Text>
          <Text style={styles.assetInfoValue}>{asset.dateAcquired?.slice(0, 10)}</Text>
        </View>
        <View style={styles.assetInfoRow}>
          <Text style={styles.assetInfoLabel}>Unit Value:</Text>
          <Text style={styles.assetInfoValue}>
            PHP{asset.unitValue?.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      <View style={styles.tableWrap}>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.cell, styles.colDate]}>Date</Text>
            <Text style={[styles.cell, styles.colParItrNumber]}>PAR/PTR/ITR Number</Text>
            <Text style={[styles.cell, styles.colFromEmployee]}>From Employee</Text>
            <Text style={[styles.cell, styles.colToEmployee]}>To Employee</Text>
            <Text style={[styles.cell, styles.colOfficeDivision]}>Office/Division</Text>
            <Text style={[styles.cell, styles.colCondition]}>Condition</Text>
          </View>

          {movements.map((m, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.cell, styles.colDate]}>{m.date}</Text>
              <Text style={[styles.cell, styles.colParItrNumber]}>{m.parItrNumber}</Text>
              <Text style={[styles.cell, styles.colFromEmployee]}>{truncate(m.fromEmployee, 20)}</Text>
              <Text style={[styles.cell, styles.colToEmployee]}>{truncate(m.toEmployee, 20)}</Text>
              <Text style={[styles.cell, styles.colOfficeDivision]}>{truncate(m.officeDivision, 15)}</Text>
              <Text style={[styles.cell, styles.colCondition]}>{m.condition}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footerContainer}>
        <View style={styles.footerBlock}>
          <Text style={styles.footerTitle}>Prepared By:</Text>
          <View style={styles.footerLine} />
          <Text style={styles.footerLabel}>Signature over Printed Name</Text>
        </View>

        <View style={styles.footerBlock}>
          <Text style={styles.footerTitle}>Noted By:</Text>
          <View style={styles.footerLine} />
          <Text style={styles.footerLabel}>Signature over Printed Name</Text>
          <Text style={{ fontSize: 8, marginTop: 8, textAlign: "center" }}>
            Date Generated: {today}
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);

export class ITRGenerator {
  static async generateITRPreview(asset: Asset): Promise<string> {
    const movements: ITRRow[] = asset.movements
      .filter(m => m.isActive)
      .sort((a, b) => new Date(a.dateAssigned).getTime() - new Date(b.dateAssigned).getTime())
      .map(m => ({
        date: m.dateAssigned.slice(0, 10),
        parItrNumber: m.parItrNumber,
        fromEmployee: m.employee?.firstName && m.employee?.lastName
          ? `${m.employee.lastName}, ${m.employee.firstName}`
          : 'N/A',
        toEmployee: 'N/A', // Would need to track transfer history
        officeDivision: m.office?.name || m.division?.name || 'N/A',
        condition: m.condition,
      }));

    const blob = await pdf(
      <ITRDocument
        asset={asset}
        movements={movements}
      />
    ).toBlob();

    return URL.createObjectURL(blob);
  }

  static async generateITR(asset: Asset) {
    const movements: ITRRow[] = asset.movements
      .filter(m => m.isActive)
      .sort((a, b) => new Date(a.dateAssigned).getTime() - new Date(b.dateAssigned).getTime())
      .map(m => ({
        date: m.dateAssigned.slice(0, 10),
        parItrNumber: m.parItrNumber,
        fromEmployee: m.employee?.firstName && m.employee?.lastName
          ? `${m.employee.lastName}, ${m.employee.firstName}`
          : 'N/A',
        toEmployee: 'N/A', // Would need to track transfer history
        officeDivision: m.office?.name || m.division?.name || 'N/A',
        condition: m.condition,
      }));

    const blob = await pdf(
      <ITRDocument
        asset={asset}
        movements={movements}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ITR_${asset.propertyNumber}_${Date.now()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
