// Audit Trail interfaces
export interface AuditTrailItem {
  table: string;
  recordId: number;
  action: 'Insert' | 'Update' | 'Delete';
  date: string; // ISO date string
}

export interface AuditTrailResponse {
  success: boolean;
  message: string;
  data: {
    items: AuditTrailItem[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}
