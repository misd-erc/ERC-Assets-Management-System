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
