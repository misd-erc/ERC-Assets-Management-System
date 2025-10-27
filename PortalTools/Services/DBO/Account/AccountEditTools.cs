using Microsoft.EntityFrameworkCore;
using PortalCommon.Models.ViewModels.Account;
using PortalCommon.Models.QueryParams.Account;
using PortalCommon.Utilities;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.LOG.AuditTrail;
using PortalDB.Services;
using System;
using System.Linq;
using System.Text.Json;
using PortalCommon.Constants;

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
        /// Updates an existing TblSystemUser for Login.
        /// Returns true if update succeeds, false otherwise. This will be save first just to get the Id.
        /// </summary>
        public async Task<long> EditTblSystemUserForLoginAsync(TblSystemUser model, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;

                TblSystemUser? existingUser = null;
                model.LastLoginAt = DateTime.UtcNow;

                if (isInsert)
                {
                    model.StatusId = TblSystemUserStatus.Dictionary[TblSystemUserStatus.PENDING];
                    await context.TblSystemUsers.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingUser = await _accountGetTools.GetTblSystemUserByEntraIdAndEmail(model.EntraId, model.Email);

                    if (existingUser == null)
                        return 0;

                    //existingUser.FirstName = model.FirstName ?? existingUser.FirstName;
                    //existingUser.LastName = model.LastName ?? existingUser.LastName;
                    //existingUser.Email = model.Email ?? existingUser.Email;
                    //existingUser.IsActive = model.IsActive;
                    model.Id = existingUser.Id;

                    await context.TblSystemUsers.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.FirstNameEncrypted, model.FirstNameEncrypted)
                            .SetProperty(x => x.LastNameEncrypted, model.LastNameEncrypted)
                            .SetProperty(x => x.LastLoginAt, model.LastLoginAt)
                            .SetProperty(x => x.IsActive, model.IsActive));

                }

                AuditTrailTool.TrackChanges(context, isInsert ? null! : existingUser!, model, nameof(TblSystemUser), UniversalConstants.SYSTEM_ID, isInsert ? "Insert" : "Update");

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
        /// Returns true if update succeeds, false otherwise. This will be save first just to get the Id.
        /// </summary>
        public async Task<long> EditTblSystemUserAsync(EditSystemUserViewModel model, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                TblSystemUser? userCurrentInfo = await _accountGetTools.GetTblSystemUser(model.Id);
                TblSystemUser userUpdatedInfo = new()
                {
                    Id = model.Id,
                    SystemRoleId = model.SystemRoleId,
                    StatusId = model.StatusId,
                    OfficeId = model.OfficeId,
                    DivisionId = model.DivisionId,
                    EmploymentTypeId = model.EmploymentTypeId,
                    PositionId = model.PositionId,
                    IsActive = model.IsActive
                };

                if (userCurrentInfo == null)
                    return 0;

                await context.TblSystemUsers.Where(u => u.Id == userUpdatedInfo.Id)
                    .ExecuteUpdateAsync(u => u
                        .SetProperty(x => x.SystemRoleId, userUpdatedInfo.SystemRoleId)
                        .SetProperty(x => x.StatusId, userUpdatedInfo.StatusId)
                        .SetProperty(x => x.OfficeId, userUpdatedInfo.OfficeId)
                        .SetProperty(x => x.DivisionId, userUpdatedInfo.DivisionId)
                        .SetProperty(x => x.EmploymentTypeId, userUpdatedInfo.EmploymentTypeId)
                        .SetProperty(x => x.PositionId, userUpdatedInfo.PositionId)
                        .SetProperty(x => x.IsActive, userUpdatedInfo.IsActive));

                AuditTrailTool.TrackChanges(context, userCurrentInfo, userUpdatedInfo, nameof(TblSystemUser), model.ActionBy, "Update");

                return userUpdatedInfo.Id;
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

                await context.TblOneTimePasswords.Where(x => x.SystemUserId == model.SystemUserId).ExecuteSoftDeleteAsync(context);
                await context.TblOneTimePasswords.AddAsync(model);
                await context.SaveChangesAsync();

                AuditTrailTool.TrackChanges(context, null!, model, nameof(TblOneTimePassword), UniversalConstants.SYSTEM_ID, "Insert");

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

                await context.TblSessionTokens.Where(x => x.SystemUserId == model.SystemUserId).ExecuteSoftDeleteAsync(context);
                await context.TblSessionTokens.AddAsync(model);
                await context.SaveChangesAsync();
                AuditTrailTool.TrackChanges(context, null!, model, nameof(TblOneTimePassword), UniversalConstants.SYSTEM_ID, "Insert");

                return true;

            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AccountEditTools));
                throw;
            }
        }

        /// <summary>
        /// Updating profile picture of an existing TblSystemUser.
        /// Returns true if update succeeds, false otherwise. This will be save first just to get the Id.
        /// </summary>
        public async Task<bool> UpdateTblSystemUserProfilePictureAsync(EditSystemUserProfilePictureViewModel model, PortalDbContext context)
        {
            if (model == null)
                return false;

            try
            {

                TblSystemUser? userCurrentInfo = await _accountGetTools.GetTblSystemUser(model.SystemUserId);
                TblSystemUser userUpdatedInfo = new()
                {
                    ProfilePictureFileStorageId = model.FileStorageId
                };

                if (userCurrentInfo == null)
                    return false;

                await context.TblSystemUsers.Where(u => u.Id == model.SystemUserId)
                    .ExecuteUpdateAsync(u => u
                        .SetProperty(x => x.ProfilePictureFileStorageId, userUpdatedInfo.ProfilePictureFileStorageId));

                AuditTrailTool.TrackChanges(context, userCurrentInfo, userUpdatedInfo, nameof(TblSystemUser), model.SystemUserId, "Update");

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
