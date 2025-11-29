import { PPEAsset } from '@/types/asset/ppe';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const ppeApi = {
  // Batch upload PPE assets with file, ActionBySystemUserId and SessionKey params
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
      throw new Error('Failed to batch upload PPE assets');
    }

    return response.json();
  },

  // List PPE assets with pagination, search, optional date filters, and user/session auth
  list: async (params: {
    SearchString?: string;
    PageNumber: number;
    PageSize: number;
    StartDate?: string;
    EndDate?: string;
    ActionBySystemUserId: string;
    SessionKey: string;
    GroupName: string;
  }): Promise<{ items: PPEAsset[]; totalCount: number }> => {
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
      throw new Error('Failed to fetch PPE asset list');
    }

    const data = await response.json();

    return {
      items: data.data?.items || [],
      totalCount: data.data?.totalCount || 0,
    };
  },

  // Get PPE asset details by ID
  getById: async (
    id: string,
    actionBySystemUserId: string,
    sessionKey: string
  ): Promise<PPEAsset> => {
    const url =
      API_BASE_URL +
      '/Inventory/ppe/all/' +
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
      throw new Error('Failed to fetch PPE asset details');
    }

    return response.json();
  },
};
