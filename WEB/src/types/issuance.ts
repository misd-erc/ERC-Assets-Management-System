export type IssuanceType = 'NEW' | 'RENEW';

export interface IssuanceRecord {
  id: number;
  /** SE/PPE property item ID (ptaId from movement) */
  ptaId: number;
  employeeId: number;
  employeeName: string;
  subEmployeeId?: number;
  subEmployeeName?: string;
  itemName: string;
  itemGroup: 'PPE' | 'SE';
  parIcsNumber: string;
  ptrItrNumber?: string;
  rrppeRrspNumber?: string;
  issuanceType: IssuanceType;
  issuedDate: string;
  expiryDate?: string;
  status: 'ACTIVE' | 'INACTIVE';
  condition?: string;
  actualOfficeId?: number;
  actualDivisionId?: number;
  notes?: string;
}

export interface IssuanceStats {
  totalActive: number;
  totalNew: number;
  totalRenew: number;
}
