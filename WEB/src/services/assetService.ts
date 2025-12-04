import { PPEService } from '@/services/ppeService';
import { SEService } from '@/services/seService';
import { PPEAsset } from '@/types/asset/PPEAsset';
import { SEAsset } from '@/types/supply/se';

export type AssetType = 'ppe' | 'se';

export class AssetService {
  static async getAll(type: AssetType, filters?: any): Promise<{ items: (PPEAsset | SEAsset)[]; totalCount: number }> {
    if (type === 'ppe') {
      return await PPEService.getAll(filters);
    } else {
      return await SEService.getAll(filters);
    }
  }

  static async getById(type: AssetType, id: string): Promise<PPEAsset | SEAsset> {
    if (type === 'ppe') {
      return await PPEService.getById(id);
    } else {
      return await SEService.getById(id);
    }
  }

  static async create(type: AssetType, data: any): Promise<PPEAsset | SEAsset> {
    if (type === 'ppe') {
      return await PPEService.create(data);
    } else {
      return await SEService.create(data);
    }
  }

  static async update(type: AssetType, id: string, data: any): Promise<PPEAsset | SEAsset> {
    if (type === 'ppe') {
      return await PPEService.update(id, data);
    } else {
      return await SEService.update(id, data);
    }
  }

  static async delete(type: AssetType, id: string): Promise<void> {
    if (type === 'ppe') {
      return await PPEService.delete(id);
    } else {
      return await SEService.delete(id);
    }
  }

  static async batchUpload(type: AssetType, file: File, actionBySystemUserId: string, sessionKey: string): Promise<{ success: boolean; code: string; message: string; data: string }> {
    if (type === 'ppe') {
      return await PPEService.batchUpload(file, actionBySystemUserId, sessionKey);
    } else {
      return await SEService.batchUpload(file, actionBySystemUserId, sessionKey);
    }
  }
}

