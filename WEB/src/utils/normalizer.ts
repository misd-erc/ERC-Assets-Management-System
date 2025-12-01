/**
 * Normalizes movement payload for API calls.
 * Ensures employee IDs are strings and office/division IDs are numbers.
 */

// Helper function to parse employee ID safely
export function parseEmployeeIdSafe(val: any): string | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return val.toString();
  return null;
}

// Normalize movement entry for API payload
export function normalizeMovement(entry: any, assetModel: string, ptaId: number): any {
  return {
    id: parseInt(entry.id || '0', 10),
    ptaId,
    dateAssigned: entry.dateAssigned,
    parItrNumber: entry.parItrNumber || '',
    plantillaEmployeeId: parseEmployeeIdSafe(entry.plantillaEmployeeId),
    nonPlantillaEmployeeId: parseEmployeeIdSafe(entry.nonPlantillaEmployeeId),
    actualOfficeId: parseInt(entry.officeId || '0', 10),
    actualDivisionId: parseInt(entry.divisionId || '0', 10),
    isActive: true,
    condition: entry.condition || 'Working',
    actionBySystemUserId: parseInt(localStorage.getItem('systemUserId') || '0'),
    sessionKey: localStorage.getItem('sessionToken') || '',
    model: assetModel || '',
  };
}
