using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Services;
using PortalCommon.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PortalDB.Entities.DBO.Module;
using PortalDB.Models.ResponseModels.Account;

namespace PortalTools.Services.GetEditTools.DBO.Account
{
    public class AccountGetTools
    {

        public IQueryable<TblSystemUser> GetTblSystemUsers(PortalDbContext context) => context.TblSystemUsers.AsNoTracking().Where(x => !x.IsDeleted);
        public IQueryable<VwSystemUser?> GetVwSystemUsers(PortalDbContext context) => context.VwSystemUsers.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<VwSystemUser?> GetVwSystemUserAsync(long id, PortalDbContext context) => await context.VwSystemUsers.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSystemUser?> GetTblSystemUserAsync(long id, PortalDbContext context) => await context.TblSystemUsers.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblSystemUser?> GetTblSystemUsersByOfficeId(long officeId, PortalDbContext context) => context.TblSystemUsers.AsNoTracking().Where(x => !x.IsDeleted && x.OfficeId == officeId);
        public IQueryable<TblSystemUser?> GetTblSystemUsersByDivisionId(long divisionId, PortalDbContext context) => context.TblSystemUsers.AsNoTracking().Where(x => !x.IsDeleted && x.DivisionId == divisionId);
        public IQueryable<TblSystemUser?> GetTblSystemUsersByEmploymentTypeId(long employmentTypeId, PortalDbContext context) => context.TblSystemUsers.AsNoTracking().Where(x => !x.IsDeleted && x.EmploymentTypeId == employmentTypeId);
        public IQueryable<TblSystemUser?> GetTblSystemUsersByPositionId(long positionId, PortalDbContext context) => context.TblSystemUsers.AsNoTracking().Where(x => !x.IsDeleted && x.PositionId == positionId);
        public async Task<TblSystemUser?> GetTblSystemUserWithContextAsync(long id, PortalDbContext context) => await context.TblSystemUsers.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSystemUser?> GetTblSystemUserByEntraIdAsync(long entraId, PortalDbContext context) => await context.TblSystemUsers.AsNoTracking().Where(x => !x.IsDeleted && x.EntraId == entraId).FirstOrDefaultAsync();
        public async Task<TblSystemUser?> GetTblSystemUserByEntraIdAndEmailAsync(long entraId, string email, PortalDbContext context)
        {
            TblSystemUser? user = new TblSystemUser();
            user = await GetTblSystemUserByEntraIdAsync(entraId, context);

            if (user != null && user.Email != email)
                throw new UnauthorizedAccessException("Email does not match the provided Entra ID.");

            return user;
        }
        public async Task<bool> ValidateOTPAsync(TblOneTimePassword model, PortalDbContext context)
        {
            TblOneTimePassword? otpInfo = new TblOneTimePassword();

            otpInfo = await context.TblOneTimePasswords.AsNoTracking().Where(x => !x.IsDeleted && x.SystemUserId == model.SystemUserId && x.ValidUntil >= DateTime.UtcNow).FirstOrDefaultAsync();

            if (otpInfo == null)
                throw new KeyNotFoundException("OTP connected to SystemUserId not found");

            bool isExisting = otpInfo.OTP == model.OTP;
            
            if(isExisting)
                return true;

            return false;
        }
        public async Task<bool> ValidateTokenSessionAsync(TblSessionToken model, PortalDbContext context)
        {
            bool isValid = await context.TblSessionTokens.AsNoTracking()
                .AnyAsync(x => !x.IsDeleted && x.SystemUserId == model.SystemUserId
                    && x.Key == model.Key
                    && x.ValidUntil >= DateTime.UtcNow);

            if (isValid)
                return true;
            return false;
        }
        public async Task<TblSessionToken?> GetTblSessionTokenAsync(string sessionKey, PortalDbContext context) => await context.TblSessionTokens.AsNoTracking().Where(x => !x.IsDeleted && x.Key == sessionKey).FirstOrDefaultAsync();
        public async Task<bool> ValidateTokenSessionBySystemUserIdAsync(long systemUserId, PortalDbContext context)
        {
            bool isValid = await context.TblSessionTokens.AsNoTracking()
                .AnyAsync(x => !x.IsDeleted && x.SystemUserId == systemUserId
                    && x.ValidUntil >= DateTime.UtcNow);

            if (isValid)
                return true;

            return false;
        }
        public async Task<long> GetSystemUserIdBySessionKeyAsync(string sessionKey, PortalDbContext context)
        {
            TblSessionToken? sessionToken = await GetTblSessionTokenAsync(sessionKey, context) ?? throw new UnauthorizedAccessException("Session not found.");
            if (sessionToken.ValidUntil < DateTime.UtcNow)
                throw new UnauthorizedAccessException("Session expired.");

            return sessionToken.SystemUserId;
        }
        public IQueryable<TblSystemRole?> GetSystemRoles(PortalDbContext context) => context.TblSystemRoles.AsNoTracking().Where(x => !x.IsDeleted);
        public IQueryable<TblSystemModule?> GetTblSystemModules(PortalDbContext context) => context.TblSystemModules.AsNoTracking().Where(x => !x.IsDeleted);
        public IQueryable<TblSystemUserStatus?> GetSystemUserStatuses(PortalDbContext context) => context.TblSystemUserStatuses.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblSystemRole?> GetTblSystemRoleAsync(long? id, PortalDbContext context) => await context.TblSystemRoles.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<SystemRoleResponseModel?> GetSystemRoleWithScopesAsync(long? id, PortalDbContext context)
        {
            // Get the role record
            TblSystemRole? systemRole = await GetTblSystemRoleAsync(id, context);
            if (systemRole == null)
                return null;

            // Get all scopes under this role
            var scope = await GetTblSystemRoleScopesBySystemRoleIdAsync(systemRole.Id, context);

            // 🔹 Count how many users belong to this role
            int userCount = await context.TblSystemUsers.AsNoTracking()
                .CountAsync(u => u.SystemRoleId == systemRole.Id && !u.IsDeleted);

            // Return the full response with the user count
            return new SystemRoleResponseModel
            {
                Id = systemRole.Id,
                RoleName = systemRole.RoleName,
                Description = systemRole.Description,
                Scope = scope,
                IsActive = systemRole.IsActive,
                IsDeleted = systemRole.IsDeleted,
                CreatedAt = systemRole.CreatedAt,
                UserCount = userCount // 👈 added field
            };
        }
        public async Task<List<SystemRoleResponseModel>> GetSystemRoleWithScopesAsListAsync(long? id, PortalDbContext context)
        {
            var result = await GetSystemRoleWithScopesAsync(id, context);
            return result != null
                ? new List<SystemRoleResponseModel> { result }
                : new List<SystemRoleResponseModel>();
        }
        public async Task<TblSystemModule?> GetTblSystemModuleAsync(long? id, PortalDbContext context) => await context.TblSystemModules.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblSystemRoleScope?> GetTblSystemRoleScopes(PortalDbContext context) => context.TblSystemRoleScopes.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<List<SystemRoleScopeResponseModel>> GetTblSystemRoleScopesBySystemRoleIdAsync(long? systemRoleId, PortalDbContext context)
        {
            var entities = await context.TblSystemRoleScopes
                .AsNoTracking().Where(x => !x.IsDeleted && x.RoleId == systemRoleId)
                .ToListAsync();

            var results = new List<SystemRoleScopeResponseModel>();
            foreach (var x in entities)
            {
                results.Add(new SystemRoleScopeResponseModel
                {
                    Id = x.Id,
                    //Role = await GetSystemRoleAsync(x.RoleId, context),
                    Module = await GetTblSystemModuleAsync(x.ModuleId, context),
                    IsActive = x.IsActive,
                    IsDeleted = x.IsDeleted,
                    CreatedAt = x.CreatedAt
                });
            }

            return results;
        }
        public async Task<TblSystemUserStatus?> GetSystemUserStatusAsync(long? id, PortalDbContext context) => await context.TblSystemUserStatuses.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSystemRole?> GetSystemRoleByNameAsync(string name, PortalDbContext context) => await context.TblSystemRoles.AsNoTracking().Where(x => !x.IsDeleted && x.RoleName == name).FirstOrDefaultAsync();
        public async Task<IQueryable<TblSystemUser?>> GetSystemUsersBySystemRoleWithContextAsync(string systemRole, PortalDbContext context)
        {
            var role = await GetSystemRoleByNameAsync(systemRole, context);
            long systemRoleId = role!.Id;
            return context.TblSystemUsers.AsNoTracking().Where(x => !x.IsDeleted && x.SystemRoleId == systemRoleId);
        }
        public async Task<TblEmployee?> GetEmployeeByEmployeeIdAsync(string employeeId, PortalDbContext context)
        {
            if (string.IsNullOrWhiteSpace(employeeId))
                return null;

            var encryptedEmployeeId = EncryptionHelper.Encrypt(employeeId);

            return await context.TblEmployees
                .AsNoTracking().Where(x => !x.IsDeleted && x.EmployeeIdOriginalEncrypted == encryptedEmployeeId)
                .FirstOrDefaultAsync();
        }
        public IQueryable<TblEmployee?> GetEmployees(PortalDbContext context) => context.TblEmployees.AsNoTracking().Where(x => !x.IsDeleted);
    }
}
