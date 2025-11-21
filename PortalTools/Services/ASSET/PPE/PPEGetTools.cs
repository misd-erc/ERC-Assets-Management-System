using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.ASSET.PPE;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Entities.DBO.Storage;
using PortalDB.Models.ResponseModels.PPE;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services.GetEditTools.DBO.Account;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalTools.Services.GetEditTools.ASSET.PPE
{

    public class PPEGetTools
    {

        public IQueryable<TblPPE> GetTblPPEs(PortalDbContext context) => context.TblPPEs.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblPPE?> GetTblPPEAsync(long? id, PortalDbContext context) => await context.TblPPEs.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblPPEMovement?> GetTblPPEMovementAsync(long? id, PortalDbContext context) => await context.TblPPEMovements.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<PPEMovementResponseModel> GetTblPPEMovementsByPPEId(long? ppeId, PortalDbContext context)
        {
            if (!ppeId.HasValue || ppeId.Value <= 0)
                return Enumerable.Empty<PPEMovementResponseModel>().AsQueryable();

            var query = context.TblPPEMovements
                .AsNoTracking() // Best practice for read-only queries
                .Where(m => !m.IsDeleted && m.PPEId == ppeId.Value)

                // Left Join: TblOffices
                .GroupJoin(
                    context.TblOffices.AsNoTracking(),
                    movement => movement.ActualOfficeId,
                    office => office.Id,
                    (movement, officeGroup) => new { movement, officeGroup })
                .SelectMany(
                    x => x.officeGroup.DefaultIfEmpty(),
                    (x, office) => new { x.movement, office })

                // Left Join: TblDivisions
                .GroupJoin(
                    context.TblDivisions.AsNoTracking(),
                    x => x.movement.ActualDivisionId,
                    division => division.Id,
                    (x, divisionGroup) => new { x.movement, x.office, divisionGroup })
                .SelectMany(
                    x => x.divisionGroup.DefaultIfEmpty(),
                    (x, division) => new PPEMovementResponseModel
                    {
                        Id = x.movement.Id,
                        PPEId = x.movement.PPEId,
                        DateAssigned = x.movement.DateAssigned,
                        ParItrNumber = x.movement.PARITRNumber,
                        PlantillaEmployeeId = x.movement.PlantillaEmployeeId,
                        NonPlantillaEmployeeId = x.movement.NonPlantillaEmployeeId,
                        PlantillaEmployeeIdOriginal = x.movement.PlantillaEmployeeIdOriginal,
                        NonPlantillaEmployeeIdOriginal = x.movement.NonPlantillaEmployeeIdOriginal,

                        Office = x.office,
                        Division = division,
                        Condition = x.movement.Remarks,
                        IsActive = x.movement.IsActive,
                        CreatedAt = x.movement.CreatedAt
                    });

            return query;
        }
        public IQueryable<PPEPartResponseModel> GetTblPPEPartsByPPEId(long? ppeId, PortalDbContext context)
        {
            var ppeParts = context.TblPPEParts.AsNoTracking().Where(x => !x.IsDeleted && x.PPEId == ppeId);

            return ppeParts.Select(x => new PPEPartResponseModel
            {
                Id = x.Id,
                PPEId = x.PPEId,
                Name = x.Name,
                SerialNumber = x.SerialNumber,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            });

        } 
        public async Task<TblPPEPart?> GetTblPPEPartAsync(long? id, PortalDbContext context) => await context.TblPPEParts.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblPPECategory> GetTblPPECategories(PortalDbContext context) => context.TblPPECategories.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblPPECategory?> GetTblPPECategoryAsync(long? id, PortalDbContext context) => await context.TblPPECategories.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblPPECategory?> GetTblPPECategoryByNameAsync(string? categoryName, PortalDbContext context) => await context.TblPPECategories.AsNoTracking().Where(x => !x.IsDeleted && x.Name == categoryName).FirstOrDefaultAsync();
        public IQueryable<TblPPELegend> GetTblPPELegends(PortalDbContext context) => context.TblPPELegends.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblPPELegend?> GetTblPPELegendAsync(long? id, PortalDbContext context) => await context.TblPPELegends.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblPPELegend?> GetTblPPELegendByNameAsync(string? categoryName, PortalDbContext context) => await context.TblPPELegends.AsNoTracking().Where(x => !x.IsDeleted && x.Name == categoryName).FirstOrDefaultAsync();
    }
}
