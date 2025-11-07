using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Account;
using PortalDB.Services;
using PortalTools.Services.DBO.Account;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalTools.Services
{
    public class AuthTools
    {
        private readonly AccountGetTools _accountGetTools;
        private readonly DbContextOptions<PortalDbContext> _options;

        public AuthTools(AccountGetTools accountGetTools, DbContextOptions<PortalDbContext> options)
        {
            _accountGetTools = accountGetTools;
            _options = options;
        }

        #region Existing method
        public async Task<bool> ValidateSessionTokenInternally(long systemUserId, string sessionKey)
        {
            try
            {
                var sessionModel = new TblSessionToken
                {
                    Key = sessionKey,
                    SystemUserId = systemUserId
                };
                return await _accountGetTools.ValidateTokenSessionAsync(sessionModel);
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AuthTools));
                return false;
            }
        }
        #endregion

        #region NEW: Get user with explicit context (fast, no lock)
        /// <summary>
        /// Retrieves a non-deleted TblSystemUser by Id using the supplied DbContext.
        /// Returns null if not found or deleted.
        /// </summary>
        public async Task<TblSystemUser?> GetTblSystemUserWithContextAsync(long id, PortalDbContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            return await context.TblSystemUsers
                .Where(u => u.Id == id && !u.IsDeleted)
                .FirstOrDefaultAsync();
        }
        #endregion

        #region NEW: Validate user status (single reusable call)
        /// <summary>
        /// Checks the user status after a successful edit/insert.
        /// Returns a tuple:
        ///   - bool   : true = user is allowed to continue, false = blocked
        ///   - string : error message when blocked, otherwise null
        /// </summary>
        public async Task<(bool IsAllowed, string? ErrorMessage, string? SpecificError)> ValidateUserStatusAsync(
            long systemUserId,
            PortalDbContext context,
            DbContextOptions<PortalDbContext> auditOptions)
        {
            var user = await GetTblSystemUserWithContextAsync(systemUserId, context);
            if (user == null)
            {
                // Should never happen because we just created/updated it, but safe-guard
                await AuditTrailTool.LogActivityAsync(
                    auditOptions,
                    $"Login attempt failed – user not found after edit (Id: {systemUserId})",
                    actionBy: systemUserId);

                return (false, "User record not found.", "User not found");
            }

            // 1. IsActive flag
            if (!user.IsActive)
            {
                await AuditTrailTool.LogActivityAsync(
                    auditOptions,
                    "Login attempt failed due to inactive status",
                    actionBy: systemUserId);

                return (false, "Account is inactive. Please contact the system administrator.", "Inactive account");
            }

            // 2. StatusId checks (dictionary is static – no DB hit)
            long status = user.StatusId!.Value;

            if (status == TblSystemUserStatus.Dictionary[TblSystemUserStatus.PENDING])
            {
                await AuditTrailTool.LogActivityAsync(
                    auditOptions,
                    "Login attempt failed due to pending status",
                    actionBy: systemUserId);

                return (false, "Your account is still pending. Please wait for the system administrator to approve your account.", "Pending status");
            }

            if (status == TblSystemUserStatus.Dictionary[TblSystemUserStatus.INACTIVE])
            {
                await AuditTrailTool.LogActivityAsync(
                    auditOptions,
                    "Login attempt failed due to inactive status",
                    actionBy: systemUserId);

                return (false, "Your account is inactive. Please contact the system administrator.", "Inactive status");
            }

            if (status == TblSystemUserStatus.Dictionary[TblSystemUserStatus.SUSPENDED])
            {
                await AuditTrailTool.LogActivityAsync(
                    auditOptions,
                    "Login attempt failed due to suspended status",
                    actionBy: systemUserId);

                return (false, "Your account has been suspended. Please contact the system administrator.", "Suspended status");
            }

            // All good
            return (true, null, null);
        }
        #endregion
    }
}