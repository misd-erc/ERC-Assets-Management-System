using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.ResponseModels.Account;
using PortalCommon.ResponseModels.Log.AuditTrail;
using PortalCommon.Responses;
using PortalCommon.ViewModels.Account;
using PortalCommon.ViewModels.AuditTrail;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.LOG.AuditTrail;
using PortalDB.Services;
using PortalTools.Services.DBO.Account;
using PortalTools.Services.LOG;
using PortalTools.Utilities;
using System.Text.Json;

namespace API.Controllers
{
    [Route("api/[controller]")]
    /*[Authorize]*/
    [ApiController]
    public class LogsController : ControllerBase
    {

        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly LogGetTools _logGetTools;
        private readonly AccountGetTools _accountGetTools;

        public LogsController(LogGetTools logGetTools,
            AccountGetTools accountGetTools,
        DbContextOptions<PortalDbContext> options)
        {
            _logGetTools = logGetTools;
            _options = options;
            _accountGetTools = accountGetTools;
        }

        #region GET
        // GET api/logs/all
        [HttpGet("audit-trail/all")]
        public async Task<IActionResult> AllAuditTrails()
        {
            try
            {
                List<TblSystemUser> users = await _accountGetTools.GetTblSystemUsers().ToListAsync();

                List<AuditTrailResponseModel> auditTrailResponses = _logGetTools.GetTblAuditTrails()
                    .Select(x => new AuditTrailResponseModel
                    {
                        Table = x.TableName,
                        RecordId = x.RecordId,
                        Action = x.Action,
                        Changes = JsonSerializer.Deserialize<JsonElement>(x.Changes ?? "{}"),
                        ActionBySystemUserId = x.ChangedBy,
                        ActionBy = $"{users.Where(u => u.Id == x.ChangedBy).First().FirstName} {users.Where(u => u.Id == x.ChangedBy).First().LastName}",
                        Date = x.ChangedAt
                    })
                    .ToList();

                return Ok(ApiResponse<object>.Ok(auditTrailResponses, $"Audit trails has been retrieved"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
        #endregion

    }
}
