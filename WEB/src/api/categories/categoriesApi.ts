import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';

export interface Category {
  id: number;
  name: string;
  generalCode: string;
  isActive: boolean;
}

export interface Legend {
  id: number;
  name: string;
  generalCode: string;
  isActive: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  data: T;
}

/* ======================== CATEGORIES ======================== */

export const getCategories = async (): Promise<Category[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.get<ApiResponse<{ items: Category[] }>>('/Inventory//all', {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });

    if (!response.data.success) {
      console.error('Failed to fetch categories:', response.data.message);
      return [];
    }

    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const createCategory = async (name: string, generalCode: string): Promise<Category | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.post<ApiResponse<Category>>('/Inventory/pta/category/edit', {
      id: 0,
      name,
      generalCode,
      isActive: true,
      actionBySystemUserId: systemUserId,
      sessionKey,
    });

    if (!response.data.success) {
      console.error('Failed to create category:', response.data.message);
      return null;
    }

    return response.data.data || null;
  } catch (error) {
    console.error('Error creating category:', error);
    return null;
  }
};

export const updateCategory = async (id: number, name: string, generalCode: string, isActive: boolean): Promise<Category | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.post<ApiResponse<Category>>('/Inventory/pta/category/edit', {
      id,
      name,
      generalCode,
      isActive,
      actionBySystemUserId: systemUserId,
      sessionKey,
    });

    if (!response.data.success) {
      console.error('Failed to update category:', response.data.message);
      return null;
    }

    return response.data.data || null;
  } catch (error) {
    console.error('Error updating category:', error);
    return null;
  }
};

export const deleteCategory = async (id: number): Promise<boolean> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.delete<ApiResponse<null>>(`/Inventory/pta/category/delete/${id}`, {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });

    if (!response.data.success) {
      console.error('Failed to delete category:', response.data.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
};

/* ======================== LEGENDS ======================== */

export const getLegends = async (): Promise<Legend[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.get<ApiResponse<{ items: Legend[] }>>('/Inventory/pta/legend/all', {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });

    if (!response.data.success) {
      console.error('Failed to fetch legends:', response.data.message);
      return [];
    }

    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching legends:', error);
    return [];
  }
};

export const createLegend = async (name: string, generalCode: string): Promise<Legend | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.post<ApiResponse<Legend>>('/Inventory/pta/legend/edit', {
      id: 0,
      name,
      generalCode,
      isActive: true,
      actionBySystemUserId: systemUserId,
      sessionKey,
    });

    if (!response.data.success) {
      console.error('Failed to create legend:', response.data.message);
      return null;
    }

    return response.data.data || null;
  } catch (error) {
    console.error('Error creating legend:', error);
    return null;
  }
};

export const updateLegend = async (id: number, name: string, generalCode: string, isActive: boolean): Promise<Legend | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.post<ApiResponse<Legend>>('/Inventory/pta/legend/edit', {
      id,
      name,
      generalCode,
      isActive,
      actionBySystemUserId: systemUserId,
      sessionKey,
    });

    if (!response.data.success) {
      console.error('Failed to update legend:', response.data.message);
      return null;
    }

    return response.data.data || null;
  } catch (error) {
    console.error('Error updating legend:', error);
    return null;
  }
};

export const deleteLegend = async (id: number): Promise<boolean> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.delete<ApiResponse<null>>(`/Inventory/pta/legend/delete/${id}`, {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });

    if (!response.data.success) {
      console.error('Failed to delete legend:', response.data.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting legend:', error);
    return false;
  }
};
