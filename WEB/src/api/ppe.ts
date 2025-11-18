import { PPEAsset } from '@/types/asset/ppe';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const ppeApi = {
  // Get all PPE assets
  getAll: async (): Promise<PPEAsset[]> => {
    const response = await fetch(`${API_BASE_URL}/ppe`);
    if (!response.ok) {
      throw new Error('Failed to fetch PPE assets');
    }
    return response.json();
  },

  // Get PPE asset by ID
  getById: async (id: string): Promise<PPEAsset> => {
    const response = await fetch(`${API_BASE_URL}/ppe/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch PPE asset');
    }
    return response.json();
  },

  // Create new PPE asset
  create: async (data: Omit<PPEAsset, 'id' | 'dateEncoded'>): Promise<PPEAsset> => {
    const response = await fetch(`${API_BASE_URL}/ppe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create PPE asset');
    }
    return response.json();
  },

  // Update PPE asset
  update: async (id: string, data: Partial<PPEAsset>): Promise<PPEAsset> => {
    const response = await fetch(`${API_BASE_URL}/ppe/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update PPE asset');
    }
    return response.json();
  },

  // Delete PPE asset
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/ppe/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete PPE asset');
    }
  },

  // Search PPE assets
  search: async (query: string): Promise<PPEAsset[]> => {
    const response = await fetch(`${API_BASE_URL}/ppe/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search PPE assets');
    }
    return response.json();
  },

  // Export PPE data
  export: async (format: 'csv' | 'excel' = 'csv'): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/ppe/export?format=${format}`);
    if (!response.ok) {
      throw new Error('Failed to export PPE data');
    }
    return response.blob();
  },

  // Import PPE data
  import: async (file: File): Promise<{ imported: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/ppe/import`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to import PPE data');
    }
    return response.json();
  },
};

