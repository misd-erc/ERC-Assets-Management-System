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
public async Task<IActionResult> GetPTATransferDetails([FromQuery] string transferNumber, [FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                if (string.IsNullOrWhiteSpace(transferNumber))
                {
                    return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.INVALID_INPUT, "Transfer number (PTR/ITR) is required"));
                }

                // Get all movements for the specific PTR/ITR number
                var allMovements = await _getTools.PTA.GetTblPTAMovements(context)
                    .Where(x => !x.IsDeleted && x.PTRITRNumber != null && x.PTRITRNumber.ToUpper().Contains(transferNumber.ToUpper()))
                    .ToListAsync();

                if (!allMovements.Any())
                {
                    return Ok(ApiResponse<object>.Ok(new
                    {
                        transferNumber = transferNumber,
                        transferType = transferNumber.ToUpper().StartsWith("PTR") ? "PTR" : "ITR",
                        movements = new List<object>(),
                        totalItems = 0,
                        totalMovements = 0
                    }, "No movements found for this transfer number"));
                }

                // Get unique PTA IDs from all movements
                var ptaIds = allMovements.Select(m => m.PTAId).Distinct().ToList();

                // Fetch all PTAs with their details
                var ptas = await context.TblPTAs
                    .AsNoTracking()
                    .Where(p => ptaIds.Contains(p.Id) && !p.IsDeleted)
                    .ToListAsync();

                // Build detailed response with movements and their items
                var enrichedMovements = new List<object>();

                foreach (var movement in allMovements.OrderByDescending(x => x.CreatedAt))
                {
                    var ptaMovementDetail = _getTools.PTA.GetTblPTAMovementsByPTAId(movement.PTAId, context)
                        .Where(m => m.Id == movement.Id)
                        .FirstOrDefault();

                    if (ptaMovementDetail == null)
                        continue;

                    // Get the PTA item for this movement
                    var pta = ptas.FirstOrDefault(p => p.Id == movement.PTAId);

                    var ptaResponseModel = new PTAResponseModel();
                    if (pta != null)
                    {
                        ptaResponseModel = new PTAResponseModel
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
                            IsActive = pta.IsActive,
                            CreatedAt = pta.CreatedAt
                        };
                    }

                    enrichedMovements.Add(new
                    {
                        movementId = ptaMovementDetail.Id,
                        ptaId = ptaMovementDetail.PTAId,
                        dateAssigned = ptaMovementDetail.DateAssigned,
                        ptritrNumber = ptaMovementDetail.PtrItrNumber,
                        paricsNumber = ptaMovementDetail.ParIcsNumber,
                        office = ptaMovementDetail.Office,
                        division = ptaMovementDetail.Division,
                        condition = ptaMovementDetail.Condition,
                        remarks = movement.Remarks,
                        status = movement.Status,
                        isActive = ptaMovementDetail.IsActive,
                        items = new List<object> { new { ptaResponseModel.Id, ptaResponseModel.PropertyNumber, ptaResponseModel.Description, ptaResponseModel.Brand, ptaResponseModel.Model, ptaResponseModel.SerialNumber, ptaResponseModel.Category, ptaResponseModel.UnitOfMeasurement, ptaResponseModel.UnitValue, ptaResponseModel.DateAcquired, ptaResponseModel.Group } },
                        createdAt = ptaMovementDetail.CreatedAt
                    });
                }

                var response = new
                {
                    transferNumber = transferNumber,
                    transferType = transferNumber.ToUpper().StartsWith("PTR") ? "PTR" : "ITR",
                    movements = enrichedMovements,
                    totalItems = ptas.Count,
                    totalMovements = allMovements.Count,
                    totalValue = ptas.Sum(p => p.UnitValue)
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed transfer details for {transferNumber}", actionBy: model.ActionBySystemUserId);

                return Ok(ApiResponse<object>.Ok(response, $"Transfer details for {transferNumber} have been retrieved"));
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
