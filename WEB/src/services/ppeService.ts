import { ppeApi } from '@/api/ppe';
import { PPEAsset } from '@/types/asset/ppe';

export class PPEService {
  // Mocked data for testing and to prevent errors
  private static mockAssets: PPEAsset[] = [];

  private static mapApiPpeToPpeAsset(apiItem: any): PPEAsset {
    const latestMovement = apiItem.movements && apiItem.movements.length > 0
      ? apiItem.movements.slice().sort((a: any, b: any) => {
        const dateA = new Date(a.dateAssigned || a.createdAt).getTime();
        const dateB = new Date(b.dateAssigned || b.createdAt).getTime();
        return dateB - dateA;
      })[0]
      : null;

    return {
      id: apiItem.id.toString(),
      property_number: apiItem.propertyNumber || '',
      category: apiItem.category?.name || apiItem.category || '',
      legend: apiItem.legend || '',
      description: apiItem.description || '',
      brand: apiItem.brand || '',
      model: apiItem.model || '',
      serial_number: apiItem.serialNumber || '',
      parts: Array.isArray(apiItem.parts) ? JSON.stringify(apiItem.parts) : '',
      unit_of_measurement: apiItem.unitOfMeasurement || '',
      unit_value: apiItem.unitValue || 0,
      date_acquired: apiItem.dateAcquired || '',
      estimated_useful_life: apiItem.estimatedUsefulLife || 0,
      date: '',
      par_itr_number: latestMovement?.parItrNumber || '',
      plantilla_employee_id: latestMovement?.plantillaEmployeeIdOriginal || '',
      non_plantilla_employee_id: latestMovement?.nonPlantillaEmployeeIdOriginal || '',
      actual_division: latestMovement?.division?.name || '',
      condition: (latestMovement?.condition as any) || 'Working',
      dateEncoded: apiItem.createdAt || '',
      history: Array.isArray(apiItem.movements) ? apiItem.movements.map((mv: any) => ({
        id: mv.id.toString(),
        date: mv.dateAssigned || mv.createdAt || '',
        par_itr_number: mv.parItrNumber || '',
        plantilla_employee_id: mv.plantillaEmployeeIdOriginal || '',
        non_plantilla_employee_id: mv.nonPlantillaEmployeeIdOriginal || '',
        actual_division: mv.division?.name || '',
        condition: mv.condition || 'Working',
        remarks: '',
      })) : []
    };
  }

  static async getAll(filters?: {
    category?: string;
    condition?: string;
    division?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ items: PPEAsset[]; totalCount: number }> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      // Call API with pagination parameters hardcoded here for example,
      // ideally you'd pass them from PPEList or elsewhere
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

      const response = await ppeApi.list({
        SearchString: searchString,
        PageNumber: pageNumber,
        PageSize: pageSize,
        StartDate: filters?.startDate,
        EndDate: filters?.endDate,
        ActionBySystemUserId: actionBySystemUserId,
        SessionKey: sessionKey,
      });

      // Map the API response items to PPEAsset interface
      const mappedItems = (response.items || []).map(item => this.mapApiPpeToPpeAsset(item));

      return { items: mappedItems, totalCount: response.totalCount };
    } catch (error) {
      console.error('Error fetching PPE assets:', error);
      throw error;
    }
  }


  static async getById(id: string): Promise<PPEAsset> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';
      return await ppeApi.getById(id, actionBySystemUserId, sessionKey);
    } catch (error) {
      console.error('Error fetching PPE asset:', error);
      throw error;
    }
  }

  static async create(data: Omit<PPEAsset, 'id' | 'dateEncoded'>): Promise<PPEAsset> {
    try {
      const newAsset: PPEAsset = {
        ...data,
        id: (Math.random() * 1000000).toFixed(0),
        dateEncoded: new Date().toISOString(),
      };
      this.mockAssets.push(newAsset);
      return newAsset;
    } catch (error) {
      console.error('Error creating PPE asset:', error);
      throw error;
    }
  }

  static async update(id: string, data: Partial<PPEAsset>): Promise<PPEAsset> {
    try {
      const index = this.mockAssets.findIndex(asset => asset.id === id);
      if (index === -1) throw new Error('PPE asset not found');
      this.mockAssets[index] = { ...this.mockAssets[index], ...data };
      return this.mockAssets[index];
    } catch (error) {
      console.error('Error updating PPE asset:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      this.mockAssets = this.mockAssets.filter(asset => asset.id !== id);
    } catch (error) {
      console.error('Error deleting PPE asset:', error);
      throw error;
    }
  }

  static async search(query: string): Promise<PPEAsset[]> {
    try {
      const lowerQuery = query.toLowerCase();
      return this.mockAssets.filter(asset =>
        asset.property_number.toLowerCase().includes(lowerQuery) ||
        asset.description.toLowerCase().includes(lowerQuery) ||
        (asset.brand && asset.brand.toLowerCase().includes(lowerQuery)) ||
        (asset.model && asset.model.toLowerCase().includes(lowerQuery)) ||
        (asset.serial_number && asset.serial_number.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error('Error searching PPE assets:', error);
      throw error;
    }
  }

  static async exportData(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      // Mock export returns empty blob for now
      return new Blob();
    } catch (error) {
      console.error('Error exporting PPE data:', error);
      throw error;
    }
  }

  static async importData(file: File): Promise<{ imported: number; errors: string[] }> {
    try {
      // Mock import: does nothing
      return { imported: 0, errors: [] };
    } catch (error) {
      console.error('Error importing PPE data:', error);
      throw error;
    }
  }

  static async batchUpload(file: File, actionBySystemUserId: string, sessionKey: string): Promise<{ imported: number; errors: string[] }> {
    try {
      return await ppeApi.batchUpload(file, actionBySystemUserId, sessionKey);
    } catch (error) {
      console.error('Error during PPE batch upload:', error);
      throw error;
    }
  }
}
