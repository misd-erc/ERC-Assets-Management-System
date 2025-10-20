using Microsoft.EntityFrameworkCore;
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

        /// <summary>
        /// Validates a session token for the specified system user ID.
        /// Returns true if valid, false otherwise.
        /// </summary>
        public async Task<bool> ValidateSessionTokenInternally(long systemUserId)
        {
            try
            {
                bool isTokenValid = await _accountGetTools.ValidateTokenSessionBySystemUserIdAsync(systemUserId);
                return isTokenValid;
            }
            catch (Exception ex)
            {
                // Logs any unexpected error to the error log
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AuthTools));
                return false;
            }
        }
    }
}
