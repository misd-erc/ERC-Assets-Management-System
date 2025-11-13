import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types';

export interface SystemRoleResponseModel {
  [x: string]: any;
  id: number;
  roleName: string;
  description: string;
  scope: SystemRoleScopeResponseModel[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface SystemRoleScopeResponseModel {
  id: number;
  module: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface PaginationGenericQueryParams {
  pageNumber: number;
  pageSize: number;
  searchString?: string;
  startDate?: string;
  endDate?: string;
  actionBySystemUserId: string;
}

export interface SoloQueryParams {
  actionBySystemUserId: string;
}

export interface EditSystemRoleQueryParams {
  systemRoleId: number;
  systemRoleName: string;
  systemRoleDescription: string;
  systemRoleIsActive: boolean;
  systemRoleScopes?: EditSystemRoleScopeQueryParams[];
  actionBySystemUserId: string;
}

export interface EditSystemRoleScopeQueryParams {
  systemModuleId: number;
  systemRoleScopeIsActive: boolean;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface PaginatedRolesResponse {
  items: SystemRoleResponseModel[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export const getAllSystemRoles = async (params: PaginationGenericQueryParams): Promise<{
  data: SystemRoleResponseModel[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}> => {
  const sessionKey = localStorage.getItem('sessionToken') || '';
  params.actionBySystemUserId = localStorage.getItem('systemUserId') || '';
  const queryParams = new URLSearchParams({
    PageNumber: params.pageNumber.toString(),
    PageSize: params.pageSize.toString(),
    ActionBySystemUserId: params.actionBySystemUserId,
    SessionKey: sessionKey,
  });

  if (params.searchString) queryParams.append('SearchString', params.searchString);
  if (params.startDate) queryParams.append('StartDate', params.startDate);
  if (params.endDate) queryParams.append('EndDate', params.endDate);

  const response = await axiosInstance.get<ApiResponse<PaginatedRolesResponse>>(
    `/Roles/all?${queryParams.toString()}`
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch roles');
  }

  return {
    data: response.data.data.items,
    totalCount: response.data.data.totalCount,
    pageNumber: response.data.data.pageNumber,
    pageSize: response.data.data.pageSize,
  };
};

export const getSystemRoleById = async (
  systemRoleId: number,
  params: SoloQueryParams
): Promise<SystemRoleResponseModel> => {
  const sessionKey = localStorage.getItem('sessionToken') || '';

  const queryParams = new URLSearchParams({
    ActionBySystemUserId: params.actionBySystemUserId,
    SessionKey: sessionKey,
  });

  const response = await axiosInstance.get<ApiResponse<SystemRoleResponseModel>>(
    `/Roles/all/${systemRoleId}?${queryParams.toString()}`
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch role');
  }

  return response.data.data;
};

export const editSystemRole = async (params: EditSystemRoleQueryParams): Promise<{ systemRoleId: number }> => {
  const sessionKey = localStorage.getItem('sessionToken') || '';

  const payload = {
    SystemRoleId: params.systemRoleId,
    SystemRoleName: params.systemRoleName,
    SystemRoleDescription: params.systemRoleDescription,
    SystemRoleIsActive: params.systemRoleIsActive,
    SystemRoleScopes: params.systemRoleScopes?.map(scope => ({
      SystemModuleId: scope.systemModuleId,
      SystemRoleScopeIsActive: scope.systemRoleScopeIsActive,
    })),
    ActionBySystemUserId: params.actionBySystemUserId,
    SessionKey: sessionKey,
  };

  const response = await axiosInstance.post<ApiResponse<{ SystemRoleId: number }>>('/Roles/edit', payload);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to edit role');
  }

  return { systemRoleId: response.data.data.SystemRoleId };
};

