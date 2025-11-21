using System;
using System.Collections.Generic;

namespace PortalCommon.Constants
{
    /// <summary>
    /// Central source of truth for table names.
    /// Usage:
    ///   TableConstants.Get("PPE")        → "TblPPE"
    ///   TableConstants.ToDb("TblPPE")    → "tblPPEs"
    ///   TableConstants.PPE               → "TblPPE" (direct access)
    /// </summary>
    public static class TableConstants
    {
        #region Logical Table Names (Used in API routes)

        public const string Division = "TblDivision";
        public const string Employee = "TblEmployee";
        public const string EmploymentType = "TblEmploymentType";
        public const string FileStorage = "TblFileStorage";
        public const string Office = "TblOffice";
        public const string OneTimePassword = "TblOneTimePassword";
        public const string Position = "TblPosition";
        public const string SessionToken = "TblSessionToken";
        public const string SystemModule = "TblSystemModule";
        public const string SystemNotificationRead = "TblSystemNotificationRead";
        public const string SystemNotification = "TblSystemNotification";
        public const string SystemRole = "TblSystemRole";
        public const string SystemRoleScope = "TblSystemRoleScope";
        public const string SystemUser = "TblSystemUser";
        public const string SystemUserStatus = "TblSystemUserStatus";

        public const string PPE = "TblPPE";
        public const string PPECategory = "TblPPECategory";
        public const string PPELegend = "TblPPELegend";
        public const string PPEMovement = "TblPPEMovement";
        public const string PPEPart = "TblPPEPart";

        public const string ActivityLog = "TblActivityLog";
        public const string AuditTrail = "TblAuditTrail";
        public const string ErrorLog = "TblErrorLog";

        #endregion

        // Map: API-friendly name → Logical constant value (TblPPE)
        private static readonly Dictionary<string, string> ApiToLogical = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Division"] = Division,
            ["Employee"] = Employee,
            ["EmploymentType"] = EmploymentType,
            ["FileStorage"] = FileStorage,
            ["Office"] = Office,
            ["OneTimePassword"] = OneTimePassword,
            ["Position"] = Position,
            ["SessionToken"] = SessionToken,
            ["SystemModule"] = SystemModule,
            ["SystemNotificationRead"] = SystemNotificationRead,
            ["SystemNotification"] = SystemNotification,
            ["SystemRole"] = SystemRole,
            ["SystemRoleScope"] = SystemRoleScope,
            ["SystemUser"] = SystemUser,
            ["SystemUserStatus"] = SystemUserStatus,

            ["PPE"] = PPE,
            ["PPECategory"] = PPECategory,
            ["PPELegend"] = PPELegend,
            ["PPEMovement"] = PPEMovement,
            ["PPEPart"] = PPEPart,

            ["ActivityLog"] = ActivityLog,
            ["AuditTrail"] = AuditTrail,
            ["ErrorLog"] = ErrorLog
        };

        // Map: Logical name (TblPPE) → Real database table name (tblPPEs)
        private static readonly Dictionary<string, string> LogicalToDatabase = new(StringComparer.OrdinalIgnoreCase)
        {
            [Division] = "tblDivisions",
            [Employee] = "tblEmployees",
            [EmploymentType] = "tblEmploymentTypes",
            [FileStorage] = "tblFileStorages",
            [Office] = "tblOffices",
            [OneTimePassword] = "tblOneTimePasswords",
            [Position] = "tblPositions",
            [SessionToken] = "tblSessionTokens",
            [SystemModule] = "tblSystemModules",
            [SystemNotificationRead] = "tblSystemNotificationReads",
            [SystemNotification] = "tblSystemNotifications",
            [SystemRole] = "tblSystemRoles",
            [SystemRoleScope] = "tblSystemRoleScopes",
            [SystemUser] = "tblSystemUsers",
            [SystemUserStatus] = "tblSystemUserStatuses",

            [PPE] = "tblPPEs",
            [PPECategory] = "tblPPECategories",
            [PPELegend] = "tblPPELegends",
            [PPEMovement] = "tblPPEMovements",
            [PPEPart] = "tblPPEParts",

            [ActivityLog] = "tblActivityLogs",
            [AuditTrail] = "tblAuditTrails",
            [ErrorLog] = "tblErrorLogs"
        };

        /// <summary>
        /// Get logical table name from API route name
        /// Example: TableConstants.Get("PPE") → "TblPPE"
        /// </summary>
        public static string Get(string apiName)
        {
            if (string.IsNullOrWhiteSpace(apiName))
                throw new ArgumentException("Table name cannot be null or empty.");

            if (ApiToLogical.TryGetValue(apiName, out var logicalName))
                return logicalName;

            throw new KeyNotFoundException($"Table '{apiName}' is not defined.");
        }

        /// <summary>
        /// Convert logical name (TblPPE) → actual DB table name (tblPPEs)
        /// </summary>
        public static string ToDb(string logicalName) => LogicalToDatabase[logicalName];

        /// <summary>
        /// BONUS: Allow TableConstants("PPE") syntax (very clean!)
        /// </summary>
        public static string Call(string apiName) => Get(apiName);
    }
}