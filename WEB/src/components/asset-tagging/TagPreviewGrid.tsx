import { getLatestMovement, TagPreview, TagTemplate } from "@/hooks/useAssetTagging";

type TagUser = { firstName?: string | null };

interface TagPreviewGridProps {
  tagPreviews: TagPreview[];
  includeQR: boolean;
  includeLogo: boolean;
  activeTemplate: TagTemplate;
  generatedBy?: TagUser | null;
  logoSrc: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(value: number): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

interface FieldRowProps {
  label: string;
  value: string;
  mono?: boolean;
  f: (base: number) => string;
}

function FieldRow({ label, value, mono, f }: FieldRowProps) {
  return (
    <div style={{ marginBottom: "2px" }}>
      <div style={{ fontSize: f(5.5), fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.2 }}>
        {label}
      </div>
      <div style={{ fontSize: f(7.5), color: "#111827", lineHeight: 1.3, fontFamily: mono ? "Courier New, monospace" : "inherit", wordBreak: "break-word" }}>
        {value || "—"}
      </div>
    </div>
  );
}

// ─── constants ────────────────────────────────────────────────
const REFERENCE_H = 25; // standard template height (mm) — baseline for scaling

export function TagPreviewGrid({
  tagPreviews,
  includeQR,
  includeLogo,
  activeTemplate,
  logoSrc,
}: TagPreviewGridProps) {
  if (!tagPreviews.length) return null;

  // Scale everything relative to the standard 25mm-tall template
  const scale = activeTemplate.height / REFERENCE_H;
  const fontScale = Math.max(0.75, Math.min(scale, 1.6));
  const f = (base: number) => `${(base * fontScale).toFixed(1)}px`;
  const qrSize = Math.round(Math.max(32, 58 * scale));
  const logoSize = Math.round(Math.max(16, 22 * scale));
  const isSlim = activeTemplate.height < 20;   // slim tag (e.g. 60×15mm)
  const isLarge = activeTemplate.height >= 35;  // large tag (e.g. 70×40mm)

  // Grid columns per template
  const gridClass = isLarge
    ? "grid gap-3 sm:grid-cols-1 lg:grid-cols-2 print:grid-cols-2 print:gap-2"
    : isSlim
    ? "grid gap-2 sm:grid-cols-1 print:grid-cols-2 print:gap-2"
    : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-2";

  return (
    <div className="print-area">
      <div className={gridClass}>
        {tagPreviews.map((tag) => {
          const asset = tag.asset;
          const latestMovement = getLatestMovement(asset.movements);
          const employee = latestMovement?.employee?.[0];
          const divAcronym = employee?.division?.acronym || employee?.office?.acronym || "";
          const empName = employee
            ? [employee.firstName, employee.middleName, employee.lastName, employee.suffixName]
                .filter(Boolean).join(" ").trim()
            : "Unassigned";
          const personAccountable = divAcronym ? `${divAcronym} — ${empName}` : empName;
          const modelSerial = [asset.model, asset.serialNumber ? `SN: ${asset.serialNumber}` : null]
            .filter(Boolean).join(" / ") || "—";
          const acqDate = formatDate(asset.dateAcquired);
          const acqCost = formatCurrency(asset.unitValue);
          const groupLabel = asset.group === "PPE" ? "PPE" : "SE";
          const condition = latestMovement?.condition || null;

          // ── SLIM layout (60×15mm) ─────────────────────────────
          if (isSlim) {
            return (
              <div
                key={tag.id}
                className="bg-white text-black overflow-hidden"
                style={{ fontFamily: "Arial, sans-serif", border: "2px solid #1f2937", width: "100%" }}
              >
                {/* Slim header strip */}
                <div style={{
                  borderBottom: "1.5px solid #1f2937",
                  display: "flex",
                  alignItems: "center",
                  padding: "2px 5px",
                  gap: "4px",
                }}>
                  {includeLogo && (
                    <img src={logoSrc} alt="ERC" style={{ height: `${logoSize}px`, width: `${logoSize}px`, borderRadius: "50%", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: f(6.5), fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.1 }}>
                      Energy Regulatory Commission
                    </div>
                    <div style={{ fontSize: f(5), fontWeight: 700, color: "#111827", textTransform: "uppercase", letterSpacing: "0.07em", lineHeight: 1.1 }}>
                      Property Inventory Sticker
                    </div>
                  </div>
                  <div style={{ fontSize: f(5.5), fontWeight: 700, color: "#1d4ed8", background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "2px", padding: "0 3px", flexShrink: 0 }}>
                    {groupLabel}
                  </div>
                </div>

                {/* Single-row body */}
                <div style={{ display: "flex", alignItems: "center", padding: "3px 5px", gap: "6px" }}>
                  {/* Property No + Description */}
                  <div style={{
                    background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "2px",
                    padding: "1px 4px", flexShrink: 0,
                  }}>
                    <div style={{ fontSize: f(4.5), fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>Property No.</div>
                    <div style={{ fontSize: f(7.5), fontWeight: 800, color: "#1e3a5f", fontFamily: "Courier New, monospace" }}>{tag.code}</div>
                  </div>

                  {/* Description */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: f(4.5), fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Description</div>
                    <div style={{ fontSize: f(6.5), color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tag.description}
                    </div>
                  </div>

                  {/* Person Accountable */}
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <div style={{ fontSize: f(4.5), fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Person Accountable</div>
                    <div style={{ fontSize: f(6.5), color: "#111827", fontWeight: 600 }}>{personAccountable}</div>
                  </div>

                  {/* QR */}
                  {includeQR && tag.qrCode && (
                    <img
                      src={tag.qrCode}
                      alt={`QR ${tag.code}`}
                      style={{ width: `${qrSize}px`, height: `${qrSize}px`, flexShrink: 0, display: "block" }}
                    />
                  )}
                </div>
              </div>
            );
          }

          // ── STANDARD / LARGE layout ───────────────────────────
          return (
            <div
              key={tag.id}
              className="bg-white text-black overflow-hidden"
              style={{ fontFamily: "Arial, sans-serif", border: "2px solid #1f2937", width: "100%" }}
            >
              {/* ── Header ──────────────────── */}
              <div style={{
                background: "#ffffff",
                borderBottom: "2px solid #1f2937",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: `${Math.round(4 * fontScale)}px 6px`,
              }}>
                {includeLogo && (
                  <img src={logoSrc} alt="ERC" style={{ height: `${logoSize}px`, width: `${logoSize}px`, borderRadius: "50%", background: "#fff", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: f(7), fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.2 }}>
                    Energy Regulatory Commission
                  </div>
                  <div style={{ fontSize: f(5.5), color: "#111827", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1.2, fontWeight: 700 }}>
                    Property Inventory Sticker
                  </div>
                </div>
                <div style={{
                  fontSize: f(5.5), fontWeight: 700, color: "#1d4ed8",
                  background: "#eff6ff", border: "1px solid #93c5fd",
                  borderRadius: "2px", padding: "1px 4px", whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  {groupLabel}
                </div>
              </div>

              {/* ── Body: two-column ─────────── */}
              <div style={{ display: "flex", gap: 0 }}>

                {/* Left: fields */}
                <div style={{
                  flex: 1,
                  padding: `${Math.round(5 * fontScale)}px 6px`,
                  borderRight: includeQR && tag.qrCode ? "1px dashed #d1d5db" : "none",
                  minWidth: 0,
                }}>
                  {/* Property No highlight */}
                  <div style={{
                    background: "#eff6ff", border: "1px solid #93c5fd",
                    borderRadius: "2px", padding: "2px 4px",
                    marginBottom: `${Math.round(4 * fontScale)}px`,
                  }}>
                    <div style={{ fontSize: f(5), fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.04em" }}>Property No.</div>
                    <div style={{ fontSize: f(8.5), fontWeight: 800, color: "#1e3a5f", fontFamily: "Courier New, monospace", letterSpacing: "0.03em" }}>
                      {tag.code}
                    </div>
                  </div>

                  <FieldRow label="Description" value={tag.description} f={f} />
                  <FieldRow label="Model / Serial No." value={modelSerial} f={f} />

                  {/* Show Category only on large template */}
                  {isLarge && tag.category && (
                    <FieldRow label="Category" value={tag.category} f={f} />
                  )}

                  <div style={{ borderTop: "0.5px solid #e5e7eb", margin: `${Math.round(3 * fontScale)}px 0` }} />

                  <FieldRow label="Acquisition Date" value={acqDate} f={f} />
                  <FieldRow label="Acquisition Cost" value={acqCost} f={f} />

                  <div style={{ borderTop: "0.5px solid #e5e7eb", margin: `${Math.round(3 * fontScale)}px 0` }} />

                  <FieldRow label="Person Accountable" value={personAccountable} f={f} />

                  {/* Show Condition only on large template */}
                  {isLarge && condition && (
                    <FieldRow label="Condition" value={condition} f={f} />
                  )}

                  <div style={{ borderTop: "0.5px solid #e5e7eb", margin: `${Math.round(4 * fontScale)}px 0 ${Math.round(3 * fontScale)}px` }} />

                  <div style={{ fontSize: f(5.5), fontWeight: 700, color: "#374151", marginBottom: "2px" }}>
                    Validated by:
                  </div>
                  <div style={{ borderBottom: "0.75px solid #374151", width: "80%", marginBottom: "1px" }} />
                </div>

                {/* Right: QR */}
                {includeQR && tag.qrCode && (
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: `${Math.round(5 * fontScale)}px`,
                    gap: "2px",
                    flexShrink: 0,
                  }}>
                    <img
                      src={tag.qrCode}
                      alt={`QR ${tag.code}`}
                      style={{ width: `${qrSize}px`, height: `${qrSize}px`, display: "block" }}
                    />
                    <div style={{ fontSize: f(4.5), color: "#9ca3af", textAlign: "center", letterSpacing: "0.02em" }}>
                      Scan to view
                    </div>
                  </div>
                )}
              </div>

              {/* ── Footer ──────────────────── */}
              <div style={{
                borderTop: "0.5px solid #d1d5db",
                background: "#f9fafb",
                padding: "2px 6px",
                textAlign: "center",
              }}>
                <p style={{ fontSize: f(5), color: "#9ca3af", fontStyle: "italic", margin: 0 }}>
                  Tampering / Removing of this sticker is Punishable under ERC Regulations.
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
