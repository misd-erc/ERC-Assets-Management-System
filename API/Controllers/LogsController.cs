using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalCommon.Enums;
using PortalCommon.Models.QueryParams.Pagination;
using PortalCommon.Models.ResponseModels.Log;
using PortalCommon.Models.ResponseModels.Log.AuditTrail;
using PortalCommon.Models.Responses;
using PortalCommon.Utilities;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.LOG;
using PortalDB.Entities.LOG.AuditTrail;
using PortalDB.Services;
using PortalTools.Services;
using PortalTools.Services.DBO.Account;
using PortalTools.Services.LOG;
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

                var systemUserIds = auditTrailList
                    .Where(x => x.ChangedBy.HasValue)
                    .Select(x => x.ChangedBy.Value)
                    .Distinct()
                    .ToList();

                List<TblSystemUser> users = await _accountGetTools.GetTblSystemUsers()
                    .Where(x => systemUserIds.Contains(x.Id))
                    .ToListAsync();

                List<AuditTrailResponseModel> auditTrailResponses = auditTrailList.Select(x => new AuditTrailResponseModel
                {
                    Table = x.TableName,
                    RecordId = x.RecordId,
                    Action = x.Action,
                    Changes = JsonSerializer.Deserialize<JsonElement>(x.Changes ?? "{}"),
                    ActionBySystemUserId = x.ChangedBy,
                    ActionBy = x.ChangedBy == 0 ? UniversalConstants.SYSTEM_NAME : $"{users.FirstOrDefault(u => u.Id == x.ChangedBy)?.FirstName ?? ""} {users.FirstOrDefault(u => u.Id == x.ChangedBy)?.LastName ?? ""}".Trim(),
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

                TblSystemUser? user = await _accountGetTools.GetTblSystemUser(long.Parse(EncryptionHelper.Decrypt(systemUserIdEncrypted)));

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

        // GET api/logs/activities/all
        [HttpGet("activities/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllActivities([FromQuery] PaginationGenericQueryParams model)
        {
            try
            {

                IQueryable<TblActivityLog> activityLogQuery = _logGetTools.GetTblActivityLogs();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    activityLogQuery = activityLogQuery.Where(x =>
                        x.Action.ToLower().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    activityLogQuery = activityLogQuery.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    activityLogQuery = activityLogQuery.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = activityLogQuery.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var activityLogList = activityLogQuery
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var auditTrailIds = activityLogList
                    .Where(x => x.AuditTrailId.HasValue)
                    .Select(x => x.AuditTrailId.Value)
                    .Distinct()
                    .ToList();

                var systemUserIds = activityLogList
                    .Where(x => x.ActionBy.HasValue)
                    .Select(x => x.ActionBy.Value)
                    .Distinct()
                    .ToList();

                List<TblAuditTrail> auditTrails = await _logGetTools.GetTblAuditTrails()
                    .Where(x => auditTrailIds.Contains(x.Id))
                    .ToListAsync();

                List<TblSystemUser> users = await _accountGetTools.GetTblSystemUsers()
                    .Where(x => systemUserIds.Contains(x.Id))
                    .ToListAsync();

                List<ActivityResponseModel> activityResponses = (await Task.WhenAll(
                    activityLogList.Select(async x =>
                    {
                        var auditTrail = x.AuditTrailId.HasValue
                            ? auditTrails.FirstOrDefault(at => at.Id == x.AuditTrailId)
                            : null;

                        var changedByUser = auditTrail != null
                            ? users.FirstOrDefault(u => u.Id == auditTrail.ChangedBy)
                            : null;

                        return new ActivityResponseModel
                        {
                            ActivityId = x.Id,
                            AuditTrailId = x.AuditTrailId,
                            Action = x.Action,
                            ActionBySystemUserId = x.ActionBy,
                            ActionBy = x.ActionBy == 0
                                ? UniversalConstants.SYSTEM_NAME
                                : $"{users.FirstOrDefault(u => u.Id == x.ActionBy)?.FirstName ?? ""} {users.FirstOrDefault(u => u.Id == x.ActionBy)?.LastName ?? ""}".Trim(),
                            CreatedAt = x.CreatedAt,
                            AuditTrail = auditTrail == null
                                ? null
                                : new AuditTrailResponseModel
                                {
                                    Table = auditTrail.TableName,
                                    RecordId = auditTrail.RecordId,
                                    Action = auditTrail.Action,
                                    Changes = JsonSerializer.Deserialize<JsonElement>(auditTrail.Changes ?? "{}"),
                                    ActionBySystemUserId = auditTrail.ChangedBy,
                                    ActionBy = $"{changedByUser?.FirstName ?? ""} {changedByUser?.LastName ?? ""}".Trim(),
                                    Date = auditTrail.ChangedAt
                                }
                        };
                    })
                )).ToList();

                await AuditTrailTool.LogActivityAsync(_options, "Viewed activity logs", actionBy: long.Parse(EncryptionHelper.Decrypt(model.ActionBySystemUserIdEncrypted)));
                return Ok(ApiResponse<ActivityResponseModel>.OkPaginated(
                    activityResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Activity logs have been retrieved"
                ));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(LogsController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/logs/activities/all
        [HttpGet("activities/all/{systemUserIdEncrypted}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        [DecodeRouteParameter(nameof(systemUserIdEncrypted))]
        public async Task<IActionResult> GetAllActivitiesBySystemUserId([FromQuery] PaginationGenericQueryParams model, [FromRoute] string systemUserIdEncrypted)
        {
            try
            {

                long systemUserId = long.Parse(EncryptionHelper.Decrypt(systemUserIdEncrypted));

                IQueryable<TblActivityLog> activityLogQuery = _logGetTools
                    .GetTblActivityLogs()
                    .Where(x => x.ActionBy == systemUserId);

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string search = $"%{model.SearchString.Trim()}%";
                    activityLogQuery = activityLogQuery.Where(x =>
                        EF.Functions.Like(x.Action, search));
                }


                if (model.StartDate.HasValue)
                    activityLogQuery = activityLogQuery.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    activityLogQuery = activityLogQuery.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = await activityLogQuery.CountAsync();

                int skip = (model.PageNumber - 1) * model.PageSize;

                List<TblActivityLog> activityLogList = await activityLogQuery
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToListAsync();

                var auditTrailIds = activityLogList
                    .Where(x => x.AuditTrailId.HasValue)
                    .Select(x => x.AuditTrailId.Value)
                    .Distinct()
                    .ToList();

                List<TblAuditTrail> auditTrails = await _logGetTools.GetTblAuditTrails()
                    .Where(x => auditTrailIds.Contains(x.Id))
                    .ToListAsync();

                TblSystemUser? systemUser = await _accountGetTools.GetTblSystemUser(systemUserId);

                List<ActivityResponseModel> activityResponses = (await Task.WhenAll(
                    activityLogList.Select(async x =>
                    {
                        var auditTrail = x.AuditTrailId.HasValue
                            ? auditTrails.FirstOrDefault(at => at.Id == x.AuditTrailId)
                            : null;

                        return new ActivityResponseModel
                        {
                            ActivityId = x.Id,
                            AuditTrailId = x.AuditTrailId,
                            Action = x.Action,
                            ActionBySystemUserId = x.ActionBy,
                            ActionBy = x.ActionBy == 0
                                ? UniversalConstants.SYSTEM_NAME
                                : $"{systemUser?.FirstName ?? ""} {systemUser?.LastName ?? ""}".Trim(),
                            CreatedAt = x.CreatedAt,
                            AuditTrail = auditTrail == null
                                ? null
                                : new AuditTrailResponseModel
                                {
                                    Table = auditTrail.TableName,
                                    RecordId = auditTrail.RecordId,
                                    Action = auditTrail.Action,
                                    Changes = JsonSerializer.Deserialize<JsonElement>(auditTrail.Changes ?? "{}"),
                                    ActionBySystemUserId = auditTrail.ChangedBy,
                                    ActionBy = $"{systemUser?.FirstName ?? ""} {systemUser?.LastName ?? ""}".Trim(),
                                    Date = auditTrail.ChangedAt
                                }
                        };
                    })
                )).ToList();

                await AuditTrailTool.LogActivityAsync(_options, $"Viewed activity logs for user {systemUserId}", actionBy: long.Parse(EncryptionHelper.Decrypt(model.ActionBySystemUserIdEncrypted)));
                return Ok(ApiResponse<ActivityResponseModel>.OkPaginated(
                    activityResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Activity logs have been retrieved"
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
