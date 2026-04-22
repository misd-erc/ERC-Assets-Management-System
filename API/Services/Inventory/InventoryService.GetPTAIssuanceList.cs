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
public async Task<IActionResult> GetPTAIssuanceList([FromQuery] PTAIssuanceListQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                // 1. Load all current non-deleted movements that have a PAR/ICS number
                var allMovements = await _getTools.PTA.GetTblPTAMovements(context)
                    .Where(x => x.IsCurrent == true && !x.IsDeleted)
                    .ToListAsync();

                allMovements = allMovements
                    .Where(x => !string.IsNullOrEmpty(x.PARICSNumber))
                    .ToList();

                // 2. Date range filter
                if (model.StartDate.HasValue)
                    allMovements = allMovements.Where(x => x.DateAssigned >= model.StartDate.Value).ToList();

                if (model.EndDate.HasValue)
                    allMovements = allMovements.Where(x => x.DateAssigned <= model.EndDate.Value).ToList();

                // 3. PAR/ICS number filter (prefix shortcut or partial search)
                if (!string.IsNullOrWhiteSpace(model.ParIcsFilter))
                {
                    string f = model.ParIcsFilter.Trim();
                    if (f.ToUpper() == "PAR")
                        allMovements = allMovements.Where(x => x.PARICSNumber.ToUpper().StartsWith("PAR")).ToList();
                    else if (f.ToUpper() == "ICS")
                        allMovements = allMovements.Where(x => x.PARICSNumber.ToUpper().StartsWith("ICS")).ToList();
                    else
                        allMovements = allMovements.Where(x => x.PARICSNumber.ToUpper().Contains(f.ToUpper())).ToList();
                }

                // 4. Office / Division filter (DB-level field, no encryption)
                if (model.OfficeId.HasValue && model.OfficeId.Value > 0)
                    allMovements = allMovements.Where(x => x.ActualOfficeId == model.OfficeId.Value).ToList();

                if (model.DivisionId.HasValue && model.DivisionId.Value > 0)
                    allMovements = allMovements.Where(x => x.ActualDivisionId == model.DivisionId.Value).ToList();

                // 5. Collect PTA IDs and fetch PTA records for group filter + enrichment
                var ptaIds = allMovements
                    .Where(x => x.PTAId.HasValue)
                    .Select(x => x.PTAId.Value)
                    .Distinct()
                    .ToList();

                var ptaMap = await context.TblPTAs
                    .AsNoTracking()
                    .Where(p => ptaIds.Contains(p.Id) && !p.IsDeleted)
                    .ToListAsync();

                // 6. Group filter (PPE / SE)
                if (!string.IsNullOrWhiteSpace(model.Group) &&
                    (model.Group.ToUpper() == "PPE" || model.Group.ToUpper() == "SE"))
                {
                    var groupPtaIds = ptaMap
                        .Where(p => p.Group.ToUpper() == model.Group.ToUpper())
                        .Select(p => p.Id)
                        .ToHashSet();

                    allMovements = allMovements
                        .Where(x => x.PTAId.HasValue && groupPtaIds.Contains(x.PTAId.Value))
                        .ToList();
                }

                var ptaLookup = ptaMap.ToDictionary(p => p.Id, p => p);

                // 7. Employee search — resolve names in-memory for movements still in set
                //    Build a name/id-original lookup first to avoid per-row async calls during filter
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
                        // Check plantilla name
                        if (m.PlantillaEmployeeId.HasValue &&
                            employeeNameMap.TryGetValue(m.PlantillaEmployeeId.Value, out var pName) &&
                            pName.ToUpper().Contains(search))
                            return true;

                        // Check non-plantilla name
                        if (m.NonPlantillaEmployeeId.HasValue &&
                            employeeNameMap.TryGetValue(m.NonPlantillaEmployeeId.Value, out var npName) &&
                            npName.ToUpper().Contains(search))
                            return true;

                        // Check plantilla ID original
                        if (!string.IsNullOrEmpty(m.PlantillaEmployeeIdOriginal) &&
                            m.PlantillaEmployeeIdOriginal.ToUpper().Contains(search))
                            return true;

                        // Check non-plantilla ID original
                        if (!string.IsNullOrEmpty(m.NonPlantillaEmployeeIdOriginal) &&
                            m.NonPlantillaEmployeeIdOriginal.ToUpper().Contains(search))
                            return true;

                        return false;
                    }).ToList();
                }

                // 8. Sort
                allMovements = allMovements
                    .OrderByDescending(x => x.DateAssigned)
                    .ThenByDescending(x => x.CreatedAt)
                    .ToList();

                // 9. Pagination
                int totalCount = allMovements.Count;
                int skip = (model.PageNumber - 1) * model.PageSize;
                var pagedMovements = allMovements.Skip(skip).Take(model.PageSize).ToList();

                // 10. Build result for the current page
                var result = new List<object>();

                foreach (var movement in pagedMovements)
                {
                    long? plantillaId = movement.PlantillaEmployeeId;
                    long? nonPlantillaId = movement.NonPlantillaEmployeeId;

                    employeeNameMap.TryGetValue(plantillaId ?? 0, out var plantillaName);
                    employeeNameMap.TryGetValue(nonPlantillaId ?? 0, out var nonPlantillaName);

                    // Resolve office and division
                    object office = null;
                    object division = null;
                    if (movement.ActualOfficeId.HasValue)
                        office = await _getTools.Office.GetTblOfficeAsync(movement.ActualOfficeId.Value, context);
                    if (movement.ActualDivisionId.HasValue)
                        division = await _getTools.Office.GetTblDivisionAsync(movement.ActualDivisionId.Value, context);

                    // Resolve PTA item details
                    object itemDetails = null;
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
                await AuditTrailTool.LogActivityAsync(_options, "Viewed PPE/SE Issuance List", actionBy: model.ActionBySystemUserId);

                return Ok(ApiResponse<object>.OkPaginated(
                    result,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "PPE/SE Issuance list retrieved successfully"
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
