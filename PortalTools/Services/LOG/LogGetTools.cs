using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.LOG.AuditTrail;
using PortalDB.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalTools.Services.LOG
{
    public class LogGetTools
    {

        private readonly PortalDbContext _context;

        public LogGetTools(PortalDbContext context)
        {
            _context = context;
        }

        public IEnumerable<TblAuditTrail> GeetTblAuditTrails() => _context.TblAuditTrails;

    }
}
