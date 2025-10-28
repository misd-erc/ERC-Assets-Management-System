using Microsoft.EntityFrameworkCore;
using Microsoft.Graph.Models;
using PortalCommon.Constants;
using PortalCommon.Models.ResponseModels.Log;
using PortalCommon.Models.ResponseModels.Log.AuditTrail;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.LOG;
using PortalDB.Entities.LOG.AuditTrail;
using PortalDB.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
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

        public IQueryable<TblAuditTrail> GetTblAuditTrails() => _context.TblAuditTrails;
        public Task<TblAuditTrail?> GetTblAuditTrail(long id) => _context.TblAuditTrails.Where(x => x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblActivityLog> GetTblActivityLogs() => _context.TblActivityLogs;
        public async Task<TblActivityLog?> GetTblActivityLog(long id) => await _context.TblActivityLogs.Where(x => x.Id == id).FirstOrDefaultAsync();
        public async Task<AuditTrailResponseModel?> GetTblAuditTrailForResponseModel(long id)
        {

            TblAuditTrail? auditTrail = await GetTblAuditTrail(id);
            TblSystemUser? user = await _context.TblSystemUsers.Where(u => u.Id == auditTrail.ChangedBy).FirstOrDefaultAsync();

            AuditTrailResponseModel auditTrailRM = new()
            {
                Table = auditTrail.TableName,
                RecordId = auditTrail.RecordId,
                Action = auditTrail.Action,
                Changes = JsonSerializer.Deserialize<JsonElement>(auditTrail.Changes ?? "{}"),
                ActionBySystemUserId = auditTrail.ChangedBy,
                ActionBy = auditTrail.ChangedBy == 0 ? UniversalConstants.SYSTEM_NAME : $"{user.FirstName ?? ""} {user.LastName ?? ""}".Trim(),
                Date = auditTrail.ChangedAt
            };

            return auditTrailRM;
        } 

    }
}
