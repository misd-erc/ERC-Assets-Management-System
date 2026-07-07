using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.Constants
{
    public class NotificationConstants
    {
        // Account notifications
        public static readonly string LOGIN_ATTEMPT_FAILED = "Login Attempt Failed";
        public static readonly string INACTIVE_ACCOUNT = "Deactivated Account";
        public static readonly string SUSPENDED_ACCOUNT = "Suspended Account";
        public static readonly string ACTIVE_ACCOUNT = "Activated Account";

        // Delivery notifications
        public static readonly string DELIVERY_CREATED = "New Delivery Record";
        public static readonly string DELIVERY_RECEIVED = "Delivery Received";

        // IAR notifications
        public static readonly string IAR_SUBMITTED = "New IAR Submitted";
        public static readonly string IAR_APPROVED = "IAR Approved";

        // ActionType values for notification click-navigation (see TblSystemNotification.ActionType)
        public static class ActionTypes
        {
            public const string IAR_SUBMITTED = "IAR_SUBMITTED";
            public const string IAR_APPROVED = "IAR_APPROVED";
        }

        // RIS notifications
        public static readonly string RIS_SUBMITTED = "New RIS Submitted";
        public static readonly string RIS_APPROVED = "RIS Approved";
        public static readonly string RIS_GENERATED = "RIS Generated";

        // Supply notifications
        public static readonly string SUPPLY_LOW_STOCK = "Low Stock Alert";

        // Disposal notifications
        public static readonly string DISPOSAL_REQUESTED = "Disposal Requested";
        public static readonly string DISPOSAL_APPROVED = "Disposal Approved";
        public static readonly string DISPOSAL_REJECTED = "Disposal Rejected";
        public static readonly string DISPOSAL_COMPLETED = "Disposal Completed";

        // Asset Request notifications
        public static readonly string REQUEST_SUBMITTED = "New Asset Request";
        public static readonly string REQUEST_STATUS_UPDATED = "Asset Request Updated";
        public static readonly string REQUEST_ASSIGNED = "Asset Request Assigned";
        public static readonly string REQUEST_REJECTED = "Asset Request Rejected";

        // Transfer/Return notifications
        public static readonly string TRANSFER_REQUESTED = "Asset Transfer Requested";
        public static readonly string TRANSFER_COMPLETED = "Asset Transfer Completed";
        public static readonly string ASSET_ASSIGNED = "Asset Assigned";
        public static readonly string ASSET_TRANSFERRED = "Asset Transferred";

        // Approval notifications
        public static readonly string APPROVAL_REQUIRED = "Approval Required";
        public static readonly string APPROVAL_COMPLETED = "Approval Completed";

        // Reports
        public static readonly string PAR_GENERATED = "PAR Generated";

        // Role notifications
        public static readonly string ROLE_UPDATED = "Role Permissions Updated";

        // System
        public static readonly string SYSTEM_MAINTENANCE = "System Maintenance";

        // Module IDs matching TblSystemModuleSeeder
        public static class Modules
        {
            public const long DASHBOARD = 1;
            public const long CALENDAR_NOTIFICATIONS = 2;
            public const long COMMUNICATION_TOOLS = 3;
            public const long CATEGORY_MANAGEMENT = 4;
            public const long DELIVERY_RECEIPT = 5;
            public const long SUPPLY_MANAGEMENT = 6;
            public const long TRANSFERS_RETURNS = 7;
            public const long DISPOSAL = 8;
            public const long CONTRACT_MANAGEMENT = 9;
            public const long PPE_SE = 10;
            public const long PPE_SEMI_EXPENDABLES = 11;
            public const long REPORTS_CENTER = 12;
            public const long APPROVALS = 13;
            public const long USER_MANAGEMENT = 14;
            public const long ROLES_MANAGEMENT = 15;
            public const long OFFICE_MANAGEMENT = 16;
            public const long SYSTEM_SETTINGS = 17;
            public const long AUDIT_LOGS = 18;
        }
    }
}
