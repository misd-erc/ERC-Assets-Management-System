import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  data: T;
}

/* -------------------------------------------------------------------------- */
/*  Shared types                                                                */
/* -------------------------------------------------------------------------- */

export interface PtaMovementRecord {
  id: number;
  ptaId: number;
  dateAssigned: string;
  ptrItrNumber: string;
  parIcsNumber: string;
  rrppeRrspNumber: string;
  status: 'NEW' | 'RENEW';
  plantillaEmployeeId: number;
  nonPlantillaEmployeeId: number;
  condition: string;
  actualOfficeId: number;
  actualDivisionId: number;
  isActive: boolean;
  isCurrent: boolean;
  // Joined / enriched fields returned by the API
  plantillaEmployeeName?: string;
  nonPlantillaEmployeeName?: string;
  itemDescription?: string;
  groupName?: 'PPE' | 'SE';
}

export interface PtaMovementPayload {
  id: number;
  ptaId: number;
  dateAssigned: string;
  ptrItrNumber: string;
  parIcsNumber: string;
  rrppeRrspNumber: string;
  status: string;
  plantillaEmployeeId: number;
  nonPlantillaEmployeeId: number;
  condition: string;
  actualOfficeId: number;
  actualDivisionId: number;
  isActive: boolean;
  isCurrent: boolean;
  actionBySystemUserId: number;
  sessionKey: string;
}

export interface PtaItem {
  id: number;
  description: string;
  groupName: 'PPE' | 'SE';
  propertyNumber?: string;
  category?: string;
  brand?: string;
  model?: string;
  condition?: string;
}

/* -------------------------------------------------------------------------- */
/*  GET next PAR number                                                         */
/* -------------------------------------------------------------------------- */

export const getNextParNumber = async (): Promise<string> => {
  const { systemUserId, sessionKey } = getAuthParams();
  try {
    const response = await axiosInstance.get<ApiResponse<string>>(
      '/Inventory/pta/movement/next-par-number',
      { params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey } }
    );
    if (!response.data.success) {
      console.error('[PTA] Failed to fetch next PAR number:', response.data.message);
      return '';
    }
    return response.data.data ?? '';
  } catch (error) {
    console.error('[PTA] Error fetching next PAR number:', error);
    return '';
  }
};

/* -------------------------------------------------------------------------- */
/*  GET movement list                                                           */
/*  Filters client-side: status IN (NEW, RENEW), parIcsNumber present,         */
/*  isCurrent = true                                                            */
/* -------------------------------------------------------------------------- */

export const listMovements = async (): Promise<PtaMovementRecord[]> => {
  const { systemUserId, sessionKey } = getAuthParams();
  try {
    const response = await axiosInstance.get<
      ApiResponse<{ items: PtaMovementRecord[]; totalCount: number } | PtaMovementRecord[]>
    >('/Inventory/pta/movement/list', {
      params: {
        ActionBySystemUserId: systemUserId,
        SessionKey: sessionKey,
        PageNumber: 1,
        PageSize: 1000,
      },
    });

    if (!response.data.success) {
      console.error('[PTA] Failed to fetch movement list:', response.data.message);
      return [];
    }

    const raw = response.data.data;
    const items: PtaMovementRecord[] = Array.isArray(raw)
      ? raw
      : (raw as any)?.items ?? [];

    // Keep only records that belong in the issuance view
    return items.filter(
      (r) =>
        (r.status === 'NEW' || r.status === 'RENEW') &&
        !!r.parIcsNumber &&
        r.isCurrent === true
    );
  } catch (error) {
    console.error('[PTA] Error fetching movement list:', error);
    return [];
  }
};

/* -------------------------------------------------------------------------- */
/*  POST create / edit movement   (id = 0 → create)                            */
/* -------------------------------------------------------------------------- */

export const editMovement = async (payload: PtaMovementPayload): Promise<boolean> => {
  try {
    const response = await axiosInstance.post<ApiResponse<unknown>>(
      '/Inventory/pta/movement/edit',
      payload
    );
    if (!response.data.success) {
      console.error('[PTA] Failed to edit movement:', response.data.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[PTA] Error editing movement:', error);
    return false;
  }
};

/* -------------------------------------------------------------------------- */
/*  GET SE / PPE items                                                          */
/* -------------------------------------------------------------------------- */

export const listSePpeItems = async (groupName?: 'PPE' | 'SE'): Promise<PtaItem[]> => {
  const { systemUserId, sessionKey } = getAuthParams();
  try {
    const response = await axiosInstance.get<ApiResponse<{ items: any[]; totalCount: number }>>(
      '/Inventory/pta/se-ppe/all',
      {
        params: {
          ActionBySystemUserId: systemUserId,
          SessionKey: sessionKey,
          PageNumber: 1,
          PageSize: 1000,
          ...(groupName ? { GroupName: groupName } : {}),
        },
      }
    );

    if (!response.data.success) {
      console.error('[PTA] Failed to fetch SE/PPE items:', response.data.message);
      return [];
    }

    return (response.data.data?.items ?? []).map((item: any): PtaItem => ({
      id: item.id,
      description:
        item.description ||
        item.itemDescription ||
        item.name ||
        `Item #${item.id}`,
      groupName: ((item.groupName || item.group_name || 'PPE') as 'PPE' | 'SE'),
      propertyNumber: item.propertyNumber || item.property_number || '',
      category: item.category || '',
      brand: item.brand || '',
      model: item.model || '',
      condition: item.condition || '',
    }));
  } catch (error) {
    console.error('[PTA] Error fetching SE/PPE items:', error);
    return [];
  }
};
