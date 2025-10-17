using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Enums;
using PortalCommon.QueryParams.AuditTrail;
using PortalCommon.ResponseModels.Log.AuditTrail;
using PortalCommon.Responses;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.LOG.AuditTrail;
using PortalDB.Services;
using PortalTools.Services;
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
        // GET api/logs/audit-trail/all
        [HttpGet("audit-trail/all")]
        public async Task<IActionResult> GetAllAuditTrails([FromQuery] AuditTrailQueryParams query)
        {
            try
            {
                List<TblSystemUser> users = await _accountGetTools.GetTblSystemUsers().ToListAsync();

                IQueryable<TblAuditTrail> auditTrailQuery = _logGetTools.GetTblAuditTrails();

                if (!string.IsNullOrWhiteSpace(query.SearchString))
                {
                    string searchLower = query.SearchString.ToLower();
                    auditTrailQuery = auditTrailQuery.Where(x =>
                        x.TableName.ToLower().Contains(searchLower) ||
                        x.Action.ToLower().Contains(searchLower));
                }

                if (query.StartDate.HasValue)
                    auditTrailQuery = auditTrailQuery.Where(x => x.ChangedAt >= query.StartDate.Value);

                if (query.EndDate.HasValue)
                    auditTrailQuery = auditTrailQuery.Where(x => x.ChangedAt <= query.EndDate.Value);

                int totalCount = auditTrailQuery.Count();

                int skip = (query.PageNumber - 1) * query.PageSize;

                var auditTrailList = auditTrailQuery
                    .OrderByDescending(x => x.ChangedAt)
                    .Skip(skip)
                    .Take(query.PageSize)
                    .ToList();

                List<AuditTrailResponseModel> auditTrailResponses = auditTrailList.Select(x => new AuditTrailResponseModel
                {
                    Table = x.TableName,
                    RecordId = x.RecordId,
                    Action = x.Action,
                    Changes = JsonSerializer.Deserialize<JsonElement>(x.Changes ?? "{}"),
                    ActionBySystemUserId = x.ChangedBy,
                    ActionBy = $"{users.FirstOrDefault(u => u.Id == x.ChangedBy)?.FirstName ?? ""} {users.FirstOrDefault(u => u.Id == x.ChangedBy)?.LastName ?? ""}".Trim(),
                    Date = x.ChangedAt
                }).ToList();

                return Ok(ApiResponse<AuditTrailResponseModel>.OkPaginated(
                    auditTrailResponses,
                    query.PageNumber,
                    query.PageSize,
                    totalCount,
                    "Audit trails have been retrieved"
                ));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(LogsController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/logs/audit-trail/systemUserIdEncrypted
        [HttpGet("audit-trail/all/{systemUserIdEncrypted}")]
        public async Task<IActionResult> GetAllAuditTrailsBySystemUserId([FromQuery] AuditTrailQueryParams query, [FromRoute] string systemUserIdEncrypted)
        {
            try
            {

                TblSystemUser user = await _accountGetTools.GetTblSystemUser(long.Parse(EncryptionHelper.Decrypt(systemUserIdEncrypted)));

                IQueryable<TblAuditTrail> auditTrailQuery = _logGetTools.GetTblAuditTrails().Where(x => x.ChangedBy == user.Id);

                if (!string.IsNullOrWhiteSpace(query.SearchString))
                {
                    string searchLower = query.SearchString.ToLower();
                    auditTrailQuery = auditTrailQuery.Where(x =>
                        x.TableName.ToLower().Contains(searchLower) ||
                        x.Action.ToLower().Contains(searchLower));
                }

                if (query.StartDate.HasValue)
                    auditTrailQuery = auditTrailQuery.Where(x => x.ChangedAt >= query.StartDate.Value);

                if (query.EndDate.HasValue)
                    auditTrailQuery = auditTrailQuery.Where(x => x.ChangedAt <= query.EndDate.Value);

                int totalCount = auditTrailQuery.Count();

                int skip = (query.PageNumber - 1) * query.PageSize;

                var auditTrailList = auditTrailQuery
                    .OrderByDescending(x => x.ChangedAt)
                    .Skip(skip)
                    .Take(query.PageSize)
                    .ToList();

                List<AuditTrailResponseModel> auditTrailResponses = auditTrailList.Select(x => new AuditTrailResponseModel
                {
                    Table = x.TableName,
                    RecordId = x.RecordId,
                    Action = x.Action,
                    Changes = JsonSerializer.Deserialize<JsonElement>(x.Changes ?? "{}"),
                    ActionBySystemUserId = x.ChangedBy,
                    ActionBy = $"{user.FirstName ?? ""} {user.LastName ?? ""}".Trim(),
                    Date = x.ChangedAt
                }).ToList();

                return Ok(ApiResponse<AuditTrailResponseModel>.OkPaginated(
                    auditTrailResponses,
                    query.PageNumber,
                    query.PageSize,
                    totalCount,
                    "Audit trails have been retrieved"
                ));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(LogsController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion

    }
}
