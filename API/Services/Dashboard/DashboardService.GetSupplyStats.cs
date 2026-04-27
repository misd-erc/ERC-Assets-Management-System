using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.Supply;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.ResponseModels.Dashboard;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;

namespace API.Services.Dashboard
{
    public partial class DashboardService
    {
        public async Task<IActionResult> GetSupplyStats(SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                IEnumerable<TblSupplyItem>? supplyItems = await _getTools.Supply.GetTblSupplyItems(context)!.ToListAsync();
                IEnumerable<TblSupplyRISItem>? risItems = await _getTools.Supply.GetTblSupplyRISItems(context)!.ToListAsync();

                var issuedStockGroup = risItems
                    .Where(x => !string.IsNullOrEmpty(x.StockNumber) && !string.IsNullOrEmpty(x.ItemDescription))
                    .GroupBy(x => new { x.StockNumber, x.ItemDescription })
                    .ToDictionary(
                        g => (g.Key.StockNumber, g.Key.ItemDescription),
                        g => g.Sum(x => x.IssueQuantity));

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
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DashboardService));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
    }
}