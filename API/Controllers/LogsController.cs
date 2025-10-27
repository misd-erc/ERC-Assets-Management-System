using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Enums;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.LOG.AuditTrail;
using PortalDB.Services;
using PortalTools.Services;
using PortalTools.Services.DBO.Account;
using PortalTools.Services.LOG;
using PortalCommon.Utilities;
using System.Text.Json;
using PortalCommon.Models.Responses;
using PortalCommon.Models.QueryParams.Pagination;
using PortalCommon.Models.ResponseModels.Log.AuditTrail;
using PortalAPI.Attributes;
using API.Attributes;

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
        private readonly AuthTools _authTools;

        public LogsController(LogGetTools logGetTools,
            AccountGetTools accountGetTools,
        DbContextOptions<PortalDbContext> options,
        AuthTools authTools)
        {
            _logGetTools = logGetTools;
            _options = options;
            _accountGetTools = accountGetTools;
            _authTools = authTools;
        }

        #region GET
        // GET api/logs/audit-trail/all
        [HttpGet("audit-trail/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllAuditTrails([FromQuery] PaginationGenericQueryParams model)
        {
            try
            {

                List<TblSystemUser> users = await _accountGetTools.GetTblSystemUsers().ToListAsync();

                IQueryable<TblAuditTrail> auditTrailQuery = _logGetTools.GetTblAuditTrails();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    auditTrailQuery = auditTrailQuery.Where(x =>
                        x.TableName.ToLower().Contains(searchLower) ||
                        x.Action.ToLower().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    auditTrailQuery = auditTrailQuery.Where(x => x.ChangedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    auditTrailQuery = auditTrailQuery.Where(x => x.ChangedAt <= model.EndDate.Value);

                int totalCount = auditTrailQuery.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var auditTrailList = auditTrailQuery
                    .OrderByDescending(x => x.ChangedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
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

                await AuditTrailTool.LogActivityAsync(_options, "Viewed audit trails", actionBy: long.Parse(EncryptionHelper.Decrypt(model.ActionBySystemUserIdEncrypted)));
                return Ok(ApiResponse<AuditTrailResponseModel>.OkPaginated(
                    auditTrailResponses,
                    model.PageNumber,
                    model.PageSize,
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
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        [DecodeRouteParameter(nameof(systemUserIdEncrypted))]
        public async Task<IActionResult> GetAllAuditTrailsBySystemUserId([FromQuery] PaginationGenericQueryParams model, [FromRoute] string systemUserIdEncrypted)
        {
            try
            {


                TblSystemUser user = await _accountGetTools.GetTblSystemUser(long.Parse(EncryptionHelper.Decrypt(systemUserIdEncrypted)));

                IQueryable<TblAuditTrail> auditTrailQuery = _logGetTools.GetTblAuditTrails().Where(x => x.ChangedBy == user.Id);

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    auditTrailQuery = auditTrailQuery.Where(x =>
                        x.TableName.ToLower().Contains(searchLower) ||
                        x.Action.ToLower().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    auditTrailQuery = auditTrailQuery.Where(x => x.ChangedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    auditTrailQuery = auditTrailQuery.Where(x => x.ChangedAt <= model.EndDate.Value);

                int totalCount = auditTrailQuery.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var auditTrailList = auditTrailQuery
                    .OrderByDescending(x => x.ChangedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
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

                await AuditTrailTool.LogActivityAsync(_options, $"Viewed audit trail for user {long.Parse(EncryptionHelper.Decrypt(systemUserIdEncrypted))}", actionBy: long.Parse(EncryptionHelper.Decrypt(model.ActionBySystemUserIdEncrypted)));
                return Ok(ApiResponse<AuditTrailResponseModel>.OkPaginated(
                    auditTrailResponses,
                    model.PageNumber,
                    model.PageSize,
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
