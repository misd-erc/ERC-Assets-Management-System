// src/api/office-management/employeeApi.ts
import axiosInstance from '@/lib/axios';
import { ApiResponse, EmployeeDetail } from '@/types';
import { toast } from 'sonner';
import { getAuthParams } from '@/utils/auth';

interface EmployeeResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  data: T;
}

interface ListResponse<T> {
  items: T[];
}

const mapEmployeeDetail = (raw: any): EmployeeDetail => ({
  id: raw.id,
  systemUser: raw.systemUser ?? null,
  firstName: raw.firstName ?? null,
  middleName: raw.middleName ?? null,
  lastName: raw.lastName ?? null,
  suffixName: raw.suffixName ?? null,
  employeeIdOriginal: raw.employeeIdOriginal ?? '',
  office: raw.office ?? null,
  division: raw.division ?? null,
  employmentType: raw.employmentType ?? null,
  position: raw.position ?? null,
  isActive: raw.isActive ?? true,
  createdAt: raw.createdAt ?? '',
});

/* ------------------------------- GET ------------------------------- */

export const getEmployeeList = async (): Promise<EmployeeDetail[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<EmployeeResponse<ListResponse<any>>>(
    '/Employee/all',
    { params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey, PageSize: 10000 } }
  );

  if (!response.data.success) {
    toast.error(response.data.message || 'Failed to fetch employees');
    return [];
  }

  return Array.isArray(response.data.data.items)
    ? response.data.data.items.map(mapEmployeeDetail)
    : [];
};

export const getEmployeeDetails = async (employeeId: number): Promise<EmployeeDetail | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<EmployeeResponse<any>>(
    `/Employee/all/${employeeId}`,
    { params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey } }
  );

  if (!response.data.success) {
    toast.error(response.data.message || 'Employee not found');
    return null;
  }

  return mapEmployeeDetail(response.data.data);
};

/* ------------------------------- POST ------------------------------- */

export interface EditEmployeePayload {
  employeeId?: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffixName?: string;
  employeeIdOriginal: string;
  officeId?: number | null;
  divisionId?: number | null;
  employmentTypeId?: number | null;
  positionId?: number | null;
  isActive: boolean;
}

export const editEmployeeRecord = async (payload: EditEmployeePayload): Promise<{ message: string }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const requestPayload = {
    EmployeeId: payload.employeeId ?? 0,
    FirstName: payload.firstName,
    MiddleName: payload.middleName,
    LastName: payload.lastName,
    SuffixName: payload.suffixName,
    EmployeeIdOriginal: payload.employeeIdOriginal,
    OfficeId: payload.officeId ?? null,
    DivisionId: payload.divisionId ?? null,
    EmploymentTypeId: payload.employmentTypeId ?? null,
    PositionId: payload.positionId ?? null,
    IsActive: payload.isActive,
    ActionBySystemUserId: systemUserId,
    SessionKey: sessionKey,
  };

  const response = await axiosInstance.post<ApiResponse<any>>('/Employee/edit', requestPayload);

  if (!response.data.success) throw new Error(response.data.message || 'Failed to save employee');
  return { message: response.data.message ?? 'Success' };
};

/* ------------------------------- DELETE ------------------------------- */

export const deleteEmployeeRecord = async (employeeId: number): Promise<{ message: string }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.delete<ApiResponse<any>>(`/Employee/delete/${employeeId}`, {
    params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
  });

  if (!response.data.success) {
    toast.error(response.data.message || 'Failed to delete employee');
    throw new Error(response.data.message || 'Failed to delete employee');
  }

  return { message: response.data.message ?? 'Success' };
};
