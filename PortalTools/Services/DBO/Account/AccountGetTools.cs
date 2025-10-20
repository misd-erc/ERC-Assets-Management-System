using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Account;
using PortalDB.Services;
using PortalTools.Utilities;
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
        public async Task<TblSystemUser?> GetTblSystemUser(long id) => await _context.TblSystemUsers.Where(x => x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSystemUser?> GetTblSystemUserByEntraId(string entraIdEncrypted) => await _context.TblSystemUsers.Where(x => x.EntraIdEncrypted == entraIdEncrypted).FirstOrDefaultAsync();
        public async Task<TblSystemUser?> GetTblSystemUserByEntraIdAndEmail(long? entraId, string email)
        {
            var encryptedEntraId = EncryptionHelper.Encrypt(entraId.ToString());
            var encryptedEmail = EncryptionHelper.Encrypt(email);

            return await _context.TblSystemUsers.Where(x => x.EntraIdEncrypted == encryptedEntraId
                && x.EmailEncrypted == encryptedEmail).FirstOrDefaultAsync();
        }
        public async Task<bool> ValidateOTPAsync(TblOneTimePassword model)
        {
            bool isExisting = await _context.TblOneTimePasswords
                .AnyAsync(x => x.SystemUserId == model.SystemUserId 
                    && x.OTPEncrypted == model.OTPEncrypted
                    && x.ValidUntil <= DateTime.UtcNow);
            
            if(isExisting)
                return true;
            return false;
        }
        public async Task<bool> ValidateTokenSessionAsync(TblSessionToken model)
        {
            bool isValid = await _context.TblSessionTokens
                .AnyAsync(x => x.SystemUserId == model.SystemUserId
                    && x.Key == model.Key
                    && x.ValidUntil <= DateTime.UtcNow);

            if (isValid)
                return true;
            return false;
        }

        public async Task<bool> ValidateTokenSessionBySystemUserIdAsync(long systemUserId)
        {
            bool isValid = await _context.TblSessionTokens
                .AnyAsync(x => x.SystemUserId == systemUserId
                    && x.ValidUntil <= DateTime.UtcNow);

            if (isValid)
                return true;

            return false;
        }

    }
}
