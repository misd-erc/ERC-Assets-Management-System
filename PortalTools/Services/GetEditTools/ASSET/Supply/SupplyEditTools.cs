using Microsoft.EntityFrameworkCore;
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
    public class SupplyEditTools
    {

        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;

        public SupplyEditTools(DbContextOptions<PortalDbContext> options, IPortalGetTools getTools)
        {
            _options = options;
            _getTools = getTools;
        }

        public async Task<long> EditTblSupplyVendorAsync(TblSupplyVendor model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblSupplyVendor? existingSupplyVendor = null;

                if (isInsert)
                {
                    await context.TblSupplyVendors.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingSupplyVendor = await _getTools.Supply.GetTblSupplyVendorAsync(model.Id, context);

                    if (existingSupplyVendor == null)
                        return 0;

                    model.Id = existingSupplyVendor.Id;

                    await context.TblSupplyVendors.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.NameEncrypted, model.NameEncrypted)
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                return isInsert ? model.Id : existingSupplyVendor.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyEditTools));
                throw;
            }
        }
        public async Task<bool> DeleteTblSupplyVendorAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            if (id == 0)
                return false;

            try
            {
                TblSupplyVendor? supplyVendorModel = await _getTools.Supply.GetTblSupplyVendorAsync(id, context);
                await context.TblSupplyVendors.Where(x => x.Id == id).ExecuteSoftDeleteAsync(context);
                await AuditTrailTool.LogActivityAsync(_options, $"Deleted a Supply Vendor", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, supplyVendorModel, null, nameof(TblSupplyVendor), actionBySystemUserId, "Delete"));

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyEditTools));
                throw;
            }
        }
        public async Task<long> EditTblSupplyCategoryAsync(TblSupplyCategory model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblSupplyCategory? existingSupplyCategory = null;

                if (isInsert)
                {
                    await context.TblSupplyCategories.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingSupplyCategory = await _getTools.Supply.GetTblSupplyCategoryAsync(model.Id, context);

                    if (existingSupplyCategory == null)
                        return 0;

                    model.Id = existingSupplyCategory.Id;

                    await context.TblSupplyCategories.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.Name, model.Name)
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                return isInsert ? model.Id : existingSupplyCategory.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyEditTools));
                throw;
            }
        }
        public async Task<bool> DeleteTblSupplyCategoryAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            if (id == 0)
                return false;

            try
            {
                TblSupplyCategory? supplyCategoryModel = await _getTools.Supply.GetTblSupplyCategoryAsync(id, context);
                await context.TblSupplyCategories.Where(x => x.Id == id).ExecuteSoftDeleteAsync(context);
                await AuditTrailTool.LogActivityAsync(_options, $"Deleted a Supply Category", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, supplyCategoryModel, null, nameof(TblSupplyCategory), actionBySystemUserId, "Delete"));

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyEditTools));
                throw;
            }
        }
        public async Task<long> EditTblSupplyItemAsync(TblSupplyItem model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblSupplyItem? existingSupplyItem = null;

                if (isInsert)
                {
                    await context.TblSupplyItems.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingSupplyItem = await _getTools.Supply.GetTblSupplyItemAsync(model.Id, context);

                    if (existingSupplyItem == null)
                        return 0;

                    model.Id = existingSupplyItem.Id;

                    await context.TblSupplyItems.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.CodeEncrypted, model.CodeEncrypted)
                            .SetProperty(x => x.CategoryId, model.CategoryId)
                            .SetProperty(x => x.DescriptionEncrypted, model.DescriptionEncrypted)
                            .SetProperty(x => x.MeasurementUnitId, model.MeasurementUnitId)
                            .SetProperty(x => x.CurrentStock, model.CurrentStock)
                            .SetProperty(x => x.UnitCost, model.UnitCost)
                            .SetProperty(x => x.ReorderPoint, model.ReorderPoint)
                            .SetProperty(x => x.StorageLocationId, model.StorageLocationId)
                            .SetProperty(x => x.VendorId, model.VendorId)
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                return isInsert ? model.Id : existingSupplyItem.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyEditTools));
                throw;
            }
        }
        public async Task<bool> DeleteTblSupplyItemAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            if (id == 0)
                return false;

            try
            {
                TblSupplyItem? supplyItemModel = await _getTools.Supply.GetTblSupplyItemAsync(id, context);
                await context.TblSupplyItems.Where(x => x.Id == id).ExecuteSoftDeleteAsync(context);
                await AuditTrailTool.LogActivityAsync(_options, $"Deleted a Supply Item", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, supplyItemModel, null, nameof(TblSupplyItem), actionBySystemUserId, "Delete"));

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyEditTools));
                throw;
            }
        }
        public async Task<long> EditTblSupplyStorageLocationAsync(TblSupplyStorageLocation model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblSupplyStorageLocation? existingSupplyStorageLocation = null;

                if (isInsert)
                {
                    await context.TblSupplyStorageLocations.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingSupplyStorageLocation = await _getTools.Supply.GetTblSupplyStorageLocationAsync(model.Id, context);

                    if (existingSupplyStorageLocation == null)
                        return 0;

                    model.Id = existingSupplyStorageLocation.Id;

                    await context.TblSupplyStorageLocations.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.Name, model.Name)
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                return isInsert ? model.Id : existingSupplyStorageLocation.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyEditTools));
                throw;
            }
        }
        public async Task<bool> DeleteTblSupplyStorageLocationAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            if (id == 0)
                return false;

            try
            {
                TblSupplyStorageLocation? supplyCategoryModel = await _getTools.Supply.GetTblSupplyStorageLocationAsync(id, context);
                await context.TblSupplyStorageLocations.Where(x => x.Id == id).ExecuteSoftDeleteAsync(context);
                await AuditTrailTool.LogActivityAsync(_options, $"Deleted a Supply Category", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, supplyCategoryModel, null, nameof(TblSupplyStorageLocation), actionBySystemUserId, "Delete"));

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyEditTools));
                throw;
            }
        }
        public async Task<long> EditTblSupplyUnitAsync(TblSupplyUnit model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblSupplyUnit? existingSupplyUnit = null;

                if (isInsert)
                {
                    await context.TblSupplyUnits.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingSupplyUnit = await _getTools.Supply.GetTblSupplyUnitAsync(model.Id, context);

                    if (existingSupplyUnit == null)
                        return 0;

                    model.Id = existingSupplyUnit.Id;

                    await context.TblSupplyUnits.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.Name, model.Name)
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                return isInsert ? model.Id : existingSupplyUnit.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyEditTools));
                throw;
            }
        }
        public async Task<bool> DeleteTblSupplyUnitAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            if (id == 0)
                return false;

            try
            {
                TblSupplyUnit? supplyCategoryModel = await _getTools.Supply.GetTblSupplyUnitAsync(id, context);
                await context.TblSupplyUnits.Where(x => x.Id == id).ExecuteSoftDeleteAsync(context);
                await AuditTrailTool.LogActivityAsync(_options, $"Deleted a Supply Category", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, supplyCategoryModel, null, nameof(TblSupplyUnit), actionBySystemUserId, "Delete"));

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyEditTools));
                throw;
            }
        }

    }
}
