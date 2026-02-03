import axiosInstance from '@/lib/axios';
import { ApiResponse, SupplyUnit } from '@/types';
import { toast } from 'sonner';
import { getAuthParams } from '@/utils/auth';

interface SupplyUnitResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  data: T;
}
interface ListResponse<T> {
  items: T[];
}

/* ------------------------------- GET ------------------------------- */

export const getSupplyUnits = async (): Promise<SupplyUnit[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<SupplyUnitResponse<ListResponse<SupplyUnit>>>('/Supply/unit/all', {
    params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
  });

  if (!response.data.success) {
    toast.error(response.data.message || 'Failed to fetch measurement units');
    return [];
  }

  return Array.isArray(response.data.data.items)
    ? response.data.data.items.map((u: any) => ({
        id: u.id,
        name: u.name,
        isActive: u.isActive ?? true,
        createdAt: u.createdAt
      }))
    : [];
};

export const getSupplyUnitById = async (positionId: string): Promise<SupplyUnit | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<SupplyUnitResponse<SupplyUnit>>(
    `/Supply/unit/all/${encodeURIComponent(positionId)}`,
    { params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey } }
  );

  if (!response.data.success) {
    toast.error(response.data.message || 'Measurement Unit not found');
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

export const editSupplyUnit = async (payload: {
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

  const response = await axiosInstance.post<ApiResponse<any>>('/Supply/unit/edit', requestPayload);

  if (!response.data.success) throw new Error(response.data.message || 'Failed to save measurement unit');
  return { message: response.data.message ?? 'Success' };
};



