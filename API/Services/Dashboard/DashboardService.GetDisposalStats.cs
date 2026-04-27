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
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var disposals = await context.TblDisposals
                    .AsNoTracking()
                    .Where(x => !x.IsDeleted)
                    .ToListAsync();

                var result = new DashboardDisposalStatsResponseModel
                {
                    PendingCount = disposals.Count(x => x.Status == TblDisposal.PENDING),
                    ApprovedCount = disposals.Count(x => x.Status == TblDisposal.APPROVED),
                    DisposedCount = disposals.Count(x => x.Status == TblDisposal.DISPOSED),
                    RejectedCount = disposals.Count(x => x.Status == TblDisposal.REJECTED),
                    TotalCount = disposals.Count
                };

                await transaction.CommitAsync();
                return Ok(ApiResponse<DashboardDisposalStatsResponseModel>.Ok(result, "Disposal stats retrieved"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DashboardService));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
    }
}