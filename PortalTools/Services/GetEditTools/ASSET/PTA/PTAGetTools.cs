using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Entities.DBO.Storage;
using PortalDB.Models.ResponseModels.PTA;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services.GetEditTools.DBO.Account;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalTools.Services.GetEditTools.ASSET.PTA
{

    public class PTAGetTools
    {

        public IQueryable<TblPTA> GetTblPTAsByGroup(string groupName, PortalDbContext context) => context.TblPTAs.AsNoTracking().Where(x => !x.IsDeleted && x.Group == groupName);
        public IQueryable<VwPTA> GetVwPTAsByGroup(string groupName, PortalDbContext context) => context.VwPTAs.AsNoTracking().Where(x => !x.IsDeleted && x.Group == groupName);
        public async Task<TblPTA?> GetTblPTAAsync(long? id, PortalDbContext context) => await context.TblPTAs.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblPTAMovement?> GetTblPTAMovementAsync(long? id, PortalDbContext context) => await context.TblPTAMovements.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<PTAMovementResponseModel> GetTblPTAMovementsByPTAId(long? ptaId, PortalDbContext context)
        {
            if (!ptaId.HasValue || ptaId.Value <= 0)
                return Enumerable.Empty<PTAMovementResponseModel>().AsQueryable();

            var query = context.TblPTAMovements
                .AsNoTracking() // Best practice for read-only queries
                .Where(m => !m.IsDeleted && m.PTAId == ptaId.Value)

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
                    (x, division) => new PTAMovementResponseModel
                    {
                        Id = x.movement.Id,
                        PTAId = x.movement.PTAId,
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
        public IQueryable<PTAPartResponseModel> GetTblPTAPartsByPTAId(long? ptaId, PortalDbContext context)
        {
            var ptaParts = context.TblPTAParts.AsNoTracking().Where(x => !x.IsDeleted && x.PTAId == ptaId);

            return ptaParts.Select(x => new PTAPartResponseModel
            {
                Id = x.Id,
                PTAId = x.PTAId,
                Name = x.Name,
                SerialNumber = x.SerialNumber,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            });

        } 
        public async Task<TblPTAPart?> GetTblPTAPartAsync(long? id, PortalDbContext context) => await context.TblPTAParts.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblPTACategory> GetTblPTACategories(PortalDbContext context) => context.TblPTACategories.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblPTACategory?> GetTblPTACategoryAsync(long? id, PortalDbContext context) => await context.TblPTACategories.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblPTACategory?> GetTblPTACategoryByNameAsync(string? categoryName, PortalDbContext context) => await context.TblPTACategories.AsNoTracking().Where(x => !x.IsDeleted && x.Name == categoryName).FirstOrDefaultAsync();
        public IQueryable<TblPTALegend> GetTblPTALegends(PortalDbContext context) => context.TblPTALegends.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblPTALegend?> GetTblPTALegendAsync(long? id, PortalDbContext context) => await context.TblPTALegends.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblPTALegend?> GetTblPTALegendByNameAsync(string? categoryName, PortalDbContext context) => await context.TblPTALegends.AsNoTracking().Where(x => !x.IsDeleted && x.Name == categoryName).FirstOrDefaultAsync();
    }
}
