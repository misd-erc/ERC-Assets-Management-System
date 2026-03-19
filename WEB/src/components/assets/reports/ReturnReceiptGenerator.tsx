import React from "react";
import { pdf, Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const RECEIVED_BY = {
  name: "CHERRY LYNN S. GONZALES",
  designation: "Administrative Officer V-FAS, GSD",
};

const logoSrc =
  typeof window !== "undefined"
    ? `${window.location.origin}/images/erc-logo.png`
    : "/mnt/data/erc-logo.png";

type ReturnType = "RRPPE" | "RRSP";

interface ReturnRow {
  description: string;
  quantity: string;
  propertyNumber: string;
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
  },
  bodyCellLast: {
    padding: 4,
    fontSize: 9,
    minHeight: 18,
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

function formatLongDate(date?: string | Date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function buildRowsFromItems(items: any[], endUser: string): ReturnRow[] {
  return (items || []).map((item: any) => ({
    description: item?.description || "",
    quantity: "1",
    propertyNumber: item?.propertyNumber || "",
    endUser: endUser || "",
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
}: {
  rows: ReturnRow[];
  receiptNumber: string;
  dateAssigned: string;
  returnType: ReturnType;
  returnedByName: string;
  returnedByPosition?: string;
  nonPlantillaEmployeeName?: string;
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
            <Text style={styles.metaText}>Date: {formatLongDate(dateAssigned)}</Text>
          </View>
        </View>

        <View style={styles.tableWrap}>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.headerCell, { width: "40%" }]}>Item Description</Text>
              <Text style={[styles.headerCell, { width: "10%" }]}>Qty.</Text>
              <Text style={[styles.headerCell, { width: "22%" }]}>Property Number</Text>
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
                  <Text style={[styles.bodyCell, { width: "40%" }]}>{r.description}</Text>
                  <Text style={[styles.bodyCell, { width: "10%", textAlign: "center" }]}>{r.quantity}</Text>
                  <Text style={[styles.bodyCell, { width: "22%" }]}>{r.propertyNumber}</Text>
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
            <View style={styles.sigDateLine} />
            <Text style={styles.sigDateLabel}>Date</Text>
          </View>

          <View style={styles.sigBlockLast}>
            <Text style={styles.sigTitle}>Received by:</Text>
            <Text style={[styles.sigName,{marginBottom: -10}]}>{RECEIVED_BY.name}</Text>
            <View style={[styles.sigLine,{marginBottom: 4}]} />
            <Text style={styles.sigLabel}>{RECEIVED_BY.designation}</Text>
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
    nonPlantillaEmployeeName?: string
  ): Promise<string> {
    const rows = buildRowsFromItems(items, returnedByName);

    const blob = await pdf(
      <ReturnReceiptDocument
        rows={rows}
        receiptNumber={receiptNumber}
        dateAssigned={dateAssigned}
        returnType={returnType}
        returnedByName={returnedByName}
        returnedByPosition={returnedByPosition}
        nonPlantillaEmployeeName={nonPlantillaEmployeeName}
      />
    ).toBlob();

    return URL.createObjectURL(blob);
  }
}
