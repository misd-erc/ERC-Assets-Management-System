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
using PortalCommon.Constants;
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
                    ReasonForTransfer = model.ReasonForTransfer,
                    IsActive = model.IsActive,
                    Status = model.Status,
                    IsCurrent = model.IsCurrent

                };

                long ptaMovementId = await _editTools.PTA.EditTblPTAMovementAsync(ptaMovement, model.ActionBySystemUserId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                long? recipientEmployeeId = model.PlantillaEmployeeId ?? model.NonPlantillaEmployeeId;
                if (recipientEmployeeId.HasValue)
                {
                    var employee = await context.TblEmployees
                        .AsNoTracking()
                        .FirstOrDefaultAsync(e => e.Id == recipientEmployeeId.Value && !e.IsDeleted);

                    if (employee?.SystemUserId.HasValue == true)
                    {
                        string notifTitle = model.Id == 0
                            ? NotificationConstants.ASSET_ASSIGNED
                            : NotificationConstants.ASSET_TRANSFERRED;
                        string notifDesc = model.Id == 0
                            ? "An asset has been assigned to you"
                            : "An asset transfer has been updated for you";

                        await _notificationService.NotifyUserAsync(
                            context, notifTitle, notifDesc,
                            employee.SystemUserId.Value,
                            model.ActionBySystemUserId,
                            NotificationConstants.Modules.TRANSFERS_RETURNS);
                    }
                }

                return Ok(ApiResponse<object>.Ok(new { PTAMovementId = ptaMovementId }, $"PTA Movement has been {(model.Id == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryService));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

public async Task<IActionResult> EditPTAMovementBulk([FromBody] EditPTAMovementBulkQueryParams model)
        {
            if (model.Movements == null || model.Movements.Count == 0)
                return BadRequest(ApiResponse<object>.Fail("INVALID_INPUT", "Movements list cannot be empty."));

            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var resultIds = new List<long>();

                foreach (var item in model.Movements)
                {
                    TblPTAMovement ptaMovement = new()
                    {
                        Id = item.Id,
                        PTAId = item.PTAId,
                        DateAssigned = item.DateAssigned,
                        PTRITRNumber = item.PtrItrNumber,
                        RRPPERRSPNumber = item.RrppeRrspNumber,
                        PARICSNumber = item.ParIcsNumber,
                        PlantillaEmployeeId = item.PlantillaEmployeeId,
                        NonPlantillaEmployeeId = item.NonPlantillaEmployeeId,
                        ActualOfficeId = item.ActualOfficeId,
                        ActualDivisionId = item.ActualDivisionId,
                        Remarks = item.Condition,
                        ReasonForTransfer = item.ReasonForTransfer,
                        IsActive = item.IsActive,
                        Status = item.Status,
                        IsCurrent = item.IsCurrent,
                    };

                    long id = await _editTools.PTA.EditTblPTAMovementAsync(ptaMovement, model.ActionBySystemUserId, context, isBatch: true);
                    resultIds.Add(id);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                await AuditTrailTool.LogActivityAsync(_options, $"Bulk edited {model.Movements.Count} PTA Movement(s)", actionBy: model.ActionBySystemUserId);

                var recipientEmployeeIds = model.Movements
                    .Select(m => m.PlantillaEmployeeId ?? m.NonPlantillaEmployeeId)
                    .Where(id => id.HasValue)
                    .Select(id => id!.Value)
                    .Distinct()
                    .ToList();

                foreach (var empId in recipientEmployeeIds)
                {
                    var employee = await context.TblEmployees
                        .AsNoTracking()
                        .FirstOrDefaultAsync(e => e.Id == empId && !e.IsDeleted);

                    if (employee?.SystemUserId.HasValue == true)
                    {
                        await _notificationService.NotifyUserAsync(
                            context,
                            NotificationConstants.ASSET_TRANSFERRED,
                            "Assets have been assigned/transferred to you",
                            employee.SystemUserId.Value,
                            model.ActionBySystemUserId,
                            NotificationConstants.Modules.TRANSFERS_RETURNS);
                    }
                }

                return Ok(ApiResponse<object>.Ok(new { PTAMovementIds = resultIds, Count = resultIds.Count }, $"{model.Movements.Count} PTA Movement(s) processed successfully."));
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
