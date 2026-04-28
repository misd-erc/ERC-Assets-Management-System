using Microsoft.AspNetCore.Mvc;
using PortalDB.Models.QueryParams.Universal;

namespace API.Services.Dashboard
{
    public interface IDashboardService
    {
        Task<IActionResult> GetPTADashboard(SoloQueryParams model);
        Task<IActionResult> GetAssetOverview(SoloQueryParams model);
        Task<IActionResult> GetRecentActivities(SoloQueryParams model);
        Task<IActionResult> GetDisposalStats(SoloQueryParams model);
        Task<IActionResult> GetSupplyStats(SoloQueryParams model);
    }
}