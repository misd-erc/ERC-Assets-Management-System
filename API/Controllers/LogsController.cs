using API.Attributes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalCommon.Utilities;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.LOG;
using PortalDB.Entities.LOG.AuditTrail;
using PortalDB.Models.QueryParams.Pagination;
using PortalDB.Models.ResponseModels.Log;
using PortalDB.Models.ResponseModels.Log.AuditTrail;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;
using PortalTools.Services.GetEditTools.DBO.Account;
using PortalTools.Services.GetEditTools.LOG;
using System.Text.Json;

namespace API.Controllers
{
    [Route("api/[controller]")]
    /*[Authorize]*/
    [ApiController]
    public class LogsController : ControllerBase
    {

        private readonly DbContextOptions<PortalDbContext> _options;
		private readonly IPortalGetTools _getTools;
		private readonly IPortalEditTools _editTools;
		private readonly AuthTools _authTools;

        public LogsController(DbContextOptions<PortalDbContext> options,
            IPortalGetTools getTools,
            IPortalEditTools editTools,
		AuthTools authTools)
        {
            _options = options;
            _getTools = getTools;
            _editTools = editTools;
			_authTools = authTools;
        }


        #region GET
        // GET api/logs/audit-trail/all
        [HttpGet("audit-trail/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllAuditTrails([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IQueryable<TblAuditTrail> auditTrailQuery = _getTools.Log.GetTblAuditTrails();

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

                List<TblSystemUser> users = await _getTools.Account.GetTblSystemUsers(context)
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

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed audit trails", actionBy: model.ActionBySystemUserId);
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
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(LogsController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/logs/audit-trail/systemUserId
        [HttpGet("audit-trail/all/{systemUserId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllAuditTrailsBySystemUserId([FromQuery] PaginationGenericQueryParams model, [FromRoute] long systemUserId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblSystemUser? user = await _getTools.Account.GetTblSystemUserAsync(systemUserId, context);

                IQueryable<TblAuditTrail> auditTrailQuery = _getTools.Log.GetTblAuditTrails().Where(x => x.ChangedBy == user.Id);

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

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed audit trail for user {systemUserId}", actionBy: model.ActionBySystemUserId);
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
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(LogsController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/logs/audit-trail/systemUserId
        [HttpGet("audit-trail/all/{tableName}/{recordId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllAuditTrailsByTableNameAndRecordId([FromQuery] PaginationGenericQueryParams model, [FromRoute] string tableName, [FromRoute] long recordId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IQueryable<TblAuditTrail> auditTrailQuery = _getTools.Log.GetTblAuditTrailsByTableNameAndRecordId(TableConstants.Get(tableName), recordId);

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

                List<TblSystemUser> users = await _getTools.Account.GetTblSystemUsers(context)
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

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed audit trails", actionBy: model.ActionBySystemUserId);
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
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(LogsController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/logs/activities/all

        [HttpGet("activities/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllActivities([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IQueryable<TblActivityLog> activityLogQuery = _getTools.Log.GetTblActivityLogs();

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

                List<TblAuditTrail> auditTrails = await _getTools.Log.GetTblAuditTrails()
                    .Where(x => auditTrailIds.Contains(x.Id))
                    .ToListAsync();

                List<TblSystemUser> users = await _getTools.Account.GetTblSystemUsers(context)
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

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed activity logs", actionBy: model.ActionBySystemUserId);
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
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(LogsController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/logs/activities/all
        [HttpGet("activities/all/{systemUserId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllActivitiesBySystemUserId([FromQuery] PaginationGenericQueryParams model, [FromRoute] long systemUserId)
        {

            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IQueryable<TblActivityLog> activityLogQuery = _getTools.Log
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

                List<TblAuditTrail> auditTrails = await _getTools.Log.GetTblAuditTrails()
                    .Where(x => auditTrailIds.Contains(x.Id))
                    .ToListAsync();

                TblSystemUser? systemUser = await _getTools.Account.GetTblSystemUserAsync(systemUserId, context);

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

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed activity logs for user {systemUserId}", actionBy: model.ActionBySystemUserId);
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
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(LogsController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/logs/error-logs/all
        [HttpGet("error-logs/all/{anonymousKey}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllErrorLogs([FromQuery] AnonymousPaginationGenericQueryParams model, string anonymousKey)
        {

            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                if (anonymousKey != UniversalConstants.ANONYMOUS_KEY)
                    return StatusCode(ApiStatusCode.Unauthorized, ApiResponse<object>.Fail(ErrorCodes.UNAUTHORIZED, "Unauthorized access."));

                IQueryable<TblErrorLog> errorLogQuery = _getTools.Log.GetTblErrorLogs();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    errorLogQuery = errorLogQuery.Where(x =>
                        x.Description.ToLower().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    errorLogQuery = errorLogQuery.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    errorLogQuery = errorLogQuery.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = errorLogQuery.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var errorLogList = errorLogQuery
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                List<TblErrorLog> errorLogResponses = errorLogList;

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<TblErrorLog>.OkPaginated(
                    errorLogResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Error logs have been retrieved"
                ));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(LogsController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
        #endregion

    }
}
