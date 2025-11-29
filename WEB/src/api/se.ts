﻿import { SEAsset, SEMovementHistory, RRSPEntry } from '@/types/supply/se';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const seApi = {
  // Get all SE assets
  // getAll: async (): Promise<SEAsset[]> => {
  //   const response = await fetch(`${API_BASE_URL}/se`);
  //   if (!response.ok) {
  //     throw new Error('Failed to fetch SE assets');
  //   }
  //   return response.json();
  // },

  // Batch upload SE assets with file, ActionBySystemUserId and SessionKey params
  batchUpload: async (
    file: File,
    actionBySystemUserId: string,
    sessionKey: string
  ): Promise<{ imported: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);

    const url =
      API_BASE_URL +
      '/Inventory/pta/batch-upload?ActionBySystemUserId=' +
      actionBySystemUserId +
      '&SessionKey=' +
      encodeURIComponent(sessionKey);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to batch upload SE assets');
    }

    return response.json();
  },

  // List SE assets with pagination, search, optional date filters, and user/session auth
  list: async (params: {
    SearchString?: string;
    PageNumber: number;
    PageSize: number;
    StartDate?: string;
    EndDate?: string;
    ActionBySystemUserId: string;
    SessionKey: string;
    GroupName: string;
  }): Promise<{ items: SEAsset[]; totalCount: number }> => {
    const query = new URLSearchParams();

    if (params.SearchString) {
      query.append('SearchString', params.SearchString);
    }
    query.append('PageNumber', params.PageNumber.toString());
    query.append('PageSize', params.PageSize.toString());

    if (params.StartDate) {
      query.append('StartDate', params.StartDate);
    }

    if (params.EndDate) {
      query.append('EndDate', params.EndDate);
    }

    query.append('ActionBySystemUserId', params.ActionBySystemUserId);
    query.append('SessionKey', params.SessionKey);
    query.append('GroupName', params.GroupName);

    const url = API_BASE_URL + '/Inventory/pta/se-ppe/all?' + query.toString();

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch SE asset list');
    }

    const data = await response.json();

    return {
      items: data.data?.items || [],
      totalCount: data.data?.totalCount || 0,
    };
  },

  // Get SE asset by ID
  getById: async (
    id: string,
    actionBySystemUserId: string,
    sessionKey: string
  ): Promise<SEAsset> => {
    const url =
      API_BASE_URL +
      '/Inventory/se/all/' +
      id +
      '?ActionBySystemUserId=' +
      actionBySystemUserId +
      '&SessionKey=' +
      encodeURIComponent(sessionKey);

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch SE asset details');
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

