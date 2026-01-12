using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Entities.DBO.Storage;
using PortalDB.Models.ResponseModels.Account;
using PortalDB.Models.ResponseModels.PTA;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services.GetEditTools.DBO.Account;
using System;
using System.Collections.Generic;
using System.Data;
using System.Text;

namespace PortalTools.Services.GetEditTools.ASSET.PTA
{

    public class PTAGetTools
    {

        public IQueryable<TblPTA> GetTblPTAs(PortalDbContext context) => context.TblPTAs.AsNoTracking().Where(x => !x.IsDeleted);
        public IQueryable<TblPTA> GetTblPTAsByGroup(string groupName, PortalDbContext context) => context.TblPTAs.AsNoTracking().Where(x => !x.IsDeleted && x.Group == groupName);
        public IQueryable<VwPTA> GetVwPTAsByGroup(string groupName, PortalDbContext context) => context.VwPTAs.AsNoTracking().Where(x => !x.IsDeleted && x.Group == groupName);
        public async Task<TblPTA?> GetTblPTAAsync(long? id, PortalDbContext context) => await context.TblPTAs.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblPTAMovement?> GetTblPTAMovementAsync(long? id, PortalDbContext context) => await context.TblPTAMovements.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<PTAMovementResponseModel> GetTblPTAMovementsByPTAId(long? ptaId, PortalDbContext context)
        {
            if (!ptaId.HasValue || ptaId.Value <= 0)
                return Enumerable.Empty<PTAMovementResponseModel>().AsQueryable();

            return context.TblPTAMovements
                .AsNoTracking()
                .Where(m => !m.IsDeleted && m.PTAId == ptaId.Value)

                // LEFT JOIN 1: ActualOffice
                .GroupJoin(
                    context.TblOffices.AsNoTracking(),
                    movement => movement.ActualOfficeId,
                    office => office.Id,
                    (movement, officeGroup) => new { movement, officeGroup }
                )
                .SelectMany(
                    temp => temp.officeGroup.DefaultIfEmpty(),
                    (temp, actualOffice) => new { temp.movement, actualOffice }
                )

                // LEFT JOIN 2: ActualDivision
                .GroupJoin(
                    context.TblDivisions.AsNoTracking(),
                    temp => temp.movement.ActualDivisionId,
                    division => division.Id,
                    (temp, divisionGroup) => new { temp.movement, temp.actualOffice, divisionGroup }
                )
                .SelectMany(
                    temp => temp.divisionGroup.DefaultIfEmpty(),
                    (temp, actualDivision) => new PTAMovementResponseModel
                    {
                        Id = temp.movement.Id,
                        PTAId = temp.movement.PTAId,
                        DateAssigned = temp.movement.DateAssigned,
                        ParItrNumber = temp.movement.PARITRNumber ?? string.Empty,
                        PlantillaEmployeeId = temp.movement.PlantillaEmployeeId,
                        NonPlantillaEmployeeId = temp.movement.NonPlantillaEmployeeId,
                        PlantillaEmployeeIdOriginal = temp.movement.PlantillaEmployeeIdOriginal ?? string.Empty,
                        NonPlantillaEmployeeIdOriginal = temp.movement.NonPlantillaEmployeeIdOriginal ?? string.Empty,
                        Employee = context.TblEmployees
                                .Where(e => (temp.movement.NonPlantillaEmployeeId != null && e.Id == temp.movement.NonPlantillaEmployeeId) || (temp.movement.PlantillaEmployeeId != null && e.Id == temp.movement.PlantillaEmployeeId))
                                .Select(e => new EmployeeResponseModel
                                {
                                    Id = e.Id,
                                    SystemUser = e.SystemUserId.HasValue
                                        ? context.TblSystemUsers.FirstOrDefault(u => u.Id == e.SystemUserId.Value)
                                        : null,
                                    FirstName = e.FirstName,
                                    MiddleName = e.MiddleName,
                                    LastName = e.LastName,
                                    SuffixName = e.SuffixName,
                                    EmployeeIdOriginal = e.EmployeeIdOriginal,
                                    Office = e.OfficeId.HasValue ? context.TblOffices.FirstOrDefault(o => o.Id == e.OfficeId) : null,
                                    Division = e.DivisionId.HasValue ? context.TblDivisions.FirstOrDefault(d => d.Id == e.DivisionId) : null,
                                    EmploymentType = e.EmploymentTypeId.HasValue ? context.TblEmploymentTypes.FirstOrDefault(et => et.Id == e.EmploymentTypeId) : null,
                                    Position = e.PositionId.HasValue ? context.TblPositions.FirstOrDefault(p => p.Id == e.PositionId) : null,
                                    IsActive = e.IsActive,
                                    CreatedAt = e.CreatedAt
                                }).ToList(),
                        // Employee (fully translatable sub-query)
                        /*Employee = temp.movement.NonPlantillaEmployeeId != null && temp.movement.NonPlantillaEmployeeId != 0
                            ? context.TblEmployees
                                .Where(e => e.Id == temp.movement.NonPlantillaEmployeeId)
                                .Select(e => new EmployeeResponseModel
                                {
                                    Id = e.Id,
                                    SystemUser = e.SystemUserId.HasValue
                                        ? context.TblSystemUsers.FirstOrDefault(u => u.Id == e.SystemUserId.Value)
                                        : null,
                                    FirstName = e.FirstName,
                                    MiddleName = e.MiddleName,
                                    LastName = e.LastName,
                                    SuffixName = e.SuffixName,
                                    EmployeeIdOriginal = e.EmployeeIdOriginal,
                                    Office = e.OfficeId.HasValue ? context.TblOffices.FirstOrDefault(o => o.Id == e.OfficeId) : null,
                                    Division = e.DivisionId.HasValue ? context.TblDivisions.FirstOrDefault(d => d.Id == e.DivisionId) : null,
                                    EmploymentType = e.EmploymentTypeId.HasValue ? context.TblEmploymentTypes.FirstOrDefault(et => et.Id == e.EmploymentTypeId) : null,
                                    Position = e.PositionId.HasValue ? context.TblPositions.FirstOrDefault(p => p.Id == e.PositionId) : null,
                                    IsActive = e.IsActive,
                                    CreatedAt = e.CreatedAt
                                })
                                .FirstOrDefault()
                            : temp.movement.PlantillaEmployeeId != null
                                ? context.TblEmployees
                                    .Where(e => e.Id == temp.movement.PlantillaEmployeeId)
                                    .Select(e => new EmployeeResponseModel
                                    {
                                        Id = e.Id,
                                        SystemUser = e.SystemUserId.HasValue
                                            ? context.TblSystemUsers.FirstOrDefault(u => u.Id == e.SystemUserId.Value)
                                            : null,
                                        FirstName = e.FirstName,
                                        MiddleName = e.MiddleName,
                                        LastName = e.LastName,
                                        SuffixName = e.SuffixName,
                                        EmployeeIdOriginal = e.EmployeeIdOriginal,
                                        Office = e.OfficeId.HasValue ? context.TblOffices.FirstOrDefault(o => o.Id == e.OfficeId) : null,
                                        Division = e.DivisionId.HasValue ? context.TblDivisions.FirstOrDefault(d => d.Id == e.DivisionId) : null,
                                        EmploymentType = e.EmploymentTypeId.HasValue ? context.TblEmploymentTypes.FirstOrDefault(et => et.Id == e.EmploymentTypeId) : null,
                                        Position = e.PositionId.HasValue ? context.TblPositions.FirstOrDefault(p => p.Id == e.PositionId) : null,
                                        IsActive = e.IsActive,
                                        CreatedAt = e.CreatedAt
                                    })
                                    .FirstOrDefault()
                                : null,*/

                        // These are now 100% in scope
                        Office = temp.actualOffice,
                        Division = actualDivision,

                        Condition = temp.movement.Remarks ?? string.Empty,
                        IsActive = temp.movement.IsActive,
                        IsDeleted = temp.movement.IsDeleted,
                        CreatedAt = temp.movement.CreatedAt
                    });
        }
        public IQueryable<TblPTAMovement> GetTblPTAMovements(PortalDbContext context) => context.TblPTAMovements.AsNoTracking().Where(x => !x.IsDeleted);
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
