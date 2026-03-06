using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.ASSET.Delivery;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.ASSET.Supply;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services.GetEditTools.ASSET.PTA;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalTools.Services.GetEditTools.ASSET.Supply
{
    public class DeliveryEditTools
    {

        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;

        public DeliveryEditTools(DbContextOptions<PortalDbContext> options, IPortalGetTools getTools)
        {
            _options = options;
            _getTools = getTools;
        }

        public async Task<long> EditTblDeliveryRecordAsync(TblDeliveryRecord model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblDeliveryRecord? existingDeliveryRecord = null;

                if (isInsert)
                {
                    await context.TblDeliveryRecords.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingDeliveryRecord = await _getTools.Supply.GetTblDeliveryRecordAsync(model.Id, context);

                    if (existingDeliveryRecord == null)
                        return 0;

                    model.Id = existingDeliveryRecord.Id;

                    await context.TblDeliveryRecords.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.DRNumberEncrypted, model.DRNumberEncrypted)
                            .SetProperty(x => x.SupplyIARId, model.SupplyIARId)
                            .SetProperty(x => x.DeliveryDate, model.DeliveryDate)
                            .SetProperty(x => x.EmployeeId, model.EmployeeId)
                            .SetProperty(x => x.RemarksEncrypted, model.RemarksEncrypted)
                            .SetProperty(x => x.IsReceived, model.IsReceived)
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                return isInsert ? model.Id : existingDeliveryRecord.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyEditTools));
                throw;
            }
        }
        public async Task<bool> DeleteTblDeliveryRecordAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            if (id == 0)
                return false;

            try
            {
                TblDeliveryRecord? deliveryRecordModel = await _getTools.Supply.GetTblDeliveryRecordAsync(id, context);
                await context.TblDeliveryRecordItems.Where(x => x.RecordId == id).ExecuteSoftDeleteAsync(context);
                await context.TblDeliveryRecords.Where(x => x.Id == id).ExecuteSoftDeleteAsync(context);
                await AuditTrailTool.LogActivityAsync(_options, $"Deleted a Delivery Record", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, deliveryRecordModel, null, nameof(TblDeliveryRecord), actionBySystemUserId, "Delete"));

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyEditTools));
                throw;
            }
        }
        public async Task<long> EditTblDeliveryRecordItemAsync(TblDeliveryRecordItem model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblDeliveryRecordItem? existingDeliveryRecordItem = null;

                if (isInsert)
                {
                    await context.TblDeliveryRecordItems.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingDeliveryRecordItem = await _getTools.Delivery.GetTblDeliveryRecordItemAsync(model.Id, context);

                    if (existingDeliveryRecordItem == null)
                        return 0;

                    model.Id = existingDeliveryRecordItem.Id;

                    await context.TblDeliveryRecordItems.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.RecordId, model.RecordId)
                            .SetProperty(x => x.ItemTypeId, model.ItemTypeId)
                            .SetProperty(x => x.CategoryId, model.CategoryId)
                            .SetProperty(x => x.ItemDescriptionEncrypted, model.ItemDescriptionEncrypted)
                            .SetProperty(x => x.ItemSpecificationEncrypted, model.ItemSpecificationEncrypted)
                            .SetProperty(x => x.ItemQuantity, model.ItemQuantity)
                            .SetProperty(x => x.UnitId, model.UnitId)
                            .SetProperty(x => x.UnitCost, model.UnitCost)
                            .SetProperty(x => x.IsActive, model.IsActive)
                            .SetProperty(x => x.IsDeleted, model.IsDeleted));
                }

                return isInsert ? model.Id : existingDeliveryRecordItem.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DeliveryEditTools));
                throw;
            }
        }
        public async Task<bool> DeleteTblDeliveryRecordItemAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            if (id == 0)
                return false;

            try
            {
                TblDeliveryRecordItem? deliveryRecordItemModel = await _getTools.Delivery.GetTblDeliveryRecordItemAsync(id, context);
                await context.TblDeliveryRecordItems.Where(x => x.Id == id).ExecuteSoftDeleteAsync(context);
                await AuditTrailTool.LogActivityAsync(_options, $"Deleted a Delivery Record Item", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, deliveryRecordItemModel, null, nameof(TblDeliveryRecordItem), actionBySystemUserId, "Delete"));

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DeliveryEditTools));
                throw;
            }
        }

    }
}

