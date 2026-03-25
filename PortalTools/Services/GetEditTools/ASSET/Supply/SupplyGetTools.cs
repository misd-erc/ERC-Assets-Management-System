using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.ASSET.Delivery;
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
        public IQueryable<TblPTACategory>? GetTblSupplyCategories(PortalDbContext context) => context.TblPTACategories.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblPTACategory?> GetTblSupplyCategoryAsync(long? id, PortalDbContext context) => await context.TblPTACategories.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblSupplyItem>? GetTblSupplyItems(PortalDbContext context) => context.TblSupplyItems.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblSupplyItem?> GetTblSupplyItemAsync(long? id, PortalDbContext context) => await context.TblSupplyItems.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblSupplyStorageLocation>? GetTblSupplyStorageLocations(PortalDbContext context) => context.TblSupplyStorageLocations.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblSupplyStorageLocation?> GetTblSupplyStorageLocationAsync(long? id, PortalDbContext context) => await context.TblSupplyStorageLocations.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblSupplyUnit>? GetTblSupplyUnits(PortalDbContext context) => context.TblSupplyUnits.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblSupplyUnit?> GetTblSupplyUnitAsync(long? id, PortalDbContext context) => await context.TblSupplyUnits.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblDeliveryRecord>? GetTblDeliveryRecords(PortalDbContext context) => context.TblDeliveryRecords.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblDeliveryRecord?> GetTblDeliveryRecordAsync(long? id, PortalDbContext context) => await context.TblDeliveryRecords.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblSupplyIAR>? GetTblSupplyIARs(PortalDbContext context) => context.TblSupplyIARs.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblSupplyIAR?> GetTblSupplyIARAsync(long? id, PortalDbContext context) => await context.TblSupplyIARs.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblSupplyRIS>? GetTblSupplyRISs(PortalDbContext context) => context.TblSupplyRISs.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblSupplyRIS?> GetTblSupplyRISAsync(long? id, PortalDbContext context) => await context.TblSupplyRISs.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblSupplyRISItem>? GetTblSupplyRISItems(PortalDbContext context) => context.TblSupplyRISItems.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblSupplyRISItem?> GetTblSupplyRISItemAsync(long? id, PortalDbContext context) => await context.TblSupplyRISItems.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<List<TblSupplyUnit>> GetTblSupplyUnitsByIds(PortalDbContext context, List<long> ids)
        {
            return await context.TblSupplyUnits
                .Where(u => ids.Contains(u.Id))
                .ToListAsync();
        }
    }
}
