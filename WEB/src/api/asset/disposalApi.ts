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

/* -------------------------------------------------------------------------- */
/*  Shared types                                                                */
/* -------------------------------------------------------------------------- */

export interface DisposalPtaItem {
  id: number;
  group: string;
  propertyNumber: string;
  description: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  category?: string;
  unitValue: number;
  dateAcquired?: string;
}

export interface DisposalItem {
  id: number;
  disposalId: number;
  ptaId: number;
  pta: DisposalPtaItem;
}

export interface DisposalRecord {
  id: number;
  group: string;
  disposalNumber: string;
  reason: string;
  method: string;
  requestedBySystemUserId: number;
  requestedByName?: string;
  approvedBySystemUserId?: number;
  approvedByName?: string;
  dateRequested: string;
  dateApproved?: string;
  dateDisposed?: string;
  proceedAmount?: number;
  buyer?: string;
  remarks?: string;
  status: 'Pending' | 'Approved' | 'Disposed' | 'Rejected';
  isActive: boolean;
  createdAt: string;
  items: DisposalItem[];
}

export interface CreateDisposalPayload {
  id: number;
  group: string;
  reason: string;
  method: string;
  ptaIds: number[];
  buyer?: string;
  remarks?: string;
}

export interface MarkDisposedPayload {
  dateDisposed: string;
  proceedAmount?: number;
  buyer?: string;
  remarks?: string;
}

/* -------------------------------------------------------------------------- */
/*  GET                                                                        */
/* -------------------------------------------------------------------------- */

export const getDisposals = async (params?: {
  groupName?: string;
  status?: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}): Promise<{ items: DisposalRecord[]; totalCount: number }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.get<ApiResponse<PaginatedData<DisposalRecord>>>(
      '/Disposal/all',
      {
        params: {
          ActionBySystemUserId: systemUserId,
          SessionKey: sessionKey,
          GroupName: params?.groupName,
          Status: params?.status,
          SearchString: params?.searchString,
          PageNumber: params?.pageNumber ?? 1,
          PageSize: params?.pageSize ?? 100,
          StartDate: params?.startDate,
          EndDate: params?.endDate,
        },
      }
    );

    if (!response.data.success) {
      console.error('Failed to fetch disposals:', response.data.message);
      return { items: [], totalCount: 0 };
    }

    return {
      items: response.data.data?.items ?? [],
      totalCount: response.data.data?.totalCount ?? 0,
    };
  } catch (error) {
    console.error('Error fetching disposals:', error);
    return { items: [], totalCount: 0 };
  }
};

export const getDisposal = async (disposalId: number): Promise<DisposalRecord | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.get<ApiResponse<DisposalRecord[]>>(
      `/Disposal/${disposalId}`,
      {
        params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
      }
    );

    if (!response.data.success) {
      console.error('Failed to fetch disposal:', response.data.message);
      return null;
    }

    return response.data.data?.[0] ?? null;
  } catch (error) {
    console.error('Error fetching disposal:', error);
    return null;
  }
};

/* -------------------------------------------------------------------------- */
/*  POST                                                                       */
/* -------------------------------------------------------------------------- */

export const createDisposal = async (
  payload: CreateDisposalPayload
): Promise<{ disposalId: number; disposalNumber: string } | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.post<ApiResponse<{ disposalId: number; disposalNumber: string }>>(
      '/Disposal/create',
      {
        ...payload,
        actionBySystemUserId: systemUserId,
        sessionKey,
      }
    );

    if (!response.data.success) {
      console.error('Failed to create disposal:', response.data.message);
      return null;
    }

    return response.data.data;
  } catch (error) {
    console.error('Error creating disposal:', error);
    return null;
  }
};

export const approveDisposal = async (disposalId: number): Promise<boolean> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.post<ApiResponse<object>>(
      `/Disposal/approve/${disposalId}`,
      null,
      {
        params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
      }
    );

    return response.data.success;
  } catch (error) {
    console.error('Error approving disposal:', error);
    return false;
  }
};

export const markDisposed = async (
  disposalId: number,
  payload: MarkDisposedPayload
): Promise<boolean> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.post<ApiResponse<object>>(
      `/Disposal/mark-disposed/${disposalId}`,
      {
        ...payload,
        actionBySystemUserId: systemUserId,
        sessionKey,
      }
    );

    return response.data.success;
  } catch (error) {
    console.error('Error marking disposal as disposed:', error);
    return false;
  }
};

export const rejectDisposal = async (disposalId: number): Promise<boolean> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.post<ApiResponse<object>>(
      `/Disposal/reject/${disposalId}`,
      null,
      {
        params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
      }
    );

    return response.data.success;
  } catch (error) {
    console.error('Error rejecting disposal:', error);
    return false;
  }
};

/* -------------------------------------------------------------------------- */
/*  Available PTAs for disposal selection                                      */
/* -------------------------------------------------------------------------- */

export interface AvailablePtaAsset {
  id: number;
  group: string;
  propertyNumber: string;
  description: string;
  category: string;
  unitValue: number;
  dateAcquired?: string;
}

export const getAvailablePTAs = async (group: string): Promise<AvailablePtaAsset[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.get<ApiResponse<PaginatedData<any>>>(
      '/Inventory/pta/se-ppe/for-disposal',
      {
        params: {
          ActionBySystemUserId: systemUserId,
          SessionKey: sessionKey,
          GroupName: group,
          PageNumber: 1,
          PageSize: 1000,
        },
      }
    );

    if (!response.data.success) return [];

    const items: any[] = response.data.data?.items ?? [];
    return items.map(pta => ({
      id: Number(pta.id),
      group: pta.group ?? group,
      propertyNumber: pta.propertyNumber ?? '',
      description: pta.description ?? '',
      category:
        typeof pta.category === 'object' && pta.category
          ? (pta.category.name ?? '')
          : (pta.category ?? ''),
      unitValue: pta.unitValue ?? 0,
      dateAcquired: pta.dateAcquired,
    }));
  } catch (error) {
    console.error('Error fetching available PTAs:', error);
    return [];
  }
};

/* -------------------------------------------------------------------------- */
/*  DELETE                                                                     */
/* -------------------------------------------------------------------------- */

export const deleteDisposal = async (disposalId: number): Promise<boolean> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.delete<ApiResponse<object>>(
      `/Disposal/delete/${disposalId}`,
      {
        params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
      }
    );

    return response.data.success;
  } catch (error) {
    console.error('Error deleting disposal:', error);
    return false;
  }
};
