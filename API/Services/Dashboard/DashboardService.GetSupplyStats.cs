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

                var approvedRisIds = await context.Set<TblSupplyRIS>()
                    .Where(r => r.IsApproved && !r.IsDeleted)
                    .Select(r => r.Id)
                    .ToListAsync();

                IEnumerable<TblSupplyRISItem>? risItems = await _getTools.Supply.GetTblSupplyRISItems(context)!
                    .Where(x => x.SupplyRISId.HasValue && approvedRisIds.Contains(x.SupplyRISId.Value))
                    .ToListAsync();

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

                var categories = await context.TblPTACategories.AsNoTracking().Where(x => !x.IsDeleted).ToListAsync();
                var catDict = categories.ToDictionary(c => c.Id, c => c.Name ?? "Uncategorized");

                var catBreakdown = supplyItems
                    .GroupBy(x => x.CategoryId.HasValue && catDict.ContainsKey(x.CategoryId.Value)
                        ? catDict[x.CategoryId.Value] : "Uncategorized")
                    .Select(g =>
                    {
                        var itemCodes = g.Select(x => (x.Code, x.Description)).Distinct().ToList();
                        long qty = 0;
                        decimal val = 0;
                        foreach (var code in itemCodes)
                        {
                            var itemsForCode = g.Where(x => x.Code == code.Code && x.Description == code.Description).ToList();
                            var totalStock = itemsForCode.Sum(x => x.Quantity ?? 0);
                            var key = (code.Code, code.Description);
                            var issued = issuedStockGroup.GetValueOrDefault(key, 0);
                            var stockOnHand = Math.Max(0, totalStock - issued);
                            var unitCost = itemsForCode.First().UnitCost ?? 0;
                            qty += stockOnHand;
                            val += stockOnHand * unitCost;
                        }
                        return new SupplyCategoryBreakdownItem
                        {
                            Name = g.Key,
                            Quantity = qty,
                            Value = val
                        };
                    })
                    .OrderByDescending(x => x.Value)
                    .ToList();

                var result = new DashboardSupplyStatsResponseModel
                {
                    TotalItems = groups.Count,
                    TotalQuantity = groups.Sum(x => (long)x.StockOnHand),
                    TotalValue = groups.Sum(x => (decimal)x.TotalValue),
                    LowStockCount = groups.Count(x => x.IsLowStock),
                    CategoryBreakdown = catBreakdown
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