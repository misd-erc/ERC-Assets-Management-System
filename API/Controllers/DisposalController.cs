using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Models.QueryParams.Disposal;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DisposalController : ControllerBase
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;

        public DisposalController(DbContextOptions<PortalDbContext> options, IPortalGetTools getTools)
        {
            _options = options;
            _getTools = getTools;
        }

        #region Helpers

        private async Task<string?> GetUserFullNameAsync(long? systemUserId, PortalDbContext context)
        {
            if (!systemUserId.HasValue) return null;
            var user = await _getTools.Account.GetTblSystemUserAsync(systemUserId.Value, context);
            if (user == null) return null;
            return $"{user.FirstName} {user.LastName}".Trim();
        }

        private async Task<object> BuildDisposalResponse(TblDisposal disposal, PortalDbContext context)
        {
            var items = await context.TblDisposalItems
                .Where(i => i.DisposalId == disposal.Id && !i.IsDeleted)
                .ToListAsync();

            var itemDetails = new List<object>();
            foreach (var item in items)
            {
                if (!item.PTAId.HasValue) continue;
                var pta = await _getTools.PTA.GetTblPTAAsync(item.PTAId.Value, context);
                if (pta == null) continue;
                var category = await _getTools.PTA.GetTblPTACategoryAsync(pta.CategoryId, context);
                itemDetails.Add(new
                {
                    id = item.Id,
                    disposalId = item.DisposalId,
                    ptaId = item.PTAId,
                    pta = new
                    {
                        id = pta.Id,
                        group = pta.Group,
                        propertyNumber = pta.PropertyNumber,
                        description = pta.Description,
                        brand = pta.Brand,
                        model = pta.Model,
                        serialNumber = pta.SerialNumber,
                        category = category?.Name,
                        unitValue = pta.UnitValue,
                        dateAcquired = pta.DateAcquired
                    }
                });
            }

            string? requestedByName = await GetUserFullNameAsync(disposal.RequestedBySystemUserId, context);
            string? approvedByName = await GetUserFullNameAsync(disposal.ApprovedBySystemUserId, context);

            return new
            {
                id = disposal.Id,
                group = disposal.Group,
                disposalNumber = disposal.DisposalNumber,
                reason = disposal.Reason,
                method = disposal.Method,
                requestedBySystemUserId = disposal.RequestedBySystemUserId,
                requestedByName,
                approvedBySystemUserId = disposal.ApprovedBySystemUserId,
                approvedByName,
                dateRequested = disposal.DateRequested,
                dateApproved = disposal.DateApproved,
                dateDisposed = disposal.DateDisposed,
                proceedAmount = disposal.ProceedAmount,
                buyer = disposal.Buyer,
                remarks = disposal.Remarks,
                status = disposal.Status,
                isActive = disposal.IsActive,
                createdAt = disposal.CreatedAt,
                items = itemDetails
            };
        }

        #endregion

        #region GET

        [HttpGet("all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllDisposals([FromQuery] DisposalListQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                IEnumerable<TblDisposal> disposals = await context.TblDisposals
                    .Where(x => !x.IsDeleted)
                    .ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.GroupName))
                    disposals = disposals.Where(x => x.Group == model.GroupName);

                if (!string.IsNullOrWhiteSpace(model.Status))
                    disposals = disposals.Where(x => x.Status == model.Status);

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string search = model.SearchString.ToLowerInvariant();
                    disposals = disposals.Where(x =>
                        (x.DisposalNumber ?? "").ToLowerInvariant().Contains(search) ||
                        (x.Reason ?? "").ToLowerInvariant().Contains(search) ||
                        (x.Method ?? "").ToLowerInvariant().Contains(search) ||
                        (x.Status ?? "").ToLowerInvariant().Contains(search)
                    );
                }

                if (model.StartDate.HasValue)
                    disposals = disposals.Where(x => x.DateRequested >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    disposals = disposals.Where(x => x.DateRequested <= model.EndDate.Value);

                int totalCount = disposals.Count();
                int skip = (model.PageNumber - 1) * model.PageSize;

                var disposalList = disposals
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var responses = new List<object>();
                foreach (var disposal in disposalList)
                    responses.Add(await BuildDisposalResponse(disposal, context));

                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed Disposal records", actionBy: model.ActionBySystemUserId);

                return Ok(ApiResponse<object>.OkPaginated(
                    responses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Disposals retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DisposalController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("{disposalId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetDisposal([FromQuery] SoloQueryParams model, [FromRoute] long disposalId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var disposal = await context.TblDisposals
                    .FirstOrDefaultAsync(x => x.Id == disposalId && !x.IsDeleted);

                if (disposal == null)
                    return StatusCode(ApiStatusCode.NotFound, ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "Disposal not found."));

                var response = await BuildDisposalResponse(disposal, context);

                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed Disposal {disposalId}", actionBy: model.ActionBySystemUserId);

                return Ok(ApiResponse<object>.Ok(new List<object> { response }, "Disposal retrieved successfully"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DisposalController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion

        #region POST

        [HttpPost("create")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> CreateDisposal([FromBody] EditDisposalQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                if (model.PTAIds == null || !model.PTAIds.Any())
                    return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.INVALID_INPUT, "At least one asset must be selected for disposal."));

                // Auto-generate disposal number: IIRUP-YYYY-NNN (PPE) or IIRSP-YYYY-NNN (SE)
                string prefix = model.Group == TblPTA.PPE ? "IIRUP" : "IIRSP";
                int year = DateTime.UtcNow.Year;
                int groupCount = await context.TblDisposals
                    .CountAsync(x => x.Group == model.Group && x.CreatedAt.Year == year);
                string disposalNumber = $"{prefix}-{year}-{(groupCount + 1).ToString().PadLeft(3, '0')}";

                var disposal = new TblDisposal
                {
                    Group = model.Group,
                    DisposalNumber = disposalNumber,
                    Reason = model.Reason,
                    Method = model.Method,
                    Buyer = model.Buyer,
                    Remarks = model.Remarks,
                    RequestedBySystemUserId = model.ActionBySystemUserId,
                    DateRequested = DateTime.UtcNow,
                    Status = TblDisposal.PENDING,
                    IsActive = true,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow
                };

                context.TblDisposals.Add(disposal);
                await context.SaveChangesAsync();

                foreach (long ptaId in model.PTAIds)
                {
                    context.TblDisposalItems.Add(new TblDisposalItem
                    {
                        DisposalId = disposal.Id,
                        PTAId = ptaId,
                        IsActive = true,
                        IsDeleted = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                await AuditTrailTool.LogActivityAsync(_options, $"Created Disposal {disposalNumber}", actionBy: model.ActionBySystemUserId);

                return Ok(ApiResponse<object>.Created(new { DisposalId = disposal.Id, DisposalNumber = disposalNumber }, $"Disposal {disposalNumber} created successfully"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DisposalController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpPost("approve/{disposalId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> ApproveDisposal([FromQuery] SoloQueryParams model, [FromRoute] long disposalId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var disposal = await context.TblDisposals
                    .FirstOrDefaultAsync(x => x.Id == disposalId && !x.IsDeleted);

                if (disposal == null)
                    return StatusCode(ApiStatusCode.NotFound, ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "Disposal not found."));

                if (disposal.Status != TblDisposal.PENDING)
                    return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.INVALID_INPUT, $"Only pending disposals can be approved. Current status: {disposal.Status}"));

                disposal.Status = TblDisposal.APPROVED;
                disposal.ApprovedBySystemUserId = model.ActionBySystemUserId;
                disposal.DateApproved = DateTime.UtcNow;

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                await AuditTrailTool.LogActivityAsync(_options, $"Approved Disposal {disposal.DisposalNumber}", actionBy: model.ActionBySystemUserId);

                return Ok(ApiResponse<object>.Ok(new { DisposalId = disposalId }, $"Disposal {disposal.DisposalNumber} approved successfully"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DisposalController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpPost("mark-disposed/{disposalId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> MarkDisposed([FromBody] MarkDisposedQueryParams model, [FromRoute] long disposalId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var disposal = await context.TblDisposals
                    .FirstOrDefaultAsync(x => x.Id == disposalId && !x.IsDeleted);

                if (disposal == null)
                    return StatusCode(ApiStatusCode.NotFound, ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "Disposal not found."));

                if (disposal.Status != TblDisposal.APPROVED)
                    return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.INVALID_INPUT, $"Only approved disposals can be marked as disposed. Current status: {disposal.Status}"));

                disposal.Status = TblDisposal.DISPOSED;
                disposal.DateDisposed = model.DateDisposed;
                disposal.ProceedAmount = model.ProceedAmount;
                if (!string.IsNullOrWhiteSpace(model.Buyer))
                    disposal.Buyer = model.Buyer;
                if (!string.IsNullOrWhiteSpace(model.Remarks))
                    disposal.Remarks = string.IsNullOrWhiteSpace(disposal.Remarks)
                        ? model.Remarks
                        : $"{disposal.Remarks}\n{model.Remarks}";

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                await AuditTrailTool.LogActivityAsync(_options, $"Marked Disposal {disposal.DisposalNumber} as Disposed", actionBy: model.ActionBySystemUserId);

                return Ok(ApiResponse<object>.Ok(new { DisposalId = disposalId }, $"Disposal {disposal.DisposalNumber} marked as disposed"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DisposalController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpPost("reject/{disposalId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> RejectDisposal([FromQuery] SoloQueryParams model, [FromRoute] long disposalId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var disposal = await context.TblDisposals
                    .FirstOrDefaultAsync(x => x.Id == disposalId && !x.IsDeleted);

                if (disposal == null)
                    return StatusCode(ApiStatusCode.NotFound, ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "Disposal not found."));

                if (disposal.Status != TblDisposal.PENDING)
                    return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.INVALID_INPUT, $"Only pending disposals can be rejected. Current status: {disposal.Status}"));

                disposal.Status = TblDisposal.REJECTED;

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                await AuditTrailTool.LogActivityAsync(_options, $"Rejected Disposal {disposal.DisposalNumber}", actionBy: model.ActionBySystemUserId);

                return Ok(ApiResponse<object>.Ok(new { DisposalId = disposalId }, $"Disposal {disposal.DisposalNumber} rejected"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DisposalController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion

        #region DELETE

        [HttpDelete("delete/{disposalId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeleteDisposal([FromQuery] SoloQueryParams model, [FromRoute] long disposalId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var disposal = await context.TblDisposals
                    .FirstOrDefaultAsync(x => x.Id == disposalId && !x.IsDeleted);

                if (disposal == null)
                    return StatusCode(ApiStatusCode.NotFound, ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "Disposal not found."));

                disposal.IsDeleted = true;
                disposal.IsActive = false;

                var items = await context.TblDisposalItems
                    .Where(i => i.DisposalId == disposalId && !i.IsDeleted)
                    .ToListAsync();

                foreach (var item in items)
                {
                    item.IsDeleted = true;
                    item.IsActive = false;
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                await AuditTrailTool.LogActivityAsync(_options, $"Deleted Disposal {disposal.DisposalNumber}", actionBy: model.ActionBySystemUserId);

                return Ok(ApiResponse<object>.Ok($"Disposal {disposal.DisposalNumber} has been deleted"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DisposalController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion
    }
}
