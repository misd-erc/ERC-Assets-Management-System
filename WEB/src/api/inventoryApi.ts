import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  data: T;
}

/* ------------------------------- GET ------------------------------- */

export const getCategories = async (): Promise<{ id: number; name: string }[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.get<ApiResponse<{ items: { id: number; name: string; isActive: boolean; isDeleted: boolean; createdAt: string }[]; pageNumber: number; pageSize: number; totalCount: number; totalPages: number }>>('/Inventory/pta/category/all', {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });

    if (!response.data.success) {
      console.error('Failed to fetch categories:', response.data.message);
      return [];
    }

    return response.data.data?.items?.map(item => ({ id: item.id, name: item.name })) || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const getLegends = async (): Promise<{ id: number; name: string }[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.get<ApiResponse<{ items: { id: number; name: string; isActive: boolean; isDeleted: boolean; createdAt: string }[]; pageNumber: number; pageSize: number; totalCount: number; totalPages: number }>>('/Inventory/pta/legend/all', {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });

    if (!response.data.success) {
      console.error('Failed to fetch legends:', response.data.message);
      return [];
    }

    return response.data.data?.items?.map(item => ({ id: item.id, name: item.name })) || [];
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

/* ------------------------ LEGENDS (detailed) ------------------------ */

// Non-breaking addition: returns extended fields for legends for management UI
export const getLegendsDetailed = async (): Promise<{ id: number; name: string; generalCode?: string; isActive?: boolean; createdAt?: string }[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.get<ApiResponse<{ items: { id: number; name: string; isActive: boolean; isDeleted: boolean; createdAt: string; generalCode?: string }[]; pageNumber: number; pageSize: number; totalCount: number; totalPages: number }>>('/Inventory/pta/legend/all', {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });

    if (!response.data.success) {
      console.error('Failed to fetch legends (detailed):', response.data.message);
      return [];
    }

    return response.data.data?.items?.map(item => ({
      id: item.id,
      name: item.name,
      generalCode: (item as any).generalCode ?? '',
      isActive: item.isActive,
      createdAt: item.createdAt,
    })) || [];
  } catch (error) {
    console.error('Error fetching legends (detailed):', error);
    return [];
  }
};

// Create new legend
export const createLegend = async (data: {
  name: string;
  generalCode?: string;
  isActive: boolean;
}): Promise<{ id: number; name: string; generalCode?: string; isActive: boolean; createdAt?: string }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.post<ApiResponse<{ id: number; name: string; generalCode?: string; isActive: boolean; createdAt?: string }>>('/Inventory/pta/legend/edit', {
      id: 0,
      ...data,
      actionBySystemUserId: systemUserId,
      sessionKey,
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create legend');
    }

    return response.data.data!;
  } catch (error) {
    console.error('Error creating legend:', error);
    throw error;
  }
};


// Update existing legend
export const updateLegend = async (id: number, data: {
  name: string;
  generalCode?: string;
  isActive: boolean;
}): Promise<{ id: number; name: string; generalCode?: string; isActive: boolean }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.post<ApiResponse<{ id: number; name: string; generalCode?: string; isActive: boolean }>>('/Inventory/pta/legend/edit', {
      id,
      ...data,
      actionBySystemUserId: systemUserId,
      sessionKey,
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update legend');
    }

    return response.data.data!;
  } catch (error) {
    console.error('Error updating legend:', error);
    throw error;
  }
};


// Delete legend
export const deleteLegend = async (id: number): Promise<void> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/Inventory/pta/legend/delete/${id}`, {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete legend');
    }
  } catch (error) {
    console.error('Error deleting legend:', error);
    throw error;
  }
};
