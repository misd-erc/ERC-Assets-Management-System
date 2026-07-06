using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.PTA;
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
        public async Task<IActionResult> GetPTADashboard(SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                List<TblPTA>? ptas = await _getTools.PTA.GetTblPTAs(context).ToListAsync();

                DashboardPTAResponseModel ptaDash = new DashboardPTAResponseModel();
                ptaDash.TotalPPE = ptas.Count(x => x.Group == TblPTA.PPE && x.IsActive);
                ptaDash.TotalSE = ptas.Count(x => x.Group == TblPTA.SE && x.IsActive);
                ptaDash.TotalPPEValue = (decimal)(ptas.Where(x => x.Group == TblPTA.PPE && x.IsActive).Sum(x => x.UnitValue) ?? 0);
                ptaDash.TotalSEValue = (decimal)(ptas.Where(x => x.Group == TblPTA.SE && x.IsActive).Sum(x => x.UnitValue) ?? 0);
                ptaDash.TotalPPEValuePercentage = ptaDash.TotalPPEValue + ptaDash.TotalSEValue == 0 ? 0 :
                    Math.Round((ptaDash.TotalPPEValue / (ptaDash.TotalPPEValue + ptaDash.TotalSEValue)) * 100, 2);
                ptaDash.TotalSEValuePercentage = ptaDash.TotalPPEValue + ptaDash.TotalSEValue == 0 ? 0 :
                    Math.Round((ptaDash.TotalSEValue / (ptaDash.TotalPPEValue + ptaDash.TotalSEValue)) * 100, 2);

                var activeSEIds = ptas.Where(x => x.Group == TblPTA.SE && x.IsActive).Select(x => x.Id).ToHashSet();
                var seIdsWithCurrentMovement = await _getTools.PTA.GetTblPTAMovements(context)
                    .Where(x => x.PTAId.HasValue && activeSEIds.Contains(x.PTAId.Value) && x.IsCurrent)
                    .Select(x => x.PTAId!.Value)
                    .Distinct()
                    .ToListAsync();
                ptaDash.TotalSEIssued = seIdsWithCurrentMovement.Count;
                ptaDash.TotalSEStock = ptaDash.TotalSE - ptaDash.TotalSEIssued;

                var issuedPtaIds = seIdsWithCurrentMovement.ToHashSet();
                ptaDash.TotalSEIssuedValue = (decimal)(ptas
                    .Where(x => x.Group == TblPTA.SE && x.IsActive && issuedPtaIds.Contains(x.Id))
                    .Sum(x => (double?)x.UnitValue) ?? 0);
                ptaDash.TotalSEStockValue = ptaDash.TotalSEValue - ptaDash.TotalSEIssuedValue;

                var categories = await context.TblPTACategories.AsNoTracking().Where(x => !x.IsDeleted).ToListAsync();
                var catDict = categories.ToDictionary(c => c.Id, c => c.Name ?? "Uncategorized");

                var activePtas = ptas.Where(x => x.IsActive).ToList();

                ptaDash.PPECategoryBreakdown = activePtas
                    .Where(x => x.Group == TblPTA.PPE)
                    .GroupBy(x => x.CategoryId.HasValue && catDict.ContainsKey(x.CategoryId.Value)
                        ? catDict[x.CategoryId.Value] : "Uncategorized")
                    .Select(g => new PTACategoryBreakdownItem
                    {
                        Name = g.Key,
                        Count = g.Count(),
                        Value = (decimal)g.Sum(x => x.UnitValue ?? 0)
                    })
                    .OrderByDescending(x => x.Value)
                    .ToList();

                ptaDash.SECategoryBreakdown = activePtas
                    .Where(x => x.Group == TblPTA.SE)
                    .GroupBy(x => x.CategoryId.HasValue && catDict.ContainsKey(x.CategoryId.Value)
                        ? catDict[x.CategoryId.Value] : "Uncategorized")
                    .Select(g => new PTACategoryBreakdownItem
                    {
                        Name = g.Key,
                        Count = g.Count(),
                        Value = (decimal)g.Sum(x => x.UnitValue ?? 0),
                        IssuedCount = g.Count(x => issuedPtaIds.Contains(x.Id)),
                        StockCount = g.Count(x => !issuedPtaIds.Contains(x.Id))
                    })
                    .OrderByDescending(x => x.Value)
                    .ToList();

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
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DashboardService));
                return StatusCode(
                    ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(
                        ErrorCodes.SERVER_ERROR,
                        "An error occurred while processing your request."
                    )
                );
            }
        }
    }
}