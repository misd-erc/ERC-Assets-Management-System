import { SEAsset } from '@/types/supply/se';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const seApi = {
  // Batch upload SE assets with file, ActionBySystemUserId and SessionKey params
  batchUpload: async (
    file: File,
    actionBySystemUserId: string,
    sessionKey: string
  ): Promise<{ success: boolean; code: string; message: string; data: string }> => {
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

  // Get SE asset details by ID
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

  // Get SE asset details by ID using unified endpoint
  getByIdUnified: async (
    id: string,
    actionBySystemUserId: string,
    sessionKey: string
  ): Promise<SEAsset> => {
    const url =
      API_BASE_URL +
      '/Inventory/pta/se-ppe/all/' +
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

  // Edit SE-PPE asset
  editSePpe: async (data: {
    id: number;
    ptaId: number;
    name: string;
    serialNumber: string;
    isActive: boolean;
    actionBySystemUserId: number;
    sessionKey: string;
  }): Promise<any> => {
    const url = API_BASE_URL + '/Inventory/pta/se-ppe/edit';

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to edit SE-PPE asset');
    }

    return response.json();
  },

  // Edit part
  editPart: async (data: {
    id: number;
    ptaId: number;
    name: string;
    serialNumber: string;
    isActive: boolean;
    actionBySystemUserId: number;
    sessionKey: string;
  }): Promise<any> => {
    const url = API_BASE_URL + '/Inventory/pta/part/edit';

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to edit part');
    }

    return response.json();
  },

  // Edit movement
  editMovement: async (data: {
    id: number;
    ptaId: number;
    dateAssigned: string;
    parItrNumber: string;
    plantillaEmployeeId: number;
    nonPlantillaEmployeeId: number;
    condition: string;
    actualOfficeId: number;
    actualDivisionId: number;
    isActive: boolean;
    actionBySystemUserId: number;
    sessionKey: string;
  }): Promise<any> => {
    const url = API_BASE_URL + '/Inventory/pta/movement/edit';

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to edit movement');
    }

    return response.json();
  },

  // Create new SE asset
  create: async (data: {
    propertyNumber: string;
    category: string;
    legend: string;
    description: string;
    brand: string;
    model: string;
    serialNumber: string;
    parts: any[];
    unitOfMeasurement: string;
    unitValue: number;
    dateAcquired: string;
    estimatedUsefulLife: number;
    group: string;
    movements: any[];
    actionBySystemUserId: string;
    sessionKey: string;
  }): Promise<SEAsset> => {
    const url = API_BASE_URL + '/Inventory/pta/se-ppe/edit';

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create SE asset');
    }

    return response.json();
  },

  // Update SE asset
  update: async (data: {
    id: string;
    propertyNumber: string;
    category: string;
    legend: string;
    description: string;
    brand: string;
    model: string;
    serialNumber: string;
    parts: any[];
    unitOfMeasurement: string;
    unitValue: number;
    dateAcquired: string;
    estimatedUsefulLife: number;
    movements: any[];
    actionBySystemUserId: string;
    sessionKey: string;
  }): Promise<SEAsset> => {
    const url = API_BASE_URL + '/Inventory/pta/se-ppe/update';

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update SE asset');
    }

    return response.json();
  },
};
