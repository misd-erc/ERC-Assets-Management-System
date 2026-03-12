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
    public class DeliveryGetTools
    {
        public IQueryable<TblDeliveryRecord>? GetTblDeliveryRecords(PortalDbContext context) => context.TblDeliveryRecords.AsNoTracking().Where(x => !x.IsDeleted);
        public IQueryable<TblDeliveryRecordItem>? GetTblDeliveryRecordItems(PortalDbContext context) => context.TblDeliveryRecordItems.AsNoTracking().Where(x => !x.IsDeleted);
        public IQueryable<TblDeliveryRecordItem>? GetTblDeliveryRecordItemsByRecordId(long? recordId, PortalDbContext context) => context.TblDeliveryRecordItems.AsNoTracking().Where(x => x.RecordId == recordId && !x.IsDeleted);
        public async Task<TblDeliveryRecordItem?> GetTblDeliveryRecordItemAsync(long? id, PortalDbContext context) => await context.TblDeliveryRecordItems.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();

    }
}
