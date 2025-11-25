using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.ASSET.SE;
using PortalDB.Models.ResponseModels.SE;
using PortalDB.Services;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalTools.Services.GetEditTools.ASSET.SE
{
    public class SEGetTools
    {

        public IQueryable<TblSE> GetTblSEs(PortalDbContext context) => context.TblSEs.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblSE?> GetTblSEAsync(long? id, PortalDbContext context) => await context.TblSEs.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSEMovement?> GetTblSEMovementAsync(long? id, PortalDbContext context) => await context.TblSEMovements.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<SEMovementResponseModel> GetTblSEMovementsBySEId(long? SEId, PortalDbContext context)
        {
            if (!SEId.HasValue || SEId.Value <= 0)
                return Enumerable.Empty<SEMovementResponseModel>().AsQueryable();

            var query = context.TblSEMovements
                .AsNoTracking() // Best practice for read-only queries
                .Where(m => !m.IsDeleted && m.SEId == SEId.Value)

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
                    (x, division) => new SEMovementResponseModel
                    {
                        Id = x.movement.Id,
                        SEId = x.movement.SEId,
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
        public IQueryable<SEPartResponseModel> GetTblSEPartsBySEId(long? SEId, PortalDbContext context)
        {
            var SEParts = context.TblSEParts.AsNoTracking().Where(x => !x.IsDeleted && x.SEId == SEId);

            return SEParts.Select(x => new SEPartResponseModel
            {
                Id = x.Id,
                SEId = x.SEId,
                Name = x.Name,
                SerialNumber = x.SerialNumber,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            });

        }
        public async Task<TblSEPart?> GetTblSEPartAsync(long? id, PortalDbContext context) => await context.TblSEParts.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblSECategory> GetTblSECategories(PortalDbContext context) => context.TblSECategories.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblSECategory?> GetTblSECategoryAsync(long? id, PortalDbContext context) => await context.TblSECategories.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSECategory?> GetTblSECategoryByNameAsync(string? categoryName, PortalDbContext context) => await context.TblSECategories.AsNoTracking().Where(x => !x.IsDeleted && x.Name == categoryName).FirstOrDefaultAsync();
        public IQueryable<TblSELegend> GetTblSELegends(PortalDbContext context) => context.TblSELegends.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblSELegend?> GetTblSELegendAsync(long? id, PortalDbContext context) => await context.TblSELegends.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblSELegend?> GetTblSELegendByNameAsync(string? categoryName, PortalDbContext context) => await context.TblSELegends.AsNoTracking().Where(x => !x.IsDeleted && x.Name == categoryName).FirstOrDefaultAsync();
    }
}
