import React from "react";
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const RECEIVED_BY = {
  name: "CHERRY LYNN S. GONZALES",
  designation: "Administrative Officer V-FAS, GSD",
};

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
    padding: 28,
    fontSize: 9,
    fontFamily: "Helvetica",
  },
  annex: {
    fontSize: 9,
    textAlign: "right",
    marginBottom: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  table: {
    borderWidth: 1,
    borderColor: "#000",
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 4,
    fontSize: 9,
  },
  cellLast: {
    padding: 4,
    fontSize: 9,
  },
  label: {
    fontWeight: "bold",
  },
  headerCell: {
    padding: 4,
    fontSize: 9,
    fontWeight: "bold",
    borderRightWidth: 1,
    borderColor: "#000",
    textAlign: "center",
  },
  headerCellLast: {
    padding: 4,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    backgroundColor: "#f5f5f5",
  },
  bodyRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  bodyCell: {
    padding: 4,
    fontSize: 9,
    borderRightWidth: 1,
    borderColor: "#ccc",
    minHeight: 18,
  },
  bodyCellLast: {
    padding: 4,
    fontSize: 9,
    minHeight: 18,
  },
  signatures: {
    flexDirection: "row",
    marginTop: 18,
    marginBottom: 12,
  },
  sigBlock: {
    flex: 1,
    paddingRight: 12,
  },
  sigBlockRight: {
    flex: 1,
    paddingLeft: 12,
  },
  sigTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 18,
  },
  sigNameLine: {
    borderBottomWidth: 1,
    borderColor: "#000",
    height: 18,
    marginBottom: 6,
  },
  sigNameText: {
    fontSize: 9,
    textAlign: "center",
    marginTop: -14,
  },
  sigLabel: {
    fontSize: 8,
    textAlign: "center",
    marginBottom: 12,
  },
  sigDateLine: {
    borderBottomWidth: 1,
    borderColor: "#000",
    height: 10,
    marginTop: 10,
  },
  sigDateText: {
    fontSize: 8,
    textAlign: "center",
    marginTop: 2,
  },
  subPar: {
    fontSize: 9,
    fontWeight: "bold",
    marginTop: 8,
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
}: {
  rows: ReturnRow[];
  receiptNumber: string;
  dateAssigned: string;
  returnType: ReturnType;
  returnedByName: string;
  returnedByPosition?: string;
}) => {
  const title =
    returnType === "RRPPE"
      ? "RECEIPT OF RETURNED PROPERTY, PLANT AND EQUIPMENT"
      : "RECEIPT OF RETURNED SEMI-EXPENDABLE PROPERTY";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.annex}>Annex A.6</Text>
        <Text style={styles.title}>{title}</Text>

        {/* Meta table */}
        <View style={[styles.table, { marginBottom: 10 }]}>
          <View style={styles.row}>
            <View style={{ flex: 1, borderRightWidth: 1, borderColor: "#000" }}>
              <Text style={{ ...styles.cell, paddingBottom: 2 }}>
                <Text style={styles.label}>Entity Name:</Text> Energy Regulatory Commission
              </Text>
            </View>
            <View style={{ width: 180 }}>
              <Text style={{ ...styles.cell, paddingBottom: 2 }}>
                <Text style={styles.label}>Date:</Text> {formatLongDate(dateAssigned)}
              </Text>
            </View>
          </View>

          <View style={{ borderTopWidth: 1, borderColor: "#000" }}>
            <Text style={{ ...styles.cell, ...styles.label }}>
              {returnType === "RRPPE" ? "RRPPE No.: " : "RRSP No.: "}{receiptNumber || ""}
            </Text>
          </View>
        </View>

        {/* Items table */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.headerCell, { width: "38%" }]}>Item Description</Text>
            <Text style={[styles.headerCell, { width: "10%" }]}>Qty.</Text>
            <Text style={[styles.headerCell, { width: "22%" }]}>Property Number</Text>
            <Text style={[styles.headerCell, { width: "15%" }]}>End-user</Text>
            <Text style={[styles.headerCellLast, { width: "15%" }]}>Remarks</Text>
          </View>

          {rows.length === 0 ? (
            <View style={[styles.bodyRow, { minHeight: 40 }] }>
              <Text style={[styles.bodyCell, { width: "100%", borderRightWidth: 0, textAlign: "center" }]}>No items</Text>
            </View>
          ) : (
            rows.map((r, idx) => (
              <View key={idx} style={styles.bodyRow}>
                <Text style={[styles.bodyCell, { width: "38%" }]}>{r.description}</Text>
                <Text style={[styles.bodyCell, { width: "10%", textAlign: "center" }]}>{r.quantity}</Text>
                <Text style={[styles.bodyCell, { width: "22%" }]}>{r.propertyNumber}</Text>
                <Text style={[styles.bodyCell, { width: "15%" }]}>{r.endUser}</Text>
                <Text style={[styles.bodyCellLast, { width: "15%" }]}>{r.remarks}</Text>
              </View>
            ))
          )}
        </View>

        {/* Signatures */}
        <View style={styles.signatures}>
          <View style={styles.sigBlock}>
            <Text style={styles.sigTitle}>Returned by:</Text>
            <View style={styles.sigNameLine} />
            <Text style={styles.sigNameText}>{returnedByName || ""}</Text>
            <Text style={styles.sigLabel}>{returnedByPosition || "Position, Service-Division"}</Text>
            <View style={styles.sigDateLine} />
            <Text style={styles.sigDateText}>Date</Text>
          </View>

          <View style={styles.sigBlockRight}>
            <Text style={styles.sigTitle}>Received by:</Text>
            <View style={styles.sigNameLine} />
            <Text style={styles.sigNameText}>{RECEIVED_BY.name}</Text>
            <Text style={styles.sigLabel}>{RECEIVED_BY.designation}</Text>
            <View style={styles.sigDateLine} />
            <Text style={styles.sigDateText}>Date</Text>
          </View>
        </View>

        <Text style={styles.subPar}>Sub-PAR:</Text>
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
    returnedByPosition?: string
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
      />
    ).toBlob();

    return URL.createObjectURL(blob);
  }
}
