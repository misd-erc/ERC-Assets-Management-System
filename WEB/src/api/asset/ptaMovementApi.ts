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
  unitOfMeasurement?: string;
  unitValue?: number;
  dateAcquired?: string;
}

/* -------------------------------------------------------------------------- */
/*  GET next PAR number                                                         */
/* -------------------------------------------------------------------------- */

export const getNextParNumber = async (): Promise<string> => {
  const { systemUserId, sessionKey } = getAuthParams();
  try {
    const response = await axiosInstance.get<ApiResponse<{ parNumber: string; sequence: number } | string>>(
      '/Inventory/pta/movement/next-par-number',
      { params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey } }
    );
    if (!response.data.success) {
      console.error('[PTA] Failed to fetch next PAR number:', response.data.message);
      return '';
    }
    const data = response.data.data;
    if (data && typeof data === 'object' && 'parNumber' in data) {
      return data.parNumber ?? '';
    }
    return (data as string) ?? '';
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
/*  POST bulk edit movements                                                   */
/* -------------------------------------------------------------------------- */

export type MovementItemPayload = Omit<PtaMovementPayload, 'actionBySystemUserId' | 'sessionKey'>;

export const editMovementBulk = async (movements: MovementItemPayload[]): Promise<boolean> => {
  if (movements.length === 0) return true;
  const { systemUserId, sessionKey } = getAuthParams();
  try {
    const response = await axiosInstance.post<ApiResponse<unknown>>(
      '/Inventory/pta/movement/edit-bulk',
      {
        movements,
        actionBySystemUserId: systemUserId,
        sessionKey,
      }
    );
    if (!response.data.success) {
      console.error('[PTA] Failed to bulk edit movements:', response.data.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[PTA] Error bulk editing movements:', error);
    return false;
  }
};

/* -------------------------------------------------------------------------- */
/*  DELETE movement (soft delete)                                              */
/* -------------------------------------------------------------------------- */

export const deleteMovement = async (id: number): Promise<boolean> => {
  const { systemUserId, sessionKey } = getAuthParams();
  try {
    const response = await axiosInstance.delete<ApiResponse<unknown>>(
      `/Inventory/pta/movement/delete/${id}`,
      { params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey } }
    );
    // Note: the backend returns HTTP 200 with success=true even when it couldn't
    // delete the record — it only signals failure via the message text, so check that too.
    const failedSilently = (response.data.message || '').toLowerCase().includes('unable to delete');
    if (!response.data.success || failedSilently) {
      console.error('[PTA] Failed to delete movement:', response.data.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[PTA] Error deleting movement:', error);
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

/* -------------------------------------------------------------------------- */
/*  GET SE / PPE items with NO movements (available for new issuance)          */
/* -------------------------------------------------------------------------- */

export const listSePpeItemsNoMovement = async (groupName?: 'PPE' | 'SE'): Promise<PtaItem[]> => {
  const { systemUserId, sessionKey } = getAuthParams();
  try {
    // PageSize was hardcoded at 1000, silently truncating results once on-stock counts
    // grew past that (SE alone can be 2000+) — probe totalCount first, then fetch it all.
    const probe = await axiosInstance.get<ApiResponse<{ items: any[]; totalCount: number }>>(
      '/Inventory/pta/se-ppe/no-movement',
      {
        params: {
          ActionBySystemUserId: systemUserId,
          SessionKey: sessionKey,
          PageNumber: 1,
          PageSize: 1,
          ...(groupName ? { GroupName: groupName } : {}),
        },
      }
    );
    const totalCount = probe.data.data?.totalCount ?? 0;
    if (!probe.data.success || totalCount === 0) return [];

    const response = await axiosInstance.get<ApiResponse<{ items: any[]; totalCount: number }>>(
      '/Inventory/pta/se-ppe/no-movement',
      {
        params: {
          ActionBySystemUserId: systemUserId,
          SessionKey: sessionKey,
          PageNumber: 1,
          PageSize: totalCount,
          ...(groupName ? { GroupName: groupName } : {}),
        },
      }
    );

    if (!response.data.success) {
      console.error('[PTA] Failed to fetch SE/PPE items (no movement):', response.data.message);
      return [];
    }

    return (response.data.data?.items ?? []).map((item: any): PtaItem => ({
      id: item.id,
      description:
        item.description ||
        item.itemDescription ||
        item.name ||
        `Item #${item.id}`,
      groupName: ((item.group || item.groupName || item.group_name || 'PPE') as 'PPE' | 'SE'),
      propertyNumber: item.propertyNumber || item.property_number || '',
      category: typeof item.category === 'object' ? item.category?.name ?? '' : item.category ?? '',
      brand: item.brand || '',
      model: item.model || '',
      condition: item.condition || '',
      unitOfMeasurement: item.unitOfMeasurement || '',
      unitValue: item.unitValue ?? 0,
      dateAcquired: item.dateAcquired || '',
    }));
  } catch (error) {
    console.error('[PTA] Error fetching SE/PPE items (no movement):', error);
    return [];
  }
};

/** Lightweight count of SE/PPE items with no movement yet (available for NEW issuance) — avoids fetching full item rows just to display a number. */
export const getSePpeNoMovementCount = async (groupName: 'PPE' | 'SE'): Promise<number> => {
  const { systemUserId, sessionKey } = getAuthParams();
  try {
    const response = await axiosInstance.get<ApiResponse<{ items: any[]; totalCount: number }>>(
      '/Inventory/pta/se-ppe/no-movement',
      {
        params: {
          ActionBySystemUserId: systemUserId,
          SessionKey: sessionKey,
          PageNumber: 1,
          PageSize: 1,
          GroupName: groupName,
        },
      }
    );
    return response.data.success ? (response.data.data?.totalCount ?? 0) : 0;
  } catch (error) {
    console.error('[PTA] Error fetching SE/PPE no-movement count:', error);
    return 0;
  }
};

/* -------------------------------------------------------------------------- */
/*  GET SE / PPE items WITH movements (issued at least once)                   */
/* -------------------------------------------------------------------------- */

/** Items that have at least one movement record — i.e. issued (matches the "on stock" definition used by listSePpeItemsNoMovement, inverted). */
export const listSePpeItemsWithMovement = async (groupName?: 'PPE' | 'SE'): Promise<PtaItem[]> => {
  const { systemUserId, sessionKey } = getAuthParams();
  try {
    const probe = await axiosInstance.get<ApiResponse<{ items: any[]; totalCount: number }>>(
      '/Inventory/pta/se-ppe/with-movement',
      {
        params: {
          ActionBySystemUserId: systemUserId,
          SessionKey: sessionKey,
          PageNumber: 1,
          PageSize: 1,
          ...(groupName ? { GroupName: groupName } : {}),
        },
      }
    );
    const totalCount = probe.data.data?.totalCount ?? 0;
    if (!probe.data.success || totalCount === 0) return [];

    const response = await axiosInstance.get<ApiResponse<{ items: any[]; totalCount: number }>>(
      '/Inventory/pta/se-ppe/with-movement',
      {
        params: {
          ActionBySystemUserId: systemUserId,
          SessionKey: sessionKey,
          PageNumber: 1,
          PageSize: totalCount,
          ...(groupName ? { GroupName: groupName } : {}),
        },
      }
    );

    if (!response.data.success) {
      console.error('[PTA] Failed to fetch SE/PPE items (with movement):', response.data.message);
      return [];
    }

    return (response.data.data?.items ?? []).map((item: any): PtaItem => ({
      id: item.id,
      description:
        item.description ||
        item.itemDescription ||
        item.name ||
        `Item #${item.id}`,
      groupName: ((item.group || item.groupName || item.group_name || 'PPE') as 'PPE' | 'SE'),
      propertyNumber: item.propertyNumber || item.property_number || '',
      category: typeof item.category === 'object' ? item.category?.name ?? '' : item.category ?? '',
      brand: item.brand || '',
      model: item.model || '',
      condition: item.condition || '',
      unitOfMeasurement: item.unitOfMeasurement || '',
      unitValue: item.unitValue ?? 0,
      dateAcquired: item.dateAcquired || '',
    }));
  } catch (error) {
    console.error('[PTA] Error fetching SE/PPE items (with movement):', error);
    return [];
  }
};
