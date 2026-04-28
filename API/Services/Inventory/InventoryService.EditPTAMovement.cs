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
public async Task<IActionResult> EditPTAMovement([FromBody] EditPTAMovementQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblPTAMovement ptaMovement = new()
                {
                    Id = model.Id,
                    PTAId = model.PTAId,
                    DateAssigned = model.DateAssigned,
                    PTRITRNumber = model.PtrItrNumber,
                    RRPPERRSPNumber = model.RrppeRrspNumber,
                    PARICSNumber = model.ParIcsNumber,
                    PlantillaEmployeeId = model.PlantillaEmployeeId,
                    NonPlantillaEmployeeId = model.NonPlantillaEmployeeId,
                    ActualOfficeId = model.ActualOfficeId,
                    ActualDivisionId = model.ActualDivisionId,
                    Remarks = model.Condition,
                    IsActive = model.IsActive,
                    Status = model.Status,
                    IsCurrent = model.IsCurrent

                };

                long ptaMovementId = await _editTools.PTA.EditTblPTAMovementAsync(ptaMovement, model.ActionBySystemUserId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(new { PTAMovementId = ptaMovementId }, $"PTA Movement has been {(model.Id == 0 ? "added" : "updated")}"));

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
