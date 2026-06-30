using API.Attributes;
using API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.DBO.Account;
using PortalDB.Models.QueryParams.AssetRequest;
using PortalDB.Models.QueryParams.Pagination;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AssetRequestController : ControllerBase
    {
        private const string APPROVAL_MODULE_ACRONYM = "APR";

        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;
        private readonly NotificationBroadcastService _notificationService;

        public AssetRequestController(DbContextOptions<PortalDbContext> options, IPortalGetTools getTools, NotificationBroadcastService notificationService)
        {
            _options = options;
            _getTools = getTools;
            _notificationService = notificationService;
        }

        #region Helpers

        private static readonly Dictionary<string, HashSet<string>> AllowedTransitions = new(StringComparer.OrdinalIgnoreCase)
        {
            [TblAssetRequest.PENDING] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                TblAssetRequest.UNDER_REVIEW,
                TblAssetRequest.REJECTED
            },
            [TblAssetRequest.UNDER_REVIEW] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                TblAssetRequest.ASSIGNED,
                TblAssetRequest.REJECTED
            },
            [TblAssetRequest.ASSIGNED] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                TblAssetRequest.IN_PROGRESS,
                TblAssetRequest.REJECTED
            },
            [TblAssetRequest.IN_PROGRESS] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                TblAssetRequest.RESOLVED,
                TblAssetRequest.REJECTED
            },
            [TblAssetRequest.RESOLVED] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                TblAssetRequest.COMPLETED
            },
            [TblAssetRequest.REJECTED] = new HashSet<string>(StringComparer.OrdinalIgnoreCase),
            [TblAssetRequest.COMPLETED] = new HashSet<string>(StringComparer.OrdinalIgnoreCase),
        };

        private static string NormalizeStatus(string status)
        {
            return status?.Trim() switch
            {
                "Pending" => TblAssetRequest.PENDING,
                "UnderReview" => TblAssetRequest.UNDER_REVIEW,
                "Assigned" => TblAssetRequest.ASSIGNED,
                "InProgress" => TblAssetRequest.IN_PROGRESS,
                "Resolved" => TblAssetRequest.RESOLVED,
                "Rejected" => TblAssetRequest.REJECTED,
                "Completed" => TblAssetRequest.COMPLETED,
                _ => string.Empty,
            };
        }

        private async Task<TblSystemUser?> GetSystemUserAsync(long systemUserId, PortalDbContext context)
        {
            return await context.TblSystemUsers
                .FirstOrDefaultAsync(x => x.Id == systemUserId && x.IsActive && !x.IsDeleted);
        }

        private async Task<string> GetUserRoleNameAsync(long systemUserId, PortalDbContext context)
        {
            var user = await GetSystemUserAsync(systemUserId, context);
            if (user?.SystemRoleId == null) return string.Empty;

            var role = await context.TblSystemRoles.FirstOrDefaultAsync(x => x.Id == user.SystemRoleId && x.IsActive && !x.IsDeleted);
            return role?.RoleName ?? string.Empty;
        }

        private async Task<bool> IsEmployeeAsync(long systemUserId, PortalDbContext context)
        {
            string role = await GetUserRoleNameAsync(systemUserId, context);
            return role.Equals(TblSystemRole.EMPLOYEE, StringComparison.OrdinalIgnoreCase);
        }

        private async Task<bool> HasApprovalsModuleScopeAsync(long systemUserId, PortalDbContext context)
        {
            var user = await GetSystemUserAsync(systemUserId, context);
            if (user?.SystemRoleId == null) return false;

            var aprModuleId = await context.TblSystemModules
                .Where(x => x.Acronym == APPROVAL_MODULE_ACRONYM && x.IsActive && !x.IsDeleted)
                .Select(x => (long?)x.Id)
                .FirstOrDefaultAsync();

            if (!aprModuleId.HasValue) return false;

            return await context.TblSystemRoleScopes.AnyAsync(x =>
                x.RoleId == user.SystemRoleId &&
                x.ModuleId == aprModuleId.Value &&
                x.IsActive &&
                !x.IsDeleted);
        }

        private async Task<string?> GetUserFullNameAsync(long? systemUserId, PortalDbContext context)
        {
            if (!systemUserId.HasValue) return null;

            var user = await GetSystemUserAsync(systemUserId.Value, context);
            if (user == null) return null;

            return $"{user.FirstName} {user.LastName}".Trim();
        }

        private static object MapPTA(TblPTA? pta)
        {
            if (pta == null)
            {
                return new { id = 0L, group = "", propertyNumber = "", description = "", serialNumber = "" };
            }

            return new
            {
                id = pta.Id,
                group = pta.Group,
                propertyNumber = pta.PropertyNumber,
                description = pta.Description,
                serialNumber = pta.SerialNumber,
            };
        }

        private async Task<object> BuildRequestResponseAsync(TblAssetRequest req, PortalDbContext context)
        {
            var items = await context.TblAssetRequestItems
                .Where(x => x.AssetRequestId == req.Id && !x.IsDeleted)
                .OrderBy(x => x.CreatedAt)
                .ToListAsync();

            var ptaIds = items.Where(i => i.PTAId.HasValue).Select(i => i.PTAId!.Value).Distinct().ToList();
            var ptaMap = await context.TblPTAs
                .Where(x => ptaIds.Contains(x.Id) && x.IsActive && !x.IsDeleted)
                .ToDictionaryAsync(x => x.Id, x => x);

            var itemModels = items.Select(i =>
            {
                ptaMap.TryGetValue(i.PTAId ?? 0, out var pta);
                return new
                {
                    id = i.Id,
                    requestId = i.AssetRequestId,
                    ptaId = i.PTAId,
                    propertyNumber = i.PropertyNumber,
                    remarks = i.Remarks,
                    createdAt = i.CreatedAt,
                    item = MapPTA(pta)
                };
            }).ToList();

            var histories = await context.TblAssetRequestHistories
                .Where(x => x.AssetRequestId == req.Id && !x.IsDeleted)
                .OrderByDescending(x => x.ActionAt)
                .ToListAsync();

            var updaterIds = histories.Select(h => h.UpdatedBySystemUserId).Distinct().ToList();
            var userMap = await context.TblSystemUsers
                .Where(x => updaterIds.Contains(x.Id) && x.IsActive && !x.IsDeleted)
                .ToDictionaryAsync(x => x.Id, x => $"{x.FirstName} {x.LastName}".Trim());

            var historyModels = histories.Select(h => new
            {
                id = h.Id,
                requestId = h.AssetRequestId,
                actionType = h.ActionType,
                fromStatus = h.FromStatus,
                toStatus = h.ToStatus,
                assignedCommitteeSystemUserId = h.AssignedCommitteeSystemUserId,
                assignedPersonnelSystemUserId = h.AssignedPersonnelSystemUserId,
                remarks = h.Remarks,
                updatedBySystemUserId = h.UpdatedBySystemUserId,
                updatedByName = userMap.TryGetValue(h.UpdatedBySystemUserId, out var name) ? name : "Unknown",
                actionAt = h.ActionAt,
            }).ToList();

            return new
            {
                id = req.Id,
                requestNumber = req.RequestNumber,
                employeeSystemUserId = req.EmployeeSystemUserId,
                employeeName = await GetUserFullNameAsync(req.EmployeeSystemUserId, context),
                assignedCommitteeSystemUserId = req.AssignedCommitteeSystemUserId,
                assignedCommitteeName = await GetUserFullNameAsync(req.AssignedCommitteeSystemUserId, context),
                assignedPersonnelSystemUserId = req.AssignedPersonnelSystemUserId,
                assignedPersonnelName = await GetUserFullNameAsync(req.AssignedPersonnelSystemUserId, context),
                status = req.Status,
                createdAt = req.CreatedAt,
                updatedAt = req.UpdatedAt,
                items = itemModels,
                history = historyModels
            };
        }

        private async Task AddHistoryAsync(
            PortalDbContext context,
            TblAssetRequest request,
            long actionBySystemUserId,
            string actionType,
            string? fromStatus,
            string? toStatus,
            string? remarks,
            long? assignedCommitteeSystemUserId = null,
            long? assignedPersonnelSystemUserId = null)
        {
            context.TblAssetRequestHistories.Add(new TblAssetRequestHistory
            {
                AssetRequestId = request.Id,
                ActionType = actionType,
                FromStatus = fromStatus,
                ToStatus = toStatus,
                AssignedCommitteeSystemUserId = assignedCommitteeSystemUserId,
                AssignedPersonnelSystemUserId = assignedPersonnelSystemUserId,
                Remarks = remarks,
                UpdatedBySystemUserId = actionBySystemUserId,
                ActionAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true,
                IsDeleted = false,
            });

            await context.SaveChangesAsync();
        }

        #endregion

        #region Lookup

        [HttpGet("lookup/property")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> LookupAssetByPropertyNumber([FromQuery] AssetRequestLookupQueryParams model)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                string needle = model.PropertyNumber.Trim().ToLowerInvariant();
                var pta = context.TblPTAs
                    .Where(x => x.IsActive && !x.IsDeleted)
                    .AsEnumerable()
                    .FirstOrDefault(x => (x.PropertyNumber ?? string.Empty).Trim().ToLowerInvariant() == needle);

                if (pta == null)
                {
                    return StatusCode(ApiStatusCode.NotFound,
                        ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "Asset not found for the given property number."));
                }

                return Ok(ApiResponse<object>.Ok(new
                {
                    id = pta.Id,
                    group = pta.Group,
                    propertyNumber = pta.PropertyNumber,
                    description = pta.Description,
                    serialNumber = pta.SerialNumber,
                    unitValue = pta.UnitValue,
                }, "Asset found."));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AssetRequestController));
                return StatusCode(ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("processors/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetEligibleProcessors([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                bool canAccess = await HasApprovalsModuleScopeAsync(model.ActionBySystemUserId, context)
                    || await IsEmployeeAsync(model.ActionBySystemUserId, context);

                if (!canAccess)
                {
                    return StatusCode(ApiStatusCode.Forbidden,
                        ApiResponse<object>.Fail(ErrorCodes.FORBIDDEN, "You are not allowed to access this resource."));
                }

                var aprModuleId = await context.TblSystemModules
                    .Where(x => x.Acronym == APPROVAL_MODULE_ACRONYM && x.IsActive && !x.IsDeleted)
                    .Select(x => (long?)x.Id)
                    .FirstOrDefaultAsync();

                if (!aprModuleId.HasValue)
                {
                    return Ok(ApiResponse<object>.Ok(new List<object>(), "No processors configured."));
                }

                var roleIds = await context.TblSystemRoleScopes
                    .Where(x => x.ModuleId == aprModuleId && x.IsActive && !x.IsDeleted)
                    .Select(x => x.RoleId)
                    .Where(x => x.HasValue)
                    .Select(x => x!.Value)
                    .Distinct()
                    .ToListAsync();

                var users = await context.TblSystemUsers
                    .Where(x => x.IsActive && !x.IsDeleted && x.SystemRoleId.HasValue && roleIds.Contains(x.SystemRoleId.Value))
                    .OrderBy(x => x.LastName)
                    .ThenBy(x => x.FirstName)
                    .Select(x => new
                    {
                        id = x.Id,
                        firstName = x.FirstName,
                        lastName = x.LastName,
                        fullName = ($"{x.FirstName} {x.LastName}").Trim(),
                        roleId = x.SystemRoleId,
                    })
                    .ToListAsync();

                return Ok(ApiResponse<object>.Ok(users, "Eligible processors retrieved successfully."));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AssetRequestController));
                return StatusCode(ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion

        #region Employee

        [HttpPost("create")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> Create([FromBody] CreateAssetRequestQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                if (!await IsEmployeeAsync(model.ActionBySystemUserId, context))
                {
                    return StatusCode(ApiStatusCode.Forbidden,
                        ApiResponse<object>.Fail(ErrorCodes.FORBIDDEN, "Only employees can create asset requests."));
                }

                if (model.Items.Any(i => string.IsNullOrWhiteSpace(i.PropertyNumber) || string.IsNullOrWhiteSpace(i.Remarks)))
                {
                    return StatusCode(ApiStatusCode.BadRequest,
                        ApiResponse<object>.Fail(ErrorCodes.INVALID_INPUT, "Each item must include a property number and remarks."));
                }

                int year = DateTime.UtcNow.Year;
                int existingCount = await context.TblAssetRequests.CountAsync(x => x.CreatedAt.Year == year);
                string requestNumber = $"AR-{year}-{(existingCount + 1).ToString().PadLeft(4, '0')}";

                var request = new TblAssetRequest
                {
                    RequestNumber = requestNumber,
                    EmployeeSystemUserId = model.ActionBySystemUserId,
                    AssignedCommitteeSystemUserId = model.AssignedCommitteeSystemUserId,
                    Status = TblAssetRequest.PENDING,
                    IsActive = true,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };

                context.TblAssetRequests.Add(request);
                await context.SaveChangesAsync();

                foreach (var item in model.Items)
                {
                    long? ptaId = item.PTAId;

                    if (!ptaId.HasValue)
                    {
                        var pta = context.TblPTAs
                            .Where(x => x.IsActive && !x.IsDeleted)
                            .AsEnumerable()
                            .FirstOrDefault(x => string.Equals((x.PropertyNumber ?? string.Empty).Trim(), item.PropertyNumber.Trim(), StringComparison.OrdinalIgnoreCase));

                        ptaId = pta?.Id;
                    }

                    context.TblAssetRequestItems.Add(new TblAssetRequestItem
                    {
                        AssetRequestId = request.Id,
                        PTAId = ptaId,
                        PropertyNumber = item.PropertyNumber.Trim(),
                        Remarks = item.Remarks.Trim(),
                        IsActive = true,
                        IsDeleted = false,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    });
                }

                await context.SaveChangesAsync();

                await AddHistoryAsync(
                    context,
                    request,
                    model.ActionBySystemUserId,
                    actionType: "Created",
                    fromStatus: null,
                    toStatus: TblAssetRequest.PENDING,
                    remarks: "Asset request created.",
                    assignedCommitteeSystemUserId: request.AssignedCommitteeSystemUserId,
                    assignedPersonnelSystemUserId: request.AssignedPersonnelSystemUserId);

                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Created Asset Request {request.RequestNumber}", actionBy: model.ActionBySystemUserId);

                await _notificationService.NotifyModuleUsersAsync(
                    context,
                    NotificationConstants.REQUEST_SUBMITTED,
                    $"Asset request {request.RequestNumber} has been submitted for review",
                    NotificationConstants.Modules.APPROVALS,
                    model.ActionBySystemUserId);

                return Ok(ApiResponse<object>.Ok(new
                {
                    requestId = request.Id,
                    requestNumber = request.RequestNumber,
                }, "Asset request submitted successfully."));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AssetRequestController));
                return StatusCode(ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("my")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetMyRequests([FromQuery] AssetRequestListQueryParams model)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                var query = context.TblAssetRequests
                    .Where(x => !x.IsDeleted && x.EmployeeSystemUserId == model.ActionBySystemUserId);

                if (!string.IsNullOrWhiteSpace(model.Status))
                {
                    string normalizedStatus = NormalizeStatus(model.Status);
                    if (!string.IsNullOrWhiteSpace(normalizedStatus))
                    {
                        query = query.Where(x => x.Status == normalizedStatus);
                    }
                }

                int totalCount = await query.CountAsync();
                int skip = (model.PageNumber - 1) * model.PageSize;

                var rows = await query
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToListAsync();

                var items = new List<object>();
                foreach (var row in rows)
                {
                    items.Add(await BuildRequestResponseAsync(row, context));
                }

                return Ok(ApiResponse<object>.OkPaginated(items, model.PageNumber, model.PageSize, totalCount, "My requests retrieved successfully."));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AssetRequestController));
                return StatusCode(ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion

        #region Processor

        [HttpGet("all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAll([FromQuery] AssetRequestListQueryParams model)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                if (!await HasApprovalsModuleScopeAsync(model.ActionBySystemUserId, context))
                {
                    return StatusCode(ApiStatusCode.Forbidden,
                        ApiResponse<object>.Fail(ErrorCodes.FORBIDDEN, "You are not allowed to access this resource."));
                }

                var query = context.TblAssetRequests.Where(x => !x.IsDeleted);

                if (model.MineOnly)
                {
                    query = query.Where(x => x.AssignedCommitteeSystemUserId == model.ActionBySystemUserId || x.AssignedPersonnelSystemUserId == model.ActionBySystemUserId);
                }

                if (model.AssignedCommitteeSystemUserId.HasValue)
                {
                    query = query.Where(x => x.AssignedCommitteeSystemUserId == model.AssignedCommitteeSystemUserId.Value);
                }

                if (model.AssignedPersonnelSystemUserId.HasValue)
                {
                    query = query.Where(x => x.AssignedPersonnelSystemUserId == model.AssignedPersonnelSystemUserId.Value);
                }

                if (!string.IsNullOrWhiteSpace(model.Status))
                {
                    string normalizedStatus = NormalizeStatus(model.Status);
                    if (!string.IsNullOrWhiteSpace(normalizedStatus))
                    {
                        query = query.Where(x => x.Status == normalizedStatus);
                    }
                }

                int totalCount = await query.CountAsync();
                int skip = (model.PageNumber - 1) * model.PageSize;

                var rows = await query
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToListAsync();

                var items = new List<object>();
                foreach (var row in rows)
                {
                    items.Add(await BuildRequestResponseAsync(row, context));
                }

                return Ok(ApiResponse<object>.OkPaginated(items, model.PageNumber, model.PageSize, totalCount, "Asset requests retrieved successfully."));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AssetRequestController));
                return StatusCode(ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("{requestId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetById([FromRoute] long requestId, [FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                var req = await context.TblAssetRequests
                    .FirstOrDefaultAsync(x => x.Id == requestId && !x.IsDeleted);

                if (req == null)
                {
                    return StatusCode(ApiStatusCode.NotFound,
                        ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "Asset request not found."));
                }

                bool isOwner = req.EmployeeSystemUserId == model.ActionBySystemUserId;
                bool canManage = await HasApprovalsModuleScopeAsync(model.ActionBySystemUserId, context);
                if (!isOwner && !canManage)
                {
                    return StatusCode(ApiStatusCode.Forbidden,
                        ApiResponse<object>.Fail(ErrorCodes.FORBIDDEN, "You are not allowed to access this resource."));
                }

                var response = await BuildRequestResponseAsync(req, context);
                return Ok(ApiResponse<object>.Ok(response, "Asset request retrieved successfully."));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AssetRequestController));
                return StatusCode(ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("history/{requestId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetHistory([FromRoute] long requestId, [FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                var req = await context.TblAssetRequests
                    .FirstOrDefaultAsync(x => x.Id == requestId && !x.IsDeleted);

                if (req == null)
                {
                    return StatusCode(ApiStatusCode.NotFound,
                        ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "Asset request not found."));
                }

                bool isOwner = req.EmployeeSystemUserId == model.ActionBySystemUserId;
                bool canManage = await HasApprovalsModuleScopeAsync(model.ActionBySystemUserId, context);
                if (!isOwner && !canManage)
                {
                    return StatusCode(ApiStatusCode.Forbidden,
                        ApiResponse<object>.Fail(ErrorCodes.FORBIDDEN, "You are not allowed to access this resource."));
                }

                var histories = await context.TblAssetRequestHistories
                    .Where(x => x.AssetRequestId == requestId && !x.IsDeleted)
                    .OrderByDescending(x => x.ActionAt)
                    .ToListAsync();

                var updaterIds = histories.Select(h => h.UpdatedBySystemUserId).Distinct().ToList();
                var userMap = await context.TblSystemUsers
                    .Where(x => updaterIds.Contains(x.Id) && x.IsActive && !x.IsDeleted)
                    .ToDictionaryAsync(x => x.Id, x => $"{x.FirstName} {x.LastName}".Trim());

                var response = histories.Select(h => new
                {
                    id = h.Id,
                    requestId = h.AssetRequestId,
                    actionType = h.ActionType,
                    fromStatus = h.FromStatus,
                    toStatus = h.ToStatus,
                    assignedCommitteeSystemUserId = h.AssignedCommitteeSystemUserId,
                    assignedPersonnelSystemUserId = h.AssignedPersonnelSystemUserId,
                    remarks = h.Remarks,
                    updatedBySystemUserId = h.UpdatedBySystemUserId,
                    updatedByName = userMap.TryGetValue(h.UpdatedBySystemUserId, out var name) ? name : "Unknown",
                    actionAt = h.ActionAt,
                });

                return Ok(ApiResponse<object>.Ok(response, "Request history retrieved successfully."));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AssetRequestController));
                return StatusCode(ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpPost("assign")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> Assign([FromBody] AssignAssetRequestQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                if (!await HasApprovalsModuleScopeAsync(model.ActionBySystemUserId, context))
                {
                    return StatusCode(ApiStatusCode.Forbidden,
                        ApiResponse<object>.Fail(ErrorCodes.FORBIDDEN, "You are not allowed to assign requests."));
                }

                var req = await context.TblAssetRequests
                    .FirstOrDefaultAsync(x => x.Id == model.RequestId && !x.IsDeleted);

                if (req == null)
                {
                    return StatusCode(ApiStatusCode.NotFound,
                        ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "Asset request not found."));
                }

                req.AssignedCommitteeSystemUserId = model.AssignedCommitteeSystemUserId ?? req.AssignedCommitteeSystemUserId;
                req.AssignedPersonnelSystemUserId = model.AssignedPersonnelSystemUserId ?? req.AssignedPersonnelSystemUserId;

                if (req.Status == TblAssetRequest.PENDING || req.Status == TblAssetRequest.UNDER_REVIEW)
                {
                    req.Status = TblAssetRequest.ASSIGNED;
                }

                req.UpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync();

                await AddHistoryAsync(
                    context,
                    req,
                    model.ActionBySystemUserId,
                    actionType: "Assigned",
                    fromStatus: null,
                    toStatus: req.Status,
                    remarks: model.Remarks,
                    assignedCommitteeSystemUserId: req.AssignedCommitteeSystemUserId,
                    assignedPersonnelSystemUserId: req.AssignedPersonnelSystemUserId);

                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Assigned Asset Request {req.RequestNumber}", actionBy: model.ActionBySystemUserId);

                if (req.AssignedPersonnelSystemUserId.HasValue)
                {
                    await _notificationService.NotifyUserAsync(
                        context,
                        NotificationConstants.REQUEST_ASSIGNED,
                        $"You have been assigned to asset request {req.RequestNumber}",
                        req.AssignedPersonnelSystemUserId.Value,
                        model.ActionBySystemUserId,
                        NotificationConstants.Modules.APPROVALS);
                }

                if (req.AssignedCommitteeSystemUserId.HasValue)
                {
                    await _notificationService.NotifyUserAsync(
                        context,
                        NotificationConstants.REQUEST_ASSIGNED,
                        $"You have been assigned as committee for asset request {req.RequestNumber}",
                        req.AssignedCommitteeSystemUserId.Value,
                        model.ActionBySystemUserId,
                        NotificationConstants.Modules.APPROVALS);
                }

                return Ok(ApiResponse<object>.Ok(new { requestId = req.Id, status = req.Status }, "Request assignment updated successfully."));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AssetRequestController));
                return StatusCode(ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpPost("status")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateAssetRequestStatusQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                if (!await HasApprovalsModuleScopeAsync(model.ActionBySystemUserId, context))
                {
                    return StatusCode(ApiStatusCode.Forbidden,
                        ApiResponse<object>.Fail(ErrorCodes.FORBIDDEN, "You are not allowed to update request status."));
                }

                var req = await context.TblAssetRequests
                    .FirstOrDefaultAsync(x => x.Id == model.RequestId && !x.IsDeleted);

                if (req == null)
                {
                    return StatusCode(ApiStatusCode.NotFound,
                        ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "Asset request not found."));
                }

                string nextStatus = NormalizeStatus(model.Status);
                if (string.IsNullOrWhiteSpace(nextStatus))
                {
                    return StatusCode(ApiStatusCode.BadRequest,
                        ApiResponse<object>.Fail(ErrorCodes.INVALID_INPUT, "Invalid status value."));
                }

                if (!AllowedTransitions.TryGetValue(req.Status, out var allowed) || !allowed.Contains(nextStatus))
                {
                    return StatusCode(ApiStatusCode.BadRequest,
                        ApiResponse<object>.Fail(ErrorCodes.INVALID_INPUT, $"Status transition from {req.Status} to {nextStatus} is not allowed."));
                }

                string fromStatus = req.Status;
                req.Status = nextStatus;
                req.UpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync();

                await AddHistoryAsync(
                    context,
                    req,
                    model.ActionBySystemUserId,
                    actionType: "StatusUpdated",
                    fromStatus: fromStatus,
                    toStatus: req.Status,
                    remarks: model.Remarks,
                    assignedCommitteeSystemUserId: req.AssignedCommitteeSystemUserId,
                    assignedPersonnelSystemUserId: req.AssignedPersonnelSystemUserId);

                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Updated Asset Request {req.RequestNumber} status to {nextStatus}", actionBy: model.ActionBySystemUserId);

                if (nextStatus == TblAssetRequest.REJECTED)
                {
                    await _notificationService.NotifyUserAsync(
                        context,
                        NotificationConstants.REQUEST_REJECTED,
                        $"Asset request {req.RequestNumber} has been rejected",
                        req.EmployeeSystemUserId,
                        model.ActionBySystemUserId,
                        NotificationConstants.Modules.APPROVALS);
                }
                else if (nextStatus == TblAssetRequest.ASSIGNED && req.AssignedPersonnelSystemUserId.HasValue)
                {
                    await _notificationService.NotifyUserAsync(
                        context,
                        NotificationConstants.REQUEST_ASSIGNED,
                        $"You have been assigned to asset request {req.RequestNumber}",
                        req.AssignedPersonnelSystemUserId.Value,
                        model.ActionBySystemUserId,
                        NotificationConstants.Modules.APPROVALS);
                }
                else
                {
                    await _notificationService.NotifyUserAsync(
                        context,
                        NotificationConstants.REQUEST_STATUS_UPDATED,
                        $"Asset request {req.RequestNumber} status updated to {nextStatus}",
                        req.EmployeeSystemUserId,
                        model.ActionBySystemUserId,
                        NotificationConstants.Modules.APPROVALS);
                }

                return Ok(ApiResponse<object>.Ok(new { requestId = req.Id, status = req.Status }, "Request status updated successfully."));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AssetRequestController));
                return StatusCode(ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpPost("history/add")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> AddHistory([FromBody] AddAssetRequestHistoryQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                bool canManage = await HasApprovalsModuleScopeAsync(model.ActionBySystemUserId, context);
                var req = await context.TblAssetRequests
                    .FirstOrDefaultAsync(x => x.Id == model.RequestId && !x.IsDeleted);

                if (req == null)
                {
                    return StatusCode(ApiStatusCode.NotFound,
                        ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "Asset request not found."));
                }

                bool isOwner = req.EmployeeSystemUserId == model.ActionBySystemUserId;
                if (!canManage && !isOwner)
                {
                    return StatusCode(ApiStatusCode.Forbidden,
                        ApiResponse<object>.Fail(ErrorCodes.FORBIDDEN, "You are not allowed to add history for this request."));
                }

                await AddHistoryAsync(
                    context,
                    req,
                    model.ActionBySystemUserId,
                    actionType: "Comment",
                    fromStatus: req.Status,
                    toStatus: req.Status,
                    remarks: model.Remarks,
                    assignedCommitteeSystemUserId: req.AssignedCommitteeSystemUserId,
                    assignedPersonnelSystemUserId: req.AssignedPersonnelSystemUserId);

                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Added comment to Asset Request {req.RequestNumber}", actionBy: model.ActionBySystemUserId);

                return Ok(ApiResponse<object>.Ok(new { requestId = req.Id }, "Request history added successfully."));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AssetRequestController));
                return StatusCode(ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpPost("item/add")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> AddItem([FromBody] AddAssetRequestItemQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var req = await context.TblAssetRequests
                    .FirstOrDefaultAsync(x => x.Id == model.RequestId && !x.IsDeleted);

                if (req == null)
                {
                    return StatusCode(ApiStatusCode.NotFound,
                        ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "Asset request not found."));
                }

                bool isOwner = req.EmployeeSystemUserId == model.ActionBySystemUserId;
                bool canManage = await HasApprovalsModuleScopeAsync(model.ActionBySystemUserId, context);
                if (!isOwner && !canManage)
                {
                    return StatusCode(ApiStatusCode.Forbidden,
                        ApiResponse<object>.Fail(ErrorCodes.FORBIDDEN, "You are not allowed to add items to this request."));
                }

                var item = new TblAssetRequestItem
                {
                    AssetRequestId = req.Id,
                    PTAId = model.PTAId,
                    PropertyNumber = model.PropertyNumber.Trim(),
                    Remarks = model.Remarks.Trim(),
                    IsActive = true,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };

                context.TblAssetRequestItems.Add(item);
                req.UpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync();

                await AddHistoryAsync(
                    context,
                    req,
                    model.ActionBySystemUserId,
                    actionType: "ItemAdded",
                    fromStatus: req.Status,
                    toStatus: req.Status,
                    remarks: $"Item added: {model.PropertyNumber}",
                    assignedCommitteeSystemUserId: req.AssignedCommitteeSystemUserId,
                    assignedPersonnelSystemUserId: req.AssignedPersonnelSystemUserId);

                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(new { requestItemId = item.Id }, "Request item added successfully."));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AssetRequestController));
                return StatusCode(ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpDelete("item/remove/{requestItemId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> RemoveItem([FromRoute] long requestItemId, [FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var item = await context.TblAssetRequestItems
                    .FirstOrDefaultAsync(x => x.Id == requestItemId && !x.IsDeleted);

                if (item == null)
                {
                    return StatusCode(ApiStatusCode.NotFound,
                        ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "Request item not found."));
                }

                var req = await context.TblAssetRequests
                    .FirstOrDefaultAsync(x => x.Id == item.AssetRequestId && !x.IsDeleted);

                if (req == null)
                {
                    return StatusCode(ApiStatusCode.NotFound,
                        ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "Asset request not found."));
                }

                bool isOwner = req.EmployeeSystemUserId == model.ActionBySystemUserId;
                bool canManage = await HasApprovalsModuleScopeAsync(model.ActionBySystemUserId, context);
                if (!isOwner && !canManage)
                {
                    return StatusCode(ApiStatusCode.Forbidden,
                        ApiResponse<object>.Fail(ErrorCodes.FORBIDDEN, "You are not allowed to remove this item."));
                }

                item.IsDeleted = true;
                item.IsActive = false;
                item.UpdatedAt = DateTime.UtcNow;
                req.UpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync();

                await AddHistoryAsync(
                    context,
                    req,
                    model.ActionBySystemUserId,
                    actionType: "ItemRemoved",
                    fromStatus: req.Status,
                    toStatus: req.Status,
                    remarks: $"Item removed: {item.PropertyNumber}",
                    assignedCommitteeSystemUserId: req.AssignedCommitteeSystemUserId,
                    assignedPersonnelSystemUserId: req.AssignedPersonnelSystemUserId);

                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(new { requestItemId }, "Request item removed successfully."));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(AssetRequestController));
                return StatusCode(ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion
    }
}
