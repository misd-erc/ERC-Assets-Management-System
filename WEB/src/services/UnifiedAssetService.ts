import { ppeApi } from '@/api/asset/ppe';
import { seApi } from '@/api/asset/se';
import { Asset, UnifiedMovement, AssetGroup } from '@/types/asset/UnifiedAsset';
import { SEAsset } from '@/types/supply/se';
import { normalizeMovement } from '@/utils/normalizer';


export class UnifiedAssetService {
  // Helper function to normalize movement payload for backend
  private static normalizeMovement(entry: UnifiedMovement, assetModel: string, mode: 'create' | 'edit', assetId?: number): any {
    // Null-safety: return null if entry is undefined/null
    if (!entry) return null;

    const actionBySystemUserId = parseInt(localStorage.getItem('systemUserId') || '0');
    const sessionKey = localStorage.getItem('sessionToken') || '';
    const isCurrent = entry.isCurrent !== undefined ? entry.isCurrent : false;

    return {
      id: mode === 'create' ? 0 : (entry.id ?? 0),
      ptaId: mode === 'create' ? (assetId || 0) : (assetId || entry.ptaId || 0),
      dateAssigned: entry.dateAssigned ?? new Date().toISOString(),
      ptrItrNumber: entry.ptrItrNumber ?? '',
      parIcsNumber: entry.parIcsNumber ?? '',
      rrppeRrspNumber: (entry as any).rrppeRrspNumber ?? '',
      status: (entry as any).status ?? 'Current',
      plantillaEmployeeId: entry.plantillaEmployeeId ?? 0,
      nonPlantillaEmployeeId: entry.nonPlantillaEmployeeId ?? 0,
      condition: entry.condition ?? 'Working',
      actualOfficeId: (entry as any).actualOfficeId ?? 0,
      actualDivisionId: (entry as any).actualDivisionId ?? 0,
      isActive: entry.isActive !== undefined ? entry.isActive : true,
      isCurrent,
      actionBySystemUserId,
      sessionKey,
      model: assetModel || '',
    };
  }

  // Helper function to normalize part payload for backend
  private static normalizePart(part: any, mode: 'create' | 'edit', assetId?: number): any {
    const actionBySystemUserId = parseInt(localStorage.getItem('systemUserId') || '0');
    const sessionKey = localStorage.getItem('sessionToken') || '';

    return {
      id: mode === 'create' ? 0 : (part.id || 0),
      ptaId: mode === 'create' ? (assetId || 0) : (assetId || part.ptaId || 0),
      name: part.name || '',
      serialNumber: part.serialNumber || '',
      isActive: part.isActive !== undefined ? part.isActive : true,
      actionBySystemUserId,
      sessionKey,
    };
  }
  // Map API response to unified Asset model
  private static mapApiToUnifiedAsset(apiItem: any, group: AssetGroup): Asset {
    if (!apiItem || !apiItem.id) {
      console.error('Invalid apiItem passed to mapApiToUnifiedAsset:', apiItem);
      throw new Error('apiItem or apiItem.id is undefined');
    }

    // Map movements to unified format - handle new API structure
    const unifiedMovements: UnifiedMovement[] = (apiItem.movements || []).map((mv: any) => ({
      id: mv.id,
      ptaId: mv.ptaId || apiItem.id || 0,
      dateAssigned: mv.dateAssigned || mv.createdAt || '',
      ptrItrNumber: mv.ptrItrNumber || '',
      parIcsNumber: mv.parIcsNumber || '',
      plantillaEmployeeId: mv.plantillaEmployeeId || null,
      nonPlantillaEmployeeId: mv.nonPlantillaEmployeeId || null,
      plantillaEmployeeIdOriginal: mv.plantillaEmployeeIdOriginal || undefined,
      nonPlantillaEmployeeIdOriginal: mv.nonPlantillaEmployeeIdOriginal || undefined,
      employee: mv.employee,
      office: mv.office,
      division: mv.division,
      condition: mv.condition || 'Working',
      isActive: mv.isActive !== undefined ? mv.isActive : true,
      isDeleted: mv.isDeleted !== undefined ? mv.isDeleted : false,
      createdAt: mv.createdAt || new Date().toISOString(),
    }));

    return {
      id: apiItem.id,
      group: apiItem.group || group,
      propertyNumber: apiItem.propertyNumber || '',
      category: apiItem.category || {
        id: 0,
        name: 'Unknown',
        generalCode: '',
        isActive: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      },
      legend: apiItem.legend || null,
      description: apiItem.description || '',
      brand: apiItem.brand || null,
      model: apiItem.model || null,
      serialNumber: apiItem.serialNumber || null,
      parts: Array.isArray(apiItem.parts) ? apiItem.parts.map((part: any) => ({
        id: part.id || null,
        ptaId: part.ptaId || apiItem.id || 0,
        name: part.name || '',
        serialNumber: part.serialNumber || '',
        isActive: part.isActive !== undefined ? part.isActive : true
      })) : [],
      unitOfMeasurement: apiItem.unitOfMeasurement || '',
      unitValue: apiItem.unitValue || 0,
      dateAcquired: apiItem.dateAcquired || '',
      movements: unifiedMovements,
      estimatedUsefulLife: apiItem.estimatedUsefulLife || 0,
      fiscalDate: apiItem.fiscalDate || new Date().toISOString().split('T')[0],
      isActive: apiItem.isActive !== undefined ? apiItem.isActive : true,
      isDeleted: apiItem.isDeleted !== undefined ? apiItem.isDeleted : false,
      createdAt: apiItem.createdAt || new Date().toISOString(),
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
            asset.category?.name?.toLowerCase() === filters.category?.toLowerCase()
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
              movement.employee?.[0]?.office?.id === officeId
            )
          );
        }

        // Filter by division
        if (filters.division && filters.division !== 'all') {
          const divisionId = parseInt(filters.division);
          filteredItems = filteredItems.filter(asset =>
            asset.movements?.some(movement =>
              movement.employee?.[0]?.division?.id === divisionId
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
        let apiItem = ppeResponse;
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
      let apiItem = seResponse;
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
      const actionBySystemUserId = parseInt(localStorage.getItem('systemUserId') || '0');
      const sessionKey = localStorage.getItem('sessionToken') || '';

      const categoryId = (data as any).categoryId ?? (typeof data.category === 'object' && data.category ? (data.category as any).id : 0);
      const legendId = (data as any).legendId ?? (typeof data.legend === 'object' && data.legend ? (data.legend as any).id : 0);

      // Base asset payload (SE/PPE share the same /se-ppe/edit endpoint)
      const propertyNumber = (data.propertyNumber || '').trim();

      const assetPayload = {
        id: data.id ?? 0,
        group: data.group,
        propertyNumber,
        categoryId,
        legendId,
        description: data.description,
        brand: data.brand ?? '',
        model: data.model ?? '',
        serialNumber: data.serialNumber ?? '',
        unitOfMeasurement: data.unitOfMeasurement,
        unitValue: data.unitValue,
        dateAcquired: data.dateAcquired,
        estimatedUsefulLife: data.estimatedUsefulLife ?? 0,
        fiscalDate: data.fiscalDate ?? new Date().toISOString().split('T')[0],
        isActive: true,
        actionBySystemUserId,
        sessionKey,
      };

      // Create the asset first to get PTA Id
      const apiResponse = await seApi.create(assetPayload as any, actionBySystemUserId.toString(), sessionKey);

      let ptaId = Number(apiResponse.data?.id || (apiResponse.data as any)?.ptaId || (apiResponse.data as any)?.PTAId || 0);

      if (!apiResponse.success || !ptaId) {
        const message = (apiResponse && (apiResponse as any).message) ? (apiResponse as any).message : 'Unknown error';
        const isDuplicate = message.toLowerCase().includes('has been added') || message.toLowerCase().includes('already exists');

        if (isDuplicate) {
          // Try to locate the newly created asset (or existing duplicate) by Property Number
          try {
            const listResponse = await seApi.list({
              SearchString: propertyNumber,
              PageNumber: 1,
              PageSize: 5,
              StartDate: undefined,
              EndDate: undefined,
              ActionBySystemUserId: actionBySystemUserId.toString(),
              SessionKey: sessionKey,
              GroupName: data.group.toLowerCase(),
              EmployeeId: undefined,
            });

            const found = (listResponse.items || []).find(item => (item as any).propertyNumber === propertyNumber);
            if (found && (found as any).id) {
              ptaId = Number((found as any).id);
            }
          } catch (listError) {
            console.warn('Fallback list lookup failed after duplicate message:', listError);
          }
        }

        if (!ptaId) {
          const friendlyMessage = isDuplicate
            ? 'An asset with this Property Number already exists. Please use a unique Property Number.'
            : message;
          throw new Error('Failed to create asset: ' + friendlyMessage);
        }
      }

      if (!ptaId) {
        throw new Error('Failed to obtain PTA Id from create response');
      }

      // Create parts via dedicated endpoint
      const partsToCreate = (data.parts || []).map(part => this.normalizePart(part, 'create', ptaId));
      for (const part of partsToCreate) {
        if (part.name || part.serialNumber) {
          await seApi.editPart(part);
        }
      }

      // Create movements via dedicated endpoint
      const movementsToCreate = (data.movements || [])
        .filter(mv => mv != null)
        .map((movement, index) => this.normalizeMovement({ ...movement, isCurrent: index === 0 }, data.model || '', 'create', ptaId))
        .filter(movement => movement != null);

      for (const movement of movementsToCreate) {
        await seApi.editMovement(movement);
      }

      // Construct the created asset from input data and ptaId
      const createdAsset: Asset = {
        id: Number(ptaId),
        group: data.group,
        propertyNumber: data.propertyNumber,
        category: data.category || { id: categoryId, name: '', generalCode: '', isActive: true, isDeleted: false, createdAt: new Date().toISOString() },
        legend: data.legend || null,
        description: data.description,
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber,
        parts: data.parts || [],
        unitOfMeasurement: data.unitOfMeasurement,
        unitValue: data.unitValue,
        dateAcquired: data.dateAcquired,
        movements: data.movements || [],
        estimatedUsefulLife: data.estimatedUsefulLife || 0,
        fiscalDate: data.fiscalDate || new Date().toISOString().split('T')[0],
        isActive: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
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
        this.normalizeMovement(movement, data.model || currentAsset.model || '', 'edit', id)
      );

      const apiData = {
        id: id,
        propertyNumber: data.propertyNumber || currentAsset.propertyNumber,
        category: data.category || currentAsset.category,
        legend: data.legend || currentAsset.legend,
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

      // Use appropriate API for update
      let apiResponse;
      if (group === 'SE') {
        // SE asset - pass data directly since SEAsset interface matches the new API format
        const apiDataForSE: Partial<SEAsset> = {
          propertyNumber: apiData.propertyNumber,
          category: apiData.category as any,
          legend: typeof apiData.legend === 'object' && apiData.legend ? apiData.legend.name : apiData.legend,
          description: apiData.description,
          brand: apiData.brand,
          model: apiData.model,
          serialNumber: apiData.serialNumber,
          parts: apiData.parts || [],
          unitOfMeasurement: apiData.unitOfMeasurement,
          unitValue: apiData.unitValue,
          dateAcquired: apiData.dateAcquired,
          estimatedUsefulLife: apiData.estimatedUsefulLife || 0,
          movements: apiData.movements || [],
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
        // PPE asset - use PPE API for update
        const apiDataForPPE = {
          id: id.toString(),
          propertyNumber: apiData.propertyNumber,
          category: apiData.category,
          legend: typeof apiData.legend === 'object' && apiData.legend ? apiData.legend.name : apiData.legend,
          description: apiData.description,
          brand: apiData.brand,
          model: apiData.model,
          serialNumber: apiData.serialNumber,
          parts: apiData.parts || [],
          unitOfMeasurement: apiData.unitOfMeasurement,
          unitValue: apiData.unitValue,
          dateAcquired: apiData.dateAcquired,
          estimatedUsefulLife: apiData.estimatedUsefulLife || 0,
          movements: apiData.movements || [],
          actionBySystemUserId,
          sessionKey,
        };
        apiResponse = await ppeApi.update(apiDataForPPE);
        if (!apiResponse.success) throw new Error('Update failed');
        // Handle movements update for PPE
        if (data.movements && data.movements.length > 0) {
          for (const movement of data.movements) {
            await ppeApi.editMovement({ ...movement, actionBySystemUserId, sessionKey });
          }
        }
        return { success: true, ptaId: apiResponse.data?.id ? Number(apiResponse.data.id) : null };
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
        // Use SE API for delete
        await seApi.delete(id, actionBySystemUserId, sessionKey);
      } else {
        // Use PPE API for delete
        await ppeApi.delete(id, actionBySystemUserId, sessionKey);
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
