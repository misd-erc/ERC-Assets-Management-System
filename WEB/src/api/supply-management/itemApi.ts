  import axiosInstance from '@/lib/axios';
  import { ApiResponse, SupplyItem, VwSupplyGroupedItem, VwSupplyItem, VwSupplyUniqueRawItem } from '@/types';
  import { toast } from 'sonner';
  import { getAuthParams } from '@/utils/auth';

  interface SupplyItemResponse<T> {
    success: boolean;
    message?: string;
    code?: string;
    data: T;
  }
  interface ListResponse<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
  }

  export interface PaginatedResult<T> {
    items: T[];
    totalCount: number;
  }

  const mapVwSupplyItem = (raw: any): VwSupplyItem => ({
    id: raw.id,
    iarId: raw.iarId,
    code: raw.code,
    category: raw.category,
    quantity: raw.quantity,
    description: raw.description,
    measurementUnit: raw.measurementUnit,
    currentStock: 0,
    unitCost: raw.unitCost,
    reorderPoint: raw.reorderPoint,
    storageLocation: raw.storageLocation,
    vendor: raw.vendor,
    isActive: raw.isActive ?? true,
    createdAt: raw.createdAt,
  });

  const mapVwSupplyGroupedItem = (raw: any): VwSupplyGroupedItem => ({
    id: raw.id,
    iarId: raw.iarId,
    code: raw.code,
    description: raw.description,
    totalCurrentStock: raw.totalCurrentStock,
    totalStockCost: raw.totalStockCost,
    reorderPoint: raw.reorderPoint,
    isActive: raw.isActive ?? true,
    createdAt: raw.createdAt,
  });

  const mapVwSupplyUniqueRawItem = (raw: any): VwSupplyUniqueRawItem => ({
    id: raw.id,
    code: raw.code,
    category: raw.category,
    description: raw.description,
    measurementUnit: raw.measurementUnit,
    // currentStock: raw.currentStock,
    // unitCost: raw.unitCost,
    // reorderPoint: raw.reorderPoint,
    storageLocation: raw.storageLocation,
    vendor: raw.vendor,
    isActive: raw.isActive ?? true,
    createdAt: raw.createdAt,
  });


  /* ------------------------------- GET ------------------------------- */

  export const getSupplyItems = async (
    pageNumber: number = 1,
    pageSize: number = 10,
    search: string = '',
    categoryId?: number,
    status?: string,
    storageLocationId?: number,
    vendorId?: number
  ): Promise<PaginatedResult<VwSupplyItem>> => {
    const { systemUserId, sessionKey } = getAuthParams();

    const response = await axiosInstance.get<SupplyItemResponse<ListResponse<any>>>('/Supply/item/all', {
      params: { 
        ActionBySystemUserId: systemUserId, 
        SessionKey: sessionKey,
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchString: search,
        CategoryId: categoryId,
        Status: status,
        StorageLocationId: storageLocationId,
        VendorId: vendorId
      },
    });

    if (!response.data.success) {
      toast.error(response.data.message || 'Failed to fetch items');
      return { items: [], totalCount: 0 };
    }

    const data = response.data.data;
    const items = Array.isArray(data) ? data : (data as any)?.items || (data as any)?.Items;
    const totalCount = (data as any)?.totalCount || (data as any)?.TotalCount || 0;

    return {
      items: Array.isArray(items) ? items.map(mapVwSupplyItem) : [],
      totalCount: totalCount
    };
  };

    export const getVwSupplyGroupedItems = async (
    pageNumber: number = 1,
    pageSize: number = 10,
    search: string = '',
    status?: string
  ): Promise<PaginatedResult<VwSupplyGroupedItem>> => {
    const { systemUserId, sessionKey } = getAuthParams();

    const response = await axiosInstance.get<SupplyItemResponse<ListResponse<any>>>('/Supply/item/grouped/all', {
      params: { 
        ActionBySystemUserId: systemUserId, 
        SessionKey: sessionKey,
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchString: search,
        Status: status
      },
    });

    if (!response.data.success) {
      toast.error(response.data.message || 'Failed to fetch items');
      return { items: [], totalCount: 0 };
    }
        const data = response.data.data;
    const items = Array.isArray(data) ? data : (data as any)?.items || (data as any)?.Items;
    const totalCount = (data as any)?.totalCount || (data as any)?.TotalCount || 0;

    return {
      items: Array.isArray(items) ? items.map(mapVwSupplyGroupedItem) : [],
      totalCount: totalCount
    };
  };

  export const getVwSupplyGroupedItemLists = async (
    id: number,
    pageNumber: number = 1,
    pageSize: number = 10,
    search: string = '',
    categoryId?: number,
    status?: string,
    storageLocationId?: number,
    vendorId?: number
  ): Promise<PaginatedResult<VwSupplyItem>> => {
    const { systemUserId, sessionKey } = getAuthParams();

    const response = await axiosInstance.get<SupplyItemResponse<ListResponse<any>>>(`/Supply/item/grouped/all/${id}`, {
      params: { 
        ActionBySystemUserId: systemUserId, 
        SessionKey: sessionKey,
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchString: search,
        CategoryId: categoryId,
        Status: status,
        StorageLocationId: storageLocationId,
        VendorId: vendorId
      },
    });

    if (!response.data.success) {
      toast.error(response.data.message || 'Failed to fetch items');
      return { items: [], totalCount: 0 };
    }

    return {
      items: Array.isArray(response.data.data.items) ? response.data.data.items.map(mapVwSupplyItem) : [],
      totalCount: response.data.data.totalCount || 0
    };
  };


  export const getSupplyUniqueRawItems = async (): Promise<VwSupplyUniqueRawItem[]> => {
    const { systemUserId, sessionKey } = getAuthParams();

    const response = await axiosInstance.get<SupplyItemResponse<ListResponse<any>>>('/Supply/item/unique/all', {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });

    if (!response.data.success) {
      toast.error(response.data.message || 'Failed to fetch items');
      return [];
    }

    return Array.isArray(response.data.data.items)
      ? response.data.data.items.map(mapVwSupplyUniqueRawItem)
      : [];
  };


  export const getSupplyItemById = async (itemId: number): Promise<VwSupplyItem | null> => {
    const { systemUserId, sessionKey } = getAuthParams();

    const response = await axiosInstance.get<SupplyItemResponse<any>>(
      `/Supply/item/all/${encodeURIComponent(itemId)}`,
      { params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey } }
    );

    if (!response.data.success) {
      toast.error(response.data.message || 'Item not found');
      return null;
    }

    return mapVwSupplyItem(response.data.data);
  };

  /* ------------------------------- POST ------------------------------- */

  export const editSupplyItem = async (payload: SupplyItem): Promise<{ message: string }> => {
    const { systemUserId, sessionKey } = getAuthParams();

    const requestPayload = {
      Id: payload.id || 0,
      Code: payload.code?.trim() || null,
      CategoryId: (payload.categoryId && payload.categoryId > 0) ? payload.categoryId : null,
      Description: payload.description?.trim() || null,
      MeasurementUnitId: (payload.measurementUnitId && payload.measurementUnitId > 0) ? payload.measurementUnitId : null,
      CurrentStock: 0,
      UnitCost: payload.unitCost ?? 0,
      ReorderPoint: payload.reorderPoint ?? 0,
      StorageLocationId: (payload.storageLocationId && payload.storageLocationId > 0) ? payload.storageLocationId : null,
      VendorId: (payload.vendorId && payload.vendorId > 0) ? payload.vendorId : null,
      Quantity: payload.quantity ?? 0,
      IsActive: payload.isActive ?? true,
      ActionBySystemUserId: systemUserId,
      SessionKey: sessionKey,
    };

    const response = await axiosInstance.post<ApiResponse<any>>('/Supply/item/edit', requestPayload);
    if (!response.data.success) throw new Error(response.data.message || 'Failed to save supply');
    return { message: response.data.message ?? 'Success' };
  };



