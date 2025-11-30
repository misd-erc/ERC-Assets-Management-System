import { seApi } from '@/api/se';
import { SEAsset, SEMovementHistory, RRSPEntry } from '@/types/supply/se';

type AccountabilityBlock = {
  id: string;
  itr_rrsp_number: string;
  plantilla_employee_id: string;
  non_plantilla_employee_id: string;
  division_section: string;
  condition: string;
  date_issued_returned: string;
  remarks: string;
  label: string;
  type: string;
};

export class SEService {
  // Mocked data for testing and to prevent errors
  private static mockAssets: SEAsset[] = [];

  private static mapApiSeToSeAsset(apiItem: any): SEAsset {
    if (!apiItem || !apiItem.id) {
      console.error('Invalid apiItem passed to mapApiSeToSeAsset:', apiItem);
      throw new Error('apiItem or apiItem.id is undefined');
    }

    // Filter to only active and not deleted movements
    const activeMovements = (apiItem.movements || []).filter((mv: any) => mv.isActive && !mv.isDeleted);

    const latestMovement: any = activeMovements.length > 0
      ? activeMovements.slice().sort((a: any, b: any) => {
        const dateA = new Date(a.dateAssigned || a.createdAt).getTime();
        const dateB = new Date(b.dateAssigned || b.createdAt).getTime();
        return dateB - dateA;
      })[0]
      : null;

    return {
      id: apiItem.id.toString(),
      se_property_number: apiItem.propertyNumber || '',
      category: apiItem.category ? apiItem.category.name : '',
      legend: apiItem.legend ? apiItem.legend.name : '',
      description: apiItem.description || '',
      brand: apiItem.brand || '',
      model: apiItem.model || '',
      serial_number: apiItem.serialNumber || '',
      parts_accessories: Array.isArray(apiItem.parts) ? apiItem.parts : [],
      unit_of_measurement: apiItem.unitOfMeasurement || '',
      unit_value: apiItem.unitValue || 0,
      date_acquired: apiItem.dateAcquired || '',
      warranty_status: 'Unknown', // Assuming default
      accountabilityBlocks: Array.isArray(apiItem.movements) ? apiItem.movements.map((mv: any) => ({
        id: mv.id.toString(),
        itr_rrsp_number: mv.parItrNumber || '',
        plantilla_employee_id: mv.plantillaEmployeeIdOriginal || '',
        non_plantilla_employee_id: mv.nonPlantillaEmployeeIdOriginal || '',
        division_section: mv.division?.name || '',
        condition: mv.condition || 'Working',
        date_issued_returned: mv.dateAssigned || mv.createdAt || '',
        remarks: '',
        label: mv.isActive ? 'Current Holder' : 'Previous Holder',
        type: 'ITR', // Assuming default
      })) : [],
      movementHistory: Array.isArray(apiItem.movements) ? apiItem.movements.map((mv: any) => ({
        id: mv.id.toString(),
        type: 'Issuance', // Assuming default
        date: mv.dateAssigned || mv.createdAt || '',
        from_employee: '',
        to_employee: mv.plantillaEmployeeIdOriginal || mv.nonPlantillaEmployeeIdOriginal || '',
        condition: mv.condition || 'Working',
        remarks: '',
        documentNumber: mv.parItrNumber || '',
      })) : [],
      rrspHistory: [], // Assuming empty for now
      dateEncoded: apiItem.createdAt || '',
      status: latestMovement ? 'Active' : 'Returned', // Assuming based on latest movement
    };
  }

  static async getAll(filters?: {
    category?: string;
    condition?: string;
    division?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ items: SEAsset[]; totalCount: number }> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      // Call API with pagination parameters hardcoded here for example,
      // ideally you'd pass them from SEList or elsewhere
      const pageNumber = 1;
      const pageSize = 5;

      // Compose SearchString from search or filters, adapt as needed
      let searchString = '';
      if (filters) {
        if (filters.search) {
          searchString = filters.search;
        } else if (filters.category) {
          searchString = filters.category;
        }
      }

      const response = await seApi.list({
        SearchString: searchString,
        PageNumber: pageNumber,
        PageSize: pageSize,
        StartDate: filters?.startDate,
        EndDate: filters?.endDate,
        ActionBySystemUserId: actionBySystemUserId,
        SessionKey: sessionKey,
        GroupName: 'se',
      });

      // Map the API response items to SEAsset interface
      const mappedItems = (response.items || []).map(item => this.mapApiSeToSeAsset(item));

      return { items: mappedItems, totalCount: response.totalCount };
    } catch (error) {
      console.error('Error fetching SE assets:', error);
      throw error;
    }
  }

  static async getById(id: string): Promise<SEAsset> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';
      const response: any = await seApi.getById(id, actionBySystemUserId, sessionKey);

      let apiItem = response?.data;
      if (Array.isArray(apiItem)) {
        apiItem = apiItem[0];
      }
      if (!apiItem || !apiItem.id) {
        throw new Error('No SE asset found in response data or invalid data format');
      }

      // map to SEAsset interface to ensure correct typing
      return this.mapApiSeToSeAsset(apiItem);
    } catch (error) {
      console.error('Error fetching SE asset:', error);
      throw error;
    }
  }

  static async create(data: Omit<SEAsset, 'id' | 'dateEncoded'>): Promise<SEAsset> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      const apiData = {
        propertyNumber: data.se_property_number,
        category: data.category || '',
        legend: data.legend || '',
        description: data.description,
        brand: data.brand || '',
        model: data.model || '',
        serialNumber: data.serial_number || '',
        parts: [], // SE doesn't use parts
        unitOfMeasurement: data.unit_of_measurement,
        unitValue: data.unit_value,
        dateAcquired: data.date_acquired,
        estimatedUsefulLife: 0, // Assuming default
        group: 'SE',
        movements: data.accountabilityBlocks || [],
        actionBySystemUserId,
        sessionKey,
      };

      // Create the main SE asset
      const apiResponse = await seApi.create(apiData);

      // Since the API response doesn't include the created asset ID,
      // we need to search for the asset by propertyNumber to get the ID
      const searchResults = await this.getAll({ search: data.se_property_number });
      const createdAsset = searchResults.items.find(asset => asset.se_property_number === data.se_property_number);

      if (!createdAsset || !createdAsset.id) {
        throw new Error('Failed to retrieve created SE asset ID');
      }

      const ptaId = parseInt(createdAsset.id);

      // After successful creation, handle movements
      // Create movements
      if (data.accountabilityBlocks && data.accountabilityBlocks.length > 0) {
        for (const block of data.accountabilityBlocks as any[]) {
          await seApi.editMovement({
            id: parseInt(block.id || '0'),
            ptaId,
            dateAssigned: block.date_issued_returned,
            parItrNumber: block.itr_rrsp_number || '',
            plantillaEmployeeId: parseInt(block.plantilla_employee_id || '0'),
            nonPlantillaEmployeeId: parseInt(block.non_plantilla_employee_id || '0'),
            condition: block.condition || 'Working',
            actualOfficeId: 0, // Assuming default
            actualDivisionId: 0, // Assuming default
            isActive: block.label === 'Current Holder',
            actionBySystemUserId: parseInt(actionBySystemUserId),
            sessionKey,
          });
        }
      }

      return createdAsset;
    } catch (error) {
      console.error('Error creating SE asset:', error);
      throw error;
    }
  }

  static async update(id: string, data: Partial<SEAsset>): Promise<SEAsset> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      const apiData = {
        id,
        propertyNumber: data.se_property_number || '',
        category: data.category || '',
        legend: data.legend || '',
        description: data.description || '',
        brand: data.brand || '',
        model: data.model || '',
        serialNumber: data.serial_number || '',
        parts: [], // SE doesn't use parts
        unitOfMeasurement: data.unit_of_measurement || '',
        unitValue: data.unit_value || 0,
        dateAcquired: data.date_acquired || '',
        estimatedUsefulLife: 0, // Assuming default
        movements: data.accountabilityBlocks || [],
        actionBySystemUserId,
        sessionKey,
      };

      const apiResponse = await seApi.update(apiData);
      return this.mapApiSeToSeAsset(apiResponse);
    } catch (error) {
      console.error('Error updating SE asset:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      this.mockAssets = this.mockAssets.filter(asset => asset.id !== id);
    } catch (error) {
      console.error('Error deleting SE asset:', error);
      throw error;
    }
  }

  static async search(query: string): Promise<SEAsset[]> {
    try {
      const lowerQuery = query.toLowerCase();
      return this.mockAssets.filter(asset =>
        asset.se_property_number.toLowerCase().includes(lowerQuery) ||
        asset.description.toLowerCase().includes(lowerQuery) ||
        (asset.brand && asset.brand.toLowerCase().includes(lowerQuery)) ||
        (asset.model && asset.model.toLowerCase().includes(lowerQuery)) ||
        (asset.serial_number && asset.serial_number.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error('Error searching SE assets:', error);
      throw error;
    }
  }

  static async exportData(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      // Mock export returns empty blob for now
      return new Blob();
    } catch (error) {
      console.error('Error exporting SE data:', error);
      throw error;
    }
  }

  static async importData(file: File): Promise<{ imported: number; errors: string[] }> {
    try {
      // Mock import: does nothing
      return { imported: 0, errors: [] };
    } catch (error) {
      console.error('Error importing SE data:', error);
      throw error;
    }
  }

  static async batchUpload(file: File, actionBySystemUserId: string, sessionKey: string): Promise<{ imported: number; errors: string[] }> {
    try {
      return await seApi.batchUpload(file, actionBySystemUserId, sessionKey);
    } catch (error) {
      console.error('Error during SE batch upload:', error);
      throw error;
    }
  }
}
