export interface SystemNotification {
  id: number;
  title: string;
  description: string;
  systemUserId: number | null;
  createdBySystemUserId: number | null;
  moduleId: number | null;
  actionType: string | null;
  entityId: number | null;
  entityLabel: string | null;
  createdAt: string;
  isRead: boolean;
}

export interface SendNotificationPayload {
  actionBySystemUserId: number;
  sessionKey: string;
  title: string;
  description: string;
  recipientSystemUserId?: number;
  moduleId?: number;
}

export interface MarkReadPayload {
  actionBySystemUserId: number;
  sessionKey: string;
  notificationId: number;
}

export const MODULE_NAMES: Record<number, string> = {
  1: "Dashboard",
  2: "Calendar & Notifications",
  3: "Communication Tools",
  4: "Category Management",
  5: "Delivery & Receipt of Items",
  6: "Supply Management",
  7: "Transfers & Returns",
  8: "Disposal of Properties",
  9: "Contract Management",
  10: "PPE & SE",
  11: "PPE & Semi-Expendables",
  12: "Reports Center",
  13: "Approvals",
  14: "User Management",
  15: "Roles Management",
  16: "Office Management",
  17: "System Settings",
  18: "Audit Logs",
};
