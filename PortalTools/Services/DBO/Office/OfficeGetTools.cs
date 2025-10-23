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

namespace PortalTools.Services.DBO.Office
{
    public class OfficeGetTools
    {
        private readonly PortalDbContext _context;

        public OfficeGetTools(PortalDbContext context)
        {
            _context = context;
        }

        public IQueryable<TblOffice> GetTblOffices() => _context.TblOffices.Where(x => !x.IsDeleted);
        public async Task<TblOffice?> GetTblOffice(long id) => await _context.TblOffices.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<VwDivision> GetVwDivisions() => _context.VwDivisions.Where(x => !x.IsDeleted);
        public async Task<VwDivision?> GetVwDivision(long id) => await _context.VwDivisions.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<VwDivision?> GetVwDivisionsByOfficeId(long officeId) => _context.VwDivisions.Where(x => !x.IsDeleted && x.OfficeId == officeId);
        public IQueryable<TblEmploymentType> GetTblEmploymentTypes() => _context.TblEmploymentTypes.Where(x => !x.IsDeleted);
        public async Task<TblEmploymentType?> GetTblEmploymentType(long id) => await _context.TblEmploymentTypes.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblPosition> GetTblPositions() => _context.TblPositions.Where(x => !x.IsDeleted);
        public async Task<TblPosition?> GetTblPosition(long id) => await _context.TblPositions.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
    }
}
