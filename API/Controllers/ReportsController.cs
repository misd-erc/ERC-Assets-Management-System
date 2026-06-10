using API.Attributes;
using API.Services.Reports;
using Microsoft.AspNetCore.Mvc;
using PortalAPI.Attributes;
using PortalDB.Models.QueryParams.Report;
using PortalDB.Models.QueryParams.Universal;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly IReportsService _reportsService;

        public ReportsController(IReportsService reportsService)
        {
            _reportsService = reportsService;
        }

        [HttpGet("serial/next")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetNextReportSerial([FromQuery] string reportName, [FromQuery] SoloQueryParams model)
            => await _reportsService.GetNextReportSerial(reportName, model);

        [HttpPost("serial/create")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> CreateReportSerial([FromBody] CreateReportSerialParams model)
            => await _reportsService.CreateReportSerial(model);
    }
}
