using Microsoft.EntityFrameworkCore;
using PortalCommon.Utilities;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services.GetEditTools.DBO.Account;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalTools.Services.GetEditTools.DBO.Office
{
    public class OfficeEditTools
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;
        public OfficeEditTools(DbContextOptions<PortalDbContext> options, IPortalGetTools getTools)
        {
            _options = options;
            _getTools = getTools;
        }

        public async Task<long> EditTblOfficeAsync(TblOffice model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblOffice? existingOffice = null;

                if (isInsert)
                {
                    await context.TblOffices.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingOffice = await _getTools.Office.GetTblOfficeAsync(model.Id, context);

                    if (existingOffice == null)
                        return 0;

                    model.Id = existingOffice.Id;

                    await context.TblOffices.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.Name, model.Name)
                            .SetProperty(x => x.Acronym, model.Acronym)
                            .SetProperty(x => x.IsActive, model.IsActive));

                }

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} an office", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingOffice!, model, nameof(TblOffice), actionBySystemUserId, isInsert ? "Insert" : "Update"));
                

                return isInsert ? model.Id : existingOffice.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeEditTools));
                throw;
            }
        }
        public async Task<bool> DeleteTblOfficeAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            if (id == 0)
                return false;

            try
            {
                TblOffice? officeModel = await _getTools.Office.GetTblOfficeAsync(id, context);
                await context.TblOffices.Where(x => x.Id == id).ExecuteSoftDeleteAsync(context, actionBySystemUserId);
                await AuditTrailTool.LogActivityAsync(_options, $"Deleted an office", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, officeModel, null, nameof(TblOffice), actionBySystemUserId, "Delete"));

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeEditTools));
                throw;
            }
        }
        public async Task<long> EditTblDivisionAsync(TblDivision model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblDivision? existingDivision = null;

                if (isInsert)
                {
                    await context.TblDivisions.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingDivision = await _getTools.Office.GetTblDivisionAsync(model.Id, context);

                    if (existingDivision == null)
                        return 0;

                    model.Id = existingDivision.Id;

                    await context.TblDivisions.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.Name, model.Name)
                            .SetProperty(x => x.Acronym, model.Acronym)
                            .SetProperty(x => x.OfficeId, model.OfficeId)
                            .SetProperty(x => x.IsActive, model.IsActive));

                }

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} a division", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingDivision!, model, nameof(TblDivision), actionBySystemUserId, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingDivision.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeEditTools));
                throw;
            }
        }
        public async Task<bool> DeleteTblDivisionAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            if (id == 0)
                return false;

            try
            {
                TblDivision? divisionModel = await _getTools.Office.GetTblDivisionAsync(id, context);
                await context.TblDivisions.Where(x => x.Id == id).ExecuteSoftDeleteAsync(context);
                await AuditTrailTool.LogActivityAsync(_options, $"Deleted a division", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, divisionModel, null, nameof(TblDivision), actionBySystemUserId, "Delete"));

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeEditTools));
                throw;
            }
        }
        public async Task<long> EditTblEmploymentTypeAsync(TblEmploymentType model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblEmploymentType? existingEmploymentType = null;

                if (isInsert)
                {
                    await context.TblEmploymentTypes.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingEmploymentType = await _getTools.Office.GetTblEmploymentTypeAsync(model.Id, context);

                    if (existingEmploymentType == null)
                        return 0;

                    model.Id = existingEmploymentType.Id;

                    await context.TblEmploymentTypes.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.Name, model.Name)
                            .SetProperty(x => x.IsActive, model.IsActive));

                }

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} an employment type", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingEmploymentType!, model, nameof(TblEmploymentType), actionBySystemUserId, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingEmploymentType.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeEditTools));
                throw;
            }
        }
        public async Task<bool> DeleteTblEmploymentTypeAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            if (id == 0)
                return false;

            try
            {
                TblEmploymentType? employmentTypeModel = await _getTools.Office.GetTblEmploymentTypeAsync(id, context);
                await context.TblEmploymentTypes.Where(x => x.Id == id).ExecuteSoftDeleteAsync(context);
                await AuditTrailTool.LogActivityAsync(_options, $"Deleted an employment type", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, employmentTypeModel, null, nameof(TblEmploymentType), actionBySystemUserId, "Delete"));

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeEditTools));
                throw;
            }
        }
        public async Task<long> EditTblPositionAsync(TblPosition model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblPosition? existingPosition = null;

                if (isInsert)
                {
                    await context.TblPositions.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingPosition = await _getTools.Office.GetTblPositionAsync(model.Id, context);

                    if (existingPosition == null)
                        return 0;

                    model.Id = existingPosition.Id;

                    await context.TblPositions.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.Name, model.Name)
                            .SetProperty(x => x.Acronym, model.Acronym)
                            .SetProperty(x => x.SalaryGrade, model.SalaryGrade)
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} a position", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingPosition!, model, nameof(TblPosition), actionBySystemUserId, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingPosition.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeEditTools));
                throw;
            }
        }
        public async Task<bool> DeleteTblPositionAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            if (id == 0)
                return false;

            try
            {
                TblPosition? positionModel = await _getTools.Office.GetTblPositionAsync(id, context);
                await context.TblPositions.Where(x => x.Id == id).ExecuteSoftDeleteAsync(context);
                await AuditTrailTool.LogActivityAsync(_options, $"Deleted a position", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, positionModel, null, nameof(TblPosition), actionBySystemUserId, "Delete"));

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeEditTools));
                throw;
            }
        }


    }
}
