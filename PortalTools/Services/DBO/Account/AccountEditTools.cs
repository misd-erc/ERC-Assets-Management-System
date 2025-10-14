using Microsoft.EntityFrameworkCore;
using PortalDB.Services;
using System;
using System.Linq;
using System.Text.Json;
using PortalCommon.Utilities;
using PortalDB.Entities.LOG.AuditTrail;
using PortalDB.Entities.DBO.Account;

namespace PortalTools.Services.DBO.Account
{
    public class AccountEditTools
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        public AccountEditTools(DbContextOptions<PortalDbContext> options)
        {
            _options = options;
        }

        /// <summary>
        /// Updates an existing TblSystemUser.
        /// Returns true if update succeeds, false otherwise. This will be save first just to get the Id.
        /// </summary>
        public async Task<long> EditTblSystemUserAsync(TblSystemUser model, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.EntraId == 0;
                TblSystemUser? existingUser = null;

                if (isInsert)
                {
                    await context.TblSystemUsers.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingUser = await context.TblSystemUsers.FirstOrDefaultAsync(u => u.EntraIdEncrypted == model.EntraIdEncrypted && u.EmailEncrypted == model.EmailEncrypted);
                    if (existingUser == null)
                        return 0;

                    existingUser.FirstName = model.FirstName ?? existingUser.FirstName;
                    existingUser.LastName = model.LastName ?? existingUser.LastName;
                    existingUser.Email = model.Email ?? existingUser.Email;
                    existingUser.IsActive = model.IsActive;
                    model.Id = existingUser.Id;
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

    }
}
