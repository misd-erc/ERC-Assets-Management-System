import axiosInstance from '@/lib/axios';
import { Asset } from '@/types';

export const getAssets = async (): Promise<Asset[]> => {
  // const response = await axiosInstance.get('/assets');
  // return response.data;

  // Mock implementation
  return [
    { id: '1', name: 'Laptop', category: 'IT Equipment', status: 'Active', location: 'IT Department' },
    { id: '2', name: 'Printer', category: 'Office Equipment', status: 'Active', location: 'Admin Office' },
  ];
};

export const createAsset = async (asset: Omit<Asset, 'id'>): Promise<Asset> => {
  // const response = await axiosInstance.post('/assets', asset);
  // return response.data;

  // Mock implementation
  const newAsset: Asset = { ...asset, id: Date.now().toString() };
  return newAsset;
};

export const updateAsset = async (id: string, updates: Partial<Asset>): Promise<Asset> => {
  // const response = await axiosInstance.put(`/assets/${id}`, updates);
  // return response.data;

  // Mock implementation
  const asset = await getAssets().then(assets => assets.find(a => a.id === id));
  if (!asset) throw new Error('Asset not found');
  return { ...asset, ...updates };
};

export const deleteAsset = async (id: string): Promise<void> => {
  // await axiosInstance.delete(`/assets/${id}`);

  // Mock implementation
  return Promise.resolve();
};




