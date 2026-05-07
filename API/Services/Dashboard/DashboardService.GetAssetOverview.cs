using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Constants;
using PortalCommon.Utilities;
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

            try
            {
                var result = new DashboardAssetOverviewResponseModel();

                var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
                var movementSummary = await context.TblPTAMovements
                    .AsNoTracking()
                    .Where(x => x.CreatedAt >= sixMonthsAgo)
                    .GroupBy(x => new { x.CreatedAt.Year, x.CreatedAt.Month })
                    .Select(g => new
                    {
                        g.Key.Year,
                        g.Key.Month,
                        Issued = g.Count(m => m.PARICSNumberEncrypted != null),
                        Transferred = g.Count(m => m.PTRITRNumberEncrypted != null && m.PARICSNumberEncrypted == null)
                    })
                    .ToListAsync();

                result.MonthlyMovements = Enumerable.Range(0, 6).Select(i =>
                {
                    var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1).AddMonths(-5 + i);
                    var monthMovement = movementSummary.FirstOrDefault(m => m.Year == monthStart.Year && m.Month == monthStart.Month);

                    return new MonthlyMovementItem
                    {
                        Month = monthStart.ToString("MMM"),
                        Issued = monthMovement?.Issued ?? 0,
                        Transferred = monthMovement?.Transferred ?? 0
                    };
                }).ToList();

                var ptas = await context.TblPTAs
                    .AsNoTracking()
                    .Where(x => !x.IsDeleted && x.IsActive)
                    .Select(x => new
                    {
                        x.CategoryId,
                        x.UnitValueEncrypted
                    })
                    .ToListAsync();
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
                        Value = (decimal)g.Sum(x => ParseEncryptedDouble(x.UnitValueEncrypted))
                    })
                    .OrderByDescending(x => x.Count)
                    .ToList();

                var currentMovements = await context.TblPTAMovements
                    .AsNoTracking()
                    .Where(x => !x.IsDeleted && x.IsCurrent && x.RemarksEncrypted != null && x.RemarksEncrypted != "")
                    .Select(x => x.RemarksEncrypted)
                    .ToListAsync();

                result.ConditionBreakdown = currentMovements
                    .Select(DecryptRemark)
                    .GroupBy(remark => CultureInfo.CurrentCulture.TextInfo.ToTitleCase(remark.Trim()))
                    .Where(g => !string.IsNullOrWhiteSpace(g.Key))
                    .Select(g => new ConditionBreakdownItem { Condition = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .ToList();

                return Ok(ApiResponse<DashboardAssetOverviewResponseModel>.Ok(result, "Asset overview retrieved"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DashboardService));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        private static string DecryptRemark(string? encryptedRemark)
        {
            if (string.IsNullOrWhiteSpace(encryptedRemark))
            {
                return string.Empty;
            }

            return EncryptionHelper.Decrypt(encryptedRemark);
        }
    }
}
