import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  data: T;
}

interface PaginatedData<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export type AssetRequestStatus =
  | 'Pending'
  | 'UnderReview'
  | 'Assigned'
  | 'InProgress'
  | 'Resolved'
  | 'Rejected'
  | 'Completed';

export interface AssetLookupItem {
  id: number;
  group: string;
  propertyNumber: string;
  description?: string;
  serialNumber?: string;
  unitValue?: number;
}

export interface AssetRequestItem {
  id: number;
  requestId: number;
  ptaId?: number;
  propertyNumber: string;
  remarks: string;
  createdAt: string;
  item?: AssetLookupItem;
}

export interface AssetRequestHistory {
  id: number;
  requestId: number;
  actionType: string;
  fromStatus?: string;
  toStatus?: string;
  remarks?: string;
  updatedBySystemUserId: number;
  updatedByName?: string;
  actionAt: string;
}

export interface AssetRequestRecord {
  id: number;
  requestNumber: string;
  employeeSystemUserId: number;
  employeeName?: string;
  assignedCommitteeSystemUserId?: number;
  assignedCommitteeName?: string;
  assignedPersonnelSystemUserId?: number;
  assignedPersonnelName?: string;
  status: AssetRequestStatus;
  createdAt: string;
  updatedAt?: string;
  items: AssetRequestItem[];
  history: AssetRequestHistory[];
}

export interface AssetRequestProcessor {
  id: number;
  firstName?: string;
  lastName?: string;
  fullName: string;
  roleId?: number;
}

export interface CreateAssetRequestPayload {
  assignedCommitteeSystemUserId: number;
  items: Array<{
    ptaId?: number;
    propertyNumber: string;
    remarks: string;
  }>;
}

const mapRequest = (row: any): AssetRequestRecord => ({
  id: row.id,
  requestNumber: row.requestNumber,
  employeeSystemUserId: row.employeeSystemUserId,
  employeeName: row.employeeName,
  assignedCommitteeSystemUserId: row.assignedCommitteeSystemUserId,
  assignedCommitteeName: row.assignedCommitteeName,
  assignedPersonnelSystemUserId: row.assignedPersonnelSystemUserId,
  assignedPersonnelName: row.assignedPersonnelName,
  status: row.status,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  items: row.items || [],
  history: row.history || [],
});

export const lookupAssetByPropertyNumber = async (propertyNumber: string): Promise<AssetLookupItem | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.get<ApiResponse<AssetLookupItem>>('/AssetRequest/lookup/property', {
      params: {
        PropertyNumber: propertyNumber,
        ActionBySystemUserId: systemUserId,
        SessionKey: sessionKey,
      },
    });

    if (!response.data.success) return null;
    return response.data.data;
  } catch {
    return null;
  }
};

export const getAssetRequestProcessors = async (): Promise<AssetRequestProcessor[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.get<ApiResponse<AssetRequestProcessor[]>>('/AssetRequest/processors/all', {
      params: {
        ActionBySystemUserId: systemUserId,
        SessionKey: sessionKey,
      },
    });

    if (!response.data.success) return [];
    return response.data.data || [];
  } catch {
    return [];
  }
};

export const createAssetRequest = async (
  payload: CreateAssetRequestPayload,
): Promise<{ requestId: number; requestNumber: string } | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.post<ApiResponse<{ requestId: number; requestNumber: string }>>(
      '/AssetRequest/create',
      {
        ...payload,
        actionBySystemUserId: systemUserId,
        sessionKey,
      },
    );

    if (!response.data.success) return null;
    return response.data.data;
  } catch {
    return null;
  }
};

export const getMyAssetRequests = async (params?: {
  pageNumber?: number;
  pageSize?: number;
  status?: AssetRequestStatus;
}): Promise<{ items: AssetRequestRecord[]; totalCount: number }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.get<ApiResponse<PaginatedData<any>>>('/AssetRequest/my', {
      params: {
        ActionBySystemUserId: systemUserId,
        SessionKey: sessionKey,
        PageNumber: params?.pageNumber ?? 1,
        PageSize: params?.pageSize ?? 25,
        Status: params?.status,
      },
    });

    if (!response.data.success) return { items: [], totalCount: 0 };

    const data = response.data.data;
    return {
      items: (data.items || []).map(mapRequest),
      totalCount: data.totalCount ?? 0,
    };
  } catch {
    return { items: [], totalCount: 0 };
  }
};

export const getAllAssetRequests = async (params?: {
  pageNumber?: number;
  pageSize?: number;
  status?: AssetRequestStatus;
  mineOnly?: boolean;
}): Promise<{ items: AssetRequestRecord[]; totalCount: number }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.get<ApiResponse<PaginatedData<any>>>('/AssetRequest/all', {
      params: {
        ActionBySystemUserId: systemUserId,
        SessionKey: sessionKey,
        PageNumber: params?.pageNumber ?? 1,
        PageSize: params?.pageSize ?? 25,
        Status: params?.status,
        MineOnly: params?.mineOnly ?? false,
      },
    });

    if (!response.data.success) return { items: [], totalCount: 0 };

    const data = response.data.data;
    return {
      items: (data.items || []).map(mapRequest),
      totalCount: data.totalCount ?? 0,
    };
  } catch {
    return { items: [], totalCount: 0 };
  }
};

export const getAssetRequestById = async (requestId: number): Promise<AssetRequestRecord | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.get<ApiResponse<any>>(`/AssetRequest/${requestId}`, {
      params: {
        ActionBySystemUserId: systemUserId,
        SessionKey: sessionKey,
      },
    });

    if (!response.data.success) return null;
    return mapRequest(response.data.data);
  } catch {
    return null;
  }
};

export const updateAssetRequestAssignment = async (payload: {
  requestId: number;
  assignedCommitteeSystemUserId?: number;
  assignedPersonnelSystemUserId?: number;
  remarks?: string;
}): Promise<boolean> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.post<ApiResponse<any>>('/AssetRequest/assign', {
      ...payload,
      actionBySystemUserId: systemUserId,
      sessionKey,
    });
    return response.data.success;
  } catch {
    return false;
  }
};

export const updateAssetRequestStatus = async (payload: {
  requestId: number;
  status: AssetRequestStatus;
  remarks?: string;
}): Promise<boolean> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.post<ApiResponse<any>>('/AssetRequest/status', {
      ...payload,
      actionBySystemUserId: systemUserId,
      sessionKey,
    });
    return response.data.success;
  } catch {
    return false;
  }
};

export const addAssetRequestHistory = async (payload: {
  requestId: number;
  remarks: string;
}): Promise<boolean> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.post<ApiResponse<any>>('/AssetRequest/history/add', {
      ...payload,
      actionBySystemUserId: systemUserId,
      sessionKey,
    });
    return response.data.success;
  } catch {
    return false;
  }
};
