import { seApi } from '@/api/asset/se';
import { SEAsset } from '@/types/supply/se';

export class SEService {
  static async getAll(filters?: {
    search?: string;
    PageNumber?: number;
    PageSize?: number;
    StartDate?: string;
    EndDate?: string;
    EmployeeId?: number;
  }): Promise<{ items: SEAsset[]; totalCount: number }> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      const response = await seApi.list({
        SearchString: filters?.search || '',
        PageNumber: filters?.PageNumber || 1,
        PageSize: filters?.PageSize || 10,
        StartDate: filters?.StartDate,
        EndDate: filters?.EndDate,
        EmployeeId: filters?.EmployeeId,
        ActionBySystemUserId: actionBySystemUserId,
        SessionKey: sessionKey,
        GroupName: 'SE',
      });

      return response;
    } catch (error) {
      console.error('Error fetching SE assets:', error);
      throw error;
    }
  }

  static async getById(id: string): Promise<SEAsset> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';
      
      const response = await seApi.getById(id, actionBySystemUserId, sessionKey);

      if (!response || !response.id) {
        throw new Error('No SE asset found in response data or invalid data format');
      }

      return response;
    } catch (error) {
      console.error('Error fetching SE asset:', error);
      throw error;
    }
  }

  static async create(data: Partial<SEAsset>): Promise<SEAsset> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      const apiData: Partial<SEAsset> = {
        propertyNumber: data.propertyNumber,
        category: data.category,
        legend: data.legend,
        description: data.description,
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber,
        parts: data.parts || [],
        unitOfMeasurement: data.unitOfMeasurement,
        unitValue: data.unitValue,
        dateAcquired: data.dateAcquired,
        estimatedUsefulLife: data.estimatedUsefulLife || 0,
        movements: data.movements || [],
      };

      const apiResponse = await seApi.create(
        apiData,
        actionBySystemUserId,
        sessionKey
      );

      if (!apiResponse.success || !apiResponse.data) {
        throw new Error('Failed to create SE asset: ' + (apiResponse.message || 'Unknown error'));
      }

      return apiResponse.data;
    } catch (error) {
      console.error('Error creating SE asset:', error);
      throw error;
    }
  }

  static async update(id: string, data: Partial<SEAsset>): Promise<SEAsset> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      const apiData: Partial<SEAsset> = {
        propertyNumber: data.propertyNumber,
        category: data.category,
        legend: data.legend,
        description: data.description,
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber,
        parts: data.parts || [],
        unitOfMeasurement: data.unitOfMeasurement,
        unitValue: data.unitValue,
        dateAcquired: data.dateAcquired,
        estimatedUsefulLife: data.estimatedUsefulLife || 0,
        movements: data.movements || [],
      };

      const apiResponse = await seApi.update(
        id,
        apiData,
        actionBySystemUserId,
        sessionKey
      );

      if (!apiResponse.success || !apiResponse.data) {
        throw new Error('Failed to update SE asset: ' + (apiResponse.message || 'Unknown error'));
      }

      return apiResponse.data;
    } catch (error) {
      console.error('Error updating SE asset:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      console.warn('Delete operation not supported for SE assets via this service');
      // SE assets may have a different delete mechanism through the API
      // Or they may not support direct deletion
    } catch (error) {
      console.error('Error deleting SE asset:', error);
      throw error;
    }
  }

  static async batchUpload(file: File, actionBySystemUserId: string, sessionKey: string): Promise<{ success: boolean; code: string; message: string; data: string }> {
    try {
      return await seApi.batchUpload(file, actionBySystemUserId, sessionKey);
    } catch (error) {
      console.error('Error during SE batch upload:', error);
      throw error;
    }
  }
}
