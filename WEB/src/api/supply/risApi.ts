import  axiosInstance  from '@/lib/axios';
import { RISRequest } from '@/types/supply/ris';

export const getRISRequests = async (): Promise<RISRequest[]> => {
  const { data } = await axiosInstance.get('/ris');
  return data;
};

export const createRISRequest = async (payload: Partial<RISRequest>): Promise<RISRequest> => {
  const { data } = await axiosInstance.post('/ris', payload);
  return data;
};

export const patchRISRequest = async (id: string, payload: Partial<RISRequest>): Promise<RISRequest> => {
  const { data } = await axiosInstance.patch(`/ris/${id}`, payload);
  return data;
};

