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
import { secureStorage } from "@/utils/secureStorage";
import { downloadReportExcel } from "@/utils/reportExcelExport";

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

  colDateAcquired: { width: "12%" },
  colItemNo: { width: "16%" },
  colIcsNoDate: { width: "16%" },
  colDescription: { width: "30%" },
  colAmount: { width: "14%" },
  colCondition: { width: "12%" },

  /* ---------------- Reason for Transfer ---------------- */

  reasonBlock: { marginTop: 10 },

  reasonTitle: { fontSize: 9, fontWeight: "bold", marginBottom: 6 },

  reasonLine: {
    borderBottomWidth: 0.8,
    borderColor: "#000",
    height: 14,
  },

  /* ---------------- Signatures ---------------- */

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
    padding: 8,
  },

  sigBlockLast: {
    flex: 1,
    textAlign: "center",
    padding: 8,
  },

  sigTitle: { fontSize: 10, marginBottom: 8, textAlign: "left" },

  sigName: { fontSize: 10, textAlign: "center", marginBottom: 0, marginTop: -2 },

  sigNameAboveLine: {
    fontSize: 10,
    marginBottom: 0,
    textAlign: "center",
    marginTop: 25,
  },

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

  sigDateLabel: { fontSize: 8, textAlign: "center", marginTop: 2 },

  sigDateLine: {
    borderBottomWidth: 1,
    borderColor: "#000",
    height: 10,
  },

  sigDateValue: { fontSize: 8 },

  sigDesignation: { fontSize: 8 },
});

/* -------------------------------- DATE HELPERS ------------------------------- */
function formatLongDate(date?: string | Date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatShortDate(dateStr?: string) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[1]}-${parts[2]}-${parts[0]}`;
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

function formatIcsNoDate(icsNo?: string, dateStr?: string): string {
  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
    : "";
  return [icsNo, formattedDate].filter(Boolean).join("\n");
}

interface ITRRow {
  dateAcquired: string;
  propertyNo: string;
  icsNoDate: string;
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
  nonPlantillaEmployee,
  signatureDate,
  toEmployeePositionOffice,
  reasonForTransfer,
}: {
  rows: ITRRow[];
  itrNumber: string;
  transferDate: string;
  fromEmployee: NormalizedEmployee;
  toEmployee: NormalizedEmployee;
  transferType: TransferType;
  nonPlantillaEmployee?: NormalizedEmployee | null;
  signatureDate?: string;
  toEmployeePositionOffice?: string;
  reasonForTransfer?: string;
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
            From Accountable Officer: {fromEmployee.firstName?.toUpperCase()} {fromEmployee.middleName?.toUpperCase()} {fromEmployee.lastName?.toUpperCase()}
          </Text>
          <Text style={{ marginTop: 4 }}>
            To Accountable Officer: {toEmployee.firstName?.toUpperCase()} {toEmployee.middleName?.toUpperCase()} {toEmployee.lastName?.toUpperCase()}
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
            <Text style={[styles.cell, styles.colItemNo]}>
              Item No.
            </Text>
            <Text style={[styles.cell, styles.colIcsNoDate]}>
              ICS No./Date
            </Text>
            <Text style={[styles.cell, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.cell, styles.colAmount]}>Amount</Text>
            <Text style={[styles.cell, styles.colCondition]}>Condition of Inventory</Text>
          </View>

          {rows.map((r, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.cell, styles.colDateAcquired]}>
                {r.dateAcquired}
              </Text>
              <Text style={[styles.cell, styles.colItemNo]}>
                {r.propertyNo}
              </Text>
              <Text style={[styles.cell, styles.colIcsNoDate]}>
                {r.icsNoDate}
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

      {/* REASON FOR TRANSFER */}
      <View style={styles.reasonBlock}>
        <Text style={styles.reasonTitle}>Reason/s for Transfer:</Text>
        {reasonForTransfer ? (
          <Text style={{ fontSize: 9, marginBottom: 6 }}>{reasonForTransfer}</Text>
        ) : (
          <>
            <View style={styles.reasonLine} />
            <View style={styles.reasonLine} />
            <View style={styles.reasonLine} />
          </>
        )}
      </View>

      {/* SIGNATURES */}
      <View style={styles.sigRow}>
        <View style={styles.sigBlock}>
          <Text style={styles.sigTitle}>Approved by:</Text>
          <Text style={styles.sigNameAboveLine}>{APPROVED_BY.name}</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Signature Over Printed Name</Text>
          <Text style={[styles.sigTopText, { marginBottom: 4, marginTop: 6 }]}>{APPROVED_BY.designation}</Text>
          <View style={[styles.sigDateLine, { marginTop: -8, marginBottom: 2 }]} />
          <Text style={[styles.sigLabel, { marginBottom: 8, marginTop: 2 }]}>Position/Office</Text>
          <View>
            {signatureDate ? <Text style={[styles.sigDateValue, { textAlign: "center" }]}>{formatShortDate(signatureDate)}</Text> : null}
            <View style={styles.sigDateRow}>
              <View style={styles.sigDateLine} />
            </View>
            <Text style={styles.sigDateLabel}>DATE</Text>
          </View>
        </View>

        <View style={styles.sigBlock}>
          <Text style={styles.sigTitle}>Released / Issued by:</Text>
          <Text style={styles.sigNameAboveLine}>{RELEASED_BY.name}</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Signature Over Printed Name</Text>
          <Text style={[styles.sigTopText, { marginBottom: 4, marginTop: 6 }]}>{RELEASED_BY.designation}</Text>
          <View style={[styles.sigDateLine, { marginTop: -8, marginBottom: 2 }]} />
          <Text style={[styles.sigLabel, { marginBottom: 8, marginTop: 2 }]}>Position/Office</Text>
          <View>
            {signatureDate ? <Text style={[styles.sigDateValue, { textAlign: "center" }]}>{formatShortDate(signatureDate)}</Text> : null}
            <View style={styles.sigDateRow}>
              <View style={styles.sigDateLine} />
            </View>
            <Text style={styles.sigDateLabel}>DATE</Text>
          </View>
        </View>

        <View style={styles.sigBlockLast}>
          <Text style={styles.sigTitle}>Received by:</Text>
          <Text style={styles.sigNameAboveLine}>
            {toEmployee.label?.toUpperCase() || [toEmployee.firstName, toEmployee.middleName, toEmployee.lastName].filter(Boolean).join(' ').toUpperCase()}
          </Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Signature Over Printed Name</Text>
          <Text style={[styles.sigTopText, { marginBottom: 4, marginTop: 6 }]}>
            {toEmployeePositionOffice || ''}
          </Text>
          <View style={[styles.sigDateLine, { marginTop: -8, marginBottom: 2 }]} />
          <Text style={[styles.sigLabel, { marginBottom: 8, marginTop: 2 }]}>Position/Office</Text>
          <View>
            {signatureDate ? <Text style={[styles.sigDateValue, { textAlign: "center" }]}>{formatShortDate(signatureDate)}</Text> : null}
            <View style={styles.sigDateRow}>
              <View style={styles.sigDateLine} />
            </View>
            <Text style={styles.sigDateLabel}>DATE</Text>
          </View>
          <Text style={{ fontSize: 8, fontWeight: "bold", marginTop: 8, textAlign: "left", alignSelf: "flex-start" }}>
            Sub-ICS :{nonPlantillaEmployee ? ` ${nonPlantillaEmployee.label?.toUpperCase() || [nonPlantillaEmployee.firstName, nonPlantillaEmployee.middleName, nonPlantillaEmployee.lastName].filter(Boolean).join(' ').toUpperCase()}` : ""}
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);

/* -------------------------------- GENERATOR -------------------------------- */

export class ITRGenerator {
  static async generateITRPreviewMultiple(
    fromEmployee: NormalizedEmployee,
    toEmployee: NormalizedEmployee,
    items: any[],
    transferDate: string,
    transferType: TransferType,
    existingNumber?: string,
    signatureDate?: string,
    nonPlantillaEmployee?: NormalizedEmployee | null,
    toEmployeePositionOffice?: string,
    reasonForTransfer?: string
  ): Promise<string> {
    const itrNumber = existingNumber || this.generateITRNumber();
    const rows = this.buildRowsFromItems(items);

    const blob = await pdf(
      <ITRDocument
        rows={rows}
        itrNumber={itrNumber}
        transferDate={transferDate}
        fromEmployee={fromEmployee}
        toEmployee={toEmployee}
        transferType={transferType}
        signatureDate={signatureDate}
        nonPlantillaEmployee={nonPlantillaEmployee}
        toEmployeePositionOffice={toEmployeePositionOffice}
        reasonForTransfer={reasonForTransfer}
      />
    ).toBlob();

    return URL.createObjectURL(blob);
  }

  /** Download an Excel workbook from the same inputs as generateITRPreviewMultiple (item-list flow). */
  static async generateExcelFromDetails(
    fromEmployee: NormalizedEmployee,
    toEmployee: NormalizedEmployee,
    items: any[],
    transferDate: string,
    transferType: TransferType,
    existingNumber?: string,
    nonPlantillaEmployee?: NormalizedEmployee | null,
    toEmployeePositionOffice?: string,
    reasonForTransfer?: string
  ) {
    const itrNumber = existingNumber || this.generateITRNumber();
    const rows = this.buildRowsFromItems(items);
    await this.generateExcel(rows, itrNumber, transferDate, fromEmployee, toEmployee, transferType, nonPlantillaEmployee, toEmployeePositionOffice, reasonForTransfer);
  }

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
      employmentTypeName: '',
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
      employmentTypeName: '',
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
        actionBySystemUserId: Number(secureStorage.getItem("systemUserId")),
        sessionKey: secureStorage.getItem("sessionToken") || "",
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

  /** Download an Excel workbook matching the same rows/signatories as the ITR PDF. */
  static async generateExcel(
    rows: ITRRow[],
    itrNumber: string,
    transferDate: string,
    fromEmployee: NormalizedEmployee,
    toEmployee: NormalizedEmployee,
    transferType: TransferType,
    nonPlantillaEmployee?: NormalizedEmployee | null,
    toEmployeePositionOffice?: string,
    reasonForTransfer?: string
  ) {
    if (!rows.length) return;

    const employeeLabel = (e: NormalizedEmployee) =>
      e.label?.toUpperCase() || [e.firstName, e.middleName, e.lastName].filter(Boolean).join(' ').toUpperCase();

    // Matches the PDF's checkbox grid pairing: Donation/Relocate on row 1, Reassignment/Others on row 2.
    const transferTypeOptions = ['Donation', 'Relocate', 'Reassignment', 'Others (Specify)'];
    const selectedOption = transferTypeOptions.find(
      (opt) => opt.replace(/\s*\(.*\)/, '').toUpperCase() === String(transferType).toUpperCase()
    );

    await downloadReportExcel({
      filename: `${itrNumber}.xlsx`,
      sheetName: 'ITR',
      logoUrl: logoSrc,
      logoColOffset: 1.3,
      titleLines: ['INVENTORY TRANSFER REPORT'],
      infoLines: [
        'Entity Name: ENERGY REGULATORY COMMISSION',
        `From Accountable Officer: ${employeeLabel(fromEmployee)}`,
        `To Accountable Officer: ${employeeLabel(toEmployee)}`,
      ],
      metaRight: [`ITR No.: ${itrNumber}`, `Date: ${formatLongDate(transferDate)}`],
      checkboxGroup: {
        title: 'Transfer Type: (check only one)',
        options: transferTypeOptions,
        selected: selectedOption,
      },
      columns: ['Date Acquired', 'Item No.', 'ICS No./Date', 'Description', 'Amount', 'Condition of Inventory'],
      rows: rows.map((r) => [r.dateAcquired, r.propertyNo, r.icsNoDate.replace('\n', ' / '), r.description, currency(r.amount), r.condition]),
      preSignatureLines: reasonForTransfer
        ? ['Reason/s for Transfer:', reasonForTransfer]
        : ['Reason/s for Transfer:', '', '', ''],
      signatoryRows: [[
        { role: 'Approved by:', name: APPROVED_BY.name, designation: APPROVED_BY.designation },
        { role: 'Released / Issued by:', name: RELEASED_BY.name, designation: RELEASED_BY.designation },
        {
          role: 'Received by:',
          name: employeeLabel(toEmployee),
          designation: toEmployeePositionOffice || '',
          extra: nonPlantillaEmployee ? `Sub-ICS: ${employeeLabel(nonPlantillaEmployee)}` : undefined,
        },
      ]],
    });
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
        icsNoDate: formatIcsNoDate((latestMovement as any)?.parIcsNumber, latestMovement?.dateAssigned),
        description: asset.description ?? "",
        amount: asset.unitValue ?? null,
        condition: latestMovement?.condition || (asset as any).condition || "Good",
      };
    });
  }

  private static buildRowsFromItems(items: any[]): ITRRow[] {
    return (items || []).map(it => ({
      dateAcquired: (it.dateAcquired || '').toString().slice(0, 10),
      propertyNo: it.propertyNumber || '',
      icsNoDate: formatIcsNoDate(
        it.icsNo || it.paricsNumber || it.parIcsNumber || '',
        it.icsDate || it.dateAssigned || ''
      ),
      description: it.description || '',
      amount: it.unitValue ?? null,
      condition: it.condition || 'Good',
    }));
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

export default ITRGenerator;
