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
import { Asset } from "@/types/asset/UnifiedAsset";
import { getEmployees } from "@/api/user-management/userApi";
import { UnifiedAssetService } from "@/services/UnifiedAssetService";

const logoSrc =
  typeof window !== "undefined"
    ? `${window.location.origin}/images/erc-logo.png`
    : "/mnt/data/erc-logo.png";

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
  logo: {
    width: 55,
    height: 55,
  },
  titleBlock: {
    flex: 1,
    textAlign: "center",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 2,
  },

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
  metaLeft: {
    flex: 1,
  },
  metaRight: {
    width: 160,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: "bold",
  },

  tableWrap: {
    marginTop: 8,
  },
  table: {
    borderWidth: 0.8,
    borderColor: "#000",
    borderStyle: "solid",
  },
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
  cell: {
    padding: 3,
    fontSize: 8,
  },

  colQty: { width: "7%" },
  colUnit: { width: "7%" },
  colUnitCost: { width: "12%" },
  colTotalCost: { width: "12%" },
  colDescription: { width: "40%" },
  colPropertyNo: { width: "16%" },
  colUsefulLife: { width: "6%" },

 sigRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 25,
},

sigBlock: {
  width: '45%',
  textAlign: 'center',
},

sigTitle: {
  fontSize: 10,
  marginBottom: 8,
},

sigName: {
  fontSize: 10,
  marginBottom: 0,        // NO spacing before line
},

sigLine: {
  borderBottomWidth: 1,
  borderColor: '#000',
  height: 18,
  marginTop: 0,   
  marginBottom: 4,
},

sigSub: {
  fontSize: 8,
  marginBottom: 3,
  textAlign: 'left',
},

});

function currency(val?: number | null): string {
  if (val == null) return "";
  return (
    "PHP" +
    new Intl.NumberFormat("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  );
}

function truncate(text = "", max = 250) {
  return text.length > max ? text.substring(0, max) + "…" : text;
}

interface PARRow {
  qty: number;
  unit: string;
  unitCost: number | null;
  totalCost: number | null;
  description: string;
  propertyNo: string;
  usefulLife: string;
}

const PARDocument = ({
  rows,
  employeeName,
}: {
  rows: PARRow[];
  employeeName: string;
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
            Entity Name: <Text>ENERGY REGULATORY COMMISSION</Text>
          </Text>
          <Text style={{ marginTop: 4 }}>
            Fund Cluster: _______________________
          </Text>
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
            <Text style={[styles.cell, styles.colUnitCost]}>Unit Cost</Text>
            <Text style={[styles.cell, styles.colTotalCost]}>Total Cost</Text>
            <Text style={[styles.cell, styles.colDescription]}>Description</Text>
            <Text style={[styles.cell, styles.colPropertyNo]}>
              Property No.
            </Text>
            <Text style={[styles.cell, styles.colUsefulLife]}>U/L</Text>
          </View>

          {rows.map((r, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.cell, styles.colQty]}>{r.qty}</Text>
              <Text style={[styles.cell, styles.colUnit]}>{r.unit}</Text>
              <Text style={[styles.cell, styles.colUnitCost]}>
                {currency(r.unitCost)}
              </Text>
              <Text style={[styles.cell, styles.colTotalCost]}>
                {currency(r.totalCost)}
              </Text>
              <Text style={[styles.cell, styles.colDescription]}>
                {truncate(r.description)}
              </Text>
              <Text style={[styles.cell, styles.colPropertyNo]}>
                {r.propertyNo}
              </Text>
              <Text style={[styles.cell, styles.colUsefulLife]}>
                {r.usefulLife}
              </Text>
            </View>
          ))}
        </View>
      </View>

     {/* SIGNATURES */}
<View style={styles.sigRow}>

  {/* LEFT — RECEIVED BY (Employee) */}
  <View style={styles.sigBlock}>
    <Text style={styles.sigTitle}>Received by:</Text>

    {/* Employee Signature */}
    
    <Text style={styles.sigName}>{employeeName}</Text>
    <View style={styles.sigLine} />
    <Text style={styles.sigSub}>Signature Over Printed Name</Text>

    {/* Position */}
    <View style={styles.sigLine} />
    <Text style={styles.sigSub}>Position/Office</Text>

    {/* Date */}
    <View style={styles.sigLine} />
    <Text style={styles.sigSub}>Date</Text>
  </View>

  {/* RIGHT — RECEIVED FROM (Property Officer) */}
  <View style={styles.sigBlock}>
    <Text style={styles.sigTitle}>Received from:</Text>

    {/* Property Officer Signature */}
    <Text style={styles.sigName}>Roselle Guintu</Text>
    <View style={styles.sigLine} />
    <Text style={styles.sigSub}>Signature Over Printed Name</Text>

    {/* Position */}
    <View style={styles.sigLine} />
    <Text style={styles.sigSub}>Position/Office</Text>

    {/* Date */}
    <View style={styles.sigLine} />
    <Text style={styles.sigSub}>Date</Text>
  </View>

</View>

    </Page>
  </Document>
);

export class PARGenerator {
  static async generatePARPreview(assets: Asset[]): Promise<string> {
    if (!assets.length) throw new Error("No assets selected.");

    const empResp = await getEmployees(1, 10000);
    const employees = empResp.data.items;

    const rows: PARRow[] = [];
    let employeeName = "N/A";

    for (const asset of assets) {
      const full = await UnifiedAssetService.getById(asset.id);

      const latest = full.movements?.sort(
        (a, b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime()
      )[0];

      const emp =
        employees.find((e: any) => e.id === latest?.plantillaEmployeeId) ||
        employees.find((e: any) => e.id === latest?.nonPlantillaEmployeeId);

      if (emp)
        employeeName = `${emp.lastName}, ${emp.firstName} ${
          emp.middleName ?? ""
        }`;

      rows.push({
        qty: 1,
        unit: full.unitOfMeasurement || "Unit",
        unitCost: full.unitValue ?? null,
        totalCost: full.unitValue ?? null,
        description: full.description,
        propertyNo: full.propertyNumber,
        usefulLife: full.estimatedUsefulLife
          ? String(full.estimatedUsefulLife)
          : "",
      });
    }

    const blob = await pdf(
      <PARDocument rows={rows} employeeName={employeeName} />
    ).toBlob();

    return URL.createObjectURL(blob);
  }

  static async generatePAR(assets: Asset[]) {
    if (!assets.length) throw new Error("No assets selected.");

    const empResp = await getEmployees(1, 10000);
    const employees = empResp.data.items;

    const rows: PARRow[] = [];
    let employeeName = "N/A";

    for (const asset of assets) {
      const full = await UnifiedAssetService.getById(asset.id);

      const latest = full.movements?.sort(
        (a, b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime()
      )[0];

      const emp =
        employees.find((e: any) => e.id === latest?.plantillaEmployeeId) ||
        employees.find((e: any) => e.id === latest?.nonPlantillaEmployeeId);

      if (emp)
        employeeName = `${emp.lastName}, ${emp.firstName} ${
          emp.middleName ?? ""
        }`;

      rows.push({
        qty: 1,
        unit: full.unitOfMeasurement || "Unit",
        unitCost: full.unitValue ?? null,
        totalCost: full.unitValue ?? null,
        description: full.description,
        propertyNo: full.propertyNumber,
        usefulLife: full.estimatedUsefulLife
          ? String(full.estimatedUsefulLife)
          : "",
      });
    }

    const blob = await pdf(
      <PARDocument rows={rows} employeeName={employeeName} />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PAR_${Date.now()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
