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
import { Asset, NormalizedEmployee } from "@/types/asset/UnifiedAsset";
import { getEmployeeById, getEmployees } from "@/api/user-management/userApi";
import { UnifiedAssetService } from "@/services/UnifiedAssetService";

const logoSrc =
  typeof window !== "undefined"
    ? `${window.location.origin}/images/erc-logo.png`
    : "/mnt/data/erc-logo.png";

// Auto insert today's date
const today = new Date().toISOString().slice(0, 10);

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
    justifyContent: "space-between",
    marginTop: 24,
  },

  sigBlock: {
    width: "45%",
    textAlign: "center",
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
}: {
  rows: ICSRow[];
  employeeName: string;
  position: string;
  office: string;
}) => (
  <Document>
    <Page size="A4" style={styles.page}>

      {/* HEADER */}
      <View style={styles.headerRow}>
        <Image src={logoSrc} style={styles.logo} />

        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>INVENTORY CUSTODIAN SLIP</Text>
        </View>
      </View>

      <View style={styles.blueRule} />

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
              {r.value?.toLocaleString("en-PH", {
                style: "currency",
                currency: "PHP",
              })}
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

export class ICSGenerator {
  static async generateICSPreview(assets: Asset[], employee?: NormalizedEmployee): Promise<string> {
    if (!assets.length) throw new Error('No assets selected.');

    const rows: ICSRow[] = [];
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
        value: full.unitValue ?? null,
      });
    }

    const blob = await pdf(
      <ICSDocument
        rows={rows}
        employeeName={employeeName}
        position={position}
        office={office}
      />
    ).toBlob();

    return URL.createObjectURL(blob);
  }

  static async generateICS(assets: Asset[], employee: NormalizedEmployee) {
    if (!assets.length) throw new Error('No assets selected.');
    if (!employee) throw new Error('Employee must be selected.');

    const rows: ICSRow[] = [];
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
      const full = await UnifiedAssetService.getById(asset.id);

      rows.push({
        qty: 1,
        unit: full.unitOfMeasurement ?? "Unit",
        description: full.description ?? "",
        propertyNo: full.propertyNumber ?? "",
        value: full.unitValue ?? null,
      });
    }

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
