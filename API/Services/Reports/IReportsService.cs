using Microsoft.AspNetCore.Mvc;
using PortalDB.Models.QueryParams.Report;
using PortalDB.Models.QueryParams.Universal;

namespace API.Services.Reports
{
    public interface IReportsService
    {
        Task<IActionResult> GetNextReportSerial(string reportName, SoloQueryParams model);
        Task<IActionResult> CreateReportSerial(CreateReportSerialParams model);
    }
}
