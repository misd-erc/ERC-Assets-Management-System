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

        public IQueryable<TblOffice> GetTblOffices() => _context.TblOffices;
        public async Task<TblOffice?> GetTblOffice(long id) => await _context.TblOffices.Where(x => x.Id == id).FirstOrDefaultAsync();
        public IQueryable<VwDivision> GetVwDivisions() => _context.VwDivisions;
        public async Task<VwDivision?> GetVwDivision(long id) => await _context.VwDivisions.Where(x => x.Id == id).FirstOrDefaultAsync();
        public IQueryable<VwDivision?> GetVwDivisionsByOfficeId(long officeId) => _context.VwDivisions.Where(x => x.OfficeId == officeId);
    }
}
