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

        public IQueryable<TblPPE> GetTblPPEs(PortalDbContext context) => context.TblPPEs.Where(x => !x.IsDeleted);
        public async Task<TblPPE?> GetTblPPEAsync(long? id, PortalDbContext context) => await context.TblPPEs.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblPPEMovement?> GetTblPPEMovementAsync(long? id, PortalDbContext context) => await context.TblPPEMovements.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<PPEMovementResponseModel> GetTblPPEMovementsByPPEId(long? ppeId, PortalDbContext context)
        {
            if (ppeId == null || ppeId <= 0)
                return Enumerable.Empty<PPEMovementResponseModel>().AsQueryable();

            var query = from movement in context.TblPPEMovements
                        where !movement.IsDeleted && movement.PPEId == ppeId

                        // Left join with Office
                        join office in context.TblOffices
                            on movement.ActualOfficeId equals office.Id into officeGroup
                        from office in officeGroup.DefaultIfEmpty()

                            // Left join with Division
                        join division in context.TblDivisions
                            on movement.ActualDivisionId equals division.Id into divisionGroup
                        from division in divisionGroup.DefaultIfEmpty()

                        select new PPEMovementResponseModel
                        {
                            Id = movement.Id,
                            PPEId = movement.PPEId,
                            DateAssigned = movement.DateAssigned,
                            ParItrNumber = movement.PARITRNumber,
                            PlantillaEmployeeId = movement.PlantillaEmployeeId,
                            NonPlantillaEmployeeId = movement.NonPlantillaEmployeeId,
                            PlantillaEmployeeIdOriginal = movement.PlantillaEmployeeIdOriginal,
                            NonPlantillaEmployeeIdOriginal = movement.NonPlantillaEmployeeIdOriginal,

                            // These are navigation entities – will be NULL if no match
                            Office = office,    // Type: TblOffice?
                            Division = division,  // Type: TblDivision?

                            Condition = movement.Remarks,
                            IsActive = movement.IsActive,
                            CreatedAt = movement.CreatedAt
                        };

            return query;
        }
        public IQueryable<PPEPartResponseModel> GetTblPPEPartsByPPEId(long? ppeId, PortalDbContext context)
        {
            var ppeParts = context.TblPPEParts.Where(x => !x.IsDeleted && x.PPEId == ppeId);

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
        public async Task<TblPPEPart?> GetTblPPEPartAsync(long? id, PortalDbContext context) => await context.TblPPEParts.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblPPECategory> GetTblPPECategories(PortalDbContext context) => context.TblPPECategories.Where(x => !x.IsDeleted);
        public async Task<TblPPECategory?> GetTblPPECategoryAsync(long? id, PortalDbContext context) => await context.TblPPECategories.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblPPECategory?> GetTblPPECategoryByNameAsync(string? categoryName, PortalDbContext context) => await context.TblPPECategories.Where(x => !x.IsDeleted && x.Name == categoryName).FirstOrDefaultAsync();
        public IQueryable<TblPPELegend> GetTblPPELegends(PortalDbContext context) => context.TblPPELegends.Where(x => !x.IsDeleted);
        public async Task<TblPPELegend?> GetTblPPELegendAsync(long? id, PortalDbContext context) => await context.TblPPELegends.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblPPELegend?> GetTblPPELegendByNameAsync(string? categoryName, PortalDbContext context) => await context.TblPPELegends.Where(x => !x.IsDeleted && x.Name == categoryName).FirstOrDefaultAsync();
    }
}
