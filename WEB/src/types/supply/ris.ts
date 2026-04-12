import { Division, Office } from "../office";
import { User } from "../user";
import { SupplyUnit } from "./supply";

export type RISStatus = 'pending' | 'approved' | 'rejected' | 'released';

export interface RISItem {
  id: string;
  supplyId: string;
  description: string;
  unit: string;
  quantityRequested: number;
  quantityApproved?: number;
  unitCost?: number;
  purpose?: string;

}

export interface RISRequest {
  id: string;
  risNumber: string;
  requester: string;
  department: string;
  dateRequested: string;
  items: RISItem[];
  status: RISStatus;
  totalEstimatedValue?: number;
  remarks?: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
}

// Base RIS entity
export interface SupplyRIS {
  id: number;
  entityName: string;
  fundCluster: string;
  officeId: number;
  divisionId: number;
  responsibilityCenterCode: string;
  risNumber: string;
  risPurpose: string;
  risRequestedBySystemUserId?: number;
  risRequestedDate: string;
  risApprovedBySystemUserId?: number;
  risApprovedDate?: string;
  risIssuedBySystemUserId?: number;
  risIssuedDate?: string;
  risReceivedBySystemUserId?: number;
  risReceivedDate?: string;
  isActive: boolean;
  createdAt?: string;
}

// View model used in lists
export interface VwSupplyRIS {
  id: number;
  entityName: string;
  fundCluster: string;
  office: Office;
  division: Division;
  responsibilityCenterCode: string;
  risNumber: string;
  risPurpose: string;
  requestedBySystemUser?: User;
  risRequestedDate: string;
  approvedBySystemUser?: User;
  risApprovedDate?: string;
  issuedBySystemUser?: User;
  risIssuedDate?: string;
  receivedBySystemUser?: User;
  risReceivedDate?: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt?: string;
  items?: VwSupplyRISItem[]; // optional, for detailed view
}

// Request payload for editing a RIS
export interface EditSupplyRIS {
  id: number;
  entityName: string;
  fundCluster: string;
  officeId: number;
  divisionId: number;
  responsibilityCenterCode: string;
  risNumber: string;
  risPurpose: string;
  risRequestedBySystemUserId?: number;
  risRequestedDate: string;
  risApprovedBySystemUserId?: number;
  risApprovedDate?: string;
  risIssuedBySystemUserId?: number;
  risIssuedDate?: string;
  risReceivedBySystemUserId?: number;
  risReceivedDate?: string;
  isApproved: boolean;
  isActive: boolean;
  // Note: RIS items are handled separately
}

// RIS Item entity
export interface SupplyRISItem {
  id: number;
  supplyRISId: number;
  stockNumber: string;
  unitId: number;
  itemDescription: string;
  requisitionQuantity: number;
  isAvailable: boolean;
  issueQuantity: number;
  itemRemarks: string;
  isActive: boolean;
  createdAt?: string;
}

// View model for RIS item (includes related entities)
export interface VwSupplyRISItem {
  id: number;
  risId: number;
  stockNumber: string;
  unit: SupplyUnit;
  itemDescription: string;
  requisitionQuantity: number;
  isAvailable: boolean;
  issueQuantity: number;
  itemRemarks: string;
  isActive: boolean;
  createdAt?: string;

  office?: any;
  division?: any;
}

// Request payload for editing a RIS item
export interface EditSupplyRISItem {
  id: number;
  risId: number;
  stockNumber: string;
  unitId: number;
  itemDescription: string;
  requisitionQuantity: number;
  isAvailable: boolean;
  issueQuantity: number;
  itemRemarks: string;
  isActive: boolean;
}


