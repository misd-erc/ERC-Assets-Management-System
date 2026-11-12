using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Services;

namespace API.Services.Inventory
{
    public partial class InventoryService
    {
        public async Task<IActionResult> GetPTATransferDetails([FromQuery] string transferNumber, [FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                if (string.IsNullOrWhiteSpace(transferNumber))
                    return BadRequest(ApiResponse<object>.Fail(ErrorCodes.INVALID_INPUT, "Transfer number (PTR/ITR) is required"));

                // Encrypted numbers are not SQL-searchable. Materialize only numbered
                // movements, then compare exactly so similarly numbered reports cannot mix.
                var candidates = await context.TblPTAMovements.AsNoTracking()
                    .Where(m => !m.IsDeleted && m.PTRITRNumberEncrypted != null && m.PTRITRNumberEncrypted != "")
                    .ToListAsync();
                var movements = candidates.Where(m => string.Equals(m.PTRITRNumber?.Trim(),
                    transferNumber.Trim(), StringComparison.OrdinalIgnoreCase))
                    .OrderByDescending(m => m.CreatedAt).ThenByDescending(m => m.Id).ToList();
                var ptaIds = movements.Where(m => m.PTAId.HasValue).Select(m => m.PTAId!.Value).Distinct().ToList();
                var ptas = await context.TblPTAs.AsNoTracking()
                    .Where(p => ptaIds.Contains(p.Id) && !p.IsDeleted).ToDictionaryAsync(p => p.Id);
                var history = await context.TblPTAMovements.AsNoTracking()
                    .Where(m => !m.IsDeleted && m.PTAId.HasValue && ptaIds.Contains(m.PTAId.Value)).ToListAsync();
                var previous = new Dictionary<long, TblPTAMovement>();
                foreach (var group in history.GroupBy(m => m.PTAId))
                {
                    var ordered = group.OrderBy(m => m.DateAssigned).ThenBy(m => m.CreatedAt).ThenBy(m => m.Id).ToList();
                    for (int i = 1; i < ordered.Count; i++) previous[ordered[i].Id] = ordered[i - 1];
                }
                var employees = await LoadTransferReportEmployees(context,
                    movements.Concat(movements.Where(m => previous.ContainsKey(m.Id)).Select(m => previous[m.Id])));
                var officeIds = movements.Select(m => m.ActualOfficeId).ToList();
                var divisionIds = movements.Select(m => m.ActualDivisionId).ToList();
                var categoryIds = ptas.Values.Select(p => p.CategoryId).ToList();
                var offices = await context.TblOffices.AsNoTracking().Where(o => officeIds.Contains(o.Id)).ToDictionaryAsync(o => o.Id);
                var divisions = await context.TblDivisions.AsNoTracking().Where(d => divisionIds.Contains(d.Id)).ToDictionaryAsync(d => d.Id);
                var categories = await context.TblPTACategories.AsNoTracking().Where(c => categoryIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id);
                var enriched = new List<object>();
                foreach (var movement in movements)
                {
                    if (!ptas.TryGetValue(movement.PTAId ?? 0, out var pta)) continue;
                    previous.TryGetValue(movement.Id, out var prior);
                    enriched.Add(new
                    {
                        movementId = movement.Id, ptaId = movement.PTAId,
                        dateAssigned = movement.DateAssigned, ptritrNumber = movement.PTRITRNumber,
                        paricsNumber = movement.PARICSNumber,
                        plantillaEmployeeId = movement.PlantillaEmployeeId,
                        nonPlantillaEmployeeId = movement.NonPlantillaEmployeeId,
                        previousPlantillaEmployeeId = prior?.PlantillaEmployeeId,
                        previousNonPlantillaEmployeeId = prior?.NonPlantillaEmployeeId,
                        plantillaEmployee = employees.GetValueOrDefault(movement.PlantillaEmployeeId ?? 0),
                        nonPlantillaEmployee = employees.GetValueOrDefault(movement.NonPlantillaEmployeeId ?? 0),
                        previousPlantillaEmployee = employees.GetValueOrDefault(prior?.PlantillaEmployeeId ?? 0),
                        previousNonPlantillaEmployee = employees.GetValueOrDefault(prior?.NonPlantillaEmployeeId ?? 0),
                        office = offices.GetValueOrDefault(movement.ActualOfficeId ?? 0),
                        division = divisions.GetValueOrDefault(movement.ActualDivisionId ?? 0),
                        // The existing movement writer stores condition in Remarks.
                        condition = movement.Remarks ?? "",
                        remarks = movement.Remarks, reasonForTransfer = movement.ReasonForTransfer,
                        status = movement.Status, isActive = movement.IsActive, createdAt = movement.CreatedAt,
                        items = new[] { new {
                            pta.Id, pta.PropertyNumber, pta.Description, pta.Brand, pta.Model, pta.SerialNumber,
                            category = categories.GetValueOrDefault(pta.CategoryId ?? 0)?.Name,
                            pta.UnitOfMeasurement, pta.UnitValue, pta.DateAcquired, pta.Group
                        } }
                    });
                }
                var groups = ptas.Values.Select(p => p.Group).Distinct().ToList();
                var reportType = groups.Count == 1 ? (groups[0] == "PPE" ? "PTR" : "ITR") : "";
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed transfer details for {transferNumber}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<object>.Ok(new {
                    transferNumber, transferType = reportType, movements = enriched,
                    totalItems = ptas.Count, totalMovements = enriched.Count,
                    totalValue = ptas.Values.Sum(p => p.UnitValue)
                }, $"Transfer details for {transferNumber} have been retrieved"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryService));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
    }
}
