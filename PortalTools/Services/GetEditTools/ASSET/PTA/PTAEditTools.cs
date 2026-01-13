using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.DBO.Office;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services.GetEditTools.DBO.Office;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalTools.Services.GetEditTools.ASSET.PTA
{

    public class PTAEditTools
    {

        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;

        public PTAEditTools(DbContextOptions<PortalDbContext> options, IPortalGetTools getTools)
        {
            _options = options;
            _getTools = getTools;
        }

        public async Task<long> EditTblPTAAsync(TblPTA model, long actionBySystemUserId, PortalDbContext context, bool isBatch = false)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblPTA? existingPTA = null;

                if (isInsert)
                {
                    await context.TblPTAs.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingPTA = await _getTools.PTA.GetTblPTAAsync(model.Id, context);

                    if (existingPTA == null)
                        return 0;

                    model.Id = existingPTA.Id;

                    await context.TblPTAs.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.Group, model.Group)
                            .SetProperty(x => x.PropertyNumberEncrypted, model.PropertyNumberEncrypted)
                            .SetProperty(x => x.CategoryId, model.CategoryId)
                            .SetProperty(x => x.LegendId, model.LegendId)
                            .SetProperty(x => x.DescriptionEncrypted, model.DescriptionEncrypted)
                            .SetProperty(x => x.BrandEncrypted, model.BrandEncrypted)
                            .SetProperty(x => x.ModelEncrypted, model.ModelEncrypted)
                            .SetProperty(x => x.SerialNumberEncrypted, model.SerialNumberEncrypted)
                            .SetProperty(x => x.UnitOfMeasurementEncrypted, model.UnitOfMeasurementEncrypted)
                            .SetProperty(x => x.UnitValueEncrypted, model.UnitValueEncrypted)
                            .SetProperty(x => x.DateAcquiredEncrypted, model.DateAcquiredEncrypted)
                            .SetProperty(x => x.EstimatedUsefulLifeEncrypted, model.Group == TblPTA.PPE ? model.EstimatedUsefulLifeEncrypted : null)
                            .SetProperty(x => x.FiscalDate, model.FiscalDate)
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                if(!isBatch)
                    await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} a PTA", actionBy: actionBySystemUserId,
                        linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingPTA!, model, nameof(TblPTA), actionBySystemUserId, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingPTA.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(PTAEditTools));
                throw;
            }
        }
        public async Task<bool> DeleteTblPTAAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            if (id == 0)
                return false;

            try
            {
                TblPTA? ptaModel = await _getTools.PTA.GetTblPTAAsync(id, context);
                await context.TblPTAParts.Where(x => x.PTAId == id).ExecuteSoftDeleteAsync(context);
                await context.TblPTAMovements.Where(x => x.PTAId == id).ExecuteSoftDeleteAsync(context);
                await context.TblPTAs.Where(x => x.Id == id).ExecuteSoftDeleteAsync(context);
                await AuditTrailTool.LogActivityAsync(_options, $"Deleted a PTA - {ptaModel.Group}", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, ptaModel, null, nameof(TblPTA), actionBySystemUserId, "Delete"));

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(PTAEditTools));
                throw;
            }
        }
        public async Task<long> EditTblPTAPartAsync(TblPTAPart model, long actionBySystemUserId, PortalDbContext context, bool isBatch = false)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblPTAPart? existingPTAPart = null;

                if (isInsert)
                {
                    await context.TblPTAParts.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingPTAPart = await _getTools.PTA.GetTblPTAPartAsync(model.Id, context);

                    if (existingPTAPart == null)
                        return 0;

                    model.Id = existingPTAPart.Id;

                    await context.TblPTAParts.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.PTAId, model.PTAId)
                            .SetProperty(x => x.NameEncrypted, model.NameEncrypted)
                            .SetProperty(x => x.SerialNumberEncrypted, model.SerialNumberEncrypted));
                }

                if(!isBatch)
                    await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} a PTA Part", actionBy: actionBySystemUserId,
                        linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingPTAPart!, model, nameof(TblPTAPart), actionBySystemUserId, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingPTAPart.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(PTAEditTools));
                throw;
            }
        }
        public async Task<bool> DeleteTblPTAPartAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            if (id == 0)
                return false;

            try
            {
                TblPTAPart? ptaPartModel = await _getTools.PTA.GetTblPTAPartAsync(id, context);
                await context.TblPTAParts.Where(x => x.Id == id).ExecuteSoftDeleteAsync(context);
                await AuditTrailTool.LogActivityAsync(_options, $"Deleted a PTA Part", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, ptaPartModel, null, nameof(TblPTAPart), actionBySystemUserId, "Delete"));

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(PTAEditTools));
                throw;
            }
        }
        public async Task<long> EditTblPTAMovementAsync(TblPTAMovement model, long actionBySystemUserId, PortalDbContext context, bool isBatch = false)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblPTAMovement? existingPTAMovement = null;

                if (isInsert)
                {
                    await context.TblPTAMovements.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingPTAMovement = await _getTools.PTA.GetTblPTAMovementAsync(model.Id, context);

                    if (existingPTAMovement == null)
                        return 0;

                    model.Id = existingPTAMovement.Id;

                    await context.TblPTAMovements.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.PTAId, model.PTAId)
                            .SetProperty(x => x.DateAssignedEncrypted, model.DateAssignedEncrypted)
                            .SetProperty(x => x.PTRITRNumberEncrypted, model.PTRITRNumberEncrypted)
                            .SetProperty(x => x.PARICSNumberEncrypted, model.PARICSNumberEncrypted)
                            .SetProperty(x => x.PlantillaEmployeeId, model.PlantillaEmployeeId)
                            .SetProperty(x => x.NonPlantillaEmployeeId, model.NonPlantillaEmployeeId)
                            .SetProperty(x => x.PlantillaEmployeeIdOriginalEncrypted, model.PlantillaEmployeeIdOriginalEncrypted)
                            .SetProperty(x => x.NonPlantillaEmployeeIdOriginalEncrypted, model.NonPlantillaEmployeeIdOriginalEncrypted)
                            .SetProperty(x => x.ActualOfficeId, model.ActualOfficeId)
                            .SetProperty(x => x.ActualDivisionId, model.ActualDivisionId)
                            .SetProperty(x => x.RemarksEncrypted, model.RemarksEncrypted)
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                if(!isBatch)
                    await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} a PTA Movement", actionBy: actionBySystemUserId,
                        linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingPTAMovement!, model, nameof(TblPTAMovement), actionBySystemUserId, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingPTAMovement.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(PTAEditTools));
                throw;
            }
        }
        public async Task<bool> DeleteTblPTAMovementAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            if (id == 0)
                return false;

            try
            {
                TblPTAMovement? ptaMovementModel = await _getTools.PTA.GetTblPTAMovementAsync(id, context);
                await context.TblPTAMovements.Where(x => x.Id == id).ExecuteSoftDeleteAsync(context);
                await AuditTrailTool.LogActivityAsync(_options, $"Deleted a PTA Movement", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, ptaMovementModel, null, nameof(TblPTAMovement), actionBySystemUserId, "Delete"));

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(PTAEditTools));
                throw;
            }
        }
        public async Task<long> EditTblPTACategoryAsync(TblPTACategory model, long actionBySystemUserId, PortalDbContext context, bool isBatch = false)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblPTACategory? existingCategory = null;

                if (isInsert)
                {
                    await context.TblPTACategories.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingCategory = await _getTools.PTA.GetTblPTACategoryAsync(model.Id, context);

                    if (existingCategory == null)
                        return 0;

                    model.Id = existingCategory.Id;

                    await context.TblPTACategories.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.Name, model.Name)
                            .SetProperty(x => x.GeneralCode, model.GeneralCode)
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                if(!isBatch)
                    await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} a PTA category", actionBy: actionBySystemUserId,
                        linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingCategory!, model, nameof(TblPTACategory), actionBySystemUserId, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingCategory.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(PTAEditTools));
                throw;
            }
        }
        public async Task<bool> DeleteTblPTACategoryAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            if (id == 0)
                return false;

            try
            {
                TblPTACategory? ptaCategoryModel = await _getTools.PTA.GetTblPTACategoryAsync(id, context);
                await context.TblPTACategories.Where(x => x.Id == id).ExecuteSoftDeleteAsync(context);
                await AuditTrailTool.LogActivityAsync(_options, $"Deleted a PTA Category", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, ptaCategoryModel, null, nameof(TblPTACategory), actionBySystemUserId, "Delete"));

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(PTAEditTools));
                throw;
            }
        }
        public async Task<long> EditTblPTALegendAsync(TblPTALegend model, long actionBySystemUserId, PortalDbContext context, bool isBatch = false)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblPTALegend? existingLegend = null;

                if (isInsert)
                {
                    await context.TblPTALegends.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingLegend = await _getTools.PTA.GetTblPTALegendAsync(model.Id, context);

                    if (existingLegend == null)
                        return 0;

                    model.Id = existingLegend.Id;

                    await context.TblPTALegends.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.Name, model.Name)
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                if(!isBatch)
                    await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} a PTA legend", actionBy: actionBySystemUserId,
                        linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingLegend!, model, nameof(TblPTALegend), actionBySystemUserId, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingLegend.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(PTAEditTools));
                throw;
            }
        }
        public async Task<bool> DeleteTblPTALegendAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            if (id == 0)
                return false;

            try
            {
                TblPTALegend? ptaLegendModel = await _getTools.PTA.GetTblPTALegendAsync(id, context);
                await context.TblPTACategories.Where(x => x.Id == id).ExecuteSoftDeleteAsync(context);
                await AuditTrailTool.LogActivityAsync(_options, $"Deleted a PTA Legend", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, ptaLegendModel, null, nameof(TblPTALegend), actionBySystemUserId, "Delete"));

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(PTAEditTools));
                throw;
            }
        }

    }
}

