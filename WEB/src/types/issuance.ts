export type IssuanceType = 'NEW' | 'RENEW';

export interface IssuanceRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  subEmployeeId?: number;
  subEmployeeName?: string;
  itemName: string;
  itemGroup: 'PPE' | 'SE';
  parIcsNumber: string;
  issuanceType: IssuanceType;
  issuedDate: string;
  expiryDate?: string;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

export interface IssuanceStats {
  totalActive: number;
  totalNew: number;
  totalRenew: number;
}
