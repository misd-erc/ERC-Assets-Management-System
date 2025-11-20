using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.ASSET.PPE;
using PortalDB.Entities.DBO.Office;
using PortalDB.Services;
using PortalTools.Composition;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalTools.Services.GetEditTools.ASSET.PPE
{

    public class PPEEditTools
    {

        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;

        public PPEEditTools(DbContextOptions<PortalDbContext> options, IPortalGetTools getTools)
        {
            _options = options;
            _getTools = getTools;
        }

        public async Task<long> EditTblPPEAsync(TblPPE model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblPPE? existingPPE = null;

                if (isInsert)
                {
                    await context.TblPPEs.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingPPE = await _getTools.PPE.GetTblPPEAsync(model.Id, context);

                    if (existingPPE == null)
                        return 0;

                    model.Id = existingPPE.Id;

                    await context.TblPPEs.Where(u => u.Id == model.Id)
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
                            .SetProperty(x => x.EstimatedUsefulLifeEncrypted, model.EstimatedUsefulLifeEncrypted)
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} a PPE", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingPPE!, model, nameof(TblPPE), actionBySystemUserId, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingPPE.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(PPEEditTools));
                throw;
            }
        }
        public async Task<long> EditTblPPEPartAsync(TblPPEPart model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblPPEPart? existingPPEPart = null;

                if (isInsert)
                {
                    await context.TblPPEParts.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingPPEPart = await _getTools.PPE.GetTblPPEPartAsync(model.Id, context);

                    if (existingPPEPart == null)
                        return 0;

                    model.Id = existingPPEPart.Id;

                    await context.TblPPEParts.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.NameEncrypted, model.NameEncrypted)
                            .SetProperty(x => x.SerialNumberEncrypted, model.SerialNumberEncrypted));
                }

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} a PPE Part", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingPPEPart!, model, nameof(TblPPEPart), actionBySystemUserId, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingPPEPart.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(PPEEditTools));
                throw;
            }
        }
        public async Task<long> EditTblPPEMovementAsync(TblPPEMovement model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblPPEMovement? existingPPEMovement = null;

                if (isInsert)
                {
                    await context.TblPPEMovements.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingPPEMovement = await _getTools.PPE.GetTblPPEMovementAsync(model.Id, context);

                    if (existingPPEMovement == null)
                        return 0;

                    model.Id = existingPPEMovement.Id;

                    await context.TblPPEMovements.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.PPEId, model.PPEId)
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

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} a PPE Movement", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingPPEMovement!, model, nameof(TblPPEMovement), actionBySystemUserId, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingPPEMovement.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(PPEEditTools));
                throw;
            }
        }
        public async Task<long> EditTblPPECategoryAsync(TblPPECategory model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblPPECategory? existingCategory = null;

                if (isInsert)
                {
                    await context.TblPPECategories.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingCategory = await _getTools.PPE.GetTblPPECategoryAsync(model.Id, context);

                    if (existingCategory == null)
                        return 0;

                    model.Id = existingCategory.Id;

                    await context.TblPPECategories.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.Name, model.Name)
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} a PPE category", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingCategory!, model, nameof(TblPPECategory), actionBySystemUserId, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingCategory.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(PPEEditTools));
                throw;
            }
        }
        public async Task<long> EditTblPPELegendAsync(TblPPELegend model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblPPELegend? existingLegend = null;

                if (isInsert)
                {
                    await context.TblPPELegends.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingLegend = await _getTools.PPE.GetTblPPELegendAsync(model.Id, context);

                    if (existingLegend == null)
                        return 0;

                    model.Id = existingLegend.Id;

                    await context.TblPPELegends.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.Name, model.Name)
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} a PPE legend", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingLegend!, model, nameof(TblPPELegend), actionBySystemUserId, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingLegend.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(PPEEditTools));
                throw;
            }
        }
    }
}

