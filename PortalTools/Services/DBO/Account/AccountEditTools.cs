using Microsoft.EntityFrameworkCore;
using PortalCommon.Utilities;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.LOG.AuditTrail;
using PortalDB.Services;
using PortalTools.Utilities;
using System;
using System.Linq;
using System.Text.Json;

namespace PortalTools.Services.DBO.Account
{
    public class AccountEditTools
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly AccountGetTools _accountGetTools;
        public AccountEditTools(DbContextOptions<PortalDbContext> options, AccountGetTools accountGetTools)
        {
            _options = options;
            _accountGetTools = accountGetTools;
        }

        /// <summary>
        /// Updates an existing TblSystemUser.
        /// Returns true if update succeeds, false otherwise. This will be save first just to get the Id.
        /// </summary>
        public async Task<long> EditTblSystemUserAsync(TblSystemUser model, PortalDbContext context, bool isLogin = true)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;

                TblSystemUser? existingUser = null;

                if (isLogin)
                    model.LastLoginAt = DateTime.UtcNow;

                if (isInsert)
                {
                    await context.TblSystemUsers.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingUser = await _accountGetTools.GetTblSystemUserByEntraIdAndEmail(model.EntraId, model.Email);

                    if (existingUser == null)
                        return 0;

                    existingUser.FirstName = model.FirstName ?? existingUser.FirstName;
                    existingUser.LastName = model.LastName ?? existingUser.LastName;
                    existingUser.Email = model.Email ?? existingUser.Email;
                    existingUser.IsActive = model.IsActive;
                    model.Id = existingUser.Id;

                    if(isLogin)
                        await context.TblSystemUsers.Where(u => u.Id == model.Id)
                            .ExecuteUpdateAsync(u => u
                                .SetProperty(x => x.FirstNameEncrypted, model.FirstNameEncrypted)
                                .SetProperty(x => x.LastNameEncrypted, model.LastNameEncrypted)
                                .SetProperty(x => x.LastLoginAt, model.LastLoginAt));

                }

                AuditTrailTool.TrackChanges(context, isInsert ? null! : existingUser!, model, nameof(TblSystemUser), model.Id, isInsert ? "Insert" : "Update");

                return isInsert ? model.Id : existingUser.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AccountEditTools));
                throw;
            }
        }

        /// <summary>
        /// Updates an existing TblSystemUser.
        /// Returns true if update succeeds, false otherwise.
        /// </summary>
        public async Task<bool> AddTblOneTimePasswordAsync(TblOneTimePassword model, PortalDbContext context)
        {
            if (model == null)
                return false;

            try
            {

                await context.TblOneTimePasswords.Where(x => x.SystemUserId == model.SystemUserId).ExecuteDeleteAsync();
                await context.TblOneTimePasswords.AddAsync(model);
                await context.SaveChangesAsync();
                AuditTrailTool.TrackChanges(context, null!, model, nameof(TblOneTimePassword), model.SystemUserId, "Insert");

                return true;

            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AccountEditTools));
                throw;
            }
        }

        /// <summary>
        /// Creates session token for expiry session
        /// Returns true if update succeeds, false otherwise.
        /// </summary>
        public async Task<bool> AddTblSessionTokenAsync(TblSessionToken model, PortalDbContext context)
        {
            if (model == null)
                return false;

            try
            {

                await context.TblSessionTokens.Where(x => x.SystemUserId == model.SystemUserId).ExecuteDeleteAsync();
                await context.TblSessionTokens.AddAsync(model);
                await context.SaveChangesAsync();
                AuditTrailTool.TrackChanges(context, null!, model, nameof(TblOneTimePassword), model.SystemUserId, "Insert");

                return true;

            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AccountEditTools));
                throw;
            }
        }

    }
}
