import { ppeApi } from '@/api/ppe';
import { seApi } from '@/api/se';
import { Asset, UnifiedMovement, AssetGroup } from '@/types/asset/UnifiedAsset';
import { normalizeMovement } from '@/utils/normalizer';

export class UnifiedAssetService {
  // Helper function to normalize movement payload for backend
  private static normalizeMovement(entry: UnifiedMovement, assetModel: string): any {
    // Convert employee IDs from string format (e.g., "P-20-0020") to numbers
    const parseEmployeeId = (id: string): number => {
      if (!id || id === '') return 0;
      if (typeof id === 'number') return id;
      // Extract last segment if contains hyphen
      const parts = id.split('-');
      const lastPart = parts[parts.length - 1];
      return parseInt(lastPart, 10) || 0;
    };

    return {
      id: parseInt(entry.id || '0', 10),
      dateAssigned: entry.dateAssigned,
      parItrNumber: entry.parItrNumber || '',
      plantillaEmployeeId: parseEmployeeId(entry.plantillaEmployeeId),
      nonPlantillaEmployeeId: parseEmployeeId(entry.nonPlantillaEmployeeId),
      actualOfficeId: parseInt(entry.officeId || '0', 10),
      actualDivisionId: parseInt(entry.divisionId || '0', 10),
      isActive: true,
      condition: entry.condition || 'Working',
      actionBySystemUserId: parseInt(localStorage.getItem('systemUserId') || '0'),
      sessionKey: localStorage.getItem('sessionToken') || '',
      model: assetModel || '',
    };
  }
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
      officeId: mv.actualOfficeId?.toString() || '',
      divisionId: mv.actualDivisionId?.toString() || '',
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

      // Extract ptaId from the API response
      if (!apiResponse.success || !apiResponse.data?.ptaId) {
        throw new Error('Failed to create asset: ' + (apiResponse.message || 'Unknown error'));
      }

      const ptaId = apiResponse.data.ptaId;

      // Construct the created asset from input data and ptaId
      const createdAsset: Asset = {
        id: ptaId.toString(),
        group: data.group,
        propertyNumber: data.propertyNumber,
        category: data.category,
        legend: data.legend,
        description: data.description,
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber,
        parts: data.parts,
        unitOfMeasurement: data.unitOfMeasurement,
        unitValue: data.unitValue,
        dateAcquired: data.dateAcquired,
        estimatedUsefulLife: data.estimatedUsefulLife,
        condition: 'Working', // Default condition for new assets
        actualDivision: data.movements?.[0]?.divisionId || '',
        movements: data.movements,
        history: data.movements,
      };

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
          const normalizedMovement = this.normalizeMovement(movement, data.model || '');
          normalizedMovement.ptaId = ptaId;
          await api.editMovement(normalizedMovement);
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

      // Handle movements update if provided
      if (data.movements && data.movements.length > 0) {
        for (const movement of data.movements) {
          const normalizedMovement = normalizeMovement(movement, data.model || currentAsset.model, parseInt(id));
          console.debug('movement payload', normalizedMovement);
          await api.editMovement(normalizedMovement);
        }
      }

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

  static async batchUpload(file: File, userId: string, sessionKey: string): Promise<{ success: boolean; code: string; message: string; data: string }> {
    // Use PPE API for batch upload (both PPE and SE use the same endpoint)
    return await ppeApi.batchUpload(file, userId, sessionKey);
  }



  
}
