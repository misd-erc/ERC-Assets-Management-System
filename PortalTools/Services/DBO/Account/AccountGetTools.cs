using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Account;
using PortalDB.Services;
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

        public IEnumerable<TblSystemUser> GetTblSystemUsers() => _context.TblSystemUsers;
        public async Task<TblSystemUser?> GetTblSystemUser(long id) => await _context.TblSystemUsers.Where(x => x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSystemUser?> GetTblSystemUserByEntraId(long entraId) => await _context.TblSystemUsers.Where(x => x.EntraId == entraId).FirstOrDefaultAsync();
        public async Task<TblSystemUser?> GetTblSystemUserByEntraIdAndEmail(TblSystemUser model)
        {
            return await _context.TblSystemUsers.Where(x => x.EntraId == model.EntraId 
                && x.Email == model.Email).FirstOrDefaultAsync();
        }

        public async Task<bool> ValidateOTPAsync(TblOneTimePassword model)
        {
            bool isExisting = await _context.TblOneTimePasswords
                .AnyAsync(x => x.SystemUserId == model.SystemUserId 
                    && x.OTPEncrypted == model.OTPEncrypted);
            
            if(isExisting)
                return true;
            return false;
        }

    }
}
