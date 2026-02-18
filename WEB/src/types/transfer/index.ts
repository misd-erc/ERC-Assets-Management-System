// PTR/ITR Transfer Types
export interface MovementEditPayload {
  id: number;
  ptaId: number;
  dateAssigned: string;
  ptrItrNumber: string;
  parIcsNumber: string;
  rrppeRrspNumber?: string;
  status?: string;
  plantillaEmployeeId: number | null;
  nonPlantillaEmployeeId: number | null;
  condition: string;
  actualOfficeId: number | null;
  actualDivisionId: number | null;
  isActive: boolean;
  isCurrent?: boolean;
  actionBySystemUserId: number;
  sessionKey: string;
  model?: string;
}

export interface TransferRecord {
  id: number;
  ptaId: number;
  dateAssigned: string;
  ptrItrNumber: string;
  parIcsNumber: string;
  plantillaEmployeeId: number | null;
  nonPlantillaEmployeeId: number | null;
  condition: string;
  actualOfficeId: number | null;
  actualDivisionId: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface PTRFormData {
  // Transfer Details
  ptrNumber: string;
  dateAssigned: string;
  parIcsNumber: string;
  condition: string;
  
  // Asset Details
  asset: {
    id: number;
    propertyNumber: string;
    description: string;
    category: string;
  };
  
  // Employee Assignment
  employeeType: 'plantilla' | 'non-plantilla';
  plantillaEmployeeId: number | undefined;
  nonPlantillaEmployeeId: number | undefined;
  
  // Office/Division Assignment
  actualOfficeId: number | null;
  actualDivisionId: number | null;
}

export interface ITRFormData {
  // Transfer Details
  itrNumber: string;
  dateAssigned: string;
  parIcsNumber: string;
  condition: string;
  
  // Asset Details
  asset: {
    id: number;
    propertyNumber: string;
    description: string;
    category: string;
  };
  
  // Employee Assignment
  employeeType: 'plantilla' | 'non-plantilla';
  plantillaEmployeeId: number | undefined;
  nonPlantillaEmployeeId: number | undefined;
  
  // Office/Division Assignment
  actualOfficeId: number | null;
  actualDivisionId: number | null;
}

export interface ApiEmployee {
  id: number;
  employeeId?: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffixName?: string | null;
  employeeIdOriginal?: string | null;
  officeName?: string;
  divisionName?: string;
  employmentTypeName?: string;
  positionName?: string;
  employmentType?: { id: number; name: string } | null;
  office?: { id: number; name: string; acronym: string } | null;
  division?: { id: number; name: string; acronym: string } | null;
  position?: { id: number; name: string } | null;
  isActive?: boolean;
}

export enum TransferType {
  PTR = 'PTR', // Property Transfer Record (PPE)
  ITR = 'ITR', // Inventory Transfer Record (SE)
}

export interface TransferFilterOptions {
  type: TransferType;
  status: 'active' | 'inactive' | 'all';
  dateRange?: {
    from: string;
    to: string;
  };
  assetType?: 'PPE' | 'SE';
}
