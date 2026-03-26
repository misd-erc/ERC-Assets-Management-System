using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.ASSET.Supply;
using PortalDB.Entities.DBO.Account;
using PortalDB.Models.QueryParams.Pagination;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.ResponseModels.Account;
using PortalDB.Models.ResponseModels.Dashboard;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;
using System.Globalization;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;
        private readonly IPortalEditTools _editTools;

        public DashboardController(
        DbContextOptions<PortalDbContext> options,
        IPortalEditTools editTools,
        IPortalGetTools getTools)
        {
            _options = options;
            _getTools = getTools;
            _editTools = editTools;
        }

        #region GET

        // GET api/dashboard/pta
        [HttpGet("pta")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetPTADashboard([FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                List<TblPTA>? ptas = await _getTools.PTA.GetTblPTAs(context).ToListAsync();

                DashboardPTAResponseModel ptaDash = new DashboardPTAResponseModel();
                ptaDash.TotalPPE = ptas.Where(x => x.Group == TblPTA.PPE && x.IsActive).Count();
                ptaDash.TotalSE = ptas.Where(x => x.Group == TblPTA.SE && x.IsActive).Count();
                ptaDash.TotalPPEValue = ptas.Where(x => x.Group == TblPTA.PPE && x.IsActive).Sum(x => x.UnitValue) ?? 0;
                ptaDash.TotalSEValue = ptas.Where(x => x.Group == TblPTA.SE && x.IsActive).Sum(x => x.UnitValue) ?? 0;
                ptaDash.TotalPPEValuePercentage = ptaDash.TotalPPEValue + ptaDash.TotalSEValue == 0 ? 0 :
                    Math.Round(((decimal)ptaDash.TotalPPEValue / (ptaDash.TotalPPEValue + ptaDash.TotalSEValue)) * 100, 2);
                ptaDash.TotalSEValuePercentage = ptaDash.TotalPPEValue + ptaDash.TotalSEValue == 0 ? 0 :
                    Math.Round(((decimal)ptaDash.TotalSEValue / (ptaDash.TotalPPEValue + ptaDash.TotalSEValue)) * 100, 2);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse<DashboardPTAResponseModel>.Ok(
                    ptaDash,
                    "PTA dashboard have been retrieved"
                ));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DashboardController));
                return StatusCode(
                    ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(
                        ErrorCodes.SERVER_ERROR,
                        "An error occurred while processing your request."
                    )
                );
            }
        }

        // GET api/dashboard/asset-overview
        [HttpGet("asset-overview")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAssetOverview([FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var result = new DashboardAssetOverviewResponseModel();

                // ── Monthly Movements (last 6 months, using CreatedAt which is not encrypted) ──
                var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
                var recentMovements = await _getTools.PTA.GetTblPTAMovements(context)
                    .Where(x => x.CreatedAt >= sixMonthsAgo)
                    .ToListAsync();

                result.MonthlyMovements = Enumerable.Range(0, 6).Select(i =>
                {
                    var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1).AddMonths(-5 + i);
                    var monthEnd = monthStart.AddMonths(1);
                    var monthMovements = recentMovements
                        .Where(m => m.CreatedAt >= monthStart && m.CreatedAt < monthEnd)
                        .ToList();
                    return new MonthlyMovementItem
                    {
                        Month = monthStart.ToString("MMM"),
                        Issued = monthMovements.Count(m => m.PARICSNumberEncrypted != null),
                        Transferred = monthMovements.Count(m => m.PTRITRNumberEncrypted != null && m.PARICSNumberEncrypted == null)
                    };
                }).ToList();

                // ── Category Breakdown ──
                var ptas = await _getTools.PTA.GetTblPTAs(context).Where(x => x.IsActive).ToListAsync();
                var categories = await context.TblPTACategories.AsNoTracking().Where(x => !x.IsDeleted).ToListAsync();
                var catDict = categories.ToDictionary(c => c.Id, c => c.Name ?? "Uncategorized");

                result.CategoryBreakdown = ptas
                    .GroupBy(x => x.CategoryId.HasValue && catDict.ContainsKey(x.CategoryId.Value)
                        ? catDict[x.CategoryId.Value] : "Uncategorized")
                    .Select(g => new CategoryBreakdownItem
                    {
                        Name = g.Key,
                        Count = g.Count(),
                        Value = g.Sum(x => x.UnitValue ?? 0)
                    })
                    .OrderByDescending(x => x.Count)
                    .ToList();

                // ── Condition Breakdown (current movements only) ──
                var currentMovements = await _getTools.PTA.GetTblPTAMovements(context)
                    .Where(x => x.IsCurrent && x.RemarksEncrypted != null && x.RemarksEncrypted != "")
                    .ToListAsync();

                result.ConditionBreakdown = currentMovements
                    .GroupBy(m => CultureInfo.CurrentCulture.TextInfo.ToTitleCase(m.Remarks?.Trim() ?? ""))
                    .Where(g => !string.IsNullOrWhiteSpace(g.Key))
                    .Select(g => new ConditionBreakdownItem { Condition = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .ToList();

                await transaction.CommitAsync();
                return Ok(ApiResponse<DashboardAssetOverviewResponseModel>.Ok(result, "Asset overview retrieved"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DashboardController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/dashboard/recent-activities
        [HttpGet("recent-activities")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetRecentActivities([FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var logs = await context.TblActivityLogs
                    .AsNoTracking()
                    .OrderByDescending(x => x.CreatedAt)
                    .Take(20)
                    .ToListAsync();

                var userIds = logs.Where(l => l.ActionBy.HasValue).Select(l => l.ActionBy!.Value).Distinct().ToList();
                var systemUsers = await _getTools.Account.GetTblSystemUsers(context)
                    .Where(u => userIds.Contains(u.Id))
                    .ToListAsync();

                var result = logs.Select(log =>
                {
                    var user = systemUsers.FirstOrDefault(u => u.Id == log.ActionBy);
                    return new DashboardRecentActivityItem
                    {
                        Id = log.Id,
                        Action = log.Action,
                        PerformedBy = user != null
                            ? $"{user.FirstName} {user.LastName}".Trim()
                            : "System",
                        CreatedAt = log.CreatedAt
                    };
                }).ToList();

                await transaction.CommitAsync();
                return Ok(ApiResponse<DashboardRecentActivityItem>.Ok(result, "Recent activities retrieved"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DashboardController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/dashboard/disposal-stats
        [HttpGet("disposal-stats")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetDisposalStats([FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var disposals = await context.TblDisposals
                    .AsNoTracking()
                    .Where(x => !x.IsDeleted)
                    .ToListAsync();

                var result = new DashboardDisposalStatsResponseModel
                {
                    PendingCount = disposals.Count(x => x.Status == TblDisposal.PENDING),
                    ApprovedCount = disposals.Count(x => x.Status == TblDisposal.APPROVED),
                    DisposedCount = disposals.Count(x => x.Status == TblDisposal.DISPOSED),
                    RejectedCount = disposals.Count(x => x.Status == TblDisposal.REJECTED),
                    TotalCount = disposals.Count
                };

                await transaction.CommitAsync();
                return Ok(ApiResponse<DashboardDisposalStatsResponseModel>.Ok(result, "Disposal stats retrieved"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DashboardController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/dashboard/supply-stats
        [HttpGet("supply-stats")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetSupplyStats([FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                IEnumerable<TblSupplyItem>? supplyItems = await _getTools.Supply.GetTblSupplyItems(context)!.ToListAsync();

                // Sum issued quantities per (Code, Description) from RIS items
                IEnumerable<TblSupplyRISItem>? risItems = await _getTools.Supply.GetTblSupplyRISItems(context)!.ToListAsync();
                var issuedStockGroup = risItems
                    .Where(x => !string.IsNullOrEmpty(x.StockNumber) && !string.IsNullOrEmpty(x.ItemDescription))
                    .GroupBy(x => new { x.StockNumber, x.ItemDescription })
                    .ToDictionary(
                        g => (g.Key.StockNumber, g.Key.ItemDescription),
                        g => g.Sum(x => x.IssueQuantity));

                // Group supply items by Code+Description (same logic as GetAllSupplyGroups)
                var groups = supplyItems
                    .GroupBy(x => new { x.Code, x.Description })
                    .Select(g =>
                    {
                        var firstItem = g.First();
                        var totalStock = g.Sum(x => x.Quantity ?? 0);
                        var key = (g.Key.Code, g.Key.Description);
                        var issued = issuedStockGroup.GetValueOrDefault(key, 0);
                        var stockOnHand = Math.Max(0, totalStock - issued);
                        var unitCost = firstItem.UnitCost ?? 0;
                        var reorderPoint = g.Max(x => x.ReorderPoint ?? 0);
                        return new
                        {
                            StockOnHand = stockOnHand,
                            TotalValue = stockOnHand * unitCost,
                            IsLowStock = stockOnHand <= reorderPoint
                        };
                    })
                    .ToList();

                var result = new DashboardSupplyStatsResponseModel
                {
                    TotalItems = groups.Count,
                    TotalQuantity = groups.Sum(x => (long)x.StockOnHand),
                    TotalValue = groups.Sum(x => (decimal)x.TotalValue),
                    LowStockCount = groups.Count(x => x.IsLowStock)
                };

                await transaction.CommitAsync();
                return Ok(ApiResponse<DashboardSupplyStatsResponseModel>.Ok(result, "Supply stats retrieved"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DashboardController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion

    }
}
