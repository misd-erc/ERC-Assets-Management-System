using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalTools.Services.GetEditTools.DBO.Office
{
    public class OfficeGetTools
    {

        public IQueryable<TblOffice> GetTblOffices(PortalDbContext context) => context.TblOffices.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblOffice?> GetTblOfficeAsync(long? id, PortalDbContext context) => await context.TblOffices.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblOffice?> GetTblOfficeByAcronymAsync(string? acronym, PortalDbContext context) => await context.TblOffices.AsNoTracking().Where(x => !x.IsDeleted && x.Acronym == acronym).FirstOrDefaultAsync();
        public async Task<TblDivision?> GetTblDivisionAsync(long? id, PortalDbContext context) => await context.TblDivisions.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<VwDivision> GetVwDivisions(PortalDbContext context) => context.VwDivisions.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<VwDivision?> GetVwDivisionAsync(long id, PortalDbContext context) => await context.VwDivisions.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<VwDivision?> GetVwDivisionByAcronymAsync(string acronym, PortalDbContext context) => await context.VwDivisions.AsNoTracking().Where(x => !x.IsDeleted && x.Acronym == acronym).FirstOrDefaultAsync();
        public IQueryable<VwDivision?> GetVwDivisionsByOfficeId(long officeId, PortalDbContext context) => context.VwDivisions.AsNoTracking().Where(x => !x.IsDeleted && x.OfficeId == officeId);
        public IQueryable<TblEmploymentType> GetTblEmploymentTypes(PortalDbContext context) => context.TblEmploymentTypes.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblEmploymentType?> GetTblEmploymentTypeAsync(long id, PortalDbContext context) => await context.TblEmploymentTypes.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblPosition> GetTblPositions(PortalDbContext context) => context.TblPositions.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblPosition?> GetTblPositionAsync(long id, PortalDbContext context) => await context.TblPositions.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
    }
}
