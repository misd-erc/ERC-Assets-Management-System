import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { Asset, UnifiedMovement } from "@/types/asset/UnifiedAsset";

export interface TagTemplate {
  id: string;
  name: string;
  width: number; // mm
  height: number; // mm
  description: string;
}

export interface TaggableAsset {
  id: number;
  code: string;
  description: string;
  category: string;
  location: string;
  assignedTo: string;
  group: "PPE" | "SE";
  asset: Asset;
}

export interface TagPreview extends TaggableAsset {
  qrCode?: string;
  barcodeUrl?: string;
}

export const TAG_TEMPLATES: TagTemplate[] = [
  { id: "standard", name: "Standard Asset Tag", width: 50, height: 25, description: "50mm x 25mm - For general equipment" },
  { id: "small", name: "Small Tag", width: 38, height: 19, description: "38mm x 19mm - For small items" },
  { id: "large", name: "Large Tag", width: 70, height: 40, description: "70mm x 40mm - For large equipment" },
  { id: "slim", name: "Slim Tag", width: 60, height: 15, description: "60mm x 15mm - For narrow spaces" },
];

export function getLatestMovement(movements: UnifiedMovement[] = []): UnifiedMovement | undefined {
  if (!movements.length) return undefined;
  return [...movements].sort((a, b) => {
    const dateA = new Date(a.dateAssigned || a.createdAt || "").getTime();
    const dateB = new Date(b.dateAssigned || b.createdAt || "").getTime();
    return dateB - dateA;
  })[0];
}

export function formatEmployeeName(movement?: UnifiedMovement): string {
  const employee = movement?.employee?.[0];
  if (!employee) return "Unassigned";
  const parts = [employee.firstName, employee.middleName, employee.lastName, employee.suffixName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return parts || "Unassigned";
}

export function normalizeAssets(assets: Asset[] = []): TaggableAsset[] {
  return assets.map((asset) => {
    const latestMovement = getLatestMovement(asset.movements);
    const location = (latestMovement?.division as any)?.name || (latestMovement?.office as any)?.name || "Unspecified";
    const assignedTo = formatEmployeeName(latestMovement);

    return {
      id: asset.id,
      code: asset.propertyNumber || `ASSET-${asset.id}`,
      description: asset.description || "No description",
      category: asset.category?.name || "Uncategorized",
      location,
      assignedTo,
      group: asset.group,
      asset,
    };
  });
}

export async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 200,
      margin: 1,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return "";
  }
}

export function generateBarcode(data: string): string {
  try {
    const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    JsBarcode(svgEl, data || "N/A", {
      format: "CODE128",
      width: 2,
      height: 40,
      displayValue: true,
      fontSize: 10,
      margin: 4,
    });
    const svgStr = new XMLSerializer().serializeToString(svgEl);
    const encoded = btoa(unescape(encodeURIComponent(svgStr)));
    return `data:image/svg+xml;base64,${encoded}`;
  } catch (error) {
    console.error("Error generating barcode:", error);
    return "";
  }
}
