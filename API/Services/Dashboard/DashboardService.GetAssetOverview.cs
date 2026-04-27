using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Constants;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.ResponseModels.Dashboard;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;
using System.Globalization;

namespace API.Services.Dashboard
{
    public partial class DashboardService
    {
        public async Task<IActionResult> GetAssetOverview(SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var result = new DashboardAssetOverviewResponseModel();

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

                var ptas = await _getTools.PTA.GetTblPTAs(context).Where(x => x.IsActive).ToListAsync();
                var categories = await context.TblPTACategories.AsNoTracking().Where(x => !x.IsDeleted).ToListAsync();
                var catDict = categories.ToDictionary(c => c.Id, c => c.Name ?? "Uncategorized");

                result.CategoryBreakdown = ptas
                    .GroupBy(x => x.CategoryId.HasValue && catDict.ContainsKey(x.CategoryId.Value)
                        ? catDict[x.CategoryId.Value]
                        : "Uncategorized")
                    .Select(g => new CategoryBreakdownItem
                    {
                        Name = g.Key,
                        Count = g.Count(),
                        Value = (decimal)g.Sum(x => x.UnitValue ?? 0)
                    })
                    .OrderByDescending(x => x.Count)
                    .ToList();

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
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DashboardService));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
    }
}