using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.ASSET.SE;
using PortalDB.Services;
using PortalTools.Composition;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalTools.Services.GetEditTools.ASSET.SE
{
    public class SEEditTools
    {

        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;

        public SEEditTools(DbContextOptions<PortalDbContext> options, IPortalGetTools getTools)
        {
            _options = options;
            _getTools = getTools;
        }

        public async Task<long> EditTblSEAsync(TblSE model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblSE? existingSE = null;

                if (isInsert)
                {
                    await context.TblSEs.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingSE = await _getTools.SE.GetTblSEAsync(model.Id, context);

                    if (existingSE == null)
                        return 0;

                    model.Id = existingSE.Id;

                    await context.TblSEs.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
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
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} a SE", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingSE!, model, nameof(TblSE), actionBySystemUserId, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingSE.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SEEditTools));
                throw;
            }
        }
        public async Task<long> EditTblSEPartAsync(TblSEPart model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblSEPart? existingSEPart = null;

                if (isInsert)
                {
                    await context.TblSEParts.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingSEPart = await _getTools.SE.GetTblSEPartAsync(model.Id, context);

                    if (existingSEPart == null)
                        return 0;

                    model.Id = existingSEPart.Id;

                    await context.TblSEParts.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.SEId, model.SEId)
                            .SetProperty(x => x.NameEncrypted, model.NameEncrypted)
                            .SetProperty(x => x.SerialNumberEncrypted, model.SerialNumberEncrypted));
                }

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} a SE Part", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingSEPart!, model, nameof(TblSEPart), actionBySystemUserId, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingSEPart.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SEEditTools));
                throw;
            }
        }
        public async Task<long> EditTblSEMovementAsync(TblSEMovement model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblSEMovement? existingSEMovement = null;

                if (isInsert)
                {
                    await context.TblSEMovements.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingSEMovement = await _getTools.SE.GetTblSEMovementAsync(model.Id, context);

                    if (existingSEMovement == null)
                        return 0;

                    model.Id = existingSEMovement.Id;

                    await context.TblSEMovements.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.SEId, model.SEId)
                            .SetProperty(x => x.DateAssignedEncrypted, model.DateAssignedEncrypted)
                            .SetProperty(x => x.PARITRNumberEncrypted, model.PARITRNumberEncrypted)
                            .SetProperty(x => x.PlantillaEmployeeId, model.PlantillaEmployeeId)
                            .SetProperty(x => x.NonPlantillaEmployeeId, model.NonPlantillaEmployeeId)
                            .SetProperty(x => x.PlantillaEmployeeIdOriginalEncrypted, model.PlantillaEmployeeIdOriginalEncrypted)
                            .SetProperty(x => x.NonPlantillaEmployeeIdOriginalEncrypted, model.NonPlantillaEmployeeIdOriginalEncrypted)
                            .SetProperty(x => x.ActualOfficeId, model.ActualOfficeId)
                            .SetProperty(x => x.ActualDivisionId, model.ActualDivisionId)
                            .SetProperty(x => x.RemarksEncrypted, model.RemarksEncrypted)
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} a SE Movement", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingSEMovement!, model, nameof(TblSEMovement), actionBySystemUserId, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingSEMovement.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SEEditTools));
                throw;
            }
        }
        public async Task<long> EditTblSECategoryAsync(TblSECategory model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblSECategory? existingCategory = null;

                if (isInsert)
                {
                    await context.TblSECategories.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingCategory = await _getTools.SE.GetTblSECategoryAsync(model.Id, context);

                    if (existingCategory == null)
                        return 0;

                    model.Id = existingCategory.Id;

                    await context.TblSECategories.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.Name, model.Name)
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} a SE category", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingCategory!, model, nameof(TblSECategory), actionBySystemUserId, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingCategory.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SEEditTools));
                throw;
            }
        }
        public async Task<long> EditTblSELegendAsync(TblSELegend model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblSELegend? existingLegend = null;

                if (isInsert)
                {
                    await context.TblSELegends.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingLegend = await _getTools.SE.GetTblSELegendAsync(model.Id, context);

                    if (existingLegend == null)
                        return 0;

                    model.Id = existingLegend.Id;

                    await context.TblSELegends.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.Name, model.Name)
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} a SE legend", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingLegend!, model, nameof(TblSELegend), actionBySystemUserId, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingLegend.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SEEditTools));
                throw;
            }
        }
    }
}
