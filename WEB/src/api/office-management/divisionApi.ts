// src/api/office/divisionApi.ts
import axiosInstance from '../../lib/axios';
import { ApiResponse, Office, VwDivision, Division } from '../../types';
import { toast } from 'sonner';
import { getAuthParams } from '../../utils/auth';

interface DivisionResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  data: T;
}
interface ListResponse<T> {
  items: T[];
}

const mapVwDivision = (raw: any): VwDivision => ({
  id: raw.id,
  name: raw.name,
  acronym: raw.acronym,
  office: raw.office
    ? {
        id: raw.office.id,
        name: raw.office.name,
        acronym: raw.office.acronym,
        isActive: raw.office.isActive ?? true,
        isDeleted: raw.office.isDeleted ?? false,
        createdAt: raw.office.createdAt,
      }
    : null,
  isActive: raw.isActive ?? true,
  isDeleted: raw.isDeleted ?? false,
  createdAt: raw.createdAt,
});

/* ------------------------------- GET ------------------------------- */

export const getDivisions = async (): Promise<VwDivision[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<DivisionResponse<ListResponse<any>>>('/Office/division/all', {
    params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
  });

  if (!response.data.success) {
    toast.error(response.data.message || 'Failed to fetch divisions');
    return [];
  }

  return Array.isArray(response.data.data.items)
    ? response.data.data.items.map(mapVwDivision)
    : [];
};

export const getDivisionById = async (divisionId: string): Promise<VwDivision | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<DivisionResponse<any>>(
    `/Office/division/all/${encodeURIComponent(divisionId)}`,
    { params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey } }
  );

  if (!response.data.success) {
    toast.error(response.data.message || 'Division not found');
    return null;
  }

  return mapVwDivision(response.data.data);
};

/* ------------------------------- POST ------------------------------- */

export const editDivision = async (payload: Division): Promise<{ message: string }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const requestPayload = {
    DivisionId: payload.id ?? 0,
    OfficeId: payload.officeId,
    Name: payload.name,
    Acronym: payload.acronym,
    IsActive: payload.isActive,
    ActionBySystemUserId: systemUserId,
    SessionKey: sessionKey,
  };

  const response = await axiosInstance.post<ApiResponse<any>>('/Office/division/edit', requestPayload);

  if (!response.data.success) throw new Error(response.data.message || 'Failed to save division');
  // toast.success(payload.id ? 'Division updated' : 'Division created');
  return { message: response.data.message ?? 'Success' };
};