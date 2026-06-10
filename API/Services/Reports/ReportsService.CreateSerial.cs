using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.Report;
using PortalDB.Models.QueryParams.Report;
using PortalDB.Models.Responses;

namespace API.Services.Reports
{
    public partial class ReportsService
    {
        public async Task<IActionResult> CreateReportSerial([FromBody] CreateReportSerialParams model)
        {
            await using var context = new PortalDB.Services.PortalDbContext(_options);

            try
            {
                var now = DateTime.UtcNow;
                var month = now.Month;
                var year = now.Year;

                // Parse series from serial number format MM-YYYY-NNN
                var parts = model.SerialNumber.Split('-');
                if (parts.Length != 3 || !int.TryParse(parts[2], out var series))
                    return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.VALIDATION_FAILED, "Invalid serial number format. Expected MM-YYYY-NNN."));

                // Prevent duplicate saves of the same serial number
                var exists = await context.TblReportSerials
                    .AnyAsync(x => x.ReportName == model.ReportName && x.SerialNumber == model.SerialNumber);

                if (exists)
                    return Ok(ApiResponse<object>.Ok(new { saved = false }, "Serial number already exists."));

                var record = new TblReportSerial
                {
                    ReportName = model.ReportName,
                    SerialNumber = model.SerialNumber,
                    Month = month,
                    Year = year,
                    Series = series,
                    CreatedAt = DateTime.UtcNow,
                };

                context.TblReportSerials.Add(record);
                await context.SaveChangesAsync();

                return Ok(ApiResponse<object>.Ok(new { saved = true, id = record.Id }, "Serial number saved successfully."));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CreateReportSerial] Error: {ex.Message}");
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while saving the serial number."));
            }
        }
    }
}
