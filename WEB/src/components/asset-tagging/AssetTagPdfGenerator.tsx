import React from "react";
import { Document, Page, View, Text, Image, StyleSheet, pdf } from "@react-pdf/renderer";
import { TagPreview, TagTemplate, getLatestMovement } from "@/hooks/useAssetTagging";

const MM = 2.834645669;
const mm = (v: number) => v * MM;

const PAGE_MARGIN_MM = 8;
const GAP_MM = 3;
const A4_WIDTH_MM = 210;

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatCurrency(value?: number | null): string {
  if (value == null) return "—";
  // The PDF uses the built-in Helvetica font, which has no ₱ glyph (renders as "±"),
  // so the amount is prefixed with "PHP" instead of the currency symbol.
  const amount = new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  return `PHP ${amount}`;
}

interface TagFieldData {
  code: string;
  description: string;
  modelSerial: string;
  category: string;
  acqDate: string;
  acqCost: string;
  personAccountable: string;
  condition: string | null;
  groupLabel: string;
}

function buildTagFieldData(tag: TagPreview): TagFieldData {
  const asset: any = tag.asset;
  const latestMovement: any = getLatestMovement(asset.movements);
  const employees = latestMovement?.employee || [];
  const employee = employees.find((e: any) => e.employmentType?.name?.toLowerCase() === "plantilla") ?? employees[0];
  const officeAcronym = (employee?.office?.acronym || latestMovement?.office?.acronym || "").trim();
  const divisionAcronym = (employee?.division?.acronym || latestMovement?.division?.acronym || "").trim();
  const accountableAcronym = officeAcronym && divisionAcronym
    ? officeAcronym.toUpperCase() === divisionAcronym.toUpperCase() ? officeAcronym : `${officeAcronym}-${divisionAcronym}`
    : officeAcronym || divisionAcronym;
  const empName = employee
    ? [employee.firstName, employee.middleName, employee.lastName, employee.suffixName].filter(Boolean).join(" ").trim()
    : "Unassigned";
  const personAccountable = accountableAcronym ? `${accountableAcronym} — ${empName}` : empName;
  const modelSerial = [asset.model, asset.serialNumber ? `SN: ${asset.serialNumber}` : null].filter(Boolean).join(" / ") || "—";

  return {
    code: tag.code,
    description: tag.description,
    modelSerial,
    category: tag.category,
    acqDate: formatDate(asset.dateAcquired),
    acqCost: formatCurrency(asset.unitValue),
    personAccountable,
    condition: latestMovement?.condition || null,
    groupLabel: asset.group === "PPE" ? "PPE" : "SE",
  };
}

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: mm(GAP_MM) },
  tagBox: { borderWidth: 1.5, borderColor: "#1f2937", overflow: "hidden" },
  headerRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1.5, borderBottomColor: "#1f2937" },
  logo: { borderRadius: 999 },
  ercName: { fontFamily: "Helvetica-Bold", color: "#1d4ed8", textTransform: "uppercase" },
  stickerLabel: { fontFamily: "Helvetica-Bold", color: "#111827", textTransform: "uppercase" },
  groupBadge: { fontFamily: "Helvetica-Bold", color: "#1d4ed8", backgroundColor: "#eff6ff", borderWidth: 0.75, borderColor: "#93c5fd" },
  propNoBox: { backgroundColor: "#eff6ff", borderWidth: 0.75, borderColor: "#93c5fd" },
  propNoLabel: { fontFamily: "Helvetica-Bold", color: "#1d4ed8", textTransform: "uppercase" },
  propNoValue: { fontFamily: "Courier-Bold", color: "#1e3a5f" },
  fieldLabel: { fontFamily: "Helvetica-Bold", color: "#6b7280", textTransform: "uppercase" },
  fieldValue: { color: "#111827", overflow: "hidden" },
  divider: { borderTopWidth: 0.5, borderTopColor: "#e5e7eb" },
  qrCaption: { color: "#9ca3af", textAlign: "center" },
  footer: { borderTopWidth: 0.5, borderTopColor: "#d1d5db", backgroundColor: "#f9fafb" },
  footerText: { color: "#9ca3af", fontStyle: "italic", textAlign: "center" },
  validatedLabel: { fontFamily: "Helvetica-Bold", color: "#374151" },
  sigLine: { borderBottomWidth: 0.75, borderBottomColor: "#374151" },
});

function TagField({ label, value, f, mono }: { label: string; value: string; f: (n: number) => number; mono?: boolean }) {
  return (
    <View style={{ marginBottom: 1.5 }}>
      <Text style={[styles.fieldLabel, { fontSize: f(5.5) }]}>{label}</Text>
      <Text style={[styles.fieldValue, { fontSize: f(7.5), fontFamily: mono ? "Courier" : "Helvetica" }]}>{value || "—"}</Text>
    </View>
  );
}

function TagBox({
  tag,
  template,
  includeQR,
  includeLogo,
  logoSrc,
  columnWidthPt,
}: {
  tag: TagPreview;
  template: TagTemplate;
  includeQR: boolean;
  includeLogo: boolean;
  logoSrc: string;
  columnWidthPt: number;
}) {
  const data = buildTagFieldData(tag);
  const scale = template.height / 25;
  const fontScale = Math.max(0.75, Math.min(scale, 1.6));
  const f = (base: number) => base * fontScale;
  const qrSize = Math.max(24, 40 * scale);
  const logoSize = Math.max(12, 16 * scale);
  // Only the "slim" template gets the dense horizontal layout below — it's the one
  // template too short for the standard vertical field stack. "small" (38×19mm) is
  // close enough to standard's footprint to reuse the full layout at a smaller scale,
  // so every template prints the same complete set of details.
  const isSlim = template.id === "slim";
  const isLarge = template.height >= 35;

  // Only the width is fixed (matching the on-screen grid column); height is left to
  // grow with content — forcing height to the sticker's real physical mm previously
  // squeezed multi-line content into a box far too short for it, causing overlapping text.
  const boxStyle = [styles.tagBox, { width: columnWidthPt }];

  if (isSlim) {
    return (
      <View style={boxStyle} wrap={false}>
        <View style={[styles.headerRow, { padding: 2, gap: 3 }]}>
          {includeLogo && <Image src={logoSrc} style={{ ...styles.logo, width: logoSize, height: logoSize }} />}
          <View style={{ flex: 1 }}>
            <Text style={[styles.ercName, { fontSize: f(6.5) }]}>Energy Regulatory Commission</Text>
            <Text style={[styles.stickerLabel, { fontSize: f(5) }]}>Property Inventory Sticker</Text>
          </View>
          <Text style={[styles.groupBadge, { fontSize: f(5.5), paddingHorizontal: 3, paddingVertical: 1 }]}>{data.groupLabel}</Text>
        </View>

        <View style={{ flexDirection: "row" }}>
          <View style={{ flex: 1, padding: 3 }}>
            <View style={[styles.propNoBox, { padding: 2, marginBottom: 2 }]}>
              <Text style={[styles.propNoLabel, { fontSize: f(4.5) }]}>Property No.</Text>
              <Text style={[styles.propNoValue, { fontSize: f(7.5) }]}>{data.code}</Text>
            </View>

            <View style={{ flexDirection: "row", gap: 6 }}>
              <View style={{ flex: 1 }}>
                <TagField label="Description" value={data.description} f={f} />
              </View>
              <View style={{ flex: 1 }}>
                <TagField label="Model / Serial No." value={data.modelSerial} f={f} />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 6 }}>
              <TagField label="Acquisition Date" value={data.acqDate} f={f} />
              <TagField label="Acquisition Cost" value={data.acqCost} f={f} />
              <View style={{ flex: 1 }}>
                <TagField label="Person Accountable" value={data.personAccountable} f={f} />
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 }}>
              <Text style={[styles.validatedLabel, { fontSize: f(5) }]}>Validated by:</Text>
              <View style={[styles.sigLine, { flex: 1 }]} />
            </View>
          </View>

          {includeQR && tag.qrCode && (
            <View style={{ alignItems: "center", justifyContent: "center", padding: 3 }}>
              <Image src={tag.qrCode} style={{ width: qrSize, height: qrSize }} />
            </View>
          )}
        </View>

        <View style={[styles.footer, { padding: 1.5 }]}>
          <Text style={[styles.footerText, { fontSize: f(4.5) }]}>
            Tampering / Removing of this sticker is Punishable under ERC Regulations.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={boxStyle} wrap={false}>
      <View style={[styles.headerRow, { padding: 3, gap: 4 }]}>
        {includeLogo && <Image src={logoSrc} style={{ ...styles.logo, width: logoSize, height: logoSize }} />}
        <View style={{ flex: 1 }}>
          <Text style={[styles.ercName, { fontSize: f(7) }]}>Energy Regulatory Commission</Text>
          <Text style={[styles.stickerLabel, { fontSize: f(5.5) }]}>Property Inventory Sticker</Text>
        </View>
        <Text style={[styles.groupBadge, { fontSize: f(5.5), paddingHorizontal: 3, paddingVertical: 1 }]}>{data.groupLabel}</Text>
      </View>

      <View style={{ flexDirection: "row" }}>
        <View
          style={{
            flex: 1,
            padding: 3,
            borderRightWidth: includeQR && tag.qrCode ? 0.75 : 0,
            borderRightColor: "#d1d5db",
          }}
        >
          <View style={[styles.propNoBox, { padding: 2, marginBottom: 3 }]}>
            <Text style={[styles.propNoLabel, { fontSize: f(5) }]}>Property No.</Text>
            <Text style={[styles.propNoValue, { fontSize: f(8.5) }]}>{data.code}</Text>
          </View>

          <TagField label="Description" value={data.description} f={f} />
          <TagField label="Model / Serial No." value={data.modelSerial} f={f} />
          {isLarge && data.category && <TagField label="Category" value={data.category} f={f} />}

          <View style={[styles.divider, { marginVertical: 3 }]} />

          <TagField label="Acquisition Date" value={data.acqDate} f={f} />
          <TagField label="Acquisition Cost" value={data.acqCost} f={f} />

          <View style={[styles.divider, { marginVertical: 3 }]} />

          <TagField label="Person Accountable" value={data.personAccountable} f={f} />
          {isLarge && data.condition && <TagField label="Condition" value={data.condition} f={f} />}

          <View style={[styles.divider, { marginTop: 4, marginBottom: 3 }]} />

          <Text style={[styles.validatedLabel, { fontSize: f(5.5), marginBottom: 2 }]}>Validated by:</Text>
          <View style={[styles.sigLine, { width: "80%" }]} />
        </View>

        {includeQR && tag.qrCode && (
          <View style={{ alignItems: "center", justifyContent: "center", padding: 4, gap: 2 }}>
            <Image src={tag.qrCode} style={{ width: qrSize, height: qrSize }} />
            <Text style={[styles.qrCaption, { fontSize: f(4.5) }]}>Scan to view</Text>
          </View>
        )}
      </View>

      <View style={[styles.footer, { padding: 2 }]}>
        <Text style={[styles.footerText, { fontSize: f(5) }]}>
          Tampering / Removing of this sticker is Punishable under ERC Regulations.
        </Text>
      </View>
    </View>
  );
}

export class AssetTagPdfGenerator {
  /** Builds and downloads a sticker-sheet PDF: tags flow left-to-right/top-to-bottom in a
   * grid (column count based on template size, matching the on-screen preview's layout),
   * each card sized to fit its own content, with react-pdf auto-paginating once a page fills. */
  static async generate(
    tagPreviews: TagPreview[],
    template: TagTemplate,
    includeQR: boolean,
    includeLogo: boolean,
    logoSrc: string
  ): Promise<void> {
    if (!tagPreviews.length) return;

    const isSlim = template.id === "slim";
    const isLarge = template.height >= 35;
    const cols = isLarge || isSlim ? 2 : 3;

    const usableWidthPt = mm(A4_WIDTH_MM - 2 * PAGE_MARGIN_MM);
    const gapPt = mm(GAP_MM);
    const columnWidthPt = (usableWidthPt - gapPt * (cols - 1)) / cols;

    const doc = (
      <Document>
        <Page size="A4" style={[styles.page, { padding: mm(PAGE_MARGIN_MM) }]}>
          <View style={styles.grid}>
            {tagPreviews.map((tag) => (
              <TagBox
                key={tag.id}
                tag={tag}
                template={template}
                includeQR={includeQR}
                includeLogo={includeLogo}
                logoSrc={logoSrc}
                columnWidthPt={columnWidthPt}
              />
            ))}
          </View>
        </Page>
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Asset_Tags_${template.id}_${Date.now()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
