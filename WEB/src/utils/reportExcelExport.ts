import ExcelJS from 'exceljs';

export interface ExcelSignatoryBlock {
  role?: string;
  name?: string;
  designation?: string;
  extra?: string;
}

export interface ExcelReportConfig {
  filename: string;
  sheetName?: string;
  /** Centered title/subtitle lines shown at the very top of the sheet. */
  titleLines?: string[];
  /** Left-aligned plain lines shown below the title (e.g. "Entity Name: ...", "Fund Cluster: ..."). */
  infoLines?: string[];
  /** Right-aligned lines shown alongside the first info lines (e.g. "PAR No.: 2026-01-001"). */
  metaRight?: string[];
  /** Table header row. */
  columns: string[];
  /** Table data rows, same column order as `columns`. */
  rows: (string | number | null | undefined)[][];
  /** Optional totals row, same column order as `columns`. */
  totalRow?: (string | number | null | undefined)[];
  /** Rows of side-by-side signatory blocks (e.g. [[receivedBy, issuedBy]] or [[chair, viceChair, ceo]]). */
  signatoryRows?: ExcelSignatoryBlock[][];
}

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

/**
 * Builds and downloads an .xlsx file that mirrors a printed report's layout:
 * title block, optional info/meta lines, a bordered data table, an optional
 * totals row, and optional signatory blocks (with an actual signature-line
 * border) at the bottom.
 */
export async function downloadReportExcel(config: ExcelReportConfig): Promise<void> {
  const {
    filename,
    sheetName = 'Report',
    titleLines = [],
    infoLines = [],
    metaRight = [],
    columns,
    rows,
    totalRow,
    signatoryRows = [],
  } = config;

  const colCount = Math.max(columns.length, 1);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  worksheet.columns = columns.map(() => ({ width: 20 }));

  titleLines.forEach((line, i) => {
    const row = worksheet.addRow([line]);
    worksheet.mergeCells(row.number, 1, row.number, colCount);
    const cell = row.getCell(1);
    cell.font = { bold: true, size: i === 0 ? 13 : 10 };
    cell.alignment = { horizontal: 'center' };
  });
  if (titleLines.length) worksheet.addRow([]);

  infoLines.forEach((text, i) => {
    const row = worksheet.addRow([text]);
    const metaText = metaRight[i];
    if (metaText) {
      const cell = row.getCell(colCount);
      cell.value = metaText;
      cell.alignment = { horizontal: 'right' };
    }
  });
  if (infoLines.length) worksheet.addRow([]);

  const headerRow = worksheet.addRow(columns);
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = THIN_BORDER;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
  });

  rows.forEach((r) => {
    const row = worksheet.addRow(r.map((v) => v ?? ''));
    for (let c = 1; c <= colCount; c++) {
      row.getCell(c).border = THIN_BORDER;
    }
  });

  if (totalRow) {
    const row = worksheet.addRow(totalRow.map((v) => v ?? ''));
    for (let c = 1; c <= colCount; c++) {
      const cell = row.getCell(c);
      cell.border = THIN_BORDER;
      cell.font = { bold: true };
    }
  }

  if (signatoryRows.length) {
    worksheet.addRow([]);
    worksheet.addRow([]);
  }

  signatoryRows.forEach((blocks) => {
    const blockCount = Math.max(blocks.length, 1);
    const span = Math.max(1, Math.floor(colCount / blockCount));

    const spanOf = (i: number) => {
      const start = i * span + 1;
      const end = i === blockCount - 1 ? colCount : start + span - 1;
      return { start, end: Math.max(start, end) };
    };

    const addBlockLine = (getText: (b: ExcelSignatoryBlock) => string | undefined, opts: { bold?: boolean; signatureLine?: boolean } = {}) => {
      const row = worksheet.addRow([]);
      blocks.forEach((b, i) => {
        const { start, end } = spanOf(i);
        const cell = row.getCell(start);
        cell.value = getText(b) ?? '';
        cell.alignment = { horizontal: 'center' };
        if (opts.bold) cell.font = { bold: true };
        if (end > start) worksheet.mergeCells(row.number, start, row.number, end);
        if (opts.signatureLine) {
          for (let c = start; c <= end; c++) {
            row.getCell(c).border = { bottom: { style: 'thin' } };
          }
        }
      });
    };

    addBlockLine((b) => b.role);
    addBlockLine(() => '', { signatureLine: true });
    addBlockLine((b) => b.name?.toUpperCase(), { bold: true });
    addBlockLine((b) => b.designation);
    if (blocks.some((b) => b.extra)) addBlockLine((b) => b.extra);
    worksheet.addRow([]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
