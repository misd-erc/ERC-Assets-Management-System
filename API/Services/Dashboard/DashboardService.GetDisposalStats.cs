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
        public async Task<IActionResult> GetDisposalStats(SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                var disposalCounts = await context.TblDisposals
                    .AsNoTracking()
                    .Where(x => !x.IsDeleted)
                    .GroupBy(x => x.Status)
                    .Select(g => new
                    {
                        Status = g.Key,
                        Count = g.Count()
                    })
                    .ToListAsync();

                var countByStatus = disposalCounts.ToDictionary(x => x.Status ?? string.Empty, x => x.Count);

                var result = new DashboardDisposalStatsResponseModel
                {
                    PendingCount = countByStatus.GetValueOrDefault(TblDisposal.PENDING, 0),
                    ApprovedCount = countByStatus.GetValueOrDefault(TblDisposal.APPROVED, 0),
                    DisposedCount = countByStatus.GetValueOrDefault(TblDisposal.DISPOSED, 0),
                    RejectedCount = countByStatus.GetValueOrDefault(TblDisposal.REJECTED, 0),
                    TotalCount = disposalCounts.Sum(x => x.Count)
                };

                return Ok(ApiResponse<DashboardDisposalStatsResponseModel>.Ok(result, "Disposal stats retrieved"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DashboardService));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
    }
}
