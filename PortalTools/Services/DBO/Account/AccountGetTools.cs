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

namespace PortalTools.Services.DBO.Account
{
    public class AccountGetTools
    {

        public IQueryable<TblSystemUser> GetTblSystemUsers(PortalDbContext context) => context.TblSystemUsers.Where(x => !x.IsDeleted);
        public IQueryable<VwSystemUser?> GetVwSystemUsers(PortalDbContext context) => context.VwSystemUsers.Where(x => !x.IsDeleted);
        public async Task<VwSystemUser?> GetVwSystemUserAsync(long id, PortalDbContext context) => await context.VwSystemUsers.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSystemUser?> GetTblSystemUserAsync(long id, PortalDbContext context) => await context.TblSystemUsers.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSystemUser?> GetTblSystemUserWithContextAsync(long id, PortalDbContext context) => await context.TblSystemUsers.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSystemUser?> GetTblSystemUserByEntraIdAsync(long entraId, PortalDbContext context) => await context.TblSystemUsers.Where(x => !x.IsDeleted && x.EntraId == entraId).FirstOrDefaultAsync();
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

            otpInfo = await context.TblOneTimePasswords.Where(x => !x.IsDeleted && x.SystemUserId == model.SystemUserId && x.ValidUntil >= DateTime.UtcNow).FirstOrDefaultAsync();

            if (otpInfo == null)
                throw new KeyNotFoundException("OTP connected to SystemUserId not found");

            bool isExisting = otpInfo.OTP == model.OTP;
            
            if(isExisting)
                return true;

            return false;
        }
        public async Task<bool> ValidateTokenSessionAsync(TblSessionToken model, PortalDbContext context)
        {
            bool isValid = await context.TblSessionTokens
                .AnyAsync(x => !x.IsDeleted && x.SystemUserId == model.SystemUserId
                    && x.Key == model.Key
                    && x.ValidUntil >= DateTime.UtcNow);

            if (isValid)
                return true;
            return false;
        }
        public async Task<TblSessionToken?> GetTblSessionTokenAsync(string sessionKey, PortalDbContext context) => await context.TblSessionTokens.Where(x => !x.IsDeleted && x.Key == sessionKey).FirstOrDefaultAsync();
        public async Task<bool> ValidateTokenSessionBySystemUserIdAsync(long systemUserId, PortalDbContext context)
        {
            bool isValid = await context.TblSessionTokens
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
        public IQueryable<TblSystemRole?> GetSystemRoles(PortalDbContext context) => context.TblSystemRoles.Where(x => !x.IsDeleted);
        public IQueryable<TblSystemUserStatus?> GetSystemUserStatuses(PortalDbContext context) => context.TblSystemUserStatuses.Where(x => !x.IsDeleted);
        public async Task<TblSystemRole?> GetSystemRoleAsync(long? id, PortalDbContext context) => await context.TblSystemRoles.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSystemUserStatus?> GetSystemUserStatusAsync(long? id, PortalDbContext context) => await context.TblSystemUserStatuses.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSystemRole?> GetSystemRoleByNameAsync(string name, PortalDbContext context) => await context.TblSystemRoles.Where(x => !x.IsDeleted && x.RoleName == name).FirstOrDefaultAsync();
        public async Task<IQueryable<TblSystemUser?>> GetSystemUsersBySystemRoleWithContextAsync(string systemRole, PortalDbContext context)
        {
            var role = await GetSystemRoleByNameAsync(systemRole, context);
            long systemRoleId = role!.Id;
            return context.TblSystemUsers.Where(x => !x.IsDeleted && x.SystemRoleId == systemRoleId);
        } 


    }
}
