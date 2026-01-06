import { ppeApi } from '@/api/ppe';
import { seApi } from '@/api/se';
import { Asset, UnifiedMovement, AssetGroup } from '@/types/asset/UnifiedAsset';
import { normalizeMovement } from '@/utils/normalizer';

export class UnifiedAssetService {
  // Helper function to normalize movement payload for backend
  private static normalizeMovement(entry: UnifiedMovement, assetModel: string, mode: 'create' | 'edit', assetId?: number): any {
    // Null-safety: return null if entry is undefined/null
    if (!entry) return null;

    return {
      id: mode === 'create' ? 0 : (entry.id ?? 0),
      ptaId: mode === 'create' ? 0 : (assetId || entry.ptaId || 0),
      dateAssigned: entry.dateAssigned ?? new Date().toISOString(),
      parItrNumber: entry.parItrNumber ?? '',
      plantillaEmployeeId: entry.plantillaEmployeeId ?? 0,
      nonPlantillaEmployeeId: entry.nonPlantillaEmployeeId ?? 0,
      actualOfficeId: entry.actualOfficeId ?? null,
      actualDivisionId: entry.actualDivisionId ?? null,
      isActive: true,
      condition: entry.condition ?? 'Working',
      actionBySystemUserId: parseInt(localStorage.getItem('systemUserId') || '0'),
      sessionKey: localStorage.getItem('sessionToken') || '',
      model: assetModel || '',
    };
  }

  // Helper function to normalize part payload for backend
  private static normalizePart(part: any, mode: 'create' | 'edit', assetId?: number): any {
    return {
      id: mode === 'create' ? 0 : (part.id || 0),
      ptaId: mode === 'create' ? 0 : (assetId || part.ptaId || 0),
      name: part.name || '',
      serialNumber: part.serialNumber || '',
      isActive: part.isActive !== undefined ? part.isActive : true,
      actionBySystemUserId: parseInt(localStorage.getItem('systemUserId') || '0'),
      sessionKey: localStorage.getItem('sessionToken') || '',
    };
  }
  // Map API response to unified Asset model
  private static mapApiToUnifiedAsset(apiItem: any, group: AssetGroup): Asset {
    if (!apiItem || !apiItem.id) {
      console.error('Invalid apiItem passed to mapApiToUnifiedAsset:', apiItem);
      throw new Error('apiItem or apiItem.id is undefined');
    }

    // Map movements to unified format - handle new API structure with actualOfficeId/actualDivisionId
    const unifiedMovements: UnifiedMovement[] = (apiItem.movements || []).map((mv: any) => ({
      id: mv.id,
      ptaId: mv.ptaId || 0,
      dateAssigned: mv.dateAssigned || mv.createdAt || '',
      parItrNumber: mv.parItrNumber || '',
      plantillaEmployeeId: mv.plantillaEmployeeId || null,
      nonPlantillaEmployeeId: mv.nonPlantillaEmployeeId || null,
      actualOfficeId: mv.actualOfficeId || mv.office?.id || 0,
      actualDivisionId: mv.actualDivisionId || mv.division?.id || 0,
      condition: mv.condition || 'Working',
      isActive: mv.isActive !== undefined ? mv.isActive : true,
      isDeleted: mv.isDeleted !== undefined ? mv.isDeleted : false,
      createdAt: mv.createdAt || new Date().toISOString(),
    }));

    // Extract categoryId and category name
    let categoryId = 0;
    let category: string | undefined;
    if (apiItem.category) {
      if (typeof apiItem.category === 'object') {
        categoryId = apiItem.category.id || 0;
        category = apiItem.category.name;
      } else if (typeof apiItem.category === 'string') {
        category = apiItem.category;
        // Try to find the category ID if we have a categories list, otherwise keep as 0
        categoryId = 0;
      } else if (typeof apiItem.category === 'number') {
        categoryId = apiItem.category;
      }
    }

    // Extract legendId and legend name
    let legendId = 0;
    let legend: string | undefined;
    if (apiItem.legend) {
      if (typeof apiItem.legend === 'object') {
        legendId = apiItem.legend.id || 0;
        legend = apiItem.legend.name;
      } else if (typeof apiItem.legend === 'number') {
        legendId = apiItem.legend;
      }
    }

    return {
      id: apiItem.id,
      group,
      propertyNumber: apiItem.propertyNumber || '',
      categoryId,
      legendId,
      category,
      legend,
      condition: unifiedMovements[0]?.condition || 'Working',
      description: apiItem.description || '',
      brand: apiItem.brand || '',
      model: apiItem.model || '',
      serialNumber: apiItem.serialNumber || '',
      parts: Array.isArray(apiItem.parts) ? apiItem.parts.map((part: any) => ({
        id: part.id || null,
        ptaId: part.ptaId || 0,
        name: part.name || '',
        serialNumber: part.serialNumber || '',
        isActive: part.isActive !== undefined ? part.isActive : true
      })) : [],
      unitOfMeasurement: apiItem.unitOfMeasurement || '',
      unitValue: apiItem.unitValue || 0,
      dateAcquired: apiItem.dateAcquired || '',
      movements: unifiedMovements,
      estimatedUsefulLife: apiItem.estimatedUsefulLife || 5,
      fiscalYear: apiItem.fiscalYear || 0,
    };
  }

  static async getAll(filters?: {
    category?: string;
    condition?: string;
    division?: string;
    office?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    group?: string;
    PageNumber?: number;
    PageSize?: number;
    EmployeeId?: number;
  }): Promise<{ items: Asset[]; totalCount: number }> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      const pageNumber = filters?.PageNumber || 1;
      const pageSize = filters?.PageSize || 10;

      // Check if specific filters (category, condition, office, division) are applied
      const hasSpecificFilters = filters?.category && filters.category !== 'all' ||
                                filters?.condition && filters.condition !== 'all' ||
                                filters?.office && filters.office !== 'all' ||
                                filters?.division && filters.division !== 'all';

      let searchString = '';
      if (filters) {
        if (filters.search) {
          searchString = filters.search;
        } else if (filters.category && !hasSpecificFilters) {
          // Only use category as search if not using specific filtering
          searchString = filters.category;
        }
      }

      // Determine which APIs to call based on group filter
      const groupFilter = filters?.group?.toLowerCase();

      let allItems: Asset[] = [];
      let totalCount = 0;

      if (hasSpecificFilters) {
        // When specific filters are applied, fetch all data and filter on frontend
        const largePageSize = 10000; // Large page size to get all data

        if (groupFilter === 'ppe') {
          const ppeResponse = await ppeApi.list({
            SearchString: searchString,
            PageNumber: 1,
            PageSize: largePageSize,
            StartDate: filters?.startDate,
            EndDate: filters?.endDate,
            ActionBySystemUserId: actionBySystemUserId,
            SessionKey: sessionKey,
            GroupName: 'ppe',
            EmployeeId: filters?.EmployeeId,
          });
          allItems = (ppeResponse.items || []).map(item => this.mapApiToUnifiedAsset(item, 'PPE'));
          totalCount = ppeResponse.totalCount;
        } else if (groupFilter === 'se') {
          const seResponse = await seApi.list({
            SearchString: searchString,
            PageNumber: 1,
            PageSize: largePageSize,
            StartDate: filters?.startDate,
            EndDate: filters?.endDate,
            ActionBySystemUserId: actionBySystemUserId,
            SessionKey: sessionKey,
            GroupName: 'se',
            EmployeeId: filters?.EmployeeId,
          });
          allItems = (seResponse.items || []).map(item => this.mapApiToUnifiedAsset(item, 'SE'));
          totalCount = seResponse.totalCount;
        } else {
          // Fetch both PPE and SE assets
          const [ppeResponse, seResponse] = await Promise.all([
            ppeApi.list({
              SearchString: searchString,
              PageNumber: 1,
              PageSize: largePageSize,
              StartDate: filters?.startDate,
              EndDate: filters?.endDate,
              ActionBySystemUserId: actionBySystemUserId,
              SessionKey: sessionKey,
              GroupName: 'ppe',
              EmployeeId: filters?.EmployeeId,
            }),
            seApi.list({
              SearchString: searchString,
              PageNumber: 1,
              PageSize: largePageSize,
              StartDate: filters?.startDate,
              EndDate: filters?.endDate,
              ActionBySystemUserId: actionBySystemUserId,
              SessionKey: sessionKey,
              GroupName: 'se',
              EmployeeId: filters?.EmployeeId,
            })
          ]);

          const ppeItems = (ppeResponse.items || []).map(item => this.mapApiToUnifiedAsset(item, 'PPE'));
          const seItems = (seResponse.items || []).map(item => this.mapApiToUnifiedAsset(item, 'SE'));
          allItems = [...ppeItems, ...seItems];
          totalCount = ppeResponse.totalCount + seResponse.totalCount;
        }

        // Apply frontend filtering
        let filteredItems = allItems;

        // Filter by category
        if (filters.category && filters.category !== 'all') {
          filteredItems = filteredItems.filter(asset =>
            asset.category?.toLowerCase() === filters.category?.toLowerCase()
          );
        }

        // Filter by condition
        if (filters.condition && filters.condition !== 'all') {
          filteredItems = filteredItems.filter(asset =>
            asset.movements?.some(movement =>
              movement.condition?.toLowerCase() === filters.condition?.toLowerCase()
            )
          );
        }

        // Filter by office
        if (filters.office && filters.office !== 'all') {
          const officeId = parseInt(filters.office);
          filteredItems = filteredItems.filter(asset =>
            asset.movements?.some(movement =>
              movement.actualOfficeId === officeId
            )
          );
        }

        // Filter by division
        if (filters.division && filters.division !== 'all') {
          const divisionId = parseInt(filters.division);
          filteredItems = filteredItems.filter(asset =>
            asset.movements?.some(movement =>
              movement.actualDivisionId === divisionId
            )
          );
        }

        // Apply pagination to filtered results
        const startIndex = (pageNumber - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedItems = filteredItems.slice(startIndex, endIndex);

        return { items: paginatedItems, totalCount: filteredItems.length };
      } else {
        // Normal API call without specific filters
        if (groupFilter === 'ppe') {
          const ppeResponse = await ppeApi.list({
            SearchString: searchString,
            PageNumber: pageNumber,
            PageSize: pageSize,
            StartDate: filters?.startDate,
            EndDate: filters?.endDate,
            ActionBySystemUserId: actionBySystemUserId,
            SessionKey: sessionKey,
            GroupName: 'ppe',
            EmployeeId: filters?.EmployeeId,
          });

          const ppeItems = (ppeResponse.items || []).map(item => this.mapApiToUnifiedAsset(item, 'PPE'));
          return { items: ppeItems, totalCount: ppeResponse.totalCount };
        } else if (groupFilter === 'se') {
          const seResponse = await seApi.list({
            SearchString: searchString,
            PageNumber: pageNumber,
            PageSize: pageSize,
            StartDate: filters?.startDate,
            EndDate: filters?.endDate,
            ActionBySystemUserId: actionBySystemUserId,
            SessionKey: sessionKey,
            GroupName: 'se',
            EmployeeId: filters?.EmployeeId,
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
              EmployeeId: filters?.EmployeeId,
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
              EmployeeId: filters?.EmployeeId,
            })
          ]);

          const ppeItems = (ppeResponse.items || []).map(item => this.mapApiToUnifiedAsset(item, 'PPE'));
          const seItems = (seResponse.items || []).map(item => this.mapApiToUnifiedAsset(item, 'SE'));
          allItems = [...ppeItems, ...seItems];
          totalCount = ppeResponse.totalCount + seResponse.totalCount;

          return { items: allItems, totalCount };
        }
      }
    } catch (error) {
      console.error('Error fetching unified assets:', error);
      throw error;
    }
  }

  static async getById(id: number): Promise<Asset> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      // Use unified endpoint for both PPE and SE assets
      try {
        const unifiedResponse: any = await ppeApi.getByIdUnified(id.toString(), actionBySystemUserId, sessionKey);
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
        const ppeResponse: any = await ppeApi.getById(id.toString(), actionBySystemUserId, sessionKey);
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
      const seResponse: any = await seApi.getById(id.toString(), actionBySystemUserId, sessionKey);
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

  static async create(data: Omit<Asset, 'id'> & { id?: number }): Promise<Asset> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      // Normalize parts for create mode
      const normalizedParts = (data.parts || []).map(part =>
        this.normalizePart(part, 'create')
      );

      // Normalize movements for create mode - filter out null/undefined
      const validMovements = (data.movements || []).filter(movement => movement != null);
      const normalizedMovements = validMovements.map(movement =>
        this.normalizeMovement(movement, data.model || '', 'create')
      ).filter(movement => movement != null); // Filter out null results from normalizeMovement

      const apiData = {
        ...(data.id && { id: data.id }),
        propertyNumber: data.propertyNumber,
        category: data.categoryId || 0,
        legend: data.legendId || 0,
        description: data.description,
        brand: data.brand || '',
        model: data.model || '',
        serialNumber: data.serialNumber || '',
        parts: normalizedParts,
        unitOfMeasurement: data.unitOfMeasurement,
        unitValue: data.unitValue,
        dateAcquired: data.dateAcquired,
        estimatedUsefulLife: data.estimatedUsefulLife ?? 0,
        fiscalYear: data.fiscalYear ?? 0,
        group: data.group,
        movements: normalizedMovements,
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

      // After successful creation, handle parts and movements separately
      if (normalizedParts.length > 0) {
        for (const part of normalizedParts) {
          if (part.name && part.serialNumber) {
            await api.editPart({
              id: part.id || 0,
              ptaId: ptaId,
              name: part.name,
              serialNumber: part.serialNumber,
              isActive: part.isActive ?? true,
              actionBySystemUserId: parseInt(actionBySystemUserId),
              sessionKey,
            });
          }
        }
      }

      if (normalizedMovements.length > 0) {
        for (const movement of normalizedMovements) {
          const normalizedMovement = this.normalizeMovement(movement, data.model || '', 'edit', ptaId);
          if (normalizedMovement) {
            await api.editMovement(normalizedMovement);
          }
        }
      }

      // Construct the created asset from input data and ptaId
      const createdAsset: Asset = {
        id: ptaId,
        group: data.group,
        propertyNumber: data.propertyNumber,
        categoryId: data.categoryId || 0,
        legendId: data.legendId || 0,
        category: data.category,
        legend: data.legend,
        condition: data.condition || data.movements?.[0]?.condition || 'Working',
        description: data.description,
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber,
        parts: data.parts,
        unitOfMeasurement: data.unitOfMeasurement,
        unitValue: data.unitValue,
        dateAcquired: data.dateAcquired,
        movements: data.movements,
        estimatedUsefulLife: data.estimatedUsefulLife,
        fiscalYear: data.fiscalYear || 0,
      };

      return createdAsset;
    } catch (error) {
      console.error('Error creating unified asset:', error);
      throw error;
    }
  }

  static async update(id: number, data: Partial<Asset>): Promise<{ success: boolean; ptaId: number | null }> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      // Get current asset to determine group
      const currentAsset = await this.getById(id);
      const group = data.group || currentAsset.group;
      const api = group === 'PPE' ? ppeApi : seApi;

      // Normalize parts for edit mode
      const normalizedParts = (data.parts || currentAsset.parts || []).map(part =>
        this.normalizePart(part, 'edit', id)
      );

      // Normalize movements for edit mode
      const normalizedMovements = (data.movements || currentAsset.movements || []).map(movement =>
        this.normalizeMovement(movement, data.model || currentAsset.model, 'edit', id)
      );

      const apiData = {
        id: id,
        propertyNumber: data.propertyNumber || currentAsset.propertyNumber,
        category: data.categoryId || currentAsset.categoryId || 0,
        legend: data.legendId || currentAsset.legendId || 0,
        description: data.description || currentAsset.description,
        brand: data.brand || currentAsset.brand,
        model: data.model || currentAsset.model,
        serialNumber: data.serialNumber || currentAsset.serialNumber,
        parts: [], // Parts handled separately via editPart API
        unitOfMeasurement: data.unitOfMeasurement || currentAsset.unitOfMeasurement,
        unitValue: data.unitValue || currentAsset.unitValue,
        dateAcquired: data.dateAcquired || currentAsset.dateAcquired,
        estimatedUsefulLife: data.estimatedUsefulLife ?? currentAsset.estimatedUsefulLife ?? 0,
        fiscalYear: data.fiscalYear ?? currentAsset.fiscalYear ?? 0,
        movements: [], // Movements handled separately via editMovement API
        group: group,
        actionBySystemUserId,
        sessionKey,
      };

      // Use the same create endpoint for updates (as per task requirements)
      const apiResponse = await api.create(apiData);

      // Validate response and return minimal object - DO NOT use mapApiToUnifiedAsset()
      if (!apiResponse.success) throw new Error("Update failed");

      // Handle parts and movements separately for edit operations
      if (data.parts && data.parts.length > 0) {
        for (const part of data.parts) {
          if (part.name && part.serialNumber) {
            await api.editPart({
              id: part.id || 0,
              ptaId: id,
              name: part.name,
              serialNumber: part.serialNumber,
              isActive: part.isActive ?? true,
              actionBySystemUserId: parseInt(actionBySystemUserId),
              sessionKey,
            });
          }
        }
      }

      if (data.movements && data.movements.length > 0) {
        for (const movement of data.movements) {
          const normalizedMovement = this.normalizeMovement(movement, data.model || currentAsset.model, 'edit', id);
          await api.editMovement(normalizedMovement);
        }
      }

      return { success: true, ptaId: apiResponse.data?.ptaId ?? null };
    } catch (error) {
      console.error('Error updating unified asset:', error);
      throw error;
    }
  }

  static async delete(id: number): Promise<void> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      // Get current asset to determine group
      const currentAsset = await this.getById(id);
      const api = currentAsset.group === 'PPE' ? ppeApi : seApi;

      const response = await api.delete(id, actionBySystemUserId, sessionKey);

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete asset');
      }
    } catch (error) {
      console.error('Error deleting unified asset:', error);
      throw error;
    }
  }

  static async batchUpload(file: File, userId: string, sessionKey: string): Promise<{ success: boolean; code: string; message: string; data: string }> {
    // Use PPE API for batch upload (both PPE and SE use the same endpoint)
    return await ppeApi.batchUpload(file, userId, sessionKey);
  }



}
