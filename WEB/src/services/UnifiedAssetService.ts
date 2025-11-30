import { ppeApi } from '@/api/ppe';
import { seApi } from '@/api/se';
import { Asset, UnifiedMovement, AssetGroup } from '@/types/asset/UnifiedAsset';

export class UnifiedAssetService {
  // Map API response to unified Asset model
  private static mapApiToUnifiedAsset(apiItem: any, group: AssetGroup): Asset {
    if (!apiItem || !apiItem.id) {
      console.error('Invalid apiItem passed to mapApiToUnifiedAsset:', apiItem);
      throw new Error('apiItem or apiItem.id is undefined');
    }

    // Filter to only active and not deleted movements
    const activeMovements = (apiItem.movements || []).filter((mv: any) => mv.isActive && !mv.isDeleted);

    const latestMovement: UnifiedMovement | null = activeMovements.length > 0
      ? activeMovements.slice().sort((a: any, b: any) => {
        const dateA = new Date(a.dateAssigned || a.createdAt).getTime();
        const dateB = new Date(b.dateAssigned || b.createdAt).getTime();
        return dateB - dateA;
      })[0]
      : null;

    // Map movements to unified format
    const unifiedMovements: UnifiedMovement[] = (apiItem.movements || []).map((mv: any) => ({
      id: mv.id.toString(),
      parItrNumber: mv.parItrNumber || '',
      plantillaEmployeeId: mv.plantillaEmployeeIdOriginal || '',
      nonPlantillaEmployeeId: mv.nonPlantillaEmployeeIdOriginal || '',
      officeId: mv.office?.id?.toString() || '',
      divisionId: mv.division?.id?.toString() || '',
      condition: mv.condition || 'Working',
      dateAssigned: mv.dateAssigned || mv.createdAt || '',
    }));

    return {
      id: apiItem.id.toString(),
      group,
      propertyNumber: apiItem.propertyNumber || '',
      category: apiItem.category ? (typeof apiItem.category === 'object' ? apiItem.category.name : apiItem.category) : '',
      legend: apiItem.legend ? (typeof apiItem.legend === 'object' ? apiItem.legend.name : apiItem.legend) : '',
      description: apiItem.description || '',
      brand: apiItem.brand || '',
      model: apiItem.model || '',
      serialNumber: apiItem.serialNumber || '',
      parts: Array.isArray(apiItem.parts) ? apiItem.parts.map((part: any) => ({
        id: part.id || 0,
        name: part.name || '',
        serialNumber: part.serialNumber || ''
      })) : [],
      unitOfMeasurement: apiItem.unitOfMeasurement || '',
      unitValue: apiItem.unitValue || 0,
      dateAcquired: apiItem.dateAcquired || '',
      estimatedUsefulLife: apiItem.estimatedUsefulLife || 0,
      condition: latestMovement?.condition || 'Working',
      actualDivision: latestMovement?.divisionId || '',
      movements: unifiedMovements,
      history: unifiedMovements, // For now, movements and history are the same
    };
  }

  static async getAll(filters?: {
    category?: string;
    condition?: string;
    division?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    group?: string;
    PageNumber?: number;
    PageSize?: number;
  }): Promise<{ items: Asset[]; totalCount: number }> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      const pageNumber = filters?.PageNumber || 1;
      const pageSize = filters?.PageSize || 10;

      let searchString = '';
      if (filters) {
        if (filters.search) {
          searchString = filters.search;
        } else if (filters.category) {
          searchString = filters.category;
        }
      }

      // Determine which APIs to call based on group filter
      const groupFilter = filters?.group?.toLowerCase();

      if (groupFilter === 'ppe') {
        // Only fetch PPE assets
        const ppeResponse = await ppeApi.list({
          SearchString: searchString,
          PageNumber: pageNumber,
          PageSize: pageSize,
          StartDate: filters?.startDate,
          EndDate: filters?.endDate,
          ActionBySystemUserId: actionBySystemUserId,
          SessionKey: sessionKey,
          GroupName: 'ppe',
        });

        const ppeItems = (ppeResponse.items || []).map(item => this.mapApiToUnifiedAsset(item, 'PPE'));
        return { items: ppeItems, totalCount: ppeResponse.totalCount };
      } else if (groupFilter === 'se') {
        // Only fetch SE assets
        const seResponse = await seApi.list({
          SearchString: searchString,
          PageNumber: pageNumber,
          PageSize: pageSize,
          StartDate: filters?.startDate,
          EndDate: filters?.endDate,
          ActionBySystemUserId: actionBySystemUserId,
          SessionKey: sessionKey,
          GroupName: 'se',
        });

        const seItems = (seResponse.items || []).map(item => this.mapApiToUnifiedAsset(item, 'SE'));
        return { items: seItems, totalCount: seResponse.totalCount };
      } else {
        // Fetch both PPE and SE assets (default behavior)
        const [ppeResponse, seResponse] = await Promise.all([
          ppeApi.list({
            SearchString: searchString,
            PageNumber: pageNumber,
            PageSize: pageSize,
            StartDate: filters?.startDate,
            EndDate: filters?.endDate,
            ActionBySystemUserId: actionBySystemUserId,
            SessionKey: sessionKey,
            GroupName: 'ppe',
          }),
          seApi.list({
            SearchString: searchString,
            PageNumber: pageNumber,
            PageSize: pageSize,
            StartDate: filters?.startDate,
            EndDate: filters?.endDate,
            ActionBySystemUserId: actionBySystemUserId,
            SessionKey: sessionKey,
            GroupName: 'se',
          })
        ]);

        // Map PPE assets
        const ppeItems = (ppeResponse.items || []).map(item => this.mapApiToUnifiedAsset(item, 'PPE'));

        // Map SE assets
        const seItems = (seResponse.items || []).map(item => this.mapApiToUnifiedAsset(item, 'SE'));

        // Combine and return
        const allItems = [...ppeItems, ...seItems];
        const totalCount = ppeResponse.totalCount + seResponse.totalCount;

        return { items: allItems, totalCount };
      }
    } catch (error) {
      console.error('Error fetching unified assets:', error);
      throw error;
    }
  }

  static async getById(id: string): Promise<Asset> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      // Use unified endpoint for both PPE and SE assets
      try {
        const unifiedResponse: any = await ppeApi.getByIdUnified(id, actionBySystemUserId, sessionKey);
        let apiItem = unifiedResponse?.data;
        if (Array.isArray(apiItem)) {
          apiItem = apiItem[0];
        }
        if (apiItem && apiItem.id) {
          // Determine group based on unit value (same logic as in AssetsForm)
          const group = apiItem.unitValue >= 50000 ? 'SE' : 'PPE';
          return this.mapApiToUnifiedAsset(apiItem, group);
        }
      } catch (error) {
        // If unified endpoint fails, try fallback to individual APIs
        console.warn('Unified endpoint failed, trying individual APIs:', error);
      }

      // Fallback: First try PPE API
      try {
        const ppeResponse: any = await ppeApi.getById(id, actionBySystemUserId, sessionKey);
        let apiItem = ppeResponse?.data;
        if (Array.isArray(apiItem)) {
          apiItem = apiItem[0];
        }
        if (apiItem && apiItem.id) {
          return this.mapApiToUnifiedAsset(apiItem, 'PPE');
        }
      } catch (error) {
        // PPE not found, try SE
      }

      // Fallback: Try SE API
      const seResponse: any = await seApi.getById(id, actionBySystemUserId, sessionKey);
      let apiItem = seResponse?.data;
      if (Array.isArray(apiItem)) {
        apiItem = apiItem[0];
      }
      if (!apiItem || !apiItem.id) {
        throw new Error('No asset found in response data or invalid data format');
      }

      return this.mapApiToUnifiedAsset(apiItem, 'SE');
    } catch (error) {
      console.error('Error fetching unified asset:', error);
      throw error;
    }
  }

  static async create(data: Omit<Asset, 'id'>): Promise<Asset> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      const apiData = {
        propertyNumber: data.propertyNumber,
        category: data.category,
        legend: data.legend,
        description: data.description,
        brand: data.brand || '',
        model: data.model || '',
        serialNumber: data.serialNumber || '',
        parts: data.parts || [],
        unitOfMeasurement: data.unitOfMeasurement,
        unitValue: data.unitValue,
        dateAcquired: data.dateAcquired,
        estimatedUsefulLife: data.estimatedUsefulLife,
        group: data.group,
        movements: data.movements || [],
        actionBySystemUserId,
        sessionKey,
      };

      // Route to appropriate API based on group
      const api = data.group === 'PPE' ? ppeApi : seApi;
      const apiResponse = await api.create(apiData);

      // Since the API response doesn't include the created asset ID,
      // we need to search for the asset by propertyNumber to get the ID
      const searchResults = await this.getAll({ search: data.propertyNumber });
      const createdAsset = searchResults.items.find(asset => asset.propertyNumber === data.propertyNumber);

      if (!createdAsset || !createdAsset.id) {
        throw new Error('Failed to retrieve created asset ID');
      }

      const ptaId = parseInt(createdAsset.id);

      // Handle parts and movements if they exist
      if (data.parts && data.parts.length > 0) {
        for (const part of data.parts) {
          if (part.name && part.serialNumber) {
            await api.editPart({
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

      if (data.movements && data.movements.length > 0) {
        for (const movement of data.movements) {
          await api.editMovement({
            id: parseInt(movement.id || '0'),
            ptaId,
            dateAssigned: movement.dateAssigned,
            parItrNumber: movement.parItrNumber || '',
            plantillaEmployeeId: parseInt(movement.plantillaEmployeeId || '0', 10),
            nonPlantillaEmployeeId: parseInt(movement.nonPlantillaEmployeeId || '0', 10),
            condition: movement.condition || 'Working',
            actualOfficeId: parseInt(movement.officeId || '0', 10),
            actualDivisionId: parseInt(movement.divisionId || '0', 10),
            isActive: true,
            actionBySystemUserId: parseInt(actionBySystemUserId),
            sessionKey,
          });
        }
      }

      return createdAsset;
    } catch (error) {
      console.error('Error creating unified asset:', error);
      throw error;
    }
  }

  static async update(id: string, data: Partial<Asset>): Promise<Asset> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      // Get current asset to determine group
      const currentAsset = await this.getById(id);
      const group = data.group || currentAsset.group;
      const api = group === 'PPE' ? ppeApi : seApi;

      const apiData = {
        id,
        propertyNumber: data.propertyNumber || '',
        category: data.category || '',
        legend: data.legend || '',
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

      const apiResponse = await api.update(apiData);
      return this.mapApiToUnifiedAsset(apiResponse, group);
    } catch (error) {
      console.error('Error updating unified asset:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    // Note: The APIs don't seem to have delete endpoints, so this is a placeholder
    throw new Error('Delete operation not implemented in API');
  }

  static async batchUpload(file: File, userId: string, sessionKey: string): Promise<{ imported: number; errors: string[] }> {
    // Use PPE API for batch upload (both PPE and SE use the same endpoint)
    return await ppeApi.batchUpload(file, userId, sessionKey);
  }
}
