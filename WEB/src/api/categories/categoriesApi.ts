import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';

export interface Category {
  id: number;
  name: string;
  generalCode: string;
  moduleIds: number[];
  modules: SystemModule[];
  isActive: boolean;
}

export interface SystemModule {
  id: number;
  name: string;
  acronym: string;
}

export interface Legend {
  id: number;
  name: string;
  generalCode: string;
  description?: string;
  isActive: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  data: T;
}

/* ======================== CATEGORIES ======================== */

export const getCategories = async (moduleName?: string): Promise<Category[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.get<ApiResponse<{ items: Category[] }>>('/Inventory/pta/category/all', {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });

    if (!response.data.success) {
      console.error('Failed to fetch categories:', response.data.message);
      return [];
    }

    const data = response.data.data;
    const items = Array.isArray(data) ? data : (data as any)?.items || (data as any)?.Items;

    const categories = Array.isArray(items)
      ? items.map((c: any) => ({
          id: c.id ?? c.Id,
          name: c.name ?? c.Name,
          generalCode: c.generalCode ?? c.GeneralCode,
          moduleIds: c.moduleIds ?? c.ModuleIds ?? [],
          modules: c.modules ?? c.Modules ?? [],
          isActive: c.isActive ?? c.IsActive ?? true
        }))
      : [];

    return moduleName
      ? categories.filter(category => category.modules.some((module: SystemModule) => module.name === moduleName))
      : categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const getSystemModules = async (): Promise<SystemModule[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.get<ApiResponse<{ items: SystemModule[] }>>('/Users/system-modules/all', {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey, PageSize: 1000 },
    });

    if (!response.data.success) {
      console.error('Failed to fetch system modules:', response.data.message);
      return [];
    }

    const data = response.data.data;
    const items = Array.isArray(data) ? data : (data as any)?.items || (data as any)?.Items;

    return Array.isArray(items)
      ? items.map((m: any) => ({
          id: m.id ?? m.Id,
          name: m.name ?? m.Name,
          acronym: m.acronym ?? m.Acronym,
        }))
      : [];
  } catch (error) {
    console.error('Error fetching system modules:', error);
    return [];
  }
};

export const createCategory = async (name: string, generalCode: string, moduleIds: number[]): Promise<Category | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.post<ApiResponse<Category>>('/Inventory/pta/category/edit', {
      id: 0,
      name,
      generalCode,
      moduleIds,
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

export const updateCategory = async (id: number, name: string, generalCode: string, moduleIds: number[], isActive: boolean): Promise<Category | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.post<ApiResponse<Category>>('/Inventory/pta/category/edit', {
      id,
      name,
      generalCode,
      moduleIds,
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

export const createLegend = async (name: string, generalCode: string, description?: string): Promise<Legend | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.post<ApiResponse<Legend>>('/Inventory/pta/legend/edit', {
      id: 0,
      name,
      generalCode,
      description,
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

export const updateLegend = async (id: number, name: string, generalCode: string, isActive: boolean, description?: string): Promise<Legend | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.post<ApiResponse<Legend>>('/Inventory/pta/legend/edit', {
      id,
      name,
      generalCode,
      description,
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
