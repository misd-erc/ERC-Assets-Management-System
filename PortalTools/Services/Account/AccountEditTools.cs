using Microsoft.EntityFrameworkCore;
using PortalDB.Services;
using System;
using System.Linq;
using System.Text.Json;
using PortalCommon.Utilities;
using PortalDB.Entities.LOG.AuditTrail;
using PortalDB.Entities.DBO.Account;

namespace PortalTools.Services.Account
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
        /// Returns true if update succeeds, false otherwise.
        /// </summary>
        public async Task<bool> EditTblSystemUserAsync(TblSystemUser model, long changedBy = 0)
        {
            if (model == null)
                return false;

            await using var context = new PortalDbContext(_options);

            if (model.Id == 0) // Insert
            {
                await context.TblSystemUsers.AddAsync(model);
                AuditTrailTool.TrackChanges<TblSystemUser>(context, null!, model, nameof(TblSystemUser), changedBy, "Insert");
            }
            else // Update
            {
                var existingUser = await context.TblSystemUsers.FirstOrDefaultAsync(u => u.Id == model.Id);
                if (existingUser == null)
                    return false;

                // Apply changes
                existingUser.FirstName = model.FirstName ?? existingUser.FirstName;
                existingUser.LastName = model.LastName ?? existingUser.LastName;
                existingUser.Email = model.Email ?? existingUser.Email;
                existingUser.IsActive = model.IsActive;

                AuditTrailTool.TrackChanges(context, existingUser, model, nameof(TblSystemUser), changedBy, "Update");
            }

            try
            {
                await context.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateException)
            {
                return false;
            }
        }


    }
}
