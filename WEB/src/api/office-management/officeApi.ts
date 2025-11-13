import axiosInstance from '@/lib/axios';
import { ApiResponse, Office, VwOffice } from '@/types';
import { toast } from 'sonner';
import { getAuthParams } from '@/utils/auth';

interface OfficeResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  data: T;
}
interface ListResponse<T> {
  items: T[];
}

/* ------------------------------- GET ------------------------------- */

export const getOffices = async (): Promise<VwOffice[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<OfficeResponse<ListResponse<VwOffice>>>('/Office/all', {
    params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
  });

  if (!response.data.success) {
    toast.error(response.data.message || 'Failed to fetch offices');
    return [];
  }

  return Array.isArray(response.data.data.items)
    ? response.data.data.items.map((o: any) => ({
        id: o.id,
        name: o.name,
        acronym: o.acronym,
        users: o.users,
        isActive: o.isActive ?? true,
        isDeleted: o.isDeleted ?? false,
        createdAt: o.createdAt,
      }))
    : [];
};

export const getOfficeById = async (officeId: string): Promise<VwOffice | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<OfficeResponse<VwOffice>>(
    `/Office/all/${encodeURIComponent(officeId)}`,
    { params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey } }
  );

  if (!response.data.success) {
    toast.error(response.data.message || 'Office not found');
    return null;
  }

  const o = response.data.data;
  return {
    id: o.id,
    name: o.name,
    acronym: o.acronym,
    users: o.users,
    isActive: o.isActive ?? true,
    isDeleted: o.isDeleted ?? false,
    createdAt: o.createdAt,
  };
};

/* ------------------------------- POST ------------------------------- */

export interface EditOfficePayload {
  officeId: number;
  name: string;
  acronym: string;
  isActive: boolean;
}

export const editOffice = async (payload: EditOfficePayload): Promise<{ message: string }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const requestPayload = {
    OfficeId: payload.officeId ?? 0,
    Name: payload.name,
    Acronym: payload.acronym,
    IsActive: payload.isActive,
    ActionBySystemUserId: systemUserId,
    SessionKey: sessionKey,
  };

  const response = await axiosInstance.post<ApiResponse<any>>('/Office/edit', requestPayload);

  if (!response.data.success) throw new Error(response.data.message || 'Failed to save office');
  return { message: response.data.message ?? 'Success' };
};
