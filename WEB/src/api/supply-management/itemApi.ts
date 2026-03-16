  import axiosInstance from '@/lib/axios';
  import { ApiResponse, SupplyItem, VwSupplyItem, VwSupplyUniqueRawItem } from '@/types';
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
  }

  const mapVwSupplyItem = (raw: any): VwSupplyItem => ({
    id: raw.id,
    iarId: raw.iarId,
    code: raw.code,
    category: raw.category,
    quantity: raw.quantity,
    description: raw.description,
    measurementUnit: raw.measurementUnit,
    currentStock: raw.currentStock,
    unitCost: raw.unitCost,
    reorderPoint: raw.reorderPoint,
    storageLocation: raw.storageLocation,
    vendor: raw.vendor,
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

  export const getSupplyItems = async (): Promise<VwSupplyItem[]> => {
    const { systemUserId, sessionKey } = getAuthParams();

    const response = await axiosInstance.get<SupplyItemResponse<ListResponse<any>>>('/Supply/item/all', {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });

    if (!response.data.success) {
      toast.error(response.data.message || 'Failed to fetch items');
      return [];
    }

    return Array.isArray(response.data.data.items)
      ? response.data.data.items.map(mapVwSupplyItem)
      : [];
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
      Id: payload.id,
      Code: payload.code,
      CategoryId: payload.categoryId ?? 0,
      Description: payload.description,
      MeasurementUnitId: payload.measurementUnitId ?? 0,
      CurrentStock: payload.currentStock,
      UnitCost: payload.unitCost,
      ReorderPoint: payload.reorderPoint,
      StorageLocationId: payload.storageLocationId ?? 0,
      VendorId: payload.vendorId ?? 0,
      IsActive: payload.isActive,
      ActionBySystemUserId: systemUserId,
      SessionKey: sessionKey,
    };

    const response = await axiosInstance.post<ApiResponse<any>>('/Supply/item/edit', requestPayload);
    if (!response.data.success) throw new Error(response.data.message || 'Failed to save supply');
    return { message: response.data.message ?? 'Success' };
  };



