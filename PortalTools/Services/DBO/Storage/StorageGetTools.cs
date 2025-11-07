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
        public IQueryable<TblFileStorage> GetTblFileStorages(PortalDbContext context) => context.TblFileStorages.Where(x => !x.IsDeleted);
        public async Task<TblFileStorage?> GetTblFileStorageAsync(long? id, PortalDbContext context) => await context.TblFileStorages.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
    }
}
