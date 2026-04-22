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
public async Task<IActionResult> GetPTA([FromQuery] SoloQueryParams model, [FromRoute] long ptaId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblPTA? pta = await _getTools.PTA.GetTblPTAAsync(ptaId, context);
                var ptaResponses = new List<PTAResponseModel>();
                var ptaModel = new PTAResponseModel
                {
                    Id = pta.Id,
                    Group = pta.Group,
                    PropertyNumber = pta.PropertyNumber,
                    Category = await _getTools.PTA.GetTblPTACategoryAsync(pta.CategoryId, context),
                    Legend = await _getTools.PTA.GetTblPTALegendAsync(pta.LegendId, context),
                    Description = pta.Description,
                    Brand = pta.Brand,
                    Model = pta.Model,
                    SerialNumber = pta.SerialNumber,
                    UnitOfMeasurement = pta.UnitOfMeasurement,
                    UnitValue = pta.UnitValue,
                    DateAcquired = pta.DateAcquired,
                    EstimatedUsefulLife = pta.EstimatedUsefulLife,
                    FiscalDate = pta.FiscalDate,
                    Parts = await _getTools.PTA.GetTblPTAPartsByPTAId(pta.Id, context).ToListAsync(),
                    Movements = (await _getTools.PTA.GetTblPTAMovementsByPTAId(pta.Id, context).ToListAsync()).OrderByDescending(m => m.DateAssigned).ToList(),
                    IsActive = pta.IsActive,
                    CreatedAt = pta.CreatedAt,
                    UpdatedAt = pta.UpdatedAt
                };
                ptaResponses.Add(ptaModel);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed PTA information for PTA {pta.Id}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<PTAResponseModel>.Ok(ptaResponses, "PTA have been retrieved"
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
