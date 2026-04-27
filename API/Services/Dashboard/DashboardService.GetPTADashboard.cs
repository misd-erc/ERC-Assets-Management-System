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