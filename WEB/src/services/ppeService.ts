import { ppeApi } from '@/api/ppe';
import { PPEAsset } from '@/types/asset/ppe';

export class PPEService {
  // Get all PPE assets with optional filtering
  static async getAll(filters?: {
    category?: string;
    condition?: string;
    division?: string;
    search?: string;
  }): Promise<PPEAsset[]> {
    try {
      // API not ready, return empty array for now
      let assets: PPEAsset[] = [];

      if (filters) {
        assets = assets.filter(asset => {
          if (filters.category && asset.category !== filters.category) return false;
          if (filters.condition && asset.condition !== filters.condition) return false;
          if (filters.division && asset.actual_division !== filters.division) return false;
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            return (
              asset.property_number.toLowerCase().includes(searchLower) ||
              asset.description.toLowerCase().includes(searchLower) ||
              asset.serial_number?.toLowerCase().includes(searchLower) ||
              asset.brand?.toLowerCase().includes(searchLower) ||
              asset.model?.toLowerCase().includes(searchLower)
            );
          }
          return true;
        });
      }

      return assets;
    } catch (error) {
      console.error('Error fetching PPE assets:', error);
      throw error;
    }
  }

  // Get PPE asset by ID
  static async getById(id: string): Promise<PPEAsset> {
    try {
      return await ppeApi.getById(id);
    } catch (error) {
      console.error('Error fetching PPE asset:', error);
      throw error;
    }
  }

  // Create new PPE asset
  static async create(data: Omit<PPEAsset, 'id' | 'dateEncoded'>): Promise<PPEAsset> {
    try {
      // Validate required fields
      if (!data.property_number || !data.description || !data.date_acquired) {
        throw new Error('Property number, description, and date acquired are required');
      }

      // Validate unit value is positive
      if (data.unit_value <= 0) {
        throw new Error('Unit value must be greater than 0');
      }

      // Validate date is not in the future
      const acquiredDate = new Date(data.date_acquired);
      if (acquiredDate > new Date()) {
        throw new Error('Date acquired cannot be in the future');
      }

      return await ppeApi.create(data);
    } catch (error) {
      console.error('Error creating PPE asset:', error);
      throw error;
    }
  }

  // Update PPE asset
  static async update(id: string, data: Partial<PPEAsset>): Promise<PPEAsset> {
    try {
      return await ppeApi.update(id, data);
    } catch (error) {
      console.error('Error updating PPE asset:', error);
      throw error;
    }
  }

  // Delete PPE asset
  static async delete(id: string): Promise<void> {
    try {
      await ppeApi.delete(id);
    } catch (error) {
      console.error('Error deleting PPE asset:', error);
      throw error;
    }
  }

  // Search PPE assets
  static async search(query: string): Promise<PPEAsset[]> {
    try {
      return await ppeApi.search(query);
    } catch (error) {
      console.error('Error searching PPE assets:', error);
      throw error;
    }
  }

  // Export PPE data
  static async exportData(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      return await ppeApi.export(format);
    } catch (error) {
      console.error('Error exporting PPE data:', error);
      throw error;
    }
  }

  // Import PPE data
  static async importData(file: File): Promise<{ imported: number; errors: string[] }> {
    try {
      return await ppeApi.import(file);
    } catch (error) {
      console.error('Error importing PPE data:', error);
      throw error;
    }
  }

  // Get PPE statistics
  static async getStatistics(): Promise<{
    total: number;
    byCategory: Record<string, number>;
    byCondition: Record<string, number>;
    totalValue: number;
  }> {
    try {
      const assets = await this.getAll();

      const stats = {
        total: assets.length,
        byCategory: {} as Record<string, number>,
        byCondition: {} as Record<string, number>,
        totalValue: 0,
      };

      assets.forEach(asset => {
        // Count by category
        stats.byCategory[asset.category] = (stats.byCategory[asset.category] || 0) + 1;

        // Count by condition
        stats.byCondition[asset.condition] = (stats.byCondition[asset.condition] || 0) + 1;

        // Sum total value
        stats.totalValue += asset.unit_value;
      });

      return stats;
    } catch (error) {
      console.error('Error getting PPE statistics:', error);
      throw error;
    }
  }
}

