import { seApi } from '@/api/se';
import { SEAsset, SEMovementHistory, RRSPEntry } from '@/types/supply/se';

export class SEService {
  // Get all SE assets with optional filtering
  static async getAll(filters?: {
    category?: string;
    condition?: string;
    division?: string;
    status?: string;
    search?: string;
  }): Promise<SEAsset[]> {
    try {
      let assets = await seApi.getAll();

      if (filters) {
        assets = assets.filter(asset => {
          if (filters.category && asset.category !== filters.category) return false;
          if (filters.status && asset.status !== filters.status) return false;

          if (filters.condition || filters.division) {
            const currentBlock = asset.accountabilityBlocks.find(b => b.label === 'Current Holder');
            if (filters.condition && currentBlock?.condition !== filters.condition) return false;
            if (filters.division && currentBlock?.division_section !== filters.division) return false;
          }

          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            return (
              asset.se_property_number.toLowerCase().includes(searchLower) ||
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
      console.error('Error fetching SE assets:', error);
      throw error;
    }
  }

  // Get SE asset by ID
  static async getById(id: string): Promise<SEAsset> {
    try {
      return await seApi.getById(id);
    } catch (error) {
      console.error('Error fetching SE asset:', error);
      throw error;
    }
  }

  // Create new SE asset
  static async create(data: Omit<SEAsset, 'id' | 'dateEncoded'>): Promise<SEAsset> {
    try {
      // Validate required fields
      if (!data.se_property_number || !data.description) {
        throw new Error('SE Property number and description are required');
      }

      // Validate unit value is below 50,000
      if (data.unit_value >= 50000) {
        throw new Error('Unit value for Semi-Expendable must be below â‚±50,000');
      }

      // Validate date is not in the future
      const acquiredDate = new Date(data.date_acquired);
      if (acquiredDate > new Date()) {
        throw new Error('Date acquired cannot be in the future');
      }

      // Validate current holder exists
      const currentBlock = data.accountabilityBlocks.find(b => b.label === 'Current Holder');
      if (!currentBlock || (!currentBlock.plantilla_employee_id && !currentBlock.non_plantilla_employee_id)) {
        throw new Error('Current holder information is required');
      }

      return await seApi.create(data);
    } catch (error) {
      console.error('Error creating SE asset:', error);
      throw error;
    }
  }

  // Update SE asset
  static async update(id: string, data: Partial<SEAsset>): Promise<SEAsset> {
    try {
      return await seApi.update(id, data);
    } catch (error) {
      console.error('Error updating SE asset:', error);
      throw error;
    }
  }

  // Delete SE asset
  static async delete(id: string): Promise<void> {
    try {
      await seApi.delete(id);
    } catch (error) {
      console.error('Error deleting SE asset:', error);
      throw error;
    }
  }

  // Record movement
  static async recordMovement(assetId: string, movement: Omit<SEMovementHistory, 'id'>): Promise<SEMovementHistory> {
    try {
      return await seApi.recordMovement(assetId, movement);
    } catch (error) {
      console.error('Error recording movement:', error);
      throw error;
    }
  }

  // Record RRSP
  static async recordRRSP(assetId: string, rrsp: Omit<RRSPEntry, 'id'>): Promise<RRSPEntry> {
    try {
      // Validate RRSP data
      if (!rrsp.rrsp_number || !rrsp.employee_returning || !rrsp.findings) {
        throw new Error('RRSP number, employee returning, and findings are required');
      }

      if (['Not Working', 'Unserviceable'].includes(rrsp.condition_on_return) && !rrsp.findings) {
        throw new Error('Findings are required when condition is "Not Working" or "Unserviceable"');
      }

      return await seApi.recordRRSP(assetId, rrsp);
    } catch (error) {
      console.error('Error recording RRSP:', error);
      throw error;
    }
  }

  // Search SE assets
  static async search(query: string): Promise<SEAsset[]> {
    try {
      return await seApi.search(query);
    } catch (error) {
      console.error('Error searching SE assets:', error);
      throw error;
    }
  }

  // Export SE data
  static async exportData(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      return await seApi.export(format);
    } catch (error) {
      console.error('Error exporting SE data:', error);
      throw error;
    }
  }

  // Import SE data
  static async importData(file: File): Promise<{ imported: number; errors: string[] }> {
    try {
      return await seApi.import(file);
    } catch (error) {
      console.error('Error importing SE data:', error);
      throw error;
    }
  }

  // Download SE template
  static async downloadTemplate(): Promise<Blob> {
    try {
      return await seApi.downloadTemplate();
    } catch (error) {
      console.error('Error downloading SE template:', error);
      throw error;
    }
  }

  // Get SE statistics
  static async getStatistics(): Promise<{
    total: number;
    active: number;
    returned: number;
    lost: number;
    unserviceable: number;
    byCategory: Record<string, number>;
    byCondition: Record<string, number>;
    totalValue: number;
  }> {
    try {
      const assets = await this.getAll();

      const stats = {
        total: assets.length,
        active: 0,
        returned: 0,
        lost: 0,
        unserviceable: 0,
        byCategory: {} as Record<string, number>,
        byCondition: {} as Record<string, number>,
        totalValue: 0,
      };

      assets.forEach(asset => {
        // Count by status
        switch (asset.status) {
          case 'Active':
            stats.active++;
            break;
          case 'Returned':
            stats.returned++;
            break;
          case 'Lost':
            stats.lost++;
            break;
          case 'Unserviceable':
            stats.unserviceable++;
            break;
        }

        // Count by category
        stats.byCategory[asset.category] = (stats.byCategory[asset.category] || 0) + 1;

        // Count by current condition
        const currentBlock = asset.accountabilityBlocks.find(b => b.label === 'Current Holder');
        if (currentBlock) {
          stats.byCondition[currentBlock.condition] = (stats.byCondition[currentBlock.condition] || 0) + 1;
        }

        // Sum total value
        stats.totalValue += asset.unit_value;
      });

      return stats;
    } catch (error) {
      console.error('Error getting SE statistics:', error);
      throw error;
    }
  }
}

