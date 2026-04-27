using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalDB.Models.QueryParams.PTA;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Services;

namespace API.Services.Inventory
{
    public partial class InventoryService
    {
        public async Task<IActionResult> GetPTAReturnList([FromQuery] PTAReturnListQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                // 1. Load all current non-deleted movements.
                // RRPPERRSPNumber is [NotMapped] (encrypted), so we filter in-memory after materialization.
                var allMovements = await _getTools.PTA.GetTblPTAMovements(context)
                    .Where(x => x.IsCurrent == true && !x.IsDeleted)
                    .ToListAsync();

                // 2. Keep only rows with a valid RRPPE/RRSP number.
                //    Exclude null, whitespace, and known placeholder values.
                var invalidValues = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
                {
                    "N/A", "NA", "n/a", "New", "Renewed", "None", "-"
                };

                allMovements = allMovements
                    .Where(x =>
                        !string.IsNullOrWhiteSpace(x.RRPPERRSPNumber) &&
                        !invalidValues.Contains(x.RRPPERRSPNumber.Trim()))
                    .ToList();

                // 3. RRPPE/RRSP filter (prefix shortcut or partial search)
                if (!string.IsNullOrWhiteSpace(model.RrppeRrspFilter))
                {
                    string f = model.RrppeRrspFilter.Trim();
                    if (f.ToUpper() == "RRPPE")
                        allMovements = allMovements.Where(x => x.RRPPERRSPNumber!.ToUpper().StartsWith("RRPPE")).ToList();
                    else if (f.ToUpper() == "RRSP")
                        allMovements = allMovements.Where(x => x.RRPPERRSPNumber!.ToUpper().StartsWith("RRSP")).ToList();
                    else
                        allMovements = allMovements.Where(x => x.RRPPERRSPNumber!.ToUpper().Contains(f.ToUpper())).ToList();
                }

                // 4. Date range filter
                if (model.StartDate.HasValue)
                    allMovements = allMovements.Where(x => x.DateAssigned >= model.StartDate.Value).ToList();

                if (model.EndDate.HasValue)
                    allMovements = allMovements.Where(x => x.DateAssigned <= model.EndDate.Value).ToList();

                // 5. Office / Division filter
                if (model.OfficeId.HasValue && model.OfficeId.Value > 0)
                    allMovements = allMovements.Where(x => x.ActualOfficeId == model.OfficeId.Value).ToList();

                if (model.DivisionId.HasValue && model.DivisionId.Value > 0)
                    allMovements = allMovements.Where(x => x.ActualDivisionId == model.DivisionId.Value).ToList();

                // 6. Collect PTA IDs and fetch PTA records for group filter + enrichment
                var ptaIds = allMovements
                    .Where(x => x.PTAId.HasValue)
                    .Select(x => x.PTAId!.Value)
                    .Distinct()
                    .ToList();

                var ptaMap = await context.TblPTAs
                    .AsNoTracking()
                    .Where(p => ptaIds.Contains(p.Id) && !p.IsDeleted)
                    .ToListAsync();

                // 7. Group filter (PPE / SE)
                if (!string.IsNullOrWhiteSpace(model.Group) &&
                    (model.Group.ToUpper() == "PPE" || model.Group.ToUpper() == "SE"))
                {
                    var groupPtaIds = ptaMap
                        .Where(p => (p.Group ?? string.Empty).ToUpper() == model.Group.ToUpper())
                        .Select(p => p.Id)
                        .ToHashSet();

                    allMovements = allMovements
                        .Where(x => x.PTAId.HasValue && groupPtaIds.Contains(x.PTAId.Value))
                        .ToList();
                }

                var ptaLookup = ptaMap.ToDictionary(p => p.Id, p => p);

                // 8. Employee name lookup
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
                        employeeNameMap[empId] = $"{emp.FirstName} {emp.MiddleName} {emp.LastName}".Trim();
                }

                // Apply employee search filter
                if (!string.IsNullOrWhiteSpace(model.SearchEmployee))
                {
                    string search = model.SearchEmployee.Trim().ToUpper();

                    allMovements = allMovements.Where(m =>
                    {
                        if (m.PlantillaEmployeeId.HasValue &&
                            employeeNameMap.TryGetValue(m.PlantillaEmployeeId.Value, out var pName) &&
                            pName.ToUpper().Contains(search))
                            return true;

                        if (m.NonPlantillaEmployeeId.HasValue &&
                            employeeNameMap.TryGetValue(m.NonPlantillaEmployeeId.Value, out var npName) &&
                            npName.ToUpper().Contains(search))
                            return true;

                        if (!string.IsNullOrEmpty(m.PlantillaEmployeeIdOriginal) &&
                            m.PlantillaEmployeeIdOriginal.ToUpper().Contains(search))
                            return true;

                        if (!string.IsNullOrEmpty(m.NonPlantillaEmployeeIdOriginal) &&
                            m.NonPlantillaEmployeeIdOriginal.ToUpper().Contains(search))
                            return true;

                        return false;
                    }).ToList();
                }

                // 9. Sort — newest first
                allMovements = allMovements
                    .OrderByDescending(x => x.CreatedAt)
                    .ThenByDescending(x => x.DateAssigned)
                    .ToList();

                // 10. Pagination
                int totalCount = allMovements.Count;
                int skip = (model.PageNumber - 1) * model.PageSize;
                var pagedMovements = allMovements.Skip(skip).Take(model.PageSize).ToList();

                // 11. Build result
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
                    if (movement.PTAId.HasValue && ptaLookup.TryGetValue(movement.PTAId.Value, out var pta))
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

                    result.Add(new
                    {
                        id = movement.Id,
                        ptaId = movement.PTAId,
                        rrppeRrspNumber = movement.RRPPERRSPNumber,
                        ptrItrNumber = movement.PTRITRNumber,
                        parIcsNumber = movement.PARICSNumber,
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
                await AuditTrailTool.LogActivityAsync(_options, "Viewed RRPPE/RRSP Return List", actionBy: model.ActionBySystemUserId);

                return Ok(ApiResponse<object>.OkPaginated(
                    result,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "RRPPE/RRSP Return list retrieved successfully"
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
