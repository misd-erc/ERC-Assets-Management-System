using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.DBO.Account;
using PortalDB.Models.QueryParams.Pagination;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.ResponseModels.Account;
using PortalDB.Models.ResponseModels.Dashboard;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;

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

        #endregion

    }
}
