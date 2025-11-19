import { SEAsset, SEMovementHistory, RRSPEntry } from '@/types/supply/se';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const seApi = {
  // Get all SE assets
  // getAll: async (): Promise<SEAsset[]> => {
  //   const response = await fetch(`${API_BASE_URL}/se`);
  //   if (!response.ok) {
  //     throw new Error('Failed to fetch SE assets');
  //   }
  //   return response.json();
  // },

  // Get SE asset by ID
  getById: async (id: string): Promise<SEAsset> => {
    const response = await fetch(`${API_BASE_URL}/se/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch SE asset');
    }
    return response.json();
  },

  // Create new SE asset
  create: async (data: Omit<SEAsset, 'id' | 'dateEncoded'>): Promise<SEAsset> => {
    const response = await fetch(`${API_BASE_URL}/se`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create SE asset');
    }
    return response.json();
  },

  // Update SE asset
  update: async (id: string, data: Partial<SEAsset>): Promise<SEAsset> => {
    const response = await fetch(`${API_BASE_URL}/se/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update SE asset');
    }
    return response.json();
  },

  // Delete SE asset
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/se/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete SE asset');
    }
  },

  // Record movement
  recordMovement: async (assetId: string, movement: Omit<SEMovementHistory, 'id'>): Promise<SEMovementHistory> => {
    const response = await fetch(`${API_BASE_URL}/se/${assetId}/movement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(movement),
    });
    if (!response.ok) {
      throw new Error('Failed to record movement');
    }
    return response.json();
  },

  // Record RRSP
  recordRRSP: async (assetId: string, rrsp: Omit<RRSPEntry, 'id'>): Promise<RRSPEntry> => {
    const response = await fetch(`${API_BASE_URL}/se/${assetId}/rrsp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rrsp),
    });
    if (!response.ok) {
      throw new Error('Failed to record RRSP');
    }
    return response.json();
  },

  // Search SE assets
  search: async (query: string): Promise<SEAsset[]> => {
    const response = await fetch(`${API_BASE_URL}/se/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search SE assets');
    }
    return response.json();
  },

  // Export SE data
  export: async (format: 'csv' | 'excel' = 'csv'): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/se/export?format=${format}`);
    if (!response.ok) {
      throw new Error('Failed to export SE data');
    }
    return response.blob();
  },

  // Import SE data
  import: async (file: File): Promise<{ imported: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/se/import`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to import SE data');
    }
    return response.json();
  },

  // Download SE template
  downloadTemplate: async (): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/se/template`);
    if (!response.ok) {
      throw new Error('Failed to download SE template');
    }
    return response.blob();
  },
};

