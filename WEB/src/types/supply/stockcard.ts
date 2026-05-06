import { SupplyUnit } from '@/types';

export interface SupplyStockCardItem {
  id: number;
  stockNumber: string;
  unit: SupplyUnit | null;
  itemDescription: string;
  currentStockQuantity: number;
  addedStockQuantity: number;
  issuedStockQuantity: number;
  newStockQuantity: number;
  itemRemarks: string | null;
  isActive: boolean;
  createdAt: string;
  office?: any;
  division?: any;
}

export interface ManualStockCardIssuanceEntryPayload {
  unitId: number;
  issueQuantity: number;
  itemRemarks?: string;
}