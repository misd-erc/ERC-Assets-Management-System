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

        public IQueryable<TblSystemUser> GetTblSystemUsers() => _context.TblSystemUsers;
        public IQueryable<VwSystemUser?> GetVwSystemUsers() => _context.VwSystemUsers;
        public async Task<VwSystemUser?> GetVwSystemUser(long id) => await _context.VwSystemUsers.Where(x => x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSystemUser?> GetTblSystemUser(long id) => await _context.TblSystemUsers.Where(x => x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSystemUser?> GetTblSystemUserByEntraId(long entraId) => await _context.TblSystemUsers.Where(x => x.EntraId == entraId).FirstOrDefaultAsync();
        public async Task<TblSystemUser?> GetTblSystemUserByEntraIdAndEmail(long entraId, string email)
        {
            TblSystemUser? user = new TblSystemUser();
            user = await _context.TblSystemUsers.Where(x => x.EntraId == entraId).FirstOrDefaultAsync();

            if (user != null && user.Email != email)
                throw new UnauthorizedAccessException("Email does not match the provided Entra ID.");

            return user;
        }
        public async Task<bool> ValidateOTPAsync(TblOneTimePassword model)
        {
            TblOneTimePassword? otpInfo = new TblOneTimePassword();

            otpInfo = await _context.TblOneTimePasswords.Where(x => x.SystemUserId == model.SystemUserId && x.ValidUntil >= DateTime.UtcNow).FirstOrDefaultAsync();

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
                .AnyAsync(x => x.SystemUserId == model.SystemUserId
                    && x.Key == model.Key
                    && x.ValidUntil >= DateTime.UtcNow);

            if (isValid)
                return true;
            return false;
        }

        public async Task<bool> ValidateTokenSessionBySystemUserIdAsync(long systemUserId)
        {
            bool isValid = await _context.TblSessionTokens
                .AnyAsync(x => x.SystemUserId == systemUserId
                    && x.ValidUntil >= DateTime.UtcNow);

            if (isValid)
                return true;

            return false;
        }

    }
}
