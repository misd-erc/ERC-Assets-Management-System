import { IssuanceRecord, IssuanceStats } from '@/types/issuance';
import { getAuthParams } from '@/utils/auth';
import {
  editMovement,
  getNextParNumber as fetchNextParNumber,
  listMovements,
  PtaMovementRecord,
} from './ptaMovementApi';

/* Re-export so existing imports keep working */
export { fetchNextParNumber as getNextParNumber };

/** Map a raw movement record to the UI IssuanceRecord shape */
const mapMovement = (m: PtaMovementRecord): IssuanceRecord => ({
  id: m.id,
  ptaId: m.ptaId,
  employeeId: m.plantillaEmployeeId,
  employeeName: m.plantillaEmployeeName || `Employee #${m.plantillaEmployeeId}`,
  subEmployeeId: m.nonPlantillaEmployeeId || undefined,
  subEmployeeName: m.nonPlantillaEmployeeName || undefined,
  itemName: m.itemDescription || `Item #${m.ptaId}`,
  itemGroup: m.groupName || 'PPE',
  parIcsNumber: m.parIcsNumber,
  ptrItrNumber: m.ptrItrNumber,
  rrppeRrspNumber: m.rrppeRrspNumber,
  issuanceType: m.status,
  issuedDate: m.dateAssigned ? m.dateAssigned.split('T')[0] : '',
  expiryDate: undefined,
  status: m.isActive ? 'ACTIVE' : 'INACTIVE',
  condition: m.condition,
  actualOfficeId: m.actualOfficeId,
  actualDivisionId: m.actualDivisionId,
});

/* -------------------------------------------------------------------------- */
/*  Public API functions                                                        */
/* -------------------------------------------------------------------------- */

export const getIssuanceStats = async (): Promise<IssuanceStats> => {
  const records = await listMovements();
  const totalNew = records.filter((r) => r.status === 'NEW').length;
  const totalRenew = records.filter((r) => r.status === 'RENEW').length;
  return { totalActive: records.length, totalNew, totalRenew };
};

export const listIssuances = async (): Promise<IssuanceRecord[]> => {
  const records = await listMovements();
  return records.map(mapMovement);
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
