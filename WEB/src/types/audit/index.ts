// Audit Trail interfaces
export interface AuditTrailItem {
  table: string;
  recordId: number;
  action: 'Insert' | 'Update' | 'Delete';
  actionBy: string;
  date: string; // ISO date string
  changes: Record<string, any>; // Object containing field-value pairs
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

// Activity interfaces
export interface ActivityItem {
  activityId: number;
  action: string;
  auditTrailId: number | null;
  actionBySystemUserId: number;
  actionBy: string;
  createdAt: string; // ISO date string
  auditTrail: any | null;
}

export interface ActivityResponse {
  success: boolean;
  message: string;
  data: {
    items: ActivityItem[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

