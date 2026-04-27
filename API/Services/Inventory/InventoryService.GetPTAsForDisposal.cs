using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Models.ParserModels.PTA;
using PortalDB.Models.QueryParams.Office;
using PortalDB.Models.QueryParams.Pagination;
using PortalDB.Models.QueryParams.PTA;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.ResponseModels.Account;
using PortalDB.Models.ResponseModels.Office;
using PortalDB.Models.ResponseModels.PPE;
using PortalDB.Models.ResponseModels.PTA;
using PortalDB.Models.Responses;
using PortalDB.Models.ViewModels.PTA;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;
using PortalTools.Services.GetEditTools.ASSET.PTA;
using PortalTools.Services.GetEditTools.DBO.Account;
using PortalTools.Services.GetEditTools.DBO.Office;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics;
using System.Globalization;
using System.Linq.Expressions;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace API.Services.Inventory
{
    public partial class InventoryService
    {
public async Task<IActionResult> GetPTAsForDisposal([FromQuery] PTAPaginationQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                // Load all PTAs for the group
                IEnumerable<TblPTA> ptas = string.IsNullOrWhiteSpace(model.GroupName)
                    ? await _getTools.PTA.GetTblPTAs(context).ToListAsync()
                    : await _getTools.PTA.GetTblPTAsByGroup(model.GroupName, context).ToListAsync();

                // Load all movements for these PTAs in one batch
                var ptaIds = ptas.Select(x => x.Id).ToHashSet();

                var allMovements = await context.TblPTAMovements
                    .AsNoTracking()
                    .Where(m => !m.IsDeleted && m.PTAId.HasValue && ptaIds.Contains(m.PTAId.Value))
                    .ToListAsync();

                // After ToListAsync(), Remarks and DateAssigned auto-decrypt via [NotMapped] getters.
                // Get the latest movement per PTA, keep only those whose latest condition is "For Disposal"
                var ptaIdsForDisposal = allMovements
                    .GroupBy(m => m.PTAId!.Value)
                    .Where(g =>
                    {
                        var latest = g.OrderByDescending(m => m.DateAssigned ?? m.CreatedAt).First();
                        return (latest.Remarks ?? "").Equals("Defective For Disposal", StringComparison.OrdinalIgnoreCase);
                    })
                    .Select(g => g.Key)
                    .ToHashSet();

                ptas = ptas.Where(x => ptaIdsForDisposal.Contains(x.Id));

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLowerInvariant();
                    ptas = ptas.Where(x =>
                        (x.PropertyNumber ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Description ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Brand ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Model ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.SerialNumber ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.UnitOfMeasurement ?? "").ToLowerInvariant().Contains(searchLower) ||
                        x.UnitValue.ToString().Contains(searchLower) ||
                        (x.DateAcquired?.ToString("yyyy-MM-dd") ?? "").Contains(searchLower) ||
                        (x.FiscalDate?.ToString("yyyy-MM-dd") ?? "").Contains(searchLower)
                    );
                }

                if (model.CategoryId != null && model.CategoryId != 0)
                    ptas = ptas.Where(x => x.CategoryId == model.CategoryId);

                if (model.StartDate.HasValue)
                    ptas = ptas.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    ptas = ptas.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = ptas.Count();
                int skip = (model.PageNumber - 1) * model.PageSize;

                var ptaList = ptas
                    .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var ptasResponses = new List<PTAResponseModel>();

                foreach (var x in ptaList)
                {
                    var ptaModel = new PTAResponseModel
                    {
                        Id = x.Id,
                        Group = x.Group,
                        PropertyNumber = x.PropertyNumber,
                        Category = await _getTools.PTA.GetTblPTACategoryAsync(x.CategoryId, context),
                        Legend = await _getTools.PTA.GetTblPTALegendAsync(x.LegendId, context),
                        Description = x.Description,
                        Brand = x.Brand,
                        Model = x.Model,
                        SerialNumber = x.SerialNumber,
                        UnitOfMeasurement = x.UnitOfMeasurement,
                        UnitValue = x.UnitValue,
                        DateAcquired = x.DateAcquired,
                        EstimatedUsefulLife = x.EstimatedUsefulLife,
                        FiscalDate = x.FiscalDate,
                        Parts = await _getTools.PTA.GetTblPTAPartsByPTAId(x.Id, context).ToListAsync(),
                        Movements = (await _getTools.PTA.GetTblPTAMovementsByPTAId(x.Id, context).ToListAsync()).OrderByDescending(m => m.DateAssigned).ToList(),
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt,
                        UpdatedAt = x.UpdatedAt
                    };
                    ptasResponses.Add(ptaModel);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed {model.GroupName} PTAs marked for disposal", actionBy: model.ActionBySystemUserId);

                return Ok(ApiResponse<PTAResponseModel>.OkPaginated(
                    ptasResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "PTAs marked for disposal retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryService));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
    }
}
