using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Constants;
using PortalDB.Models.QueryParams.PTA;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.Services.Inventory
{
    public partial class InventoryService
    {
        public async Task<IActionResult> GetMyAccountabilities([FromQuery] PTAMyAccountabilitiesQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                List<long> myEmployeeIds;

                if (!string.IsNullOrWhiteSpace(model.EmployeeId))
                {
                    var employee = await _getTools.Account.GetEmployeeByEmployeeIdAsync(model.EmployeeId.Trim(), context);
                    myEmployeeIds = employee != null ? new List<long> { employee.Id } : new List<long>();
                }
                else
                {
                    myEmployeeIds = await _getTools.Account.GetEmployees(context)
                        .Where(x => x.SystemUserId == model.ActionBySystemUserId)
                        .Select(x => x.Id)
                        .Distinct()
                        .ToListAsync();
                }

                if (!myEmployeeIds.Any())
                {
                    await transaction.CommitAsync();
                    return Ok(ApiResponse<object>.OkPaginated(
                        new List<object>(),
                        model.PageNumber,
                        model.PageSize,
                        0,
                        "No accountability records found for this user"
                    ));
                }

                var allMovements = await _getTools.PTA.GetTblPTAMovements(context)
                    .Where(x => !x.IsDeleted)
                    .ToListAsync();

                allMovements = allMovements
                    .GroupBy(x => x.PTAId ?? 0)
                    .Select(g => g.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id).First())
                    .ToList();

                var invalidParValues = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
                {
                    "N/A", "NA", "n/a", "None", "none", "-", ""
                };

                allMovements = allMovements
                    .Where(x =>
                        ((x.PlantillaEmployeeId.HasValue && myEmployeeIds.Contains(x.PlantillaEmployeeId.Value)) ||
                         (x.NonPlantillaEmployeeId.HasValue && myEmployeeIds.Contains(x.NonPlantillaEmployeeId.Value))))
                    .ToList();

                var ptaIds = allMovements
                    .Where(x => x.PTAId.HasValue)
                    .Select(x => x.PTAId!.Value)
                    .Distinct()
                    .ToList();

                var ptaMap = await context.TblPTAs
                    .AsNoTracking()
                    .Where(p => ptaIds.Contains(p.Id) && !p.IsDeleted)
                    .ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.Group) &&
                    (model.Group.ToUpper() == "PPE" || model.Group.ToUpper() == "SE"))
                {
                    var groupPtaIds = ptaMap
                        .Where(p => (p.Group ?? "").ToUpper() == model.Group!.ToUpper())
                        .Select(p => p.Id)
                        .ToHashSet();

                    allMovements = allMovements
                        .Where(x => x.PTAId.HasValue && groupPtaIds.Contains(x.PTAId.Value))
                        .ToList();
                }

                var ptaLookup = ptaMap.ToDictionary(p => p.Id, p => p);

                var employeeIds = allMovements
                    .SelectMany(m => new[] { m.PlantillaEmployeeId, m.NonPlantillaEmployeeId })
                    .Where(id => id.HasValue)
                    .Select(id => id!.Value)
                    .Distinct()
                    .ToList();

                var employeeNameMap = new Dictionary<long, string>();
                foreach (var empId in employeeIds)
                {
                    var emp = await _getTools.Account.GetTblEmployeeAsync(empId, context);
                    if (emp != null)
                    {
                        employeeNameMap[empId] = $"{emp.FirstName} {emp.MiddleName} {emp.LastName}".Trim();
                    }
                }

                allMovements = allMovements
                    .OrderByDescending(x => x.CreatedAt)
                    .ThenByDescending(x => x.DateAssigned)
                    .ToList();

                int totalCount = allMovements.Count;
                int skip = (model.PageNumber - 1) * model.PageSize;
                var pagedMovements = allMovements.Skip(skip).Take(model.PageSize).ToList();

                var result = new List<object>();

                foreach (var movement in pagedMovements)
                {
                    long? plantillaId = movement.PlantillaEmployeeId;
                    long? nonPlantillaId = movement.NonPlantillaEmployeeId;

                    employeeNameMap.TryGetValue(plantillaId ?? 0, out var plantillaName);
                    employeeNameMap.TryGetValue(nonPlantillaId ?? 0, out var nonPlantillaName);

                    object? office = null;
                    object? division = null;
                    if (movement.ActualOfficeId.HasValue)
                        office = await _getTools.Office.GetTblOfficeAsync(movement.ActualOfficeId.Value, context);
                    if (movement.ActualDivisionId.HasValue)
                        division = await _getTools.Office.GetTblDivisionAsync(movement.ActualDivisionId.Value, context);

                    object? itemDetails = null;
                    var itemGroup = "PPE";
                    if (movement.PTAId.HasValue && ptaLookup.TryGetValue(movement.PTAId.Value, out var pta))
                    {
                        itemGroup = pta.Group ?? "PPE";
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

                    var rawParIcs = movement.PARICSNumber?.Trim() ?? string.Empty;
                    var hasValidParIcs = !string.IsNullOrWhiteSpace(rawParIcs) && !invalidParValues.Contains(rawParIcs);
                    var fallbackPrefix = string.Equals(itemGroup, "SE", StringComparison.OrdinalIgnoreCase) ? "ICS" : "PAR";
                    var normalizedParIcs = hasValidParIcs ? rawParIcs : $"{fallbackPrefix}-UNASSIGNED-{movement.Id}";

                    result.Add(new
                    {
                        id = movement.Id,
                        ptaId = movement.PTAId,
                        parIcsNumber = normalizedParIcs,
                        dateAssigned = movement.DateAssigned,
                        status = movement.Status,
                        remarks = movement.Remarks,
                        isCurrent = movement.IsCurrent,
                        isActive = movement.IsActive,
                        createdAt = movement.CreatedAt,
                        plantillaEmployeeId = plantillaId,
                        plantillaEmployeeName = plantillaName,
                        plantillaEmployeeIdOriginal = movement.PlantillaEmployeeIdOriginal,
                        nonPlantillaEmployeeId = nonPlantillaId,
                        nonPlantillaEmployeeName = nonPlantillaName,
                        nonPlantillaEmployeeIdOriginal = movement.NonPlantillaEmployeeIdOriginal,
                        office,
                        division,
                        item = itemDetails
                    });
                }

                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed My Accountabilities", actionBy: model.ActionBySystemUserId);

                return Ok(ApiResponse<object>.OkPaginated(
                    result,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "My accountabilities retrieved successfully"
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
