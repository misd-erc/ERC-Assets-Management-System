using Microsoft.EntityFrameworkCore;
using PortalCommon.Constants;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.LOG;
using PortalDB.Entities.LOG.AuditTrail;
using PortalDB.Services;
using PortalTools.Services.GetEditTools.DBO.Account;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalTools.Services.GetEditTools.LOG
{
    public class LogEditTools
    {

        private readonly DbContextOptions<PortalDbContext> _options;
        public LogEditTools(DbContextOptions<PortalDbContext> options)
        {
            _options = options;
        }

        public async Task<bool> AddTblActivityLogAsync(TblActivityLog model, PortalDbContext context)
        {
            if (model == null)
                return false;

            try
            {

                await context.TblActivityLogs.AddAsync(model);
                await context.SaveChangesAsync();
                return true;

            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AccountEditTools));
                throw;
            }
        }

    }
}
