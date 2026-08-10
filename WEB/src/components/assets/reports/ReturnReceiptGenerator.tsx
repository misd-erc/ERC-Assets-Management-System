import React from "react";
import { pdf, Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { downloadReportExcel, sortReportRowsByPropertyAndAmount } from "@/utils/reportExcelExport";
import { formatPositionOffice } from "@/utils/formatters";

const RECEIVED_BY = {
  name: "CHERRY LYNN S. GONZALES",
  designation: formatPositionOffice("Administrative Officer V", "FAS", "GSD"),
};

const logoSrc =
  typeof window !== "undefined"
    ? `${window.location.origin}/images/erc-logo.png`
    : "/mnt/data/erc-logo.png";

type ReturnType = "RRPPE" | "RRSP";

interface ReturnRow {
  description: string;
  quantity: string;
  icsNo: string;
  endUser: string;
  remarks: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    fontFamily: "Helvetica",
  },
  annex: {
    position: "absolute",
    right: 20,
    top: 10,
    fontSize: 8,
    fontStyle: "italic",
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
    marginBottom: 8,
  },
  metaLeft: { flex: 1 },
  metaRight: { width: 190 },
  metaLabel: { fontSize: 9, fontWeight: "bold" },
  metaText: { marginTop: 4 },
  tableWrap: { marginTop: 8 },
  table: { borderWidth: 0.8, borderColor: "#000" },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
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
  headerCell: {
    padding: 4,
    fontSize: 9,
    fontWeight: "bold",
    borderRightWidth: 0.8,
    borderColor: "#000",
    textAlign: "center",
  },
  headerCellLast: {
    padding: 4,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
  },
  bodyCell: {
    padding: 4,
    fontSize: 9,
    borderRightWidth: 0.5,
    borderColor: "#ccc",
    minHeight: 18,
    overflow: "hidden",
  },
  bodyCellLast: {
    padding: 4,
    fontSize: 9,
    minHeight: 18,
    overflow: "hidden",
  },
  sigRow: {
    flexDirection: "row",
    borderTopWidth: 0.8,
    borderBottomWidth: 0.8,
    borderLeftWidth: 0.8,
    borderRightWidth: 0.8,
    borderColor: "#000",
    minHeight: 100,
    marginTop: 6,
  },
  sigBlock: {
    flex: 1,
    textAlign: "center",
    padding: 10,
  },
  sigBlockLast: {
    flex: 1,
    textAlign: "center",
    padding: 10,
  },
  sigTitle: { fontSize: 10, marginBottom: 8, textAlign: "left" },
  sigName: { fontSize: 10, textAlign: "center", marginBottom: 2 },
  sigLine: {
    borderBottomWidth: 1,
    borderColor: "#000",
    height: 16,
    marginBottom: 6,
    marginTop: 0,
  },
  sigLabel: { fontSize: 8, marginBottom: 10, textAlign: "center", marginTop: -4 },
  sigDateLine: { borderBottomWidth: 1, borderColor: "#000", height: 10, marginTop: 2 },
  sigDateLabel: { fontSize: 8, textAlign: "center", marginTop: 2 },
  subPar: {
    fontSize: 9,
    fontWeight: "bold",
    marginTop: 10,
  },
});

function formatShortDate(dateStr?: string) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[1]}-${parts[2]}-${parts[0]}`;
}

// Same MM-DD-YYYY format as formatShortDate, but parses via Date() so it also handles
// full ISO datetime strings (e.g. "2026-07-22T00:00:00.000Z") — formatShortDate's plain
// string-split assumes a clean "YYYY-MM-DD" and would otherwise cut into the time portion.
function formatDate(date?: string | Date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}-${dd}-${d.getFullYear()}`;
}

function buildRowsFromItems(items: any[], endUser: string, nonPlantillaEndUser?: string): ReturnRow[] {
  const sortedItems = sortReportRowsByPropertyAndAmount(
    items || [],
    (item: any) => item?.propertyNumber,
    (item: any) => item?.unitValue
  );
  return sortedItems.map((item: any) => ({
    description: item?.description || "",
    quantity: "1",
    icsNo: item?.icsNo || item?.paricsNumber || item?.parIcsNumber || "",
    endUser: nonPlantillaEndUser || endUser || "",
    remarks: item?.condition || item?.remarks || "",
  }));
}

const ReturnReceiptDocument = ({
  rows,
  receiptNumber,
  dateAssigned,
  returnType,
  returnedByName,
  returnedByPosition,
  nonPlantillaEmployeeName,
  signatureDate,
}: {
  rows: ReturnRow[];
  receiptNumber: string;
  dateAssigned: string;
  returnType: ReturnType;
  returnedByName: string;
  returnedByPosition?: string;
  nonPlantillaEmployeeName?: string;
  signatureDate?: string;
}) => {
  const title =
    returnType === "RRPPE"
      ? "RECEIPT OF RETURNED PROPERTY, PLANT AND EQUIPMENT"
      : "RECEIPT OF RETURNED SEMI-EXPENDABLE PROPERTY";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.annex}>Annex A.6</Text>

        <View style={styles.headerContainer}>
          <Image src={logoSrc} style={styles.logo} />
          <View style={styles.titleBlock}>
            <Text style={styles.headerTitle}>{title}</Text>
          </View>
        </View>

        <View style={styles.blueRule} />

        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <Text style={styles.metaLabel}>Entity Name: ENERGY REGULATORY COMMISSION</Text>
            <Text style={styles.metaText}>Returned by: {returnedByName?.toUpperCase() || ""}</Text>
            <Text style={styles.metaText}>Received by: {RECEIVED_BY.name}</Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaLabel}>{returnType === "RRPPE" ? "RRPPE No.: " : "RRSP No.: "}{receiptNumber || ""}</Text>
            <Text style={styles.metaText}>Date: {formatDate(dateAssigned)}</Text>
          </View>
        </View>

        <View style={styles.tableWrap}>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.headerCell, { width: "36%" }]}>Item Description</Text>
              <Text style={[styles.headerCell, { width: "8%" }]}>Qty.</Text>
              <Text style={[styles.headerCell, { width: "28%" }]}>{returnType === "RRSP" ? "ICS No." : "PAR No."}</Text>
              <Text style={[styles.headerCell, { width: "14%" }]}>End-user</Text>
              <Text style={[styles.headerCellLast, { width: "14%" }]}>Remarks</Text>
            </View>

            {rows.length === 0 ? (
              <View style={[styles.tableRow, { minHeight: 40 }] }>
                <Text style={[styles.bodyCell, { width: "100%", borderRightWidth: 0, textAlign: "center" }]}>No items</Text>
              </View>
            ) : (
              rows.map((r, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.bodyCell, { width: "36%" }]}>{r.description}</Text>
                  <Text style={[styles.bodyCell, { width: "8%", textAlign: "center" }]}>{r.quantity}</Text>
                  <Text style={[styles.bodyCell, { width: "28%", fontSize: 7.5 }]}>{r.icsNo}</Text>
                  <Text style={[styles.bodyCell, { width: "14%" }]}>{r.endUser}</Text>
                  <Text style={[styles.bodyCellLast, { width: "14%" }]}>{r.remarks}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={[styles.sigRow,{marginTop: -1}]}>
          <View style={styles.sigBlock}>
            <Text style={styles.sigTitle}>Returned by:</Text>
            <Text style={[styles.sigName,{marginBottom: -10}]}>{returnedByName?.toUpperCase() || ""}</Text>
            <View style={[styles.sigLine,{marginBottom: 4}]} />
            <Text style={styles.sigLabel}>{returnedByPosition || "Position, Service-Division"}</Text>
            {signatureDate ? <Text style={{ fontSize: 8, textAlign: "center", marginTop: 4 }}>{formatShortDate(signatureDate)}</Text> : null}
            <View style={styles.sigDateLine} />
            <Text style={styles.sigDateLabel}>Date</Text>
          </View>

          <View style={styles.sigBlockLast}>
            <Text style={styles.sigTitle}>Received by:</Text>
            <Text style={[styles.sigName,{marginBottom: -10}]}>{RECEIVED_BY.name}</Text>
            <View style={[styles.sigLine,{marginBottom: 4}]} />
            <Text style={styles.sigLabel}>{RECEIVED_BY.designation}</Text>
            {signatureDate ? <Text style={{ fontSize: 8, textAlign: "center", marginTop: 4 }}>{formatShortDate(signatureDate)}</Text> : null}
            <View style={styles.sigDateLine} />
            <Text style={styles.sigDateLabel}>Date</Text>
          </View>
        </View>

        <Text style={styles.subPar}>Sub-PAR:{nonPlantillaEmployeeName ? ` ${nonPlantillaEmployeeName.toUpperCase()}` : ""}</Text>
      </Page>
    </Document>
  );
};

export class ReturnReceiptGenerator {
  static async generateReturnPreview(
    returnType: ReturnType,
    items: any[],
    receiptNumber: string,
    dateAssigned: string,
    returnedByName: string,
    returnedByPosition?: string,
    nonPlantillaEmployeeName?: string,
    signatureDate?: string
  ): Promise<string> {
    const rows = buildRowsFromItems(items, returnedByName, nonPlantillaEmployeeName);

    const blob = await pdf(
      <ReturnReceiptDocument
        rows={rows}
        receiptNumber={receiptNumber}
        dateAssigned={dateAssigned}
        returnType={returnType}
        returnedByName={returnedByName}
        returnedByPosition={returnedByPosition}
        nonPlantillaEmployeeName={nonPlantillaEmployeeName}
        signatureDate={signatureDate}
      />
    ).toBlob();

    return URL.createObjectURL(blob);
  }

  /** Download an Excel workbook matching the same rows/signatories as the return receipt PDF. */
  static async generateExcel(
    returnType: ReturnType,
    items: any[],
    receiptNumber: string,
    dateAssigned: string,
    returnedByName: string,
    returnedByPosition?: string,
    nonPlantillaEmployeeName?: string
  ) {
    const rows = buildRowsFromItems(items, returnedByName, nonPlantillaEmployeeName);
    if (!rows.length) return;

    const title = returnType === "RRPPE"
      ? "RECEIPT OF RETURNED PROPERTY, PLANT AND EQUIPMENT"
      : "RECEIPT OF RETURNED SEMI-EXPENDABLE PROPERTY";

    await downloadReportExcel({
      filename: `${returnType}_${receiptNumber || Date.now()}.xlsx`,
      sheetName: returnType,
      logoUrl: logoSrc,
      logoColOffset: 1,
      titleLines: [title],
      infoLines: [
        'Entity Name: ENERGY REGULATORY COMMISSION',
        `Returned by: ${returnedByName?.toUpperCase() || ''}`,
        `Received by: ${RECEIVED_BY.name}`,
        nonPlantillaEmployeeName ? `Sub-PAR: ${nonPlantillaEmployeeName.toUpperCase()}` : '',
      ].filter(Boolean),
      metaRight: [
        `${returnType === 'RRPPE' ? 'RRPPE No.: ' : 'RRSP No.: '}${receiptNumber || ''}`,
        `Date: ${formatDate(dateAssigned)}`,
      ],
      columns: ['Item Description', 'Qty.', returnType === 'RRSP' ? 'ICS No.' : 'PAR No.', 'End-user', 'Remarks'],
      rows: rows.map((r) => [r.description, r.quantity, r.icsNo, r.endUser, r.remarks]),
      signatoryRows: [[
        { role: 'Returned by:', name: returnedByName, designation: returnedByPosition || 'Position, Service-Division' },
        { role: 'Received by:', name: RECEIVED_BY.name, designation: RECEIVED_BY.designation },
      ]],
    });
  }
}
