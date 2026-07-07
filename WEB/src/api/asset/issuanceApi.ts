import axiosInstance from '@/lib/axios';
import { IssuanceRecord, IssuanceStats } from '@/types/issuance';
import { getAuthParams } from '@/utils/auth';
import {
  deleteMovement,
  editMovement,
  editMovementBulk,
  getNextParNumber as fetchNextParNumber,
  MovementItemPayload,
} from './ptaMovementApi';

/* Re-export so existing imports keep working */
export { fetchNextParNumber as getNextParNumber };

/* -------------------------------------------------------------------------- */
/*  Types for the new /pta/issuance/list endpoint                               */
/* -------------------------------------------------------------------------- */

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface IssuanceListItem {
  id: number;
  ptaId: number;
  parIcsNumber: string;
  dateAssigned: string;
  status: string;
  remarks: string | null;
  isCurrent: boolean;
  isActive: boolean;
  createdAt: string;
  plantillaEmployeeId: number | null;
  plantillaEmployeeName: string | null;
  plantillaEmployeeIdOriginal: string | null;
  nonPlantillaEmployeeId: number | null;
  nonPlantillaEmployeeName: string | null;
  nonPlantillaEmployeeIdOriginal: string | null;
  office: { id: number; name: string; acronym: string } | null;
  division: { id: number; officeId: number; name: string; acronym: string } | null;
  item: {
    id: number;
    group: 'PPE' | 'SE';
    propertyNumber: string | null;
    description: string | null;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    category: string | null;
    unitOfMeasurement: string | null;
    unitValue: number;
    dateAcquired: string | null;
  } | null;
}

/** Map a raw issuance list item to the UI IssuanceRecord shape */
const mapIssuanceItem = (m: IssuanceListItem): IssuanceRecord => {
  const statusUpper = (m.status ?? '').toUpperCase();
  const issuanceType: 'NEW' | 'RENEW' =
    statusUpper === 'NEW' ? 'NEW' : statusUpper === 'RENEW' ? 'RENEW' : 'NEW';

  return {
    id: m.id,
    ptaId: m.ptaId,
    employeeId: m.plantillaEmployeeId ?? 0,
    employeeName: m.plantillaEmployeeName || `Employee #${m.plantillaEmployeeId}`,
    employeeIdOriginal: m.plantillaEmployeeIdOriginal ?? undefined,
    subEmployeeId: m.nonPlantillaEmployeeId ?? undefined,
    subEmployeeName: m.nonPlantillaEmployeeName ?? undefined,
    subEmployeeIdOriginal: m.nonPlantillaEmployeeIdOriginal ?? undefined,
    itemName: m.item?.description || `Item #${m.ptaId}`,
    itemGroup: (m.item?.group ?? 'PPE') as 'PPE' | 'SE',
    parIcsNumber: m.parIcsNumber,
    issuanceType,
    issuedDate: m.dateAssigned ? m.dateAssigned.split('T')[0] : '',
    expiryDate: undefined,
    status: m.isActive ? 'ACTIVE' : 'INACTIVE',
    notes: m.remarks ?? undefined,
    actualOfficeId: m.office?.id,
    actualDivisionId: m.division?.id,
    officeName: m.office?.name ?? undefined,
    officeAcronym: m.office?.acronym ?? undefined,
    divisionName: m.division?.name ?? undefined,
    divisionAcronym: m.division?.acronym ?? undefined,
    propertyNumber: m.item?.propertyNumber ?? undefined,
    brand: m.item?.brand ?? undefined,
    model: m.item?.model ?? undefined,
    serialNumber: m.item?.serialNumber ?? undefined,
    category: m.item?.category ?? undefined,
    unitOfMeasurement: m.item?.unitOfMeasurement ?? undefined,
    unitValue: m.item?.unitValue,
    dateAcquired: m.item?.dateAcquired ? m.item.dateAcquired.split('T')[0] : undefined,
  };
};

/* -------------------------------------------------------------------------- */
/*  Core fetch from new endpoint                                                */
/* -------------------------------------------------------------------------- */

export interface IssuanceListParams {
  group?: 'PPE' | 'SE';
  searchEmployee?: string;
  parIcsFilter?: string;
  officeId?: number;
  divisionId?: number;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface IssuanceListResult {
  items: IssuanceRecord[];
  totalCount: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

const fetchIssuanceList = async (params: IssuanceListParams = {}): Promise<IssuanceListResult> => {
  const { systemUserId, sessionKey } = getAuthParams();
  try {
    const response = await axiosInstance.get<
      ApiResponse<{ items: IssuanceListItem[]; totalCount: number; totalPages: number; pageNumber: number; pageSize: number }>
    >(
      '/Inventory/pta/issuance/list',
      {
        params: {
          ActionBySystemUserId: systemUserId,
          SessionKey: sessionKey,
          ...(params.group ? { group: params.group } : {}),
          ...(params.searchEmployee ? { searchEmployee: params.searchEmployee } : {}),
          ...(params.parIcsFilter ? { parIcsFilter: params.parIcsFilter } : {}),
          ...(params.officeId ? { officeId: params.officeId } : {}),
          ...(params.divisionId ? { divisionId: params.divisionId } : {}),
          ...(params.startDate ? { startDate: params.startDate } : {}),
          ...(params.endDate ? { endDate: params.endDate } : {}),
          pageNumber: params.pageNumber ?? 1,
          pageSize: params.pageSize ?? 50,
        },
      }
    );
    if (!response.data.success) {
      console.error('[Issuance] Failed to fetch issuance list:', response.data.message);
      return { items: [], totalCount: 0, totalPages: 0, pageNumber: 1, pageSize: 50 };
    }
    const d = response.data.data;
    return {
      items: (d?.items ?? []).map(mapIssuanceItem),
      totalCount: d?.totalCount ?? 0,
      totalPages: d?.totalPages ?? 0,
      pageNumber: d?.pageNumber ?? 1,
      pageSize: d?.pageSize ?? 50,
    };
  } catch (error) {
    console.error('[Issuance] Error fetching issuance list:', error);
    return { items: [], totalCount: 0, totalPages: 0, pageNumber: 1, pageSize: 50 };
  }
};

/* -------------------------------------------------------------------------- */
/*  Public API functions                                                        */
/* -------------------------------------------------------------------------- */

const countGroups = (items: IssuanceRecord[]) => new Set(items.map((r) => r.parIcsNumber)).size;

export const getIssuanceStats = async (): Promise<IssuanceStats> => {
  const emptyStats: IssuanceStats = { ppeActive: 0, seActive: 0, ppeRenew: 0, seRenew: 0 };

  // Fetch PPE and SE separately using the backend's own group filter (matches the
  // authoritative PTA.Group field) instead of pulling everything unfiltered and bucketing
  // by itemGroup client-side — a movement whose linked PTA item didn't resolve falls back
  // to itemGroup 'PPE' (see mapIssuanceItem), which silently inflates PPE counts with
  // orphaned records. Group-filtered queries correctly exclude those instead of guessing.
  const [ppeProbe, seProbe] = await Promise.all([
    fetchIssuanceList({ group: 'PPE', pageSize: 1 }),
    fetchIssuanceList({ group: 'SE', pageSize: 1 }),
  ]);
  if (ppeProbe.totalCount === 0 && seProbe.totalCount === 0) return emptyStats;

  const [ppeResult, seResult] = await Promise.all([
    ppeProbe.totalCount > 0 ? fetchIssuanceList({ group: 'PPE', pageSize: ppeProbe.totalCount }) : Promise.resolve({ items: [] as IssuanceRecord[] }),
    seProbe.totalCount > 0 ? fetchIssuanceList({ group: 'SE', pageSize: seProbe.totalCount }) : Promise.resolve({ items: [] as IssuanceRecord[] }),
  ]);
  const ppeItems = ppeResult.items;
  const seItems = seResult.items;

  return {
    // Count distinct PAR/ICS groups, not raw item rows — one PAR/ICS can carry several items.
    ppeActive: countGroups(ppeItems),
    seActive: countGroups(seItems),
    // Classify by actual issuance type (NEW vs RENEW), not by PAR/ICS number prefix —
    // that prefix reflects item group (PPE vs SE), not issuance type.
    ppeRenew: countGroups(ppeItems.filter((r) => r.issuanceType === 'RENEW')),
    seRenew: countGroups(seItems.filter((r) => r.issuanceType === 'RENEW')),
  };
};

export const listIssuances = async (params: IssuanceListParams = {}): Promise<IssuanceListResult> => {
  return fetchIssuanceList(params);
};

/**
 * Create a new PAR/ICS movement record (id = 0 → API creates it).
 */
export const createIssuance = async (
  payload: Omit<IssuanceRecord, 'id' | 'status'>
): Promise<IssuanceRecord> => {
  const { systemUserId, sessionKey } = getAuthParams();
  await editMovement({
    id: 0,
    ptaId: payload.ptaId,
    dateAssigned: payload.issuedDate
      ? new Date(payload.issuedDate).toISOString()
      : new Date().toISOString(),
    ptrItrNumber: payload.ptrItrNumber || '',
    parIcsNumber: payload.parIcsNumber,
    rrppeRrspNumber: payload.rrppeRrspNumber || '',
    status: payload.issuanceType,
    plantillaEmployeeId: payload.employeeId,
    nonPlantillaEmployeeId: payload.subEmployeeId || 0,
    condition: payload.condition || 'Working',
    actualOfficeId: payload.actualOfficeId || 0,
    actualDivisionId: payload.actualDivisionId || 0,
    isActive: true,
    isCurrent: true,
    actionBySystemUserId: systemUserId,
    sessionKey,
  });
  return { ...payload, ptaId: payload.ptaId, id: 0, status: 'ACTIVE' };
};

/**
 * Renew an existing movement record by creating a NEW record with status = RENEW.
 * A freshly generated PAR/ICS number must be supplied so the renewal gets its own number.
 */
export const renewIssuance = async (
  existing: IssuanceRecord,
  issuedDate: string,
  newParIcsNumber: string
): Promise<boolean> => {
  const { systemUserId, sessionKey } = getAuthParams();
  return editMovement({
    id: 0,
    ptaId: existing.ptaId,
    dateAssigned: new Date(issuedDate).toISOString(),
    ptrItrNumber: existing.ptrItrNumber || '',
    parIcsNumber: newParIcsNumber,
    rrppeRrspNumber: existing.rrppeRrspNumber || '',
    status: 'RENEW',
    plantillaEmployeeId: existing.employeeId,
    nonPlantillaEmployeeId: existing.subEmployeeId || 0,
    condition: existing.condition || 'Working',
    actualOfficeId: existing.actualOfficeId || 0,
    actualDivisionId: existing.actualDivisionId || 0,
    isActive: true,
    isCurrent: true,
    actionBySystemUserId: systemUserId,
    sessionKey,
  });
};

export interface UpdateIssuanceGroupPayload {
  parIcsNumber: string;
  employeeId: number;
  subEmployeeId?: number;
  actualOfficeId: number;
  actualDivisionId: number;
  issuedDate: string;
  /** Remarks/notes shown as "notes" in IssuanceRecord — stored server-side as the movement's Condition/Remarks field. */
  notes?: string;
}

/**
 * Update the shared fields (PAR/ICS number, employee, office, division, date, notes) across
 * every movement record under one PAR/ICS group in a single bulk request.
 * Each record keeps its own ptaId / issuance type; the new PAR/ICS number is applied to all of them.
 */
export const updateIssuanceGroup = async (
  records: IssuanceRecord[],
  updates: UpdateIssuanceGroupPayload
): Promise<boolean> => {
  const dateAssigned = updates.issuedDate ? new Date(updates.issuedDate).toISOString() : new Date().toISOString();
  const movements: MovementItemPayload[] = records.map((r) => ({
    id: r.id,
    ptaId: r.ptaId,
    dateAssigned,
    ptrItrNumber: r.ptrItrNumber || '',
    parIcsNumber: updates.parIcsNumber,
    rrppeRrspNumber: r.rrppeRrspNumber || '',
    status: r.issuanceType,
    plantillaEmployeeId: updates.employeeId,
    nonPlantillaEmployeeId: updates.subEmployeeId || 0,
    condition: updates.notes || 'Working',
    actualOfficeId: updates.actualOfficeId,
    actualDivisionId: updates.actualDivisionId,
    isActive: true,
    isCurrent: true,
  }));
  return editMovementBulk(movements);
};

/**
 * Soft-delete every movement record under one PAR/ICS group.
 */
export const deleteIssuanceGroup = async (records: IssuanceRecord[]): Promise<boolean> => {
  const results = await Promise.all(records.map((r) => deleteMovement(r.id)));
  return results.every(Boolean);
};
