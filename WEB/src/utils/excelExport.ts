import ExcelJS from 'exceljs';
import { ppeApi } from '@/api/asset/ppe';
import { seApi } from '@/api/asset/se';
import { secureStorage } from './secureStorage';

export interface ExportOptions {
  startDate?: string;
  endDate?: string;
  groupName: 'PPE' | 'SE' | 'All';
}

const ASSET_HEADERS = [
  'Property Number',
  'Category',
  'Legend/Sub-Category',
  'Description',
  'Brand',
  'Model',
  'Serial Number',
  'Parts/Accessories',
  'Unit of Measurement',
  'Unit Value (PHP)',
  'Date Acquired (YYYY-MM-DD)',
  'Estimated Useful Life (Years)',
  'Fiscal Date (YYYY-MM-DD)',
] as const;

const MOVEMENT_HEADERS = [
  'PTR/ITR Number',
  'PAR/ICS Number',
  'Plantilla Employee ID',
  'Firstname',
  'Lastname',
  'Position',
  'Non-Plantilla Employee ID',
  'Firstname',
  'Lastname',
  'Position',
  'Office/Division',
  'Condition',
  'Date Assigned (YYYY-MM-DD)',
  'Status',
] as const;

const MIN_MOVEMENT_BLOCKS = 2;
const MOVEMENT_BLOCK_SIZE = MOVEMENT_HEADERS.length;

const asText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const namedValue = (value: any): string => {
  if (!value) return '';
  return asText(typeof value === 'object' ? value.name : value);
};

const formatDate = (value: unknown): string => {
  const text = asText(value);
  if (!text) return '';

  const isoDate = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDate) return isoDate[1];

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, '0'),
    String(parsed.getDate()).padStart(2, '0'),
  ].join('-');
};

const formatParts = (parts: any): string => {
  if (!Array.isArray(parts)) return '';

  return parts
    .filter((part) => part && part.isDeleted !== true && part.isActive !== false)
    .map((part) => {
      const serialNumber = asText(part.serialNumber ?? part.partSerialNumber);
      if (!serialNumber) return '';
      const name = asText(part.name ?? part.partName);
      return name ? `${name}: SN: ${serialNumber}` : `SN: ${serialNumber}`;
    })
    .filter(Boolean)
    .join('\n');
};

const activeMovements = (asset: any): any[] => {
  if (!Array.isArray(asset?.movements)) return [];
  return asset.movements.filter((movement: any) => movement && movement.isDeleted !== true);
};

const employeeFor = (movement: any, kind: 'plantilla' | 'nonPlantilla'): any => {
  const employees = Array.isArray(movement?.employee) ? movement.employee : [];
  const internalId = movement?.[`${kind}EmployeeId`];
  const originalId = asText(movement?.[`${kind}EmployeeIdOriginal`]);

  const exactMatch = employees.find((employee: any) =>
    (internalId !== null && internalId !== undefined && Number(employee?.id) === Number(internalId)) ||
    (originalId && asText(employee?.employeeIdOriginal) === originalId)
  );

  if (exactMatch) return exactMatch;

  // Most API responses contain only the employee assigned in this movement.
  if (employees.length === 1 && (internalId || originalId)) return employees[0];
  return undefined;
};

const officeDivision = (movement: any, employee: any): string => {
  const office = movement?.office ?? employee?.office;
  const division = movement?.division ?? employee?.division;
  const officeLabel = asText(office?.acronym ?? office?.name ?? office);
  const divisionLabel = asText(division?.acronym ?? division?.name ?? division);
  return [officeLabel, divisionLabel].filter(Boolean).join('/');
};

const movementCells = (movement: any): Array<string> => {
  const plantillaEmployee = employeeFor(movement, 'plantilla');
  const nonPlantillaEmployee = employeeFor(movement, 'nonPlantilla');
  const locationEmployee = plantillaEmployee ?? nonPlantillaEmployee;
  // Older movement records may not have their denormalized *EmployeeIdOriginal
  // columns populated even though they still reference a valid employee. The list
  // API includes that employee object, so use its authoritative ID as the fallback.
  const plantillaEmployeeId = asText(movement?.plantillaEmployeeIdOriginal)
    || asText(plantillaEmployee?.employeeIdOriginal);
  const nonPlantillaEmployeeId = asText(movement?.nonPlantillaEmployeeIdOriginal)
    || asText(nonPlantillaEmployee?.employeeIdOriginal);

  return [
    asText(movement?.ptrItrNumber ?? movement?.ptritrNumber),
    asText(movement?.parIcsNumber ?? movement?.paricsNumber),
    plantillaEmployeeId,
    asText(plantillaEmployee?.firstName),
    asText(plantillaEmployee?.lastName),
    namedValue(plantillaEmployee?.position),
    nonPlantillaEmployeeId,
    asText(nonPlantillaEmployee?.firstName),
    asText(nonPlantillaEmployee?.lastName),
    namedValue(nonPlantillaEmployee?.position),
    officeDivision(movement, locationEmployee),
    asText(movement?.condition ?? movement?.remarks),
    formatDate(movement?.dateAssigned),
    asText(movement?.status),
  ];
};

const assetCells = (asset: any): Array<string | number> => [
  asText(asset?.propertyNumber),
  namedValue(asset?.category),
  namedValue(asset?.legend),
  asText(asset?.description),
  asText(asset?.brand),
  asText(asset?.model),
  asText(asset?.serialNumber),
  formatParts(asset?.parts),
  asText(asset?.unitOfMeasurement),
  Number.isFinite(Number(asset?.unitValue)) ? Number(asset.unitValue) : 0,
  formatDate(asset?.dateAcquired),
  Number.isFinite(Number(asset?.estimatedUsefulLife)) ? Number(asset.estimatedUsefulLife) : 0,
  formatDate(asset?.fiscalDate),
];

const saveWorkbook = async (workbook: ExcelJS.Workbook, filename: string): Promise<void> => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export class ExcelExportService {
  private static async fetchAllAssets(options: ExportOptions): Promise<any[]> {
    const { startDate, endDate, groupName } = options;
    const actionBySystemUserId = secureStorage.getItem('systemUserId') || '';
    const sessionKey = secureStorage.getItem('sessionToken') || '';

    if (!actionBySystemUserId || !sessionKey) {
      throw new Error('Authentication required');
    }

    if (groupName === 'All') {
      const [ppeItems, seItems] = await Promise.all([
        this.fetchAssetsByType('PPE', startDate, endDate, actionBySystemUserId, sessionKey),
        this.fetchAssetsByType('SE', startDate, endDate, actionBySystemUserId, sessionKey),
      ]);
      return [...ppeItems, ...seItems];
    }

    return this.fetchAssetsByType(groupName, startDate, endDate, actionBySystemUserId, sessionKey);
  }

  private static async fetchAssetsByType(
    groupName: 'PPE' | 'SE',
    startDate: string | undefined,
    endDate: string | undefined,
    actionBySystemUserId: string,
    sessionKey: string
  ): Promise<any[]> {
    const allItems: any[] = [];
    const pageSize = 100;
    let pageNumber = 1;

    while (true) {
      const params = {
        SearchString: undefined,
        PageNumber: pageNumber,
        PageSize: pageSize,
        StartDate: startDate,
        EndDate: endDate,
        ActionBySystemUserId: actionBySystemUserId,
        SessionKey: sessionKey,
        GroupName: groupName.toLowerCase(),
      };

      const response = groupName === 'PPE'
        ? await ppeApi.list(params)
        : await seApi.list(params);
      const items = response.items || [];
      allItems.push(...items);

      if (items.length < pageSize || allItems.length >= response.totalCount) break;
      pageNumber += 1;
    }

    return allItems;
  }

  private static buildWorkbook(assets: any[], sheetName: string): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ERC Assets Management System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', ySplit: 2, xSplit: 1 }],
      properties: { defaultRowHeight: 18 },
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    const movementBlockCount = Math.max(
      MIN_MOVEMENT_BLOCKS,
      ...assets.map((asset) => activeMovements(asset).length)
    );
    const totalColumns = ASSET_HEADERS.length + movementBlockCount * MOVEMENT_BLOCK_SIZE;

    worksheet.addRow([]);
    worksheet.addRow([
      ...ASSET_HEADERS,
      ...Array.from({ length: movementBlockCount }, () => [...MOVEMENT_HEADERS]).flat(),
    ]);

    worksheet.mergeCells(1, 1, 1, ASSET_HEADERS.length);
    worksheet.getCell(1, 1).value = 'ASSET DETAILS/LDCC';

    for (let block = 0; block < movementBlockCount; block += 1) {
      const startColumn = ASSET_HEADERS.length + block * MOVEMENT_BLOCK_SIZE + 1;
      const endColumn = startColumn + MOVEMENT_BLOCK_SIZE - 1;
      worksheet.mergeCells(1, startColumn, 1, endColumn);
      worksheet.getCell(1, startColumn).value = 'Asset Accountability and Movement';
    }

    assets.forEach((asset) => {
      const movements = activeMovements(asset);
      const rowValues: Array<string | number> = [...assetCells(asset)];

      for (let block = 0; block < movementBlockCount; block += 1) {
        rowValues.push(...(movements[block] ? movementCells(movements[block]) : Array(MOVEMENT_BLOCK_SIZE).fill('')));
      }

      worksheet.addRow(rowValues);
    });

    // The batch parser expects a title row, a header row, and at least one data row.
    // Keep an empty, formatted row when the selected date range has no records so the
    // downloaded workbook remains a valid blank batch-upload template.
    if (assets.length === 0) {
      worksheet.addRow(Array(totalColumns).fill(''));
    }

    const groupFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } } as const;
    const assetHeaderFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAF7' } } as const;
    const movementHeaderFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2F0D9' } } as const;
    const border: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FF7F8C8D' } },
      left: { style: 'thin', color: { argb: 'FF7F8C8D' } },
      bottom: { style: 'thin', color: { argb: 'FF7F8C8D' } },
      right: { style: 'thin', color: { argb: 'FF7F8C8D' } },
    };

    worksheet.getRow(1).height = 24;
    worksheet.getRow(2).height = 42;
    for (let column = 1; column <= totalColumns; column += 1) {
      const groupCell = worksheet.getCell(1, column);
      groupCell.fill = groupFill;
      groupCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      groupCell.alignment = { horizontal: 'center', vertical: 'middle' };
      groupCell.border = border;

      const headerCell = worksheet.getCell(2, column);
      headerCell.fill = column <= ASSET_HEADERS.length ? assetHeaderFill : movementHeaderFill;
      headerCell.font = { bold: true, color: { argb: 'FF1F1F1F' }, size: 10 };
      headerCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      headerCell.border = border;
    }

    for (let rowNumber = 3; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      row.alignment = { vertical: 'top', wrapText: true };
      for (let column = 1; column <= totalColumns; column += 1) {
        const cell = row.getCell(column);
        cell.border = border;
        if (rowNumber % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      }
    }

    const assetWidths = [22, 24, 24, 36, 18, 18, 22, 32, 20, 18, 22, 20, 22];
    const movementWidths = [20, 20, 22, 18, 18, 22, 25, 18, 18, 22, 24, 18, 22, 16];
    for (let column = 1; column <= totalColumns; column += 1) {
      worksheet.getColumn(column).width = column <= ASSET_HEADERS.length
        ? assetWidths[column - 1]
        : movementWidths[(column - ASSET_HEADERS.length - 1) % MOVEMENT_BLOCK_SIZE];
    }

    worksheet.getColumn(10).numFmt = '#,##0.00';
    worksheet.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: totalColumns } };

    return workbook;
  }

  static async exportToExcel(options: ExportOptions): Promise<void> {
    try {
      const assets = await this.fetchAllAssets(options);
      const workbook = this.buildWorkbook(assets, options.groupName);
      const today = formatDate(new Date());
      await saveWorkbook(workbook, `${options.groupName}_Batch_Upload_Format_${today}.xlsx`);
    } catch (error) {
      console.error('[ExcelExport] Export failed:', error);
      throw error;
    }
  }
}
