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
  id: raw.id ?? raw.Id,
  iarId: raw.iarId ?? raw.IarId ?? raw.IARId,
  code: raw.code ?? raw.Code,
  category: raw.category ?? raw.Category,
  categoryId: raw.categoryId ?? raw.CategoryId ?? raw.category?.id ?? raw.Category?.Id ?? raw.Category?.id ?? 0,
  quantity: raw.quantity ?? raw.Quantity,
  description: raw.description ?? raw.Description,
  measurementUnit: raw.measurementUnit ?? raw.MeasurementUnit,
  measurementUnitId: raw.measurementUnitId ?? raw.MeasurementUnitId ?? raw.measurementUnit?.id ?? raw.MeasurementUnit?.Id ?? raw.MeasurementUnit?.id ?? 0,
  currentStock: raw.currentStock ?? raw.CurrentStock ?? raw.totalCurrentStock ?? raw.TotalCurrentStock ?? 0,
  unitCost: raw.unitCost ?? raw.UnitCost,
  reorderPoint: raw.reorderPoint ?? raw.ReorderPoint,
  storageLocation: raw.storageLocation ?? raw.StorageLocation,
  storageLocationId: raw.storageLocationId ?? raw.StorageLocationId ?? raw.storageLocation?.id ?? raw.StorageLocation?.Id ?? raw.StorageLocation?.id ?? 0,
  vendor: raw.vendor ?? raw.Vendor,
  vendorId: raw.vendorId ?? raw.VendorId ?? raw.vendor?.id ?? raw.Vendor?.Id ?? raw.Vendor?.id ?? 0,
  isActive: raw.isActive ?? raw.IsActive ?? true,
  createdAt: raw.createdAt ?? raw.CreatedAt,
});

const mapVwSupplyGroupedItem = (raw: any): VwSupplyGroupedItem => ({
  id: raw.id ?? raw.Id,
  iarId: raw.iarId ?? raw.IarId ?? raw.IARId,
  code: raw.code ?? raw.Code,
  description: raw.description ?? raw.Description,
  totalCurrentStock: raw.totalCurrentStock ?? raw.TotalCurrentStock ?? 0,
  totalStockCost: raw.totalStockCost ?? raw.TotalStockCost ?? 0,
  unitCost: raw.unitCost ?? raw.UnitCost ?? 0,
  measurementUnit: raw.measurementUnit ?? raw.MeasurementUnit,
  measurementUnitId: raw.measurementUnitId ?? raw.MeasurementUnitId,
  categoryId: raw.categoryId ?? raw.CategoryId,
  reorderPoint: raw.reorderPoint ?? raw.ReorderPoint ?? 0,
  isActive: raw.isActive ?? raw.IsActive ?? true,
  createdAt: raw.createdAt ?? raw.CreatedAt,
});

const mapVwSupplyUniqueRawItem = (raw: any): VwSupplyUniqueRawItem => {
  const category = raw.category ?? raw.Category;
  return {
    id: raw.id ?? raw.Id,
    code: raw.code ?? raw.Code,
    category: category ? {
      id: category.id ?? category.Id,
      name: category.name ?? category.Name,
      generalCode: category.generalCode ?? category.GeneralCode,
      module: category.module ?? category.Module ?? '',
      isActive: category.isActive ?? category.IsActive ?? true,
      itemCount: category.itemCount ?? category.ItemCount ?? 0,
    } : null,
    description: raw.description ?? raw.Description,
    measurementUnit: raw.measurementUnit ?? raw.MeasurementUnit,
    // currentStock: raw.currentStock,
    // unitCost: raw.unitCost,
    // reorderPoint: raw.reorderPoint,
    storageLocation: raw.storageLocation ?? raw.StorageLocation,
    vendor: raw.vendor ?? raw.Vendor,
    isActive: raw.isActive ?? raw.IsActive ?? true,
    createdAt: raw.createdAt ?? raw.CreatedAt,
  };
};


/* ------------------------------- GET ------------------------------- */

export const getSupplyItems = async (
  pageNumber: number = 1,
  pageSize: number = 10000,
  search: string = '',
  categoryId?: number,
  status?: string,
  storageLocationId?: number,
  vendorId?: number,
  startDate?: string,
  endDate?: string
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
      VendorId: vendorId,
      StartDate: startDate,
      EndDate: endDate
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
  pageSize: number = 10000,
  search: string = '',
  status?: string,
  categoryId?: number,
  storageLocationId?: number,
  vendorId?: number,
  startDate?: string,
  endDate?: string
): Promise<PaginatedResult<VwSupplyGroupedItem>> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<SupplyItemResponse<ListResponse<any>>>('/Supply/item/grouped/all', {
    params: {
      ActionBySystemUserId: systemUserId,
      SessionKey: sessionKey,
      PageNumber: pageNumber,
      PageSize: pageSize,
      SearchString: search,
      Status: status,
      CategoryId: categoryId,
      StorageLocationId: storageLocationId,
      VendorId: vendorId,
      StartDate: startDate,
      EndDate: endDate
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
  pageSize: number = 10000,
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

  console.log('[API] getSupplyItemById - Fetching item ID:', itemId);
  try {
    const response = await axiosInstance.get<SupplyItemResponse<any>>(
      `/Supply/item/all/${encodeURIComponent(itemId)}`,
      { params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey } }
    );

    console.log('[API] getSupplyItemById - Response:', response.data);

    if (!response.data.success) {
      toast.error(response.data.message || 'Item not found');
      return null;
    }

    const mapped = mapVwSupplyItem(response.data.data);
    console.log('[API] getSupplyItemById - Mapped Item:', mapped);
    return mapped;
  } catch (error) {
    console.error('[API] getSupplyItemById - Error:', error);
    return null;
  }
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
    CreatedAt: payload.createdAt ? new Date(payload.createdAt).toISOString() : null,
    ActionBySystemUserId: systemUserId,
    SessionKey: sessionKey,
  };

  const response = await axiosInstance.post<ApiResponse<any>>('/Supply/item/edit', requestPayload);
  if (!response.data.success) throw new Error(response.data.message || 'Failed to save supply');
  return { message: response.data.message ?? 'Success' };
};
