import axiosInstance from '@/lib/axios';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/supply/Category';

export const getCategories = async (): Promise<Category[]> => {
  const { data } = await axiosInstance.get('/categories');
  return data;
};

export const getCategoryById = async (id: string): Promise<Category> => {
  const { data } = await axiosInstance.get(`/categories/${id}`);
  return data;
};

export const createCategory = async (payload: CreateCategoryRequest): Promise<Category> => {
  const { data } = await axiosInstance.post('/categories', payload);
  return data;
};

export const updateCategory = async (id: string, payload: UpdateCategoryRequest): Promise<Category> => {
  const { data } = await axiosInstance.put(`/categories/${id}`, payload);
  return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/categories/${id}`);
};
