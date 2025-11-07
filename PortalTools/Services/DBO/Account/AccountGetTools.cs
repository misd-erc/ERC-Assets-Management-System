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

        private readonly PortalDbContext _context; 
        
        public AccountGetTools(PortalDbContext context) 
        { 
            _context = context; 
        }

        public IQueryable<TblSystemUser> GetTblSystemUsers() => _context.TblSystemUsers.Where(x => !x.IsDeleted);
        public IQueryable<VwSystemUser?> GetVwSystemUsers() => _context.VwSystemUsers.Where(x => !x.IsDeleted);
        public async Task<VwSystemUser?> GetVwSystemUserAsync(long id) => await _context.VwSystemUsers.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSystemUser?> GetTblSystemUserAsync(long id) => await _context.TblSystemUsers.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSystemUser?> GetTblSystemUserWithContextAsync(long id, PortalDbContext context) => await context.TblSystemUsers.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSystemUser?> GetTblSystemUserByEntraIdAsync(long entraId) => await _context.TblSystemUsers.Where(x => !x.IsDeleted && x.EntraId == entraId).FirstOrDefaultAsync();
        public async Task<TblSystemUser?> GetTblSystemUserByEntraIdAndEmailAsync(long entraId, string email)
        {
            TblSystemUser? user = new TblSystemUser();
            user = await GetTblSystemUserByEntraIdAsync(entraId);

            if (user != null && user.Email != email)
                throw new UnauthorizedAccessException("Email does not match the provided Entra ID.");

            return user;
        }
        public async Task<bool> ValidateOTPAsync(TblOneTimePassword model)
        {
            TblOneTimePassword? otpInfo = new TblOneTimePassword();

            otpInfo = await _context.TblOneTimePasswords.Where(x => !x.IsDeleted && x.SystemUserId == model.SystemUserId && x.ValidUntil >= DateTime.UtcNow).FirstOrDefaultAsync();

            if (otpInfo == null)
                throw new KeyNotFoundException("OTP connected to SystemUserId not found");

            bool isExisting = otpInfo.OTP == model.OTP;
            
            if(isExisting)
                return true;

            return false;
        }
        public async Task<bool> ValidateTokenSessionAsync(TblSessionToken model)
        {
            bool isValid = await _context.TblSessionTokens
                .AnyAsync(x => !x.IsDeleted && x.SystemUserId == model.SystemUserId
                    && x.Key == model.Key
                    && x.ValidUntil >= DateTime.UtcNow);

            if (isValid)
                return true;
            return false;
        }
        public async Task<TblSessionToken?> GetTblSessionTokenAsync(string sessionKey) => await _context.TblSessionTokens.Where(x => !x.IsDeleted && x.Key == sessionKey).FirstOrDefaultAsync();
        public async Task<bool> ValidateTokenSessionBySystemUserIdAsync(long systemUserId)
        {
            bool isValid = await _context.TblSessionTokens
                .AnyAsync(x => !x.IsDeleted && x.SystemUserId == systemUserId
                    && x.ValidUntil >= DateTime.UtcNow);

            if (isValid)
                return true;

            return false;
        }
        public async Task<long> GetSystemUserIdBySessionKeyAsync(string sessionKey)
        {
            TblSessionToken? sessionToken = await GetTblSessionTokenAsync(sessionKey) ?? throw new UnauthorizedAccessException("Session not found.");
            if (sessionToken.ValidUntil < DateTime.UtcNow)
                throw new UnauthorizedAccessException("Session expired.");

            return sessionToken.SystemUserId;
        }
        public IQueryable<TblSystemRole?> GetSystemRoles() => _context.TblSystemRoles.Where(x => !x.IsDeleted);
        public IQueryable<TblSystemUserStatus?> GetSystemUserStatuses() => _context.TblSystemUserStatuses.Where(x => !x.IsDeleted);
        public async Task<TblSystemRole?> GetSystemRoleAsync(long? id) => await _context.TblSystemRoles.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSystemUserStatus?> GetSystemUserStatusAsync(long? id) => await _context.TblSystemUserStatuses.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSystemRole?> GetSystemRoleByNameAsync(string name) => await _context.TblSystemRoles.Where(x => !x.IsDeleted && x.RoleName == name).FirstOrDefaultAsync();
        public async Task<IQueryable<TblSystemUser?>> GetSystemUsersBySystemRoleWithContextAsync(string systemRole, PortalDbContext context)
        {
            var role = await GetSystemRoleByNameAsync(systemRole);
            long systemRoleId = role!.Id;
            return context.TblSystemUsers.Where(x => !x.IsDeleted && x.SystemRoleId == systemRoleId);
        } 


    }
}
