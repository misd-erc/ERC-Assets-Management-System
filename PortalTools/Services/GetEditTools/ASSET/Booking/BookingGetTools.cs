using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.ASSET.Booking;
using PortalDB.Services;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalTools.Services.GetEditTools.ASSET.Booking
{
    public class BookingGetTools
    {
        public IQueryable<TblAssetBookingItem> GetTblAssetBookingItems(PortalDbContext context) =>
            context.TblAssetBookingItems.AsNoTracking().Where(x => !x.IsDeleted);

        public IQueryable<TblAssetBookingItem> GetTblAssetBookingItemsByGroup(string group, string? status, PortalDbContext context)
        {
            var query = context.TblAssetBookingItems.AsNoTracking().Where(x => !x.IsDeleted && x.Group == group);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(x => x.Status == status);

            return query;
        }

        public IQueryable<TblAssetBookingItem> GetTblAssetBookingItemsBySupplyIARId(long supplyIARId, PortalDbContext context) =>
            context.TblAssetBookingItems.AsNoTracking().Where(x => !x.IsDeleted && x.SupplyIARId == supplyIARId);

        public async Task<TblAssetBookingItem?> GetTblAssetBookingItemAsync(long? id, PortalDbContext context) =>
            await context.TblAssetBookingItems.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
    }
}
