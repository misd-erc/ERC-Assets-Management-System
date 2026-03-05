import axiosInstance from '@/lib/axios';
import { IssuanceRecord, IssuanceStats } from '@/types/issuance';
import { getAuthParams } from '@/utils/auth';
import {
  editMovement,
  getNextParNumber as fetchNextParNumber,
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

export const getIssuanceStats = async (): Promise<IssuanceStats> => {
  // Fetch a lightweight count — pageSize=1 just to get totalCount; or fetch all
  const result = await fetchIssuanceList({ pageSize: 1000 });
  const totalActive = result.totalCount;
  const totalNew = result.items.filter((r) => r.parIcsNumber?.toUpperCase().startsWith('PAR')).length;
  const totalRenew = result.items.filter((r) => r.parIcsNumber?.toUpperCase().startsWith('ICS')).length;
  return { totalActive, totalNew, totalRenew };
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
 * Renew an existing movement record by posting the same record with status = RENEW.
 */
export const renewIssuance = async (
  existing: IssuanceRecord,
  issuedDate: string
): Promise<boolean> => {
  const { systemUserId, sessionKey } = getAuthParams();
  return editMovement({
    id: existing.id,
    ptaId: existing.ptaId,
    dateAssigned: new Date(issuedDate).toISOString(),
    ptrItrNumber: existing.ptrItrNumber || '',
    parIcsNumber: existing.parIcsNumber,
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
