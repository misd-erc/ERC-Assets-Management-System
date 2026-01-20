import * as XLSX from 'xlsx';
import { PPEAsset } from '@/types/asset/PPEAsset';
import { SEAsset } from '@/types/supply/se';
import { ppeApi } from '@/api/asset/ppe';
import { seApi } from '@/api/asset/se';

export interface ExportOptions {
  startDate?: string;
  endDate?: string;
  groupName: 'PPE' | 'SE' | 'All';
}

export class ExcelExportService {
  private static async fetchAllAssets(options: ExportOptions): Promise<any[]> {
    const { startDate, endDate, groupName } = options;
    const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
    const sessionKey = localStorage.getItem('sessionToken') || '';

    if (!actionBySystemUserId || !sessionKey) {
      throw new Error('Authentication required');
    }

    const allItems: any[] = [];

    if (groupName === 'All') {
      // Fetch both PPE and SE assets
      const [ppeItems, seItems] = await Promise.all([
        this.fetchAssetsByType('PPE', startDate, endDate, actionBySystemUserId, sessionKey),
        this.fetchAssetsByType('SE', startDate, endDate, actionBySystemUserId, sessionKey)
      ]);
      allItems.push(...ppeItems, ...seItems);
    } else {
      // Fetch specific type
      const items = await this.fetchAssetsByType(groupName, startDate, endDate, actionBySystemUserId, sessionKey);
      allItems.push(...items);
    }

    console.log(`[ExcelExport] Total rows exported: ${allItems.length}`);
    return allItems;
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
    let hasMorePages = true;

    while (hasMorePages) {
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

      allItems.push(...response.items);

      if (response.items.length < pageSize || allItems.length >= response.totalCount) {
        hasMorePages = false;
      } else {
        pageNumber++;
      }
    }

    return allItems;
  }

  private static mapPPEAssetToRow(asset: PPEAsset): Record<string, any> {
    const latestMovement = asset.movements && asset.movements.length > 0 ? asset.movements[0] : null;
    
    return {
      'Property Number': asset.propertyNumber,
      'Category': typeof asset.category === 'object' && asset.category ? asset.category.name : asset.category || '-',
      'Legend': typeof asset.legend === 'string' ? asset.legend : '-',
      'Description': asset.description,
      'Brand': asset.brand,
      'Model': asset.model,
      'Serial Number': asset.serialNumber,
      'Unit of Measurement': asset.unitOfMeasurement,
      'Unit Value': asset.unitValue,
      'Date Acquired': asset.dateAcquired,
      'Estimated Useful Life': asset.estimatedUsefulLife,
      'PTR/ITR Number': latestMovement?.ptrItrNumber || '',
      'Plantilla Employee ID': latestMovement?.plantillaEmployeeIdOriginal || '',
      'Non-Plantilla Employee ID': latestMovement?.nonPlantillaEmployeeIdOriginal || '',
      'Actual Division': latestMovement?.employee?.[0]?.division?.name || '',
      'Condition': latestMovement?.condition || asset.movements?.[0]?.condition || 'N/A',
      'Date Encoded': asset.dateEncoded || asset.createdAt || '',
    };
  }

  private static mapSEAssetToRow(asset: SEAsset): Record<string, any> {
    // Get current movement (latest active one)
    const currentMovement = asset.movements?.[0];

    return {
      'Property Number': asset.propertyNumber,
      'Category': asset.category?.name || '',
      'Legend': asset.legend || '',
      'Description': asset.description,
      'Brand': asset.brand,
      'Model': asset.model,
      'Serial Number': asset.serialNumber,
      'Parts': (asset.parts && asset.parts.length > 0) ? 'Yes' : 'No',
      'Unit of Measurement': asset.unitOfMeasurement,
      'Unit Value': asset.unitValue,
      'Date Acquired': asset.dateAcquired,
      'Estimated Useful Life': asset.estimatedUsefulLife || 'N/A',
      'Employee ID': currentMovement?.employee?.[0]?.employeeIdOriginal || '',
      'Employee Name': currentMovement?.employee?.[0] ? `${currentMovement.employee[0].lastName}, ${currentMovement.employee[0].firstName}` : '',
      'Office': currentMovement?.employee?.[0]?.office?.name || '',
      'Division': currentMovement?.employee?.[0]?.division?.name || '',
      'Condition': currentMovement?.condition || '',
      'Date Assigned': currentMovement?.dateAssigned || '',
      'Is Active': asset.isActive ? 'Yes' : 'No',
    };
  }

  static async exportToExcel(options: ExportOptions): Promise<void> {
    try {
      console.log('[ExcelExport] Modal opened');

      const assets = await this.fetchAllAssets(options);

      const rows = assets.map(asset => {
        if (options.groupName === 'PPE' || (options.groupName === 'All' && asset.propertyNumber)) {
          return this.mapPPEAssetToRow(asset as PPEAsset);
        } else {
          return this.mapSEAssetToRow(asset as SEAsset);
        }
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, options.groupName);

      const today = new Date().toISOString().split('T')[0];
      const filename = `${options.groupName}_Report_${today}.xlsx`;

      XLSX.writeFile(workbook, filename);

      console.log('[ExcelExport] Download complete');
    } catch (error) {
      console.error('[ExcelExport] Export failed:', error);
      throw error;
    }
  }
}
