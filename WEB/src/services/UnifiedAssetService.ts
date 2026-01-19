import { ppeApi } from '@/api/asset/ppe';
import { seApi } from '@/api/asset/se';
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
      ptrItrNumber: entry.ptrItrNumber ?? '',
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
      ptrItrNumber: mv.ptrItrNumber || '',
      plantillaEmployeeId: mv.plantillaEmployeeId || null,
      nonPlantillaEmployeeId: mv.nonPlantillaEmployeeId || null,
      plantillaEmployeeIdOriginal: mv.plantillaEmployeeIdOriginal || undefined,
      nonPlantillaEmployeeIdOriginal: mv.nonPlantillaEmployeeIdOriginal || undefined,
      employee: mv.employee,
      actualOfficeId: mv.actualOfficeId || mv.employee?.[0]?.office?.id || 0,
      actualDivisionId: mv.actualDivisionId || mv.employee?.[0]?.division?.id || 0,
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
      fiscalDate: apiItem.fiscalDate || new Date().toISOString().split('T')[0],
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
        fiscalDate: data.fiscalDate ?? new Date().toISOString().split('T')[0],
        group: data.group,
        movements: normalizedMovements,
        actionBySystemUserId,
        sessionKey,
      };

      // Route to appropriate API based on group
      let apiResponse;
      let ptaId;
      if (data.group === 'PPE') {
        apiResponse = await ppeApi.list({
          SearchString: data.propertyNumber,
          PageNumber: 1,
          PageSize: 1,
          ActionBySystemUserId: actionBySystemUserId,
          SessionKey: sessionKey,
          GroupName: 'ppe',
        });
        // PPE API does not support create, so just return the first item
        if (!apiResponse.items?.length) throw new Error('Failed to create PPE asset: Not supported');
        ptaId = apiResponse.items[0].id;
      } else {
        // Remove id if present and convert to string if needed
        const { id, category, legend, ...restApiData } = apiData;
        const apiDataForSE = {
          ...restApiData,
          id: id !== undefined ? String(id) : undefined,
          category: category !== undefined ? String(category) : undefined,
          legend: legend !== undefined ? String(legend) : undefined
        };
        apiResponse = await seApi.create(apiDataForSE, actionBySystemUserId, sessionKey);
        if (!apiResponse.success || !apiResponse.data?.id) {
          throw new Error('Failed to create SE asset: ' + (apiResponse.message || 'Unknown error'));
        }
        ptaId = Number(apiResponse.data.id);
      }

      // Construct the created asset from input data and ptaId
      const createdAsset: Asset = {
        id: Number(ptaId),
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
        fiscalDate: data.fiscalDate || new Date().toISOString().split('T')[0],
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
        fiscalDate: data.fiscalDate ?? currentAsset.fiscalDate ?? new Date().toISOString().split('T')[0],
        movements: [], // Movements handled separately via editMovement API
        group: group,
        actionBySystemUserId,
        sessionKey,
      };

      // Use SE API for update
      let apiResponse;
      if (group === 'SE') {
        // Remove id from apiData and convert to string if present
        const { id: apiDataId, category, legend, ...restApiData } = apiData;
        const apiDataForSE = {
          ...restApiData,
          id: apiDataId !== undefined ? String(apiDataId) : undefined,
          category: category !== undefined ? String(category) : undefined,
          legend: legend !== undefined ? String(legend) : undefined
        };
        apiResponse = await seApi.update(id.toString(), apiDataForSE, actionBySystemUserId, sessionKey);
        if (!apiResponse.success) throw new Error('Update failed');
        // Handle movements update for SE
        if (data.movements && data.movements.length > 0) {
          for (const movement of data.movements) {
            await seApi.editMovement({ ...movement, actionBySystemUserId, sessionKey });
          }
        }
        return { success: true, ptaId: apiResponse.data?.id ? Number(apiResponse.data.id) : null };
      } else {
        // PPE API does not support update
        throw new Error('Update not supported for PPE assets');
      }
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
      if (currentAsset.group === 'SE') {
        // Use SE API for delete (if implemented)
        // TODO: Implement seApi.delete if available
        throw new Error('Delete not implemented for SE assets');
      } else {
        // PPE API does not support delete
        throw new Error('Delete not supported for PPE assets');
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
