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

                // 3b. PAR/ICS Number filter (partial match)
                if (!string.IsNullOrWhiteSpace(model.ParIcsFilter))
                {
                    string pf = model.ParIcsFilter.Trim().ToUpper();
                    allMovements = allMovements
                        .Where(x => !string.IsNullOrWhiteSpace(x.PARICSNumber) && x.PARICSNumber!.ToUpper().Contains(pf))
                        .ToList();
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

                // 8. Group movements by RRPPE/RRSP number — one row per return record in the list,
                // matching what the UI displays (a single return can span multiple item movements).
                var groups = allMovements
                    .GroupBy(x => x.RRPPERRSPNumber!.Trim().ToUpperInvariant())
                    .Select(g => new
                    {
                        Key = g.Key,
                        Movements = g.ToList(),
                        Latest = g.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.DateAssigned).First()
                    })
                    .ToList();

                // 9. Employee name lookup — only for employees referenced by the latest movement of each group
                var employeeIds = groups
                    .SelectMany(g => new[] { g.Latest.PlantillaEmployeeId, g.Latest.NonPlantillaEmployeeId })
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

                // Apply employee search filter at the group level (matches if any movement in the group matches)
                if (!string.IsNullOrWhiteSpace(model.SearchEmployee))
                {
                    string search = model.SearchEmployee.Trim().ToUpper();

                    bool MovementMatchesEmployee(PortalDB.Entities.ASSET.PTA.TblPTAMovement m)
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
                    }

                    groups = groups.Where(g => g.Movements.Any(MovementMatchesEmployee)).ToList();
                }

                // 10. Sort groups — newest first
                groups = groups
                    .OrderByDescending(g => g.Latest.CreatedAt)
                    .ThenByDescending(g => g.Latest.DateAssigned)
                    .ToList();

                // 11. Pagination — by group (one row per return number)
                int totalCount = groups.Count;
                int skip = (model.PageNumber - 1) * model.PageSize;
                var pagedGroups = groups.Skip(skip).Take(model.PageSize).ToList();

                // Resolve previous holder (FROM employee) for the representative movement of each paged group.
                var ptaIdsInPage = pagedGroups
                    .Where(g => g.Latest.PTAId.HasValue)
                    .Select(g => g.Latest.PTAId!.Value)
                    .Distinct()
                    .ToList();

                var allMovementsForPtas = await _getTools.PTA.GetTblPTAMovements(context)
                    .Where(x => x.PTAId.HasValue && ptaIdsInPage.Contains(x.PTAId.Value) && !x.IsDeleted)
                    .ToListAsync();

                var movementsByPta = allMovementsForPtas
                    .OrderBy(x => x.DateAssigned)
                    .ThenBy(x => x.CreatedAt)
                    .GroupBy(x => x.PTAId!.Value)
                    .ToDictionary(g => g.Key, g => g.ToList());

                var previousMovementByMovementId = new Dictionary<long, PortalDB.Entities.ASSET.PTA.TblPTAMovement>();
                foreach (var grp in pagedGroups)
                {
                    var movement = grp.Latest;
                    var ptaId = movement.PTAId;
                    if (!ptaId.HasValue) continue;
                    if (!movementsByPta.TryGetValue(ptaId.Value, out var history)) continue;

                    var currentIndex = history.FindIndex(m => m.Id == movement.Id);
                    if (currentIndex > 0)
                        previousMovementByMovementId[movement.Id] = history[currentIndex - 1];
                }

                // Ensure previous holder IDs also have display names in the map.
                var previousHolderIds = previousMovementByMovementId.Values
                    .SelectMany(pm => new[] { pm.PlantillaEmployeeId, pm.NonPlantillaEmployeeId })
                    .Where(id => id.HasValue)
                    .Select(id => id!.Value)
                    .Distinct()
                    .ToList();

                foreach (var prevEmpId in previousHolderIds)
                {
                    if (employeeNameMap.ContainsKey(prevEmpId)) continue;
                    var emp = await _getTools.Account.GetTblEmployeeAsync(prevEmpId, context);
                    if (emp != null)
                        employeeNameMap[prevEmpId] = $"{emp.FirstName} {emp.MiddleName} {emp.LastName}".Trim();
                }

                // 12. Build lightweight result — only the fields the list view displays
                var result = new List<object>();

                foreach (var grp in pagedGroups)
                {
                    var movement = grp.Latest;
                    long? plantillaId = movement.PlantillaEmployeeId;
                    long? nonPlantillaId = movement.NonPlantillaEmployeeId;
                    long? previousPlantillaId = null;
                    long? previousNonPlantillaId = null;
                    string? previousPlantillaName = null;
                    string? previousNonPlantillaName = null;
                    string? previousPlantillaIdOriginal = null;
                    string? previousNonPlantillaIdOriginal = null;

                    if (previousMovementByMovementId.TryGetValue(movement.Id, out var previousMovement))
                    {
                        previousPlantillaId = previousMovement.PlantillaEmployeeId;
                        previousNonPlantillaId = previousMovement.NonPlantillaEmployeeId;
                        previousPlantillaIdOriginal = previousMovement.PlantillaEmployeeIdOriginal;
                        previousNonPlantillaIdOriginal = previousMovement.NonPlantillaEmployeeIdOriginal;

                        if (previousPlantillaId.HasValue)
                            employeeNameMap.TryGetValue(previousPlantillaId.Value, out previousPlantillaName);
                        if (previousNonPlantillaId.HasValue)
                            employeeNameMap.TryGetValue(previousNonPlantillaId.Value, out previousNonPlantillaName);
                    }

                    employeeNameMap.TryGetValue(plantillaId ?? 0, out var plantillaName);
                    employeeNameMap.TryGetValue(nonPlantillaId ?? 0, out var nonPlantillaName);

                    result.Add(new
                    {
                        id = movement.Id,
                        movementIds = grp.Movements.Select(m => m.Id).Distinct().ToList(),
                        ptaId = movement.PTAId,
                        rrppeRrspNumber = movement.RRPPERRSPNumber,
                        parIcsNumber = movement.PARICSNumber,
                        dateAssigned = movement.DateAssigned,
                        status = movement.Status,
                        isActive = movement.IsActive,
                        createdAt = movement.CreatedAt,
                        itemCount = grp.Movements.Select(m => m.PTAId).Where(id => id.HasValue).Distinct().Count(),
                        plantillaEmployeeId = plantillaId,
                        plantillaEmployeeName = plantillaName,
                        plantillaEmployeeIdOriginal = movement.PlantillaEmployeeIdOriginal,
                        nonPlantillaEmployeeId = nonPlantillaId,
                        nonPlantillaEmployeeName = nonPlantillaName,
                        nonPlantillaEmployeeIdOriginal = movement.NonPlantillaEmployeeIdOriginal,
                        previousPlantillaEmployeeId = previousPlantillaId,
                        previousPlantillaEmployeeName = previousPlantillaName,
                        previousPlantillaEmployeeIdOriginal = previousPlantillaIdOriginal,
                        previousNonPlantillaEmployeeId = previousNonPlantillaId,
                        previousNonPlantillaEmployeeName = previousNonPlantillaName,
                        previousNonPlantillaEmployeeIdOriginal = previousNonPlantillaIdOriginal
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
