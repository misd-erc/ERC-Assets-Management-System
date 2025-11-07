using Microsoft.EntityFrameworkCore;
using PortalCommon.Utilities;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Services;
using PortalTools.Services.DBO.Account;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalTools.Services.DBO.Office
{
    public class OfficeEditTools
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly AccountGetTools _accountGetTools;
        private readonly OfficeGetTools _officeGetTools;
        public OfficeEditTools(DbContextOptions<PortalDbContext> options, AccountGetTools accountGetTools, OfficeGetTools officeGetTools)
        {
            _options = options;
            _accountGetTools = accountGetTools;
            _officeGetTools = officeGetTools;
        }

        public async Task<long> EditTblOfficeAsync(TblOffice model, PortalDbContext context)
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
                    existingOffice = await _officeGetTools.GetTblOfficeAsync(model.Id);

                    if (existingOffice == null)
                        return 0;

                    model.Id = existingOffice.Id;

                    await context.TblOffices.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.Name, model.Name)
                            .SetProperty(x => x.Acronym, model.Acronym)
                            .SetProperty(x => x.IsActive, model.IsActive));

                }

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} an office", actionBy: model.Id,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingOffice!, model, nameof(TblOffice), model.Id, isInsert ? "Insert" : "Update"));
                

                return isInsert ? model.Id : existingOffice.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeEditTools));
                throw;
            }
        }
        public async Task<long> EditTblDivisionAsync(TblDivision model, PortalDbContext context)
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
                    existingDivision = await _officeGetTools.GetTblDivisionAsync(model.Id);

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

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} a division", actionBy: model.Id,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingDivision!, model, nameof(TblDivision), model.Id, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingDivision.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeEditTools));
                throw;
            }
        }
        public async Task<long> EditTblEmploymentTypeAsync(TblEmploymentType model, PortalDbContext context)
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
                    existingEmploymentType = await _officeGetTools.GetTblEmploymentTypeAsync(model.Id);

                    if (existingEmploymentType == null)
                        return 0;

                    model.Id = existingEmploymentType.Id;

                    await context.TblEmploymentTypes.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.Name, model.Name)
                            .SetProperty(x => x.IsActive, model.IsActive));

                }

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} an employment type", actionBy: model.Id,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingEmploymentType!, model, nameof(TblEmploymentType), model.Id, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingEmploymentType.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeEditTools));
                throw;
            }
        }
        public async Task<long> EditTblPositionAsync(TblPosition model, PortalDbContext context)
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
                    existingPosition = await _officeGetTools.GetTblPositionAsync(model.Id);

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

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} a position", actionBy: model.Id,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingPosition!, model, nameof(TblPosition), model.Id, isInsert ? "Insert" : "Update"));


                return isInsert ? model.Id : existingPosition.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeEditTools));
                throw;
            }
        }


    }
}
