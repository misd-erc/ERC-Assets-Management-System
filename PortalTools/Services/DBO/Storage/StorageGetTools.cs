using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Storage;
using PortalDB.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalTools.Services.DBO.Storage
{
    public class StorageGetTools
    {
        private readonly PortalDbContext _context;

        public StorageGetTools(PortalDbContext context)
        {
            _context = context;
        }
        public IQueryable<TblFileStorage> GetTblFileStorages() => _context.TblFileStorages.Where(x => !x.IsDeleted);
        public async Task<TblFileStorage?> GetTblFileStorageAsync(long? id) => await _context.TblFileStorages.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
    }
}
