export type BookingGroup = 'Supply' | 'PPE' | 'SE';
export type BookingItemStatus = 'Pending' | 'Booked' | 'Cancelled';

export interface NamedRef {
  id: number;
  name: string;
}

export interface PendingBookingItem {
  id: number;
  group: BookingGroup;
  status: BookingItemStatus;
  supplyIARId?: number | null;
  iarNumber?: string | null;
  deliveryRecordId?: number | null;
  drNumber?: string | null;
  unitSequence?: number | null;
  category?: NamedRef | null;
  categoryId?: number | null;
  code: string;
  description: string;
  specification?: string | null;
  measurementUnit?: NamedRef | null;
  measurementUnitId?: number | null;
  quantity?: number | null;
  unitCost?: number | null;
  reorderPoint?: number | null;
  storageLocation?: NamedRef | null;
  storageLocationId?: number | null;
  vendor?: NamedRef | null;
  vendorId?: number | null;
  suggestedPropertyNumber?: string | null;
  deliveryDate?: string | null;
  bookedAt?: string | null;
  finalizedSupplyItemId?: number | null;
  finalizedPTAId?: number | null;
  createdAt?: string | null;
}

export interface BookingStatistics {
  pendingSupply: number;
  pendingPPE: number;
  pendingSE: number;
  totalPending: number;
}

export interface BookSupplyPayload {
  bookingItemId: number;
  code?: string;
  categoryId?: number | null;
  description?: string;
  measurementUnitId?: number | null;
  quantity?: number;
  unitCost?: number;
  reorderPoint?: number;
  storageLocationId?: number | null;
  vendorId?: number | null;
}

export interface BookPTAPayload {
  bookingItemId: number;
  propertyNumber?: string;
  categoryId?: number | null;
  legendId?: number | null;
  serialNumber?: string;
  description?: string;
  brand?: string;
  model?: string;
  specification?: string;
  measurementUnitId?: number | null;
  unitCost?: number;
  plantillaEmployeeId?: number | null;
  nonPlantillaEmployeeId?: number | null;
  actualOfficeId?: number | null;
  actualDivisionId?: number | null;
  dateAssigned?: string;
}
