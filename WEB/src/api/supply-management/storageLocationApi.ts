import axiosInstance from '@/lib/axios';
import { ApiResponse, SupplyStorageLocation, SupplyUnit } from '@/types';
import { toast } from 'sonner';
import { getAuthParams } from '@/utils/auth';

interface SupplyStorageLocationResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  data: T;
}
interface ListResponse<T> {
  items: T[];
}

/* ------------------------------- GET ------------------------------- */

export const getSupplyStorageLocations = async (): Promise<SupplyStorageLocation[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<SupplyStorageLocationResponse<ListResponse<SupplyStorageLocation>>>('/Supply/storage-location/all', {
    params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
  });

  if (!response.data.success) {
    toast.error(response.data.message || 'Failed to fetch storage locations');
    return [];
  }

  const data = response.data.data;
  const items = Array.isArray(data) ? data : (data as any)?.items || (data as any)?.Items;

  return Array.isArray(items)
    ? items.map((u: any) => ({
        id: u.id ?? u.Id,
        name: u.name ?? u.Name,
        isActive: u.isActive ?? u.IsActive ?? true,
        createdAt: u.createdAt ?? u.CreatedAt
      }))
    : [];
};

export const getSupplyStorageLocationById = async (positionId: string): Promise<SupplyStorageLocation | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<SupplyStorageLocationResponse<SupplyStorageLocation>>(
    `/Supply/storage-location/all/${encodeURIComponent(positionId)}`,
    { params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey } }
  );

  if (!response.data.success) {
    toast.error(response.data.message || 'Storage Location not found');
    return null;
  }

  const u = response.data.data;
  return {
    id: u.id,
    name: u.name,
    isActive: u.isActive ?? true,
    createdAt: u.createdAt
  };
};

/* ------------------------------- POST ------------------------------- */

export const editSupplyStorageLocation = async (payload: {
  id?: number;
  name: string;
  isActive: boolean;
}): Promise<{ message: string }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const requestPayload = {
    Id: payload.id ?? 0,
    Name: payload.name,
    IsActive: payload.isActive,
    ActionBySystemUserId: systemUserId,
    SessionKey: sessionKey,
  };

  const response = await axiosInstance.post<ApiResponse<any>>('/Supply/storage-location/edit', requestPayload);

  if (!response.data.success) throw new Error(response.data.message || 'Failed to save storage location');
  return { message: response.data.message ?? 'Success' };
};



