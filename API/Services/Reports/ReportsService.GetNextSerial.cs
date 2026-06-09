using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Constants;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.Responses;

namespace API.Services.Reports
{
    public partial class ReportsService
    {
        public async Task<IActionResult> GetNextReportSerial([FromQuery] string reportName, [FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDB.Services.PortalDbContext(_options);

            try
            {
                if (string.IsNullOrWhiteSpace(reportName))
                    return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.VALIDATION_FAILED, "reportName is required."));

                var now = DateTime.UtcNow;
                var month = now.Month;
                var year = now.Year;

                var maxSeries = await context.TblReportSerials
                    .Where(x => x.ReportName == reportName && x.Month == month && x.Year == year)
                    .Select(x => (int?)x.Series)
                    .MaxAsync() ?? 0;

                var nextSeries = maxSeries + 1;
                var serialNumber = $"{month:D2}-{year}-{nextSeries:D3}";

                return Ok(ApiResponse<object>.Ok(new
                {
                    serialNumber,
                    series = nextSeries,
                    month,
                    year
                }, "Next serial number generated successfully."));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetNextReportSerial] Error: {ex.Message}");
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while generating the serial number."));
            }
        }
    }
}
