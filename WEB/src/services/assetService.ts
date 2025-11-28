import axios from '@/lib/axios';
import { PPEAsset } from '@/types/asset/PPEAsset';
import { SEAsset } from '@/types/supply/se';

export type AssetType = 'ppe' | 'se';

export class AssetService {
  static async getAll(type: AssetType, filters?: any): Promise<{ items: (PPEAsset | SEAsset)[], totalCount: number }> {
    const response = await axios.get(`/${type}`, { params: filters });
    return response.data;
  }

  static async getById(type: AssetType, id: string): Promise<PPEAsset | SEAsset> {
    const response = await axios.get(`/${type}/${id}`);
    return response.data;
  }

  static async create(type: AssetType, data: any): Promise<PPEAsset | SEAsset> {
    const response = await axios.post(`/${type}`, data);
    return response.data;
  }

  static async update(type: AssetType, id: string, data: any): Promise<PPEAsset | SEAsset> {
    const response = await axios.put(`/${type}/${id}`, data);
    return response.data;
  }

  static async delete(type: AssetType, id: string): Promise<void> {
    await axios.delete(`/${type}/${id}`);
  }

  static async batchUpload(type: AssetType, file: File, actionBySystemUserId: string, sessionKey: string): Promise<{ imported: number, errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('actionBySystemUserId', actionBySystemUserId);
    formData.append('sessionKey', sessionKey);

    const response = await axios.post(`/${type}/batch-upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }
}
