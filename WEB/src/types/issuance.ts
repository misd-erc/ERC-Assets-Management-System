export type IssuanceType = 'NEW' | 'RENEW';

export interface IssuanceRecord {
  id: number;
  /** SE/PPE property item ID (ptaId from movement) */
  ptaId: number;
  employeeId: number;
  employeeName: string;
  employeeIdOriginal?: string;
  subEmployeeId?: number;
  subEmployeeName?: string;
  subEmployeeIdOriginal?: string;
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
  officeName?: string;
  officeAcronym?: string;
  divisionName?: string;
  divisionAcronym?: string;
  notes?: string;
  // PTA item detail
  propertyNumber?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  category?: string;
  unitOfMeasurement?: string;
  unitValue?: number;
  dateAcquired?: string;
}

export interface IssuanceStats {
  totalActive: number;
  totalNew: number;
  totalRenew: number;
}
