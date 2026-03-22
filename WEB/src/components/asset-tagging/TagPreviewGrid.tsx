import { getLatestMovement, TagPreview, TagTemplate } from "@/hooks/useAssetTagging";

type TagUser = { firstName?: string | null };

interface TagPreviewGridProps {
  tagPreviews: TagPreview[];
  includeQR: boolean;
  includeBarcode: boolean;
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

interface StickerRowProps {
  label: string;
  value: string;
}

function StickerRow({ label, value }: StickerRowProps) {
  return (
    <div className="flex gap-1 text-[8px] leading-snug">
      <span className="font-bold whitespace-nowrap flex-shrink-0">{label}:</span>
      <span className="text-gray-900 break-words min-w-0">{value || "—"}</span>
    </div>
  );
}

export function TagPreviewGrid({
  tagPreviews,
  includeQR,
  includeBarcode,
  includeLogo,
  logoSrc,
}: TagPreviewGridProps) {
  if (!tagPreviews.length) return null;

  return (
    <div className="print-area">
      <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2 print:gap-3">
        {tagPreviews.map((tag) => {
          const asset = tag.asset;
          const latestMovement = getLatestMovement(asset.movements);
          const employee = latestMovement?.employee?.[0];
          const divAcronym =
            employee?.division?.acronym || employee?.office?.acronym || "";
          const empName = employee
            ? [
                employee.firstName,
                employee.middleName,
                employee.lastName,
                employee.suffixName,
              ]
                .filter(Boolean)
                .join(" ")
                .trim()
            : "Unassigned";
          const personAccountable = divAcronym
            ? `${divAcronym} - ${empName}`
            : empName;

          const modelSerial =
            [
              asset.model,
              asset.serialNumber ? `SN: ${asset.serialNumber}` : null,
            ]
              .filter(Boolean)
              .join(" / ") || "—";

          const acqDateCost = `${formatDate(asset.dateAcquired)} / ${formatCurrency(asset.unitValue)}`;

          return (
            <div
              key={tag.id}
              className="bg-white border-2 border-gray-800 text-black overflow-hidden"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              {/* Header */}
              <div className="border-b-2 border-gray-800 flex items-center px-2 py-1.5 gap-2">
                {includeLogo && (
                  <img
                    src={logoSrc}
                    alt="ERC Logo"
                    className="h-10 w-10 flex-shrink-0"
                  />
                )}
                <div className="flex-1 text-center leading-tight">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-blue-700">
                    Energy Regulatory Commission
                  </p>
                  <p className="text-[8px] font-bold uppercase tracking-wide text-black">
                    Property Inventory Sticker
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="px-2 py-1.5 space-y-1">
                <StickerRow label="Property No." value={tag.code} />
                <StickerRow label="Description" value={tag.description} />
                <StickerRow label="Model/Serial Number" value={modelSerial} />
                <StickerRow label="Acquisition Date/Cost" value={acqDateCost} />
                <StickerRow label="Person Accountable" value={personAccountable} />

                <div className="pt-1">
                  <p className="text-[8px] font-bold leading-snug">
                    Validation of the Inventory Committee:
                  </p>
                  <div className="border-b border-black mt-3 mx-1" />
                </div>

                {/* QR / Barcode */}
                {includeQR && tag.qrCode && (
                  <div className="flex justify-center pt-1">
                    <img src={tag.qrCode} alt={`QR ${tag.code}`} className="h-16 w-16" />
                  </div>
                )}
                {includeBarcode && tag.barcodeUrl && (
                  <div className="flex justify-center pt-1">
                    <img src={tag.barcodeUrl} alt={`Barcode ${tag.code}`} className="h-10 w-full object-contain" />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-400 px-2 py-0.5 mt-1">
                <p className="text-[6.5px] italic text-center text-gray-600 leading-tight">
                  Tampering / Removing of this sticker is Punishable under ERC
                  Regulations.
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
