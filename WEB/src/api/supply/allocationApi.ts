import axiosInstance from '../../lib/axios';
import { ServiceAllocation } from '../../types/supply/allocation';

export const getAllocations = async (): Promise<ServiceAllocation[]> => {
  const { data } = await axiosInstance.get('/allocations');
  return data;
};

export const createAllocation = async (payload: Partial<ServiceAllocation>): Promise<ServiceAllocation> => {
  const { data } = await axiosInstance.post('/allocations', payload);
  return data;
};

export const patchAllocation = async (id: string, payload: Partial<ServiceAllocation>): Promise<ServiceAllocation> => {
  const { data } = await axiosInstance.patch(`/allocations/${id}`, payload);
  return data;
};
