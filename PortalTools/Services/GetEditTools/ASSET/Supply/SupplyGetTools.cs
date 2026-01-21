using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.ASSET.Supply;
using PortalDB.Services;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalTools.Services.GetEditTools.ASSET.Supply
{
    public class SupplyGetTools
    {

        public IQueryable<TblSupplyVendor>? GetTblSupplyVendors(PortalDbContext context) => context.TblSupplyVendors.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblSupplyVendor?> GetTblSupplyVendorAsync(long? id, PortalDbContext context) => await context.TblSupplyVendors.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();

    }
}
