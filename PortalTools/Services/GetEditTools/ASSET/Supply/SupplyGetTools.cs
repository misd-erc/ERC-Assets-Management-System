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
        public IQueryable<TblSupplyCategory>? GetTblSupplyCategories(PortalDbContext context) => context.TblSupplyCategories.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblSupplyCategory?> GetTblSupplyCategoryAsync(long? id, PortalDbContext context) => await context.TblSupplyCategories.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblSupplyItem>? GetTblSupplyItems(PortalDbContext context) => context.TblSupplyItems.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblSupplyItem?> GetTblSupplyItemAsync(long? id, PortalDbContext context) => await context.TblSupplyItems.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblSupplyStorageLocation>? GetTblSupplyStorageLocations(PortalDbContext context) => context.TblSupplyStorageLocations.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblSupplyStorageLocation?> GetTblSupplyStorageLocationAsync(long? id, PortalDbContext context) => await context.TblSupplyStorageLocations.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblSupplyUnit>? GetTblSupplyUnits(PortalDbContext context) => context.TblSupplyUnits.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblSupplyUnit?> GetTblSupplyUnitAsync(long? id, PortalDbContext context) => await context.TblSupplyUnits.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
    
    }
}
