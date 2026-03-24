// src/components/reports/PALGenerator.tsx
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
import { NormalizedEmployee } from "@/types/asset/UnifiedAsset";
import { getEmployeeById } from "@/api/user-management/userApi";
import { getEmployeeAssets } from "@/api/asset/inventoryApi";

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
    marginBottom: 8,
  },

  metaLeft: { flex: 1 },

  metaRight: { width: 200 },

  metaLabel: { fontSize: 8, fontWeight: "bold" },

  metaValue: { fontSize: 8, marginBottom: 2 },

  tableWrap: { marginTop: 6 },

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
    minHeight: 18,
    alignItems: "center",
  },

  sectionHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#0A62C6",
    borderBottomWidth: 0.8,
    borderColor: "#000",
    minHeight: 18,
    alignItems: "center",
  },

  sectionHeaderText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 8,
    padding: 3,
    width: "100%",
  },

  subtotalRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderColor: "#aaa",
    minHeight: 16,
    alignItems: "center",
    backgroundColor: "#e8f0fb",
  },

  totalRow: {
    flexDirection: "row",
    borderTopWidth: 0.8,
    borderColor: "#000",
    minHeight: 18,
    alignItems: "center",
    backgroundColor: "#f7f7f7",
  },

  totalAmountText: {
    textAlign: "right",
    fontWeight: "bold",
  },

  cell: { padding: 2, fontSize: 8 },

  colNo: { width: "8%" },
  colDescription: { width: "45%" },
  colPropertyNo: { width: "20%" },
  colDateAcquired: { width: "14%" },
  colAmount: { width: "13%" },
  colSubtotalLabel: { width: "79%", textAlign: "right", fontSize: 8, fontStyle: "italic" },
  colTotalLabel: { width: "79%", textAlign: "right", fontWeight: "bold" },
});

function currency(val?: number | null) {
  if (val == null) return "";
  return (
    "PHP" +
    new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2 }).format(val)
  );
}

function truncate(text = "", max = 200) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

interface PALRow {
  no: number;
  description: string;
  propertyNo: string;
  dateAcquired: string;
  amount: number | null;
}

const TableHeader = () => (
  <View style={styles.tableHeaderRow}>
    <Text style={[styles.cell, styles.colNo]}>No.</Text>
    <Text style={[styles.cell, styles.colDescription]}>Description</Text>
    <Text style={[styles.cell, styles.colPropertyNo]}>Property Number</Text>
    <Text style={[styles.cell, styles.colDateAcquired]}>Date Acquired</Text>
    <Text style={[styles.cell, styles.colAmount]}>Amount</Text>
  </View>
);

const PALDocument = ({
  ppeRows,
  seRows,
  totalAmount,
  employeeName,
  position,
  office,
  divisionService,
  employeeNumber,
}: {
  ppeRows: PALRow[];
  seRows: PALRow[];
  totalAmount: number;
  employeeName: string;
  position: string;
  office: string;
  divisionService: string;
  employeeNumber: string;
}) => {
  const ppeTotal = ppeRows.reduce((s, r) => s + (r.amount ?? 0), 0);
  const seTotal = seRows.reduce((s, r) => s + (r.amount ?? 0), 0);
  const hasAny = ppeRows.length > 0 || seRows.length > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <Image src={logoSrc} style={styles.logo} />
          <View style={styles.titleBlock}>
            <Text style={styles.headerTitle}>PROPERTY ACCOUNTABILITY LIST</Text>
          </View>
        </View>

        <View style={styles.blueRule} />

        {/* META INFORMATION */}
        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <Text style={styles.metaValue}>Name: {employeeName}</Text>
            <Text style={styles.metaValue}>Service/Division: {divisionService}</Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaValue}>Employee Number: {employeeNumber}</Text>
            <Text style={styles.metaValue}>Position: {position}</Text>
          </View>
        </View>

        {/* ASSETS TABLE */}
        {hasAny && (
          <View style={styles.tableWrap}>
            <View style={styles.table}>
              <TableHeader />

              {/* PPE SECTION */}
              {ppeRows.length > 0 && (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeaderText}>
                      PROPERTY, PLANT AND EQUIPMENT (PPE)
                    </Text>
                  </View>
                  {ppeRows.map((r, i) => (
                    <View key={`ppe-${i}`} style={styles.tableRow}>
                      <Text style={[styles.cell, styles.colNo]}>{r.no}</Text>
                      <Text style={[styles.cell, styles.colDescription]}>{truncate(r.description)}</Text>
                      <Text style={[styles.cell, styles.colPropertyNo]}>{r.propertyNo}</Text>
                      <Text style={[styles.cell, styles.colDateAcquired]}>{r.dateAcquired}</Text>
                      <Text style={[styles.cell, styles.colAmount]}>{currency(r.amount)}</Text>
                    </View>
                  ))}
                  <View style={styles.subtotalRow}>
                    <Text style={[styles.cell, styles.colNo]}> </Text>
                    <Text style={[styles.cell, styles.colSubtotalLabel]}>PPE Sub-total:</Text>
                    <Text style={[styles.cell, styles.colAmount, styles.totalAmountText]}>{currency(ppeTotal)}</Text>
                  </View>
                </>
              )}

              {/* SE SECTION */}
              {seRows.length > 0 && (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeaderText}>
                      SEMI-EXPENDABLE PROPERTY (SE)
                    </Text>
                  </View>
                  {seRows.map((r, i) => (
                    <View key={`se-${i}`} style={styles.tableRow}>
                      <Text style={[styles.cell, styles.colNo]}>{r.no}</Text>
                      <Text style={[styles.cell, styles.colDescription]}>{truncate(r.description)}</Text>
                      <Text style={[styles.cell, styles.colPropertyNo]}>{r.propertyNo}</Text>
                      <Text style={[styles.cell, styles.colDateAcquired]}>{r.dateAcquired}</Text>
                      <Text style={[styles.cell, styles.colAmount]}>{currency(r.amount)}</Text>
                    </View>
                  ))}
                  <View style={styles.subtotalRow}>
                    <Text style={[styles.cell, styles.colNo]}> </Text>
                    <Text style={[styles.cell, styles.colSubtotalLabel]}>SE Sub-total:</Text>
                    <Text style={[styles.cell, styles.colAmount, styles.totalAmountText]}>{currency(seTotal)}</Text>
                  </View>
                </>
              )}

              {/* GRAND TOTAL ROW */}
              <View style={styles.totalRow}>
                <Text style={[styles.cell, styles.colNo]}> </Text>
                <Text style={[styles.cell, styles.colTotalLabel]}>TOTAL:</Text>
                <Text style={[styles.cell, styles.colAmount, styles.totalAmountText]}>{currency(totalAmount)}</Text>
              </View>
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};

export class PALGenerator {
  static async generatePALPreview(employee: NormalizedEmployee): Promise<string> {
    const ppeAssets = await getEmployeeAssets(employee.id, 'PPE');
    const seAssets = await getEmployeeAssets(employee.id, 'SE');

    if (!ppeAssets.length && !seAssets.length) {
      alert('No assets found for this employee. Cannot generate PAL preview.');
      return '';
    }

    const employeeName = `${employee.firstName}${employee.middleName ? ` ${employee.middleName}` : ''} ${employee.lastName}${employee.suffixName ? ` ${employee.suffixName}` : ''}`.trim();

    // Fetch employee details to get position and office
    const empResp = await getEmployeeById(employee.id);
    let position = 'N/A';
    let office = 'N/A';
    let divisionService = 'N/A';
    let employeeNumber = 'N/A';

    if (empResp.success && empResp.data.length > 0) {
      const empData = empResp.data[0];
      position = empData.position?.name || 'N/A';
      office = empData.office?.name || 'N/A';
      divisionService = empData.office?.name || 'N/A';
      employeeNumber = empData.employeeIdOriginal || 'N/A';
    }

    const isCurrentForEmployee = (asset: any) =>
      asset.movements?.some((m: any) => {
        const current = m.isCurrent === true || m.isCurrent === 1 || (typeof m.isCurrent === 'string' && m.isCurrent.toLowerCase() === 'true');
        return current && (
          m.plantillaEmployeeId === employee.id ||
          m.nonPlantillaEmployeeId === employee.id ||
          (Array.isArray(m.employee) && m.employee.some((e: any) => e.id === employee.id))
        );
      });

    let itemNumber = 1;
    const ppeRows: PALRow[] = ppeAssets.filter(isCurrentForEmployee).map((asset: any) => ({
      no: itemNumber++,
      description: asset.description ?? "",
      propertyNo: asset.propertyNumber ?? "",
      dateAcquired: asset.dateAcquired?.slice(0, 10) ?? "",
      amount: asset.unitValue ?? null,
    }));
    const seRows: PALRow[] = seAssets.filter(isCurrentForEmployee).map((asset: any) => ({
      no: itemNumber++,
      description: asset.description ?? "",
      propertyNo: asset.propertyNumber ?? "",
      dateAcquired: asset.dateAcquired?.slice(0, 10) ?? "",
      amount: asset.unitValue ?? null,
    }));

    const totalAmount = [...ppeRows, ...seRows].reduce((sum, row) => sum + (row.amount ?? 0), 0);

    const blob = await pdf(
      <PALDocument
        ppeRows={ppeRows}
        seRows={seRows}
        totalAmount={totalAmount}
        employeeName={employeeName}
        position={position}
        office={office}
        divisionService={divisionService}
        employeeNumber={employeeNumber}
      />
    ).toBlob();

    return URL.createObjectURL(blob);
  }

  static async generatePAL(employee: NormalizedEmployee) {
    const ppeAssets = await getEmployeeAssets(employee.id, 'PPE');
    const seAssets = await getEmployeeAssets(employee.id, 'SE');

    if (!ppeAssets.length && !seAssets.length) {
      alert('No assets found for this employee. Cannot generate PAL report.');
      return;
    }

    const employeeName = `${employee.firstName}${employee.middleName ? ` ${employee.middleName}` : ''} ${employee.lastName}${employee.suffixName ? ` ${employee.suffixName}` : ''}`.trim();

    // Fetch employee details to get position and office
    const empResp = await getEmployeeById(employee.id);
    let position = 'N/A';
    let office = 'N/A';
    let divisionService = 'N/A';
    let employeeNumber = 'N/A';

    if (empResp.success && empResp.data.length > 0) {
      const empData = empResp.data[0];
      position = empData.position?.name || 'N/A';
      office = empData.office?.name || 'N/A';
      divisionService = empData.office?.name || 'N/A';
      employeeNumber = empData.employeeIdOriginal || 'N/A';
    }

    const isCurrentForEmployee = (asset: any) =>
      asset.movements?.some((m: any) => {
        const current = m.isCurrent === true || m.isCurrent === 1 || (typeof m.isCurrent === 'string' && m.isCurrent.toLowerCase() === 'true');
        return current && (
          m.plantillaEmployeeId === employee.id ||
          m.nonPlantillaEmployeeId === employee.id ||
          (Array.isArray(m.employee) && m.employee.some((e: any) => e.id === employee.id))
        );
      });

    let itemNumber = 1;
    const ppeRows: PALRow[] = ppeAssets.filter(isCurrentForEmployee).map((asset: any) => ({
      no: itemNumber++,
      description: asset.description ?? "",
      propertyNo: asset.propertyNumber ?? "",
      dateAcquired: asset.dateAcquired?.slice(0, 10) ?? "",
      amount: asset.unitValue ?? null,
    }));
    const seRows: PALRow[] = seAssets.filter(isCurrentForEmployee).map((asset: any) => ({
      no: itemNumber++,
      description: asset.description ?? "",
      propertyNo: asset.propertyNumber ?? "",
      dateAcquired: asset.dateAcquired?.slice(0, 10) ?? "",
      amount: asset.unitValue ?? null,
    }));

    const totalAmount = [...ppeRows, ...seRows].reduce((sum, row) => sum + (row.amount ?? 0), 0);

    const blob = await pdf(
      <PALDocument
        ppeRows={ppeRows}
        seRows={seRows}
        totalAmount={totalAmount}
        employeeName={employeeName}
        position={position}
        office={office}
        divisionService={divisionService}
        employeeNumber={employeeNumber}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PAL_${Date.now()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
