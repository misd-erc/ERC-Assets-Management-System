import  axiosInstance  from '@/lib/axios';
import { SupplyItem } from '@/types/supply/supply';

// Placeholder service. Replace endpoints as needed.
export const getSupplies = async (): Promise<SupplyItem[]> => {
  const { data } = await axiosInstance.get('/supplies');
  return data;
};

export const createSupply = async (payload: Partial<SupplyItem>): Promise<SupplyItem> => {
  const { data } = await axiosInstance.post('/supplies', payload);
  return data;
};

export const patchSupply = async (id: string, payload: Partial<SupplyItem>): Promise<SupplyItem> => {
  const { data } = await axiosInstance.patch(`/supplies/${id}`, payload);
  return data;
};

export const removeSupply = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/supplies/${id}`);
};




