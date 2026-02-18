import { ppeApi } from '@/api/asset/ppe';
import { PPEAsset, Movement } from '@/types/asset/PPEAsset';
import { normalizeMovement } from '@/utils/normalizer';

export class PPEService {
  // Mocked data for testing and to prevent errors
  private static mockAssets: PPEAsset[] = [];

  private static mapApiPpeToPpeAsset(apiItem: any): PPEAsset {
    if (!apiItem || !apiItem.id) {
      console.error('Invalid apiItem passed to mapApiPpeToPpeAsset:', apiItem);
      throw new Error('apiItem or apiItem.id is undefined');
    }

    // Filter to only active and not deleted movements
    const activeMovements = (apiItem.movements || []).filter((mv: any) => mv.isActive && !mv.isDeleted);

    const latestMovement: Movement | null = activeMovements.length > 0
      ? activeMovements.slice().sort((a: any, b: any) => {
        const dateA = new Date(a.dateAssigned || a.createdAt).getTime();
        const dateB = new Date(b.dateAssigned || b.createdAt).getTime();
        return dateB - dateA;
      })[0]
      : null;

    return {
      id: apiItem.id.toString(),
      group: apiItem.group || 'PPE',
      propertyNumber: apiItem.propertyNumber || '',
      category: apiItem.category ? {
        id: apiItem.category.id,
        name: apiItem.category.name,
        generalCode: apiItem.category.generalCode || '',
        isActive: apiItem.category.isActive !== undefined ? apiItem.category.isActive : true,
        isDeleted: apiItem.category.isDeleted !== undefined ? apiItem.category.isDeleted : false,
        createdAt: apiItem.category.createdAt || new Date().toISOString(),
      } : null,
      legend: apiItem.legend ? (typeof apiItem.legend === 'string' ? apiItem.legend : apiItem.legend.name || '') : null,
      description: apiItem.description || '',
      brand: apiItem.brand || '',
      model: apiItem.model || '',
      serialNumber: apiItem.serialNumber || '',
      parts: Array.isArray(apiItem.parts) ? apiItem.parts : [],
      unitOfMeasurement: apiItem.unitOfMeasurement || '',
      unitValue: apiItem.unitValue || 0,
      dateAcquired: apiItem.dateAcquired || '',
      estimatedUsefulLife: apiItem.estimatedUsefulLife || 0,
      fiscalDate: apiItem.fiscalDate || new Date().toISOString().split('T')[0],
      movements: Array.isArray(apiItem.movements) ? apiItem.movements : [],
      history: Array.isArray(apiItem.movements) ? apiItem.movements.map((mv: any) => ({
        id: mv.id.toString(),
        date: mv.dateAssigned || mv.createdAt || '',
        par_itr_number: mv.ptrItrNumber || '',
        plantilla_employee_id: mv.plantillaEmployeeIdOriginal || '',
        non_plantilla_employee_id: mv.nonPlantillaEmployeeIdOriginal || '',
        actual_division: mv.employee?.[0]?.division?.name || '',
        condition: mv.condition || 'Working',
        remarks: '',
      })) : [],
      dateEncoded: apiItem.createdAt || '',
      isActive: apiItem.isActive !== undefined ? apiItem.isActive : true,
      isDeleted: apiItem.isDeleted !== undefined ? apiItem.isDeleted : false,
      createdAt: apiItem.createdAt || new Date().toISOString(),
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
        GroupName: 'ppe',
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
      const response: any = await ppeApi.getById(id, actionBySystemUserId, sessionKey);
      
      let apiItem = response?.data;
      if (Array.isArray(apiItem)) {
        apiItem = apiItem[0];
      }
      if (!apiItem || !apiItem.id) {
        throw new Error('No PPE asset found in response data or invalid data format');
      }
      
      // map to PPEAsset interface to ensure correct typing
      return this.mapApiPpeToPpeAsset(apiItem);
    } catch (error) {
      console.error('Error fetching PPE asset:', error);
      throw error;
    }
  }

  static async create(data: Omit<PPEAsset, 'id' | 'dateEncoded'>): Promise<PPEAsset> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      const apiData = {
        propertyNumber: data.propertyNumber,
        category: typeof data.category === 'object' && data.category ? data.category.name : data.category || '',
        legend: typeof data.legend === 'string' ? data.legend : '',
        description: data.description,
        brand: data.brand || '',
        model: data.model || '',
        serialNumber: data.serialNumber || '',
        parts: data.parts || [],
        unitOfMeasurement: data.unitOfMeasurement,
        unitValue: data.unitValue,
        dateAcquired: data.dateAcquired,
        estimatedUsefulLife: data.estimatedUsefulLife,
        group: (data as any).group || 'PPE',
        movements: data.movements || [],
        actionBySystemUserId,
        sessionKey,
      };

      let createdAsset: PPEAsset | undefined;
      let ptaId: number | undefined;

      try {
        // Try normal POST create to /edit endpoint
        const apiResponse = await ppeApi.create(apiData);
        console.log('[PPE Create] API Response:', JSON.stringify(apiResponse));
        
        // Backend returns { success: bool, data: { ptaId: number }, message: string }
        const responseData = apiResponse as any;
        
        // Try to extract ptaId from different possible locations
        let ptaIdFromResponse = responseData?.data?.ptaId ||
                                responseData?.data?.PTAId || 
                                responseData?.PTAId || 
                                responseData?.id ||
                                responseData?.data?.id;
        
        console.log('[PPE Create] Extracted ptaId:', ptaIdFromResponse);
        
        if (!ptaIdFromResponse) {
          throw new Error(`Failed to extract ptaId from response: ${JSON.stringify(responseData)}`);
        }
        ptaId = typeof ptaIdFromResponse === 'string' ? parseInt(ptaIdFromResponse) : ptaIdFromResponse;
        
        if (!ptaId) {
          throw new Error('ptaId missing from create response');
        }

        // Build created asset locally to avoid fetch dependency on response shape
        createdAsset = {
          id: ptaId as any,
          group: (data as any).group || 'PPE',
          propertyNumber: data.propertyNumber,
          category: typeof data.category === 'object' && data.category ? data.category : null,
          legend: typeof data.legend === 'string' ? data.legend : '',
          description: data.description,
          brand: data.brand || '',
          model: data.model || '',
          serialNumber: data.serialNumber || '',
          parts: data.parts || [],
          unitOfMeasurement: data.unitOfMeasurement,
          unitValue: data.unitValue,
          dateAcquired: data.dateAcquired,
          estimatedUsefulLife: data.estimatedUsefulLife || 0,
          fiscalDate: (data as any).fiscalDate || new Date().toISOString().split('T')[0],
          movements: data.movements || [],
          history: [],
          dateEncoded: new Date().toISOString(),
          isActive: true,
          isDeleted: false,
          createdAt: new Date().toISOString(),
        } as unknown as PPEAsset;
      } catch (createError: any) {
        // If the server rejects POST (e.g. 405) fall back to previous workaround
        const errorMessage = createError?.message || '';
        if (errorMessage.includes('405')) {
          console.warn('PPE create endpoint returned 405, falling back to list-search workaround');
          const searchResults = await this.getAll({ search: data.propertyNumber });
          createdAsset = searchResults.items.find(asset => asset.propertyNumber === data.propertyNumber);
          if (!createdAsset || !createdAsset.id) {
            throw new Error('Failed to locate PPE asset after fallback search');
          }
          ptaId = typeof createdAsset.id === 'string' ? parseInt(createdAsset.id) : createdAsset.id;
        } else {
          // rethrow other errors
          console.error('Error calling PPE create endpoint:', createError);
          throw createError;
        }
      }

      // After successful creation or fallback, we have ptaId and createdAsset
      if (ptaId === undefined || !createdAsset) {
        throw new Error('Unable to determine new PPE asset ID');
      }

      // After successful creation, handle parts and movements
      if (data.parts && data.parts.length > 0) {
        for (const part of data.parts as any[]) {
          if (part.name && part.serialNumber) {
            await ppeApi.editPart({
              id: part.id || 0,
              ptaId,
              name: part.name,
              serialNumber: part.serialNumber,
              isActive: true,
              actionBySystemUserId: parseInt(actionBySystemUserId),
              sessionKey,
            });
          }
        }
      }

      return createdAsset;
    } catch (error) {
      console.error('Error creating PPE asset:', error);
      throw error;
    }
  }

  static async update(id: string, data: Partial<PPEAsset>): Promise<PPEAsset> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      const apiData = {
        id,
        propertyNumber: data.propertyNumber || '',
        category: typeof data.category === 'object' && data.category ? data.category.name : data.category || '',
        legend: typeof data.legend === 'string' ? data.legend : '',
        description: data.description || '',
        brand: data.brand || '',
        model: data.model || '',
        serialNumber: data.serialNumber || '',
        parts: data.parts || [],
        unitOfMeasurement: data.unitOfMeasurement || '',
        unitValue: data.unitValue || 0,
        dateAcquired: data.dateAcquired || '',
        estimatedUsefulLife: data.estimatedUsefulLife || 0,
        movements: data.movements || [],
        actionBySystemUserId,
        sessionKey,
      };

      const apiResponse = await ppeApi.update(apiData);
      return this.mapApiPpeToPpeAsset(apiResponse);
    } catch (error) {
      console.error('Error updating PPE asset:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const idNumber = typeof id === 'string' ? parseInt(id) : id;
      this.mockAssets = this.mockAssets.filter(asset => asset.id !== idNumber);
    } catch (error) {
      console.error('Error deleting PPE asset:', error);
      throw error;
    }
  }

  static async search(query: string): Promise<PPEAsset[]> {
    try {
      const lowerQuery = query.toLowerCase();
      return this.mockAssets.filter(asset =>
        asset.propertyNumber.toLowerCase().includes(lowerQuery) ||
        asset.description.toLowerCase().includes(lowerQuery) ||
        (asset.brand && asset.brand.toLowerCase().includes(lowerQuery)) ||
        (asset.model && asset.model.toLowerCase().includes(lowerQuery)) ||
        (asset.serialNumber && asset.serialNumber.toLowerCase().includes(lowerQuery))
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

  static async batchUpload(file: File, actionBySystemUserId: string, sessionKey: string): Promise<{ success: boolean; code: string; message: string; data: string }> {
    try {
      return await ppeApi.batchUpload(file, actionBySystemUserId, sessionKey);
    } catch (error) {
      console.error('Error during PPE batch upload:', error);
      throw error;
    }
  }
}
