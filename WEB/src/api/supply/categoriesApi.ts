import axiosInstance from '@/lib/axios';

// Inventory API interfaces
export interface InventoryCategory {
  id: number;
  name: string;
  generalCode: string;
  isActive: boolean;
  // Add other fields if needed
}

export interface GetCategoriesParams {
  SearchString?: string;
  PageNumber?: number;
  PageSize?: number;
  StartDate?: string;
  EndDate?: string;
  ActionBySystemUserId: number;
  SessionKey: string;
}

export interface EditCategoryRequest {
  id: number;
  name: string;
  generalCode: string;
  isActive: boolean;
  actionBySystemUserId: number;
  sessionKey: string;
}

// Inventory API functions
export const getInventoryCategories = async (params: GetCategoriesParams): Promise<InventoryCategory[]> => {
  const { data } = await axiosInstance.get('/Inventory/pta/category/all', { params });
  // API returns wrapped response: { data: { items: [...], totalCount: number } }
  return data.data?.items || [];
};

export const createInventoryCategory = async (payload: Omit<EditCategoryRequest, 'id'>): Promise<InventoryCategory> => {
  const { data } = await axiosInstance.post('/Inventory/pta/category/edit', payload);
  return data.data || data; // Handle both wrapped and direct responses
};

export const editInventoryCategory = async (payload: EditCategoryRequest): Promise<InventoryCategory | null> => {
  const { data } = await axiosInstance.post('/Inventory/pta/category/edit', payload);
  // API might return success=true with no data, or it might return the updated category
  return (data.data as InventoryCategory) || (data as InventoryCategory) || null;
};

export const deleteInventoryCategory = async (id: number, actionBySystemUserId: number, sessionKey: string): Promise<void> => {
  await axiosInstance.delete(`/Inventory/pta/category/delete/${id}`, {
    params: { ActionBySystemUserId: actionBySystemUserId, SessionKey: sessionKey }
  });
};
