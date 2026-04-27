using API.Attributes;
using API.Services.Dashboard;
using Microsoft.AspNetCore.Mvc;
using PortalAPI.Attributes;
using PortalDB.Models.QueryParams.Universal;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        #region GET

        // GET api/dashboard/pta
        [HttpGet("pta")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetPTADashboard([FromQuery] SoloQueryParams model) => await _dashboardService.GetPTADashboard(model);

        // GET api/dashboard/asset-overview
        [HttpGet("asset-overview")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAssetOverview([FromQuery] SoloQueryParams model) => await _dashboardService.GetAssetOverview(model);

        // GET api/dashboard/recent-activities
        [HttpGet("recent-activities")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetRecentActivities([FromQuery] SoloQueryParams model) => await _dashboardService.GetRecentActivities(model);

        // GET api/dashboard/disposal-stats
        [HttpGet("disposal-stats")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetDisposalStats([FromQuery] SoloQueryParams model) => await _dashboardService.GetDisposalStats(model);

        // GET api/dashboard/supply-stats
        [HttpGet("supply-stats")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetSupplyStats([FromQuery] SoloQueryParams model) => await _dashboardService.GetSupplyStats(model);

        #endregion

    }
}
