using Microsoft.EntityFrameworkCore;
using PortalCommon.Constants;
using PortalCommon.Utilities;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.LOG.AuditTrail;
using PortalDB.Models.QueryParams.Account;
using PortalDB.Models.ResponseModels.Account;
using PortalDB.Models.ViewModels.Account;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services.GetEditTools.DBO.Office;
using System;
using System.Linq;
using System.Text.Json;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace PortalTools.Services.GetEditTools.DBO.Account
{
    public class AccountEditTools
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;
        public AccountEditTools(DbContextOptions<PortalDbContext> options, IPortalGetTools getTools)
        {
            _options = options;
            _getTools = getTools;
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
                    var role = await _getTools.Account.GetSystemRoleByNameAsync(TblSystemRole.EMPLOYEE, context);
                    model.SystemRoleId = role?.Id;
                    model.StatusId = TblSystemUserStatus.Dictionary[TblSystemUserStatus.PENDING];
                    model.IsActive = false;
                    await context.TblSystemUsers.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingUser = await _getTools.Account.GetTblSystemUserByEntraIdAndEmailAsync(model.EntraId, model.Email, context);

                    if (existingUser == null)
                        return 0;

                    existingUser.FirstName = model.FirstName ?? existingUser.FirstName;
                    existingUser.LastName = model.LastName ?? existingUser.LastName;
                    existingUser.Email = model.Email ?? existingUser.Email;
                    existingUser.EmployeeId = model.EmployeeId ?? existingUser.EmployeeId;
                    existingUser.IsActive = model.IsActive;
                    model.Id = existingUser.Id;

                    await context.TblSystemUsers.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.FirstNameEncrypted, model.FirstNameEncrypted)
                            .SetProperty(x => x.LastNameEncrypted, model.LastNameEncrypted)
                            .SetProperty(x => x.EmployeeIdEncrypted, model.EmployeeIdEncrypted)
                            .SetProperty(x => x.LastLoginAt, model.LastLoginAt)
                            .SetProperty(x => x.IsActive, model.IsActive));

                }

                //await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} system user information for user {model.Id} base on Microsoft Entra authenticated information", actionBy: UniversalConstants.SYSTEM_ID,
                //    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingUser!, model, nameof(TblSystemUser), UniversalConstants.SYSTEM_ID, isInsert ? "Insert" : "Update"));

                return isInsert? model.Id: existingUser.Id;
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

                TblSystemUser? userCurrentInfo = await _getTools.Account.GetTblSystemUserAsync(model.Id, context);
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

                await AuditTrailTool.LogActivityAsync(_options, $"Updated system user information", actionBy: model.ActionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, userCurrentInfo, userUpdatedInfo, nameof(TblSystemUser), model.ActionBySystemUserId, "Update"));

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
                ////remove since it's not needed
                //await context.TblOneTimePasswords.Where(x => x.SystemUserId == model.SystemUserId).ExecuteSoftDeleteAsync(context);
                context.TblOneTimePasswords.Where(x => x.SystemUserId == model.SystemUserId).ExecuteDelete();
                await context.TblOneTimePasswords.AddAsync(model);
                await context.SaveChangesAsync();

                //AuditTrailTool.TrackChanges(context, null!, model, nameof(TblOneTimePassword), UniversalConstants.SYSTEM_ID, "Insert");

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

                //remove since it's not needed
                //await context.TblSessionTokens.Where(x => x.SystemUserId == model.SystemUserId).ExecuteSoftDeleteAsync(context);
                context.TblSessionTokens.Where(x => x.SystemUserId == model.SystemUserId).ExecuteDelete();
                await context.TblSessionTokens.AddAsync(model);
                await context.SaveChangesAsync();
                //AuditTrailTool.TrackChanges(context, null!, model, nameof(TblOneTimePassword), UniversalConstants.SYSTEM_ID, "Insert");

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

                TblSystemUser? userCurrentInfo = await _getTools.Account.GetTblSystemUserAsync(model.SystemUserId, context);
                TblSystemUser userUpdatedInfo = new()
                {
                    ProfilePictureFileStorageId = model.FileStorageId
                };

                if (userCurrentInfo == null)
                    return false;

                await context.TblSystemUsers.Where(u => u.Id == model.SystemUserId)
                    .ExecuteUpdateAsync(u => u
                        .SetProperty(x => x.ProfilePictureFileStorageId, userUpdatedInfo.ProfilePictureFileStorageId));

                await AuditTrailTool.LogActivityAsync(_options, $"Updated system user profile picture", actionBy: model.SystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, userCurrentInfo, userUpdatedInfo, nameof(TblSystemUser), model.SystemUserId, "Update"));

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AccountEditTools));
                throw;
            }
        }

        /// <summary>
        /// Updates an existing TblSystemRole.
        /// Returns the role id if update succeeds, 0 otherwise.
        /// </summary>
        public async Task<long> EditTblSystemRoleAsync(EditSystemRoleViewModel model, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {
                bool isInsert = model.Id == 0;

                TblSystemRole? existingRole = null;
                TblSystemRole roleUpdatedInfo = new()
                {
                    Id = model.Id,
                    RoleName = model.RoleName,
                    Description = model.Description,
                    IsActive = model.IsActive
                };

                if (isInsert)
                {
                    roleUpdatedInfo.CreatedAt = DateTime.UtcNow;
                    await context.TblSystemRoles.AddAsync(roleUpdatedInfo);
                    await context.SaveChangesAsync();
                    model.Id = roleUpdatedInfo.Id; // Get the new ID
                }
                else
                {
                    existingRole = await _getTools.Account.GetTblSystemRoleAsync(model.Id, context);
                    if (existingRole == null)
                        return 0;

                    await context.TblSystemRoles.Where(r => r.Id == model.Id)
                        .ExecuteUpdateAsync(r => r
                            .SetProperty(x => x.RoleName, roleUpdatedInfo.RoleName)
                            .SetProperty(x => x.Description, roleUpdatedInfo.Description)
                            .SetProperty(x => x.IsActive, roleUpdatedInfo.IsActive));
                }

                // Handle scopes
                await EditTblSystemRoleScopesAsync(model.Id, model.Scopes, context);

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} system role {model.RoleName}", actionBy: model.ActionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingRole!, roleUpdatedInfo, nameof(TblSystemRole), model.ActionBySystemUserId, isInsert ? "Insert" : "Update"));

                return model.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AccountEditTools));
                throw;
            }
        }

        public async Task<bool> DeleteTblSystemRoleAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            if (id == 0)
                return false;

            try
            {
                SystemRoleResponseModel? systemRoleModel = await _getTools.Account.GetSystemRoleWithScopesAsync(id, context);
                await context.TblSystemRoles.Where(x => x.Id == id).ExecuteSoftDeleteAsync(context, actionBySystemUserId);

                foreach (var scopeItem in systemRoleModel.Scope ?? Enumerable.Empty<SystemRoleScopeResponseModel>())
                {
                    await context.TblSystemRoleScopes.Where(x => x.Id == scopeItem.Id).ExecuteSoftDeleteAsync(context, actionBySystemUserId);
                }

                await AuditTrailTool.LogActivityAsync(_options, $"Deleted a system role", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, systemRoleModel, null, nameof(TblSystemRole), actionBySystemUserId, "Delete"));

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeEditTools));
                throw;
            }
        }

        /// <summary>
        /// Updates scopes for a system role.
        /// </summary>
        public async Task<bool> EditTblSystemRoleScopesAsync(long roleId, List<EditSystemRoleScopeViewModel>? scopes, PortalDbContext context)
        {
            if (scopes == null || !scopes.Any())
            {
                // Soft delete all existing scopes if no scopes provided
                await context.TblSystemRoleScopes.Where(s => s.RoleId == roleId).ExecuteSoftDeleteAsync(context);
                return true;
            }

            try
            {
                // Get existing scopes
                var existingScopes = await context.TblSystemRoleScopes.Where(s => s.RoleId == roleId && !s.IsDeleted).ToListAsync();

                // Soft delete scopes not in the new list
                var moduleIdsToKeep = scopes.Select(s => s.ModuleId).ToList();
                var scopesToDelete = existingScopes.Where(s => !moduleIdsToKeep.Contains(s.ModuleId ?? 0)).ToList();
                foreach (var scope in scopesToDelete)
                {
                    await context.TblSystemRoleScopes.Where(s => s.Id == scope.Id).ExecuteSoftDeleteAsync(context);
                }

                // Add or update scopes
                foreach (var scope in scopes)
                {
                    var existingScope = existingScopes.FirstOrDefault(s => s.ModuleId == scope.ModuleId);
                    if (existingScope != null)
                    {
                        // Update existing
                        await context.TblSystemRoleScopes.Where(s => s.Id == existingScope.Id)
                            .ExecuteUpdateAsync(s => s
                                .SetProperty(x => x.IsActive, scope.IsActive));
                    }
                    else
                    {
                        // Add new
                        TblSystemRoleScope newScope = new()
                        {
                            RoleId = roleId,
                            ModuleId = scope.ModuleId,
                            IsActive = scope.IsActive,
                            CreatedAt = DateTime.UtcNow
                        };
                        await context.TblSystemRoleScopes.AddAsync(newScope);
                    }
                }

                await context.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AccountEditTools));
                throw;
            }
        }

        /// <summary>
        /// Creates or updates a TblEmployee directly using IDs.
        /// Returns the employee id on success, 0 otherwise.
        /// </summary>
        public async Task<long> EditTblEmployeeDirectAsync(TblEmployee model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {
                bool isInsert = model.Id == 0;
                TblEmployee? existingEmployee = null;

                if (isInsert)
                {
                    model.CreatedAt = DateTime.UtcNow;
                    await context.TblEmployees.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingEmployee = await _getTools.Account.GetTblEmployeeAsync(model.Id, context);

                    if (existingEmployee == null)
                        return 0;

                    await context.TblEmployees.Where(e => e.Id == model.Id)
                        .ExecuteUpdateAsync(e => e
                            .SetProperty(x => x.FirstNameEncrypted, model.FirstNameEncrypted)
                            .SetProperty(x => x.MiddleNameEncrypted, model.MiddleNameEncrypted)
                            .SetProperty(x => x.LastNameEncrypted, model.LastNameEncrypted)
                            .SetProperty(x => x.SuffixNameEncrypted, model.SuffixNameEncrypted)
                            .SetProperty(x => x.EmployeeIdOriginalEncrypted, model.EmployeeIdOriginalEncrypted)
                            .SetProperty(x => x.OfficeId, model.OfficeId)
                            .SetProperty(x => x.DivisionId, model.DivisionId)
                            .SetProperty(x => x.EmploymentTypeId, model.EmploymentTypeId)
                            .SetProperty(x => x.PositionId, model.PositionId)
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} employee record", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingEmployee!, model, nameof(TblEmployee), actionBySystemUserId, isInsert ? "Insert" : "Update"));

                return isInsert ? model.Id : existingEmployee!.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AccountEditTools));
                throw;
            }
        }

        /// <summary>
        /// Soft-deletes a TblEmployee by id.
        /// Returns true on success, false otherwise.
        /// </summary>
        public async Task<bool> DeleteTblEmployeeAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            if (id == 0)
                return false;

            try
            {
                TblEmployee? employeeModel = await _getTools.Account.GetTblEmployeeAsync(id, context);
                await context.TblEmployees.Where(x => x.Id == id).ExecuteSoftDeleteAsync(context, actionBySystemUserId);
                await AuditTrailTool.LogActivityAsync(_options, $"Deleted employee record", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, employeeModel, null, nameof(TblEmployee), actionBySystemUserId, "Delete"));

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
