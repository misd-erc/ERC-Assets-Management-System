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
import { Asset, NormalizedEmployee } from "@/types/asset/UnifiedAsset";
import { seApi } from "@/api/asset/se";

/* -------------------------------- CONSTANTS -------------------------------- */

const logoSrc =
  typeof window !== "undefined"
    ? `${window.location.origin}/images/erc-logo.png`
    : "/mnt/data/erc-logo.png";

type TransferType = "DONATION" | "REASSIGNMENT" | "RELOCATE" | "OTHERS";

const APPROVED_BY = {
  name: "CHERRY LYNN S. GONZALES",
  designation: "Administrative Officer V-FAS, GSD",
};

const RELEASED_BY = {
  name: "ROSELLE M. GUINTU",
  designation: "Administrative Officer III - FAS, GSD",
};

/* -------------------------------- STYLES -------------------------------- */

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    fontFamily: "Helvetica",
  },

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  logo: { width: 55, height: 55 },

  titleBlock: { flex: 1, textAlign: "center" },

  headerTitle: { fontSize: 14, fontWeight: "bold" },

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

  metaRight: { width: 170 },

  metaLabel: { fontSize: 9, fontWeight: "bold" },

  /* ---------------- Transfer Type ---------------- */

  transferBlock: {
    marginTop: 8,
    borderWidth: 0.8,
    borderColor: "#000",
    padding: 6,
  },

  transferTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
  },

  transferRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  transferItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 4,
  },

  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: "#000",
    marginRight: 6,
    textAlign: "center",
    fontSize: 8,
    lineHeight: 10,
  },

  othersLine: {
    borderBottomWidth: 0.8,
    borderColor: "#000",
    flex: 1,
    marginLeft: 4,
  },

  /* ---------------- Table ---------------- */

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

  /* ---------------- Signatures ---------------- */

  sigRow: {
    flexDirection: "row",
    gap: 0,
    marginTop: 25,
  },

  sigBlock: {
    flex: 1,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#000",
    padding: 8,
    marginHorizontal: -1,
  },

  sigTitle: { fontSize: 10, marginBottom: 6 },

  sigNameAboveLine: {
    fontSize: 10,
    marginBottom: 2,
    textAlign: "center",
  },

  sigLine: {
    borderBottomWidth: 1,
    borderColor: "#000",
    height: 18,
    marginBottom: 4,
  },

  sigLabel: { fontSize: 8, marginBottom: 4 },

  sigDesignation: { fontSize: 8 },
});

/* -------------------------------- DATE HELPERS ------------------------------- */
function formatLongDate(date?: string | Date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/* -------------------------------- HELPERS -------------------------------- */

function currency(val?: number | null) {
  if (val == null) return "";
  return (
    "PHP " +
    new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2 }).format(val)
  );
}

function truncate(text = "", max = 200) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

interface ITRRow {
  dateAcquired: string;
  propertyNo: string;
  description: string;
  amount: number | null;
  condition: string;
}

/* -------------------------------- DOCUMENT -------------------------------- */

const ITRDocument = ({
  rows,
  itrNumber,
  transferDate,
  fromEmployee,
  toEmployee,
  transferType,
}: {
  rows: ITRRow[];
  itrNumber: string;
  transferDate: string;
  fromEmployee: NormalizedEmployee;
  toEmployee: NormalizedEmployee;
  transferType: TransferType;
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Image src={logoSrc} style={styles.logo} />
        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle}>INVENTORY TRANSFER REPORT</Text>
        </View>
      </View>

      <View style={styles.blueRule} />

      {/* META */}
      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          <Text style={styles.metaLabel}>
            Entity Name: ENERGY REGULATORY COMMISSION
          </Text>
          <Text style={{ marginTop: 4 }}>
            From Accountable Officer: {fromEmployee.lastName},{" "}
            {fromEmployee.firstName}
          </Text>
          <Text style={{ marginTop: 4 }}>
            To Accountable Officer: {toEmployee.lastName},{" "}
            {toEmployee.firstName}
          </Text>
        </View>

        <View style={styles.metaRight}>
          <Text style={styles.metaLabel}>ITR No.: {itrNumber}</Text>
          <Text style={{ marginTop: 4 }}>Date: {formatLongDate(transferDate)}</Text>
        </View>
      </View>

      {/* TRANSFER TYPE */}
      <View style={styles.transferBlock}>
        <Text style={styles.transferTitle}>
          Transfer Type: (check only one)
        </Text>

        <View style={styles.transferRow}>
          <View style={styles.transferItem}>
            <Text style={styles.checkbox}>
              {transferType === "DONATION" ? "✓" : ""}
            </Text>
            <Text>Donation</Text>
          </View>

          <View style={styles.transferItem}>
            <Text style={styles.checkbox}>
              {transferType === "RELOCATE" ? "✓" : ""}
            </Text>
            <Text>Relocate</Text>
          </View>
        </View>

        <View style={styles.transferRow}>
          <View style={styles.transferItem}>
            <Text style={styles.checkbox}>
              {transferType === "REASSIGNMENT" ? "✓" : ""}
            </Text>
            <Text>Reassignment</Text>
          </View>

          <View style={styles.transferItem}>
            <Text style={styles.checkbox}>
              {transferType === "OTHERS" ? "✓" : ""}
            </Text>
            <Text>Others (Specify)</Text>
            <View style={styles.othersLine} />
          </View>
        </View>
      </View>

      {/* TABLE */}
      <View style={styles.tableWrap}>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.cell, styles.colDateAcquired]}>
              Date Acquired
            </Text>
            <Text style={[styles.cell, styles.colPropertyNo]}>
              Property Number
            </Text>
            <Text style={[styles.cell, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.cell, styles.colAmount]}>Amount</Text>
            <Text style={[styles.cell, styles.colCondition]}>Condition of SE</Text>
          </View>

          {rows.map((r, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.cell, styles.colDateAcquired]}>
                {r.dateAcquired}
              </Text>
              <Text style={[styles.cell, styles.colPropertyNo]}>
                {r.propertyNo}
              </Text>
              <Text style={[styles.cell, styles.colDescription]}>
                {truncate(r.description)}
              </Text>
              <Text style={[styles.cell, styles.colAmount]}>
                {currency(r.amount)}
              </Text>
              <Text style={[styles.cell, styles.colCondition]}>
                {r.condition}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* SIGNATURES */}
      <View style={styles.sigRow}>
        <View style={styles.sigBlock}>
          <Text style={styles.sigTitle}>Approved by:</Text>
          <Text style={styles.sigNameAboveLine}>{APPROVED_BY.name}</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Signature Over Printed Name</Text>
          <Text style={styles.sigDesignation}>
            {APPROVED_BY.designation}
          </Text>
          <Text style={styles.sigDesignation}>{formatLongDate(transferDate)}</Text>
        </View>

        <View style={styles.sigBlock}>
          <Text style={styles.sigTitle}>Released / Issued by:</Text>
          <Text style={styles.sigNameAboveLine}>{RELEASED_BY.name}</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Signature Over Printed Name</Text>
          <Text style={styles.sigDesignation}>
            {RELEASED_BY.designation}
          </Text>
          <Text style={styles.sigDesignation}>{formatLongDate(transferDate)}</Text>
        </View>

        <View style={styles.sigBlock}>
          <Text style={styles.sigTitle}>Received by:</Text>
          <Text style={styles.sigNameAboveLine}>
            {toEmployee.lastName}, {toEmployee.firstName}
          </Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Signature Over Printed Name</Text>
          <Text style={styles.sigDesignation}>
            Accountable Officer
          </Text>
          <Text style={styles.sigDesignation}>{formatLongDate(transferDate)}</Text>
        </View>
      </View>
    </Page>
  </Document>
);

/* -------------------------------- GENERATOR -------------------------------- */

export class ITRGenerator {
  static async generateITRPreview(
    item: Asset,
    movement: any,
    toEmployee: NormalizedEmployee,
    transferDate: string,
    transferType: TransferType
  ): Promise<string> {
    const itrNumber = this.generateITRNumber();
    const rows = this.buildRows([item]);

    // Extract fromEmployee from movement
    const employee = Array.isArray(movement?.employee) ? movement?.employee[0] : movement?.employee;
    const fromEmployee: NormalizedEmployee = {
      id: movement?.plantillaEmployeeId || movement?.nonPlantillaEmployeeId || 0,
      firstName: employee?.firstName || '',
      middleName: employee?.middleName || '',
      lastName: employee?.lastName || '',
      suffixName: employee?.suffixName || '',
      employeeIdOriginal: movement?.plantillaEmployeeIdOriginal || movement?.nonPlantillaEmployeeIdOriginal || '',
      employmentTypeId: 0,
      label: `${employee?.lastName || ''}, ${employee?.firstName || ''}`,
    };

    const blob = await pdf(
      <ITRDocument
        rows={rows}
        itrNumber={itrNumber}
        transferDate={transferDate}
        fromEmployee={fromEmployee}
        toEmployee={toEmployee}
        transferType={transferType}
      />
    ).toBlob();

    return URL.createObjectURL(blob);
  }

  static async generateITR(
    item: Asset,
    movement: any,
    toEmployee: NormalizedEmployee,
    transferDate: string,
    transferType: TransferType
  ) {
    const itrNumber = this.generateITRNumber();
    const rows = this.buildRows([item]);

    // Extract fromEmployee from movement
    const employee = Array.isArray(movement?.employee) ? movement?.employee[0] : movement?.employee;
    const fromEmployee: NormalizedEmployee = {
      id: movement?.plantillaEmployeeId || movement?.nonPlantillaEmployeeId || 0,
      firstName: employee?.firstName || '',
      middleName: employee?.middleName || '',
      lastName: employee?.lastName || '',
      suffixName: employee?.suffixName || '',
      employeeIdOriginal: movement?.plantillaEmployeeIdOriginal || movement?.nonPlantillaEmployeeIdOriginal || '',
      employmentTypeId: 0,
      label: `${employee?.lastName || ''}, ${employee?.firstName || ''}`,
    };

    const latestMovement = item.movements
      ?.filter(m => m.isActive)
      .sort(
        (a, b) =>
          new Date(b.dateAssigned).getTime() -
          new Date(a.dateAssigned).getTime()
      )[0];

    await seApi.editMovement({
      id: latestMovement?.id || 0,
      ptaId: item.id,
      dateAssigned: transferDate,
      parItrNumber: itrNumber,
      plantillaEmployeeId: toEmployee.id.toString(),
      nonPlantillaEmployeeId: null,
      condition: latestMovement?.condition ?? "Good",
      actualOfficeId: latestMovement?.actualOfficeId || 0,
        actualDivisionId: latestMovement?.actualDivisionId || 0,
        isActive: true,
        actionBySystemUserId: Number(localStorage.getItem("systemUserId")),
        sessionKey: localStorage.getItem("sessionToken") || "",
        model: item.model || "",
      });

    const blob = await pdf(
      <ITRDocument
        rows={rows}
        itrNumber={itrNumber}
        transferDate={transferDate}
        fromEmployee={fromEmployee}
        toEmployee={toEmployee}
        transferType={transferType}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${itrNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private static buildRows(assets: Asset[]): ITRRow[] {
    return assets.map(asset => {
      const latestMovement = asset.movements
        ?.filter(m => m.isActive)
        .sort(
          (a, b) =>
            new Date(b.dateAssigned).getTime() -
            new Date(a.dateAssigned).getTime()
        )[0];

      return {
        dateAcquired: asset.dateAcquired?.slice(0, 10) ?? "",
        propertyNo: asset.propertyNumber ?? "",
        description: asset.description ?? "",
        amount: asset.unitValue ?? null,
        condition: latestMovement?.condition ?? "Good",
      };
    });
  }

  private static generateITRNumber(): string {
    const now = new Date();
    return `ITR-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}-${now
      .getTime()
      .toString()
      .slice(-4)}`;
  }
}
