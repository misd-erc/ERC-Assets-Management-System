// src/api/office/employmentTypeApi.ts
import axiosInstance from '@/lib/axios';
import { ApiResponse, EmploymentType, VwEmploymentType } from '@/types';
import { toast } from 'sonner';
import { getAuthParams } from '@/utils/auth';

interface EmploymentTypeResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  data: T;
}
interface ListResponse<T> {
  items: T[];
}

/* ------------------------------- GET ------------------------------- */

export const getEmploymentTypes = async (): Promise<VwEmploymentType[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<EmploymentTypeResponse<ListResponse<VwEmploymentType>>>(
    '/Office/employment-type/all',
    { params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey } }
  );

  if (!response.data.success) {
    toast.error(response.data.message || 'Failed to fetch employment types');
    return [];
  }

  return Array.isArray(response.data.data.items)
    ? response.data.data.items.map((t: any) => ({
        id: t.id,
        name: t.name,
        users: t.users,
        isActive: t.isActive ?? true,
        isDeleted: t.isDeleted ?? false,
        createdAt: t.createdAt,
      }))
    : [];
};

export const getEmploymentTypeById = async (employmentTypeId: string): Promise<VwEmploymentType | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<EmploymentTypeResponse<VwEmploymentType>>(
    `/Office/employment-type/all/${encodeURIComponent(employmentTypeId)}`,
    { params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey } }
  );

  if (!response.data.success) {
    toast.error(response.data.message || 'Employment type not found');
    return null;
  }

  const t = response.data.data;
  return {
    id: t.id,
    name: t.name,
    users: t.users,
    isActive: t.isActive ?? true,
    isDeleted: t.isDeleted ?? false,
    createdAt: t.createdAt,
  };
};

/* ------------------------------- POST ------------------------------- */

export const editEmploymentType = async (payload: {
  employmentTypeId?: number;
  name: string;
  isActive: boolean;
}): Promise<{ message: string }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const requestPayload = {
    EmploymentTypeId: payload.employmentTypeId,
    Name: payload.name,
    IsActive: payload.isActive,
    ActionBySystemUserId: systemUserId,
    SessionKey: sessionKey,
  };

  const response = await axiosInstance.post<ApiResponse<any>>('/Office/employment-type/edit', requestPayload);

  if (!response.data.success) throw new Error(response.data.message || 'Failed to save employment type');
  return { message: response.data.message ?? 'Success' };
};



