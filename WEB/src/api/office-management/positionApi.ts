import axiosInstance from '../../lib/axios';
import { ApiResponse, Position, VwPosition } from '../../types';
import { toast } from 'sonner';
import { getAuthParams } from '../../utils/auth';

interface PositionResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  data: T;
}
interface ListResponse<T> {
  items: T[];
}

/* ------------------------------- GET ------------------------------- */

export const getPositions = async (): Promise<VwPosition[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<PositionResponse<ListResponse<VwPosition>>>('/Office/position/all', {
    params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
  });

  if (!response.data.success) {
    toast.error(response.data.message || 'Failed to fetch positions');
    return [];
  }

  return Array.isArray(response.data.data.items)
    ? response.data.data.items.map((p: any) => ({
        id: p.id,
        name: p.name,
        acronym: p.acronym,
        salaryGrade: p.salaryGrade,
        users: p.users,
        isActive: p.isActive ?? true,
        isDeleted: p.isDeleted ?? false,
        createdAt: p.createdAt,
      }))
    : [];
};

export const getPositionById = async (positionId: string): Promise<VwPosition | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<PositionResponse<VwPosition>>(
    `/Office/position/all/${encodeURIComponent(positionId)}`,
    { params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey } }
  );

  if (!response.data.success) {
    toast.error(response.data.message || 'Position not found');
    return null;
  }

  const p = response.data.data;
  return {
    id: p.id,
    name: p.name,
    acronym: p.acronym,
    salaryGrade: p.salaryGrade,
    users: p.users,
    isActive: p.isActive ?? true,
    isDeleted: p.isDeleted ?? false,
    createdAt: p.createdAt,
  };
};

/* ------------------------------- POST ------------------------------- */

export const editPosition = async (payload: {
  positionId?: number;
  name: string;
  acronym: string;
  salaryGrade: string;
  isActive: boolean;
}): Promise<{ message: string }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const requestPayload = {
    PositionId: payload.positionId ?? 0,
    Name: payload.name,
    Acronym: payload.acronym,
    SalaryGrade: payload.salaryGrade,
    IsActive: payload.isActive,
    ActionBySystemUserId: systemUserId,
    SessionKey: sessionKey,
  };

  const response = await axiosInstance.post<ApiResponse<any>>('/Office/position/edit', requestPayload);

  if (!response.data.success) throw new Error(response.data.message || 'Failed to save position');
  return { message: response.data.message ?? 'Success' };
};