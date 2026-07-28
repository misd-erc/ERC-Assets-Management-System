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
import { downloadReportExcel, sortReportRowsByPropertyAndAmount } from "@/utils/reportExcelExport";

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

  // overflow: 'hidden' clips text that's still too long even after wrapping (e.g. a long
  // property number/serial number with no spaces to wrap at) instead of letting it bleed
  // past the column's border into the next cell, which renders as mixed/overlapping letters.
  cell: { padding: 2, fontSize: 8, overflow: "hidden" },

  colNo: { width: "6%" },
  colDescription: { width: "28%" },
  colPropertyNo: { width: "16%" },
  colDateAcquired: { width: "11%" },
  colAmount: { width: "11%" },
  colRemarks: { width: "28%" },
  colSubtotalLabel: { width: "83%", textAlign: "right", fontSize: 8, fontStyle: "italic" },
  colTotalLabel: { width: "83%", textAlign: "right", fontWeight: "bold" },
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
  remarks: string;
}

const TableHeader = () => (
  <View style={styles.tableHeaderRow}>
    <Text style={[styles.cell, styles.colNo]}>No.</Text>
    <Text style={[styles.cell, styles.colPropertyNo]}>Property Number</Text>
    <Text style={[styles.cell, styles.colDescription]}>Description</Text>
    <Text style={[styles.cell, styles.colDateAcquired]}>Date Acquired</Text>
    <Text style={[styles.cell, styles.colAmount]}>Amount</Text>
    <Text style={[styles.cell, styles.colRemarks]}>Remarks</Text>
  </View>
);

const PALDocument = ({
  ppeRows,
  seRows,
  totalAmount,
  employeeName,
  position,
  divisionService,
  employeeNumber,
}: {
  ppeRows: PALRow[];
  seRows: PALRow[];
  totalAmount: number;
  employeeName: string;
  position: string;
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
                      <Text style={[styles.cell, styles.colPropertyNo]}>{r.propertyNo}</Text>
                      <Text style={[styles.cell, styles.colDescription]}>{truncate(r.description)}</Text>
                      <Text style={[styles.cell, styles.colDateAcquired]}>{r.dateAcquired}</Text>
                      <Text style={[styles.cell, styles.colAmount]}>{currency(r.amount)}</Text>
                      <Text style={[styles.cell, styles.colRemarks]}>{r.remarks}</Text>
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
                      <Text style={[styles.cell, styles.colPropertyNo]}>{r.propertyNo}</Text>
                      <Text style={[styles.cell, styles.colDescription]}>{truncate(r.description)}</Text>
                      <Text style={[styles.cell, styles.colDateAcquired]}>{r.dateAcquired}</Text>
                      <Text style={[styles.cell, styles.colAmount]}>{currency(r.amount)}</Text>
                      <Text style={[styles.cell, styles.colRemarks]}>{r.remarks}</Text>
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function movementInvolvesEmployee(m: any, employeeId: number): boolean {
  return (
    m.plantillaEmployeeId === employeeId ||
    m.nonPlantillaEmployeeId === employeeId ||
    (Array.isArray(m.employee) && m.employee.some((e: any) => e.id === employeeId))
  );
}

/**
 * Returns true if the asset has been disposed. A disposed asset is no longer part of
 * anyone's accountability, even though its final movement carries over the previous
 * holder's employee ID.
 *
 * Two signals, checked in order of reliability:
 *   1. asset.isActive === false — MarkDisposed flips this flag directly on the PTA record
 *      itself, so it's the most direct signal and doesn't depend on movement data at all.
 *   2. The asset's true latest movement (by createdAt — a system timestamp, unlike the
 *      business-editable dateAssigned) has status "Disposed".
 */
function isDisposed(asset: any): boolean {
  if (asset?.isActive === false) return true;

  const movements: any[] = asset.movements ?? [];
  if (!movements.length) return false;

  const latest = [...movements].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  })[0];

  return typeof latest?.status === "string" && latest.status.toLowerCase() === "disposed";
}

/**
 * Returns the movement that makes this asset "currently assigned" to this employee, or
 * null if it isn't. Strategy:
 *   0. Exclude disposed assets outright — see isDisposed above.
 *   1. Prefer a movement with isCurrent === true that involves this employee.
 *   2. Fall back to the latest movement (by dateAssigned) that involves this employee,
 *      provided there is no newer movement that assigns the asset to someone else.
 *      This handles batch-uploaded data where isCurrent was not set.
 */
function getGoverningMovement(asset: any, employeeId: number): any | null {
  if (isDisposed(asset)) return null;

  const movements: any[] = asset.movements ?? [];
  if (!movements.length) return null;

  // 1. Check for an explicit isCurrent movement for this employee
  const isCurrentFlag = (m: any) =>
    m.isCurrent === true ||
    m.isCurrent === 1 ||
    (typeof m.isCurrent === "string" && m.isCurrent.toLowerCase() === "true");

  const current = movements.find((m) => isCurrentFlag(m) && movementInvolvesEmployee(m, employeeId));
  if (current) return current;

  // 2. No isCurrent flag set — use the latest ACTIVE movement as the effective holder.
  // A deleted current holder (isActive=false) must not shadow the previous active assignment.
  const sortByDate = (a: any, b: any) => {
    const ta = a.dateAssigned ? new Date(a.dateAssigned).getTime() : 0;
    const tb = b.dateAssigned ? new Date(b.dateAssigned).getTime() : 0;
    return tb - ta;
  };

  const activeMovements = movements.filter((m) => m.isActive === true || m.isActive === 1);
  const sorted = activeMovements.length
    ? [...activeMovements].sort(sortByDate)
    : [...movements].sort(sortByDate);

  return movementInvolvesEmployee(sorted[0], employeeId) ? sorted[0] : null;
}

function isAssignedToEmployee(asset: any, employeeId: number): boolean {
  return getGoverningMovement(asset, employeeId) != null;
}

/**
 * The "other side" of a shared PAR/ICS: e.g. a COS employee riding on a plantilla
 * employee's PAR/ICS as sub-holder, or (from the COS's own PAL) the plantilla employee
 * whose PAR/ICS they're riding on. Returns null when the movement isn't actually shared.
 */
function getSubHolderEmployeeId(movement: any, employeeId: number): number | null {
  if (!movement) return null;
  if (movement.plantillaEmployeeId === employeeId && movement.nonPlantillaEmployeeId) {
    return movement.nonPlantillaEmployeeId;
  }
  if (movement.nonPlantillaEmployeeId === employeeId && movement.plantillaEmployeeId) {
    return movement.plantillaEmployeeId;
  }
  return null;
}

async function resolveEmployeeNames(ids: number[]): Promise<Map<number, string>> {
  const uniqueIds = Array.from(new Set(ids));
  const nameById = new Map<number, string>();
  await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const resp = await getEmployeeById(id);
        if (resp.success && resp.data.length > 0) {
          const e = resp.data[0];
          const name = [e.firstName, e.middleName, e.lastName, e.suffixName].filter(Boolean).join(" ");
          nameById.set(id, name);
        }
      } catch {
        // leave unresolved — remarks will just omit the name
      }
    })
  );
  return nameById;
}

async function buildPALData(employee: NormalizedEmployee) {
  const [ppeAssets, seAssets] = await Promise.all([
    getEmployeeAssets(employee.id, "PPE"),
    getEmployeeAssets(employee.id, "SE"),
  ]);

  const employeeName = [
    employee.firstName,
    employee.middleName ? employee.middleName : null,
    employee.lastName,
    employee.suffixName ? employee.suffixName : null,
  ]
    .filter(Boolean)
    .join(" ");

  let position = "N/A";
  let divisionService = "N/A";
  let employeeNumber = "N/A";

  const empResp = await getEmployeeById(employee.id);
  if (empResp.success && empResp.data.length > 0) {
    const empData = empResp.data[0];
    position = empData.position?.name || "N/A";
    divisionService = empData.office?.name || "N/A";
    employeeNumber = empData.employeeIdOriginal || "N/A";
  }

  const ppeFiltered = sortReportRowsByPropertyAndAmount(
    ppeAssets.filter((a) => isAssignedToEmployee(a, employee.id)),
    (a: any) => a.propertyNumber,
    (a: any) => a.unitValue
  );
  const seFiltered = sortReportRowsByPropertyAndAmount(
    seAssets.filter((a) => isAssignedToEmployee(a, employee.id)),
    (a: any) => a.propertyNumber,
    (a: any) => a.unitValue
  );

  const ppeMovements = ppeFiltered.map((a: any) => getGoverningMovement(a, employee.id));
  const seMovements = seFiltered.map((a: any) => getGoverningMovement(a, employee.id));

  const subHolderIds = [...ppeMovements, ...seMovements]
    .map((m) => getSubHolderEmployeeId(m, employee.id))
    .filter((id): id is number => id != null);
  const nameById = await resolveEmployeeNames(subHolderIds);

  let itemNumber = 1;

  const ppeRows: PALRow[] = ppeFiltered.map((asset: any, i: number) => {
    const subId = getSubHolderEmployeeId(ppeMovements[i], employee.id);    const subName = subId != null ? nameById.get(subId) : undefined;
    return {
      no: itemNumber++,
      description: asset.description ?? "",
      propertyNo: asset.propertyNumber ?? "",
      dateAcquired: asset.dateAcquired?.slice(0, 10) ?? "",
      amount: asset.unitValue ?? null,
      remarks: subName ? `Sub-PAR: ${subName}` : "",
    };
  });

  const seRows: PALRow[] = seFiltered.map((asset: any, i: number) => {
    const subId = getSubHolderEmployeeId(seMovements[i], employee.id);
    const subName = subId != null ? nameById.get(subId) : undefined;
    return {
      no: itemNumber++,
      description: asset.description ?? "",
      propertyNo: asset.propertyNumber ?? "",
      dateAcquired: asset.dateAcquired?.slice(0, 10) ?? "",
      amount: asset.unitValue ?? null,
      remarks: subName ? `Sub-ICS: ${subName}` : "",
    };
  });

  const totalAmount = [...ppeRows, ...seRows].reduce(
    (sum, row) => sum + (row.amount ?? 0),
    0
  );

  return { ppeRows, seRows, totalAmount, employeeName, position, divisionService, employeeNumber };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export class PALGenerator {
  static async generatePALPreview(employee: NormalizedEmployee): Promise<string> {
    const data = await buildPALData(employee);

    if (!data.ppeRows.length && !data.seRows.length) {
      alert("No assets found for this employee. Cannot generate PAL preview.");
      return "";
    }

    const blob = await pdf(<PALDocument {...data} />).toBlob();
    return URL.createObjectURL(blob);
  }

  static async generatePAL(employee: NormalizedEmployee) {
    const data = await buildPALData(employee);

    if (!data.ppeRows.length && !data.seRows.length) {
      alert("No assets found for this employee. Cannot generate PAL report.");
      return;
    }

    const blob = await pdf(<PALDocument {...data} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PAL_${Date.now()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  static async generatePALExcel(employee: NormalizedEmployee) {
    const { ppeRows, seRows, totalAmount, employeeName, position, divisionService, employeeNumber } = await buildPALData(employee);

    if (!ppeRows.length && !seRows.length) {
      alert("No assets found for this employee. Cannot generate PAL report.");
      return;
    }

    const ppeTotal = ppeRows.reduce((s, r) => s + (r.amount ?? 0), 0);
    const seTotal = seRows.reduce((s, r) => s + (r.amount ?? 0), 0);
    const toRow = (r: PALRow) => [r.no, r.propertyNo, r.description, r.dateAcquired, currency(r.amount), r.remarks];

    const rows: (string | number | null)[][] = [];
    if (ppeRows.length) {
      rows.push(['', 'PROPERTY, PLANT AND EQUIPMENT (PPE)', '', '', '', '']);
      rows.push(...ppeRows.map(toRow));
      rows.push(['', '', '', 'PPE Sub-total:', currency(ppeTotal), '']);
    }
    if (seRows.length) {
      rows.push(['', 'SEMI-EXPENDABLE PROPERTY (SE)', '', '', '', '']);
      rows.push(...seRows.map(toRow));
      rows.push(['', '', '', 'SE Sub-total:', currency(seTotal), '']);
    }

    await downloadReportExcel({
      filename: `PAL_${Date.now()}.xlsx`,
      sheetName: 'PAL',
      titleLines: ['PROPERTY ACCOUNTABILITY LIST'],
      infoLines: [
        `Name: ${employeeName}`,
        `Service/Division: ${divisionService}`,
      ],
      metaRight: [`Employee Number: ${employeeNumber}`, `Position: ${position}`],
      columns: ['No.', 'Property Number', 'Description', 'Date Acquired', 'Amount', 'Remarks'],
      rows,
      totalRow: ['', '', '', 'TOTAL:', currency(totalAmount), ''],
    });
  }
}
