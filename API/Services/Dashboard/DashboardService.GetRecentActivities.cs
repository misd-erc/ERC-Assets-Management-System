using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Constants;
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
        public async Task<IActionResult> GetRecentActivities(SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var logs = await context.TblActivityLogs
                    .AsNoTracking()
                    .OrderByDescending(x => x.CreatedAt)
                    .Take(20)
                    .ToListAsync();

                var userIds = logs.Where(l => l.ActionBy.HasValue).Select(l => l.ActionBy!.Value).Distinct().ToList();
                var systemUsers = await _getTools.Account.GetTblSystemUsers(context)
                    .Where(u => userIds.Contains(u.Id))
                    .ToListAsync();

                var result = logs.Select(log =>
                {
                    var user = systemUsers.FirstOrDefault(u => u.Id == log.ActionBy);

                    return new DashboardRecentActivityItem
                    {
                        Id = log.Id,
                        Action = log.Action,
                        PerformedBy = user != null
                            ? $"{user.FirstName} {user.LastName}".Trim()
                            : "System",
                        CreatedAt = log.CreatedAt
                    };
                }).ToList();

                await transaction.CommitAsync();
                return Ok(ApiResponse<DashboardRecentActivityItem>.Ok(result, "Recent activities retrieved"));
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