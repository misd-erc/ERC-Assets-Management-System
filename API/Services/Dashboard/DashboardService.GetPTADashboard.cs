using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Constants;
using PortalCommon.Utilities;
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

            try
            {
                var ptas = await context.TblPTAs
                    .AsNoTracking()
                    .Where(x => !x.IsDeleted && x.IsActive)
                    .Select(x => new
                    {
                        x.Group,
                        x.UnitValueEncrypted
                    })
                    .ToListAsync();

                DashboardPTAResponseModel ptaDash = new DashboardPTAResponseModel();
                ptaDash.TotalPPE = ptas.Count(x => x.Group == TblPTA.PPE);
                ptaDash.TotalSE = ptas.Count(x => x.Group == TblPTA.SE);
                ptaDash.TotalPPEValue = (decimal)ptas.Where(x => x.Group == TblPTA.PPE).Sum(x => ParseEncryptedDouble(x.UnitValueEncrypted));
                ptaDash.TotalSEValue = (decimal)ptas.Where(x => x.Group == TblPTA.SE).Sum(x => ParseEncryptedDouble(x.UnitValueEncrypted));
                ptaDash.TotalPPEValuePercentage = ptaDash.TotalPPEValue + ptaDash.TotalSEValue == 0 ? 0 :
                    Math.Round((ptaDash.TotalPPEValue / (ptaDash.TotalPPEValue + ptaDash.TotalSEValue)) * 100, 2);
                ptaDash.TotalSEValuePercentage = ptaDash.TotalPPEValue + ptaDash.TotalSEValue == 0 ? 0 :
                    Math.Round((ptaDash.TotalSEValue / (ptaDash.TotalPPEValue + ptaDash.TotalSEValue)) * 100, 2);

                return Ok(ApiResponse<DashboardPTAResponseModel>.Ok(
                    ptaDash,
                    "PTA dashboard have been retrieved"
                ));
            }
            catch (Exception ex)
            {
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

        private static double ParseEncryptedDouble(string? encryptedValue)
        {
            if (string.IsNullOrWhiteSpace(encryptedValue))
            {
                return 0;
            }

            var decrypted = EncryptionHelper.Decrypt(encryptedValue);
            return double.TryParse(decrypted, out var value) ? value : 0;
        }
    }
}
