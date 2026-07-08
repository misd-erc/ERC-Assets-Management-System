using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.ResponseModels.PTA;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Services;

namespace API.Services.Inventory
{
    public partial class InventoryService
    {
        public async Task<IActionResult> GetPTAReturnDetails([FromQuery] string returnNumber, [FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                if (string.IsNullOrWhiteSpace(returnNumber))
                {
                    return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.INVALID_INPUT, "Return number (RRPPE/RRSP) is required"));
                }

                // Get all movements for the specific RRPPE/RRSP number.
                // RRPPERRSPNumber is [NotMapped] (encrypted), so EF can't translate the filter to SQL —
                // materialize first, then filter in-memory against the decrypted value.
                var allMovements = (await _getTools.PTA.GetTblPTAMovements(context)
                        .Where(x => !x.IsDeleted)
                        .ToListAsync())
                    .Where(x => !string.IsNullOrWhiteSpace(x.RRPPERRSPNumber) && x.RRPPERRSPNumber!.ToUpper().Contains(returnNumber.ToUpper()))
                    .ToList();

                if (!allMovements.Any())
                {
                    return Ok(ApiResponse<object>.Ok(new
                    {
                        returnNumber = returnNumber,
                        returnType = returnNumber.ToUpper().StartsWith("RRPPE") ? "RRPPE" : "RRSP",
                        movements = new List<object>(),
                        totalItems = 0,
                        totalMovements = 0
                    }, "No movements found for this return number"));
                }

                // Get unique PTA IDs from all movements
                var ptaIds = allMovements.Select(m => m.PTAId).Distinct().ToList();

                // Fetch all PTAs with their details
                var ptas = await context.TblPTAs
                    .AsNoTracking()
                    .Where(p => ptaIds.Contains(p.Id) && !p.IsDeleted)
                    .ToListAsync();

                // Resolve previous holder (FROM employee) per movement via full PTA history
                var movementsByPta = (await _getTools.PTA.GetTblPTAMovements(context)
                        .Where(x => x.PTAId.HasValue && ptaIds.Contains(x.PTAId) && !x.IsDeleted)
                        .ToListAsync())
                    .OrderBy(x => x.DateAssigned)
                    .ThenBy(x => x.CreatedAt)
                    .GroupBy(x => x.PTAId!.Value)
                    .ToDictionary(g => g.Key, g => g.ToList());

                // Build employee lookup for current + previous holders
                var employeeIds = allMovements
                    .SelectMany(m => new[] { m.PlantillaEmployeeId, m.NonPlantillaEmployeeId })
                    .Concat(movementsByPta.Values.SelectMany(history =>
                        history.SelectMany(m => new[] { m.PlantillaEmployeeId, m.NonPlantillaEmployeeId })))
                    .Where(id => id.HasValue)
                    .Select(id => id!.Value)
                    .Distinct()
                    .ToList();

                var employeeMap = new Dictionary<long, object>();
                foreach (var empId in employeeIds)
                {
                    var emp = await _getTools.Account.GetTblEmployeeAsync(empId, context);
                    if (emp == null) continue;

                    string? positionName = null;
                    if (emp.PositionId.HasValue)
                    {
                        var position = await _getTools.Office.GetTblPositionAsync(emp.PositionId.Value, context);
                        positionName = !string.IsNullOrWhiteSpace(position?.Name) ? position!.Name : position?.Acronym;
                    }

                    employeeMap[empId] = new
                    {
                        id = emp.Id,
                        fullName = $"{emp.FirstName} {emp.MiddleName} {emp.LastName}".Trim(),
                        employeeIdOriginal = emp.EmployeeIdOriginal,
                        position = positionName != null ? new { name = positionName } : null
                    };
                }

                // Build detailed response with movements and their items
                var enrichedMovements = new List<object>();

                foreach (var movement in allMovements.OrderByDescending(x => x.CreatedAt))
                {
                    var pta = ptas.FirstOrDefault(p => p.Id == movement.PTAId);

                    object? itemDetails = null;
                    if (pta != null)
                    {
                        var category = await _getTools.PTA.GetTblPTACategoryAsync(pta.CategoryId, context);
                        itemDetails = new
                        {
                            id = pta.Id,
                            group = pta.Group,
                            propertyNumber = pta.PropertyNumber,
                            description = pta.Description,
                            brand = pta.Brand,
                            model = pta.Model,
                            serialNumber = pta.SerialNumber,
                            category = category?.Name,
                            unitOfMeasurement = pta.UnitOfMeasurement,
                            unitValue = pta.UnitValue,
                            dateAcquired = pta.DateAcquired
                        };
                    }

                    // FROM employee = previous holder before this return movement
                    object? fromEmployee = null;
                    if (movement.PTAId.HasValue && movementsByPta.TryGetValue(movement.PTAId.Value, out var history))
                    {
                        var currentIndex = history.FindIndex(m => m.Id == movement.Id);
                        if (currentIndex > 0)
                        {
                            var prev = history[currentIndex - 1];
                            if (prev.NonPlantillaEmployeeId.HasValue && employeeMap.TryGetValue(prev.NonPlantillaEmployeeId.Value, out var npPrev))
                                fromEmployee = new { employee = npPrev, employeeType = "Non-Plantilla" };
                            else if (prev.PlantillaEmployeeId.HasValue && employeeMap.TryGetValue(prev.PlantillaEmployeeId.Value, out var pPrev))
                                fromEmployee = new { employee = pPrev, employeeType = "Plantilla" };
                        }
                    }

                    // TO employee = the return's recorded holder (custodian/receiver of the return)
                    object? toEmployee = null;
                    if (movement.NonPlantillaEmployeeId.HasValue && employeeMap.TryGetValue(movement.NonPlantillaEmployeeId.Value, out var npTo))
                        toEmployee = new { employee = npTo, employeeType = "Non-Plantilla" };
                    else if (movement.PlantillaEmployeeId.HasValue && employeeMap.TryGetValue(movement.PlantillaEmployeeId.Value, out var pTo))
                        toEmployee = new { employee = pTo, employeeType = "Plantilla" };

                    enrichedMovements.Add(new
                    {
                        movementId = movement.Id,
                        ptaId = movement.PTAId,
                        dateAssigned = movement.DateAssigned,
                        rrppeRrspNumber = movement.RRPPERRSPNumber,
                        paricsNumber = movement.PARICSNumber,
                        fromEmployee,
                        toEmployee,
                        condition = movement.Remarks,
                        remarks = movement.Remarks,
                        status = movement.Status,
                        isActive = movement.IsActive,
                        items = itemDetails != null ? new List<object> { itemDetails } : new List<object>(),
                        createdAt = movement.CreatedAt
                    });
                }

                var response = new
                {
                    returnNumber = returnNumber,
                    returnType = returnNumber.ToUpper().StartsWith("RRPPE") ? "RRPPE" : "RRSP",
                    movements = enrichedMovements,
                    totalItems = ptas.Count,
                    totalMovements = allMovements.Count,
                    totalValue = ptas.Sum(p => p.UnitValue)
                };

                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed return details for {returnNumber}", actionBy: model.ActionBySystemUserId);

                return Ok(ApiResponse<object>.Ok(response, $"Return details for {returnNumber} have been retrieved"));
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
