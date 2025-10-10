export interface RISRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requester: string;
  department: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  dateRequested: Date;
  dateApproved?: Date;
}
