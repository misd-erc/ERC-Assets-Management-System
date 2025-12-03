import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  data: T;
}

/* ------------------------------- GET ------------------------------- */

export const getCategories = async (): Promise<string[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.get<ApiResponse<{ items: { id: number; name: string; isActive: boolean; isDeleted: boolean; createdAt: string }[]; pageNumber: number; pageSize: number; totalCount: number; totalPages: number }>>('/Inventory/pta/category/all', {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });

    if (!response.data.success) {
      console.error('Failed to fetch categories:', response.data.message);
      return [];
    }

    return response.data.data?.items?.map(item => item.name) || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const getLegends = async (): Promise<string[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.get<ApiResponse<{ items: { id: number; name: string; isActive: boolean; isDeleted: boolean; createdAt: string }[]; pageNumber: number; pageSize: number; totalCount: number; totalPages: number }>>('/Inventory/pta/legend/all', {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });

    if (!response.data.success) {
      console.error('Failed to fetch legends:', response.data.message);
      return [];
    }

    return response.data.data?.items?.map(item => item.name) || [];
  } catch (error) {
    console.error('Error fetching legends:', error);
    return [];
  }
};

export const getConditions = async (): Promise<string[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.get<ApiResponse<string[]>>('/Inventory/pta/conditions/all', {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });

    if (!response.data.success) {
      console.error('Failed to fetch conditions:', response.data.message);
      return [];
    }

    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching conditions:', error);
    return [];
  }
};
