using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Models.ParserModels.PTA;
using PortalDB.Models.ParserModels.PTA;
using PortalDB.Models.QueryParams.Office;
using PortalDB.Models.QueryParams.Pagination;
using PortalDB.Models.QueryParams.PTA;
using PortalDB.Models.QueryParams.PTA;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.ResponseModels.Account;
using PortalDB.Models.ResponseModels.Office;
using PortalDB.Models.ResponseModels.PPE;
using PortalDB.Models.ResponseModels.PTA;
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

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InventoryController : ControllerBase
    {
		private readonly DbContextOptions<PortalDbContext> _options;
		private readonly IPortalGetTools _getTools;
		private readonly IPortalEditTools _editTools;
		private readonly ParserTools _parserTools;

        public InventoryController(DbContextOptions<PortalDbContext> options,
            IPortalGetTools getTools,
            IPortalEditTools editTools,
			ParserTools parserTools)

		{
            _options = options;
            _getTools = getTools;
            _editTools = editTools;
			_parserTools = parserTools;
		}

        #region GET

        // GET api/inventory/pta/category/all
        [HttpGet("pta/category/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllPTACategories([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblPTACategory?> ppeCategories = await _getTools.PTA.GetTblPTACategories(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    ppeCategories = ppeCategories.Where(x =>
                        (x.Name ?? "").ToLowerInvariant().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    ppeCategories = ppeCategories.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    ppeCategories = ppeCategories.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = ppeCategories.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var ppeCategoryList = ppeCategories
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var ppeCategoriesResponses = ppeCategoryList;

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed PTA Categories", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<TblPTACategory>.OkPaginated(
                    ppeCategoriesResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "PTA Categories have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("pta/conditions/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllPTAConditions([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                var ppeConditions = _getTools.PTA
                    .GetTblPTAMovements(context)
                    .Where(x => x.RemarksEncrypted != null && x.RemarksEncrypted != "")
                    .AsEnumerable()
                    .Select(x => CultureInfo.CurrentCulture.TextInfo.ToTitleCase(x.Remarks!))
                    .Where(r => !string.IsNullOrWhiteSpace(r))
                    .Select(r => r.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(r => r).ToList();

                var ppeConditionsResponses = ppeConditions;

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                //await AuditTrailTool.LogActivityAsync(_options, "Viewed PTA Conditions", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<object>.Ok(
                    ppeConditionsResponses,
                    "PTA Conditions have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/inventory/pta/legend/all
        [HttpGet("pta/legend/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllPTALegends([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblPTALegend?> ppeLegends = await _getTools.PTA.GetTblPTALegends(context).ToListAsync();


                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    ppeLegends = ppeLegends.Where(x =>
                        (x.Name ?? "").ToLowerInvariant().ToLower().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    ppeLegends = ppeLegends.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    ppeLegends = ppeLegends.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = ppeLegends.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var ppeLegendList = ppeLegends
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var ppeLegendResponses = ppeLegendList;

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed PTA Legends", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<TblPTALegend>.OkPaginated(
                    ppeLegendResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "PTA Legends have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/inventory/pta/se-ppe/all
        [HttpGet("pta/se-ppe/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllPTAs([FromQuery] PTAPaginationQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                #region General PTA By SE/PPE

                if (model.GroupBy == null || string.IsNullOrEmpty(model.GroupBy)) { 
                    IEnumerable<TblPTA?> ptas = await _getTools.PTA.GetTblPTAsByGroup(model.GroupName!, context).Where(x => x.Group == model.GroupName).ToListAsync();

                    if (model.FiscalYear.HasValue)
                    {
                        ptas = ptas.Where(x => x.FiscalYear == model.FiscalYear.Value);
                    }

                    if (model.CategoryId != null && model.CategoryId != 0)
                        ptas = ptas.Where(x => x.CategoryId == model.CategoryId);

                    if (!string.IsNullOrWhiteSpace(model.SearchString))
                    {
                        string searchLower = (model.SearchString ?? "").ToLowerInvariant();

                        ptas = ptas.Where(x =>
                            (x.PropertyNumber ?? "").ToLowerInvariant().Contains(searchLower) ||
                            (x.Description ?? "").ToLowerInvariant().Contains(searchLower) ||
                            (x.Brand ?? "").ToLowerInvariant().Contains(searchLower) ||
                            (x.Model ?? "").ToLowerInvariant().Contains(searchLower) ||
                            (x.SerialNumber ?? "").ToLowerInvariant().Contains(searchLower) ||
                            (x.UnitOfMeasurement ?? "").ToLowerInvariant().Contains(searchLower) ||
                            x.UnitValue.ToString().Contains(searchLower) ||
                            (x.DateAcquired?.ToString("yyyy-MM-dd") ?? "").Contains(searchLower) ||
                            (model.GroupName == TblPTA.PPE &&
                             (x.EstimatedUsefulLife?.ToString() ?? "").Contains(searchLower)) ||
                             x.FiscalYear.ToString().Contains(searchLower)
                        );
                    }

                    if (model.StartDate.HasValue)
                        ptas = ptas.Where(x => x.CreatedAt >= model.StartDate.Value);

                    if (model.EndDate.HasValue)
                        ptas = ptas.Where(x => x.CreatedAt <= model.EndDate.Value);

                    int totalCount = ptas.Count();

                    int skip = (model.PageNumber - 1) * model.PageSize;

                    var ptasList = ptas
                        .OrderByDescending(x => x.CreatedAt)
                        .Skip(skip)
                        .Take(model.PageSize)
                        .ToList();

                    var ptasResponses = new List<PTAResponseModel>();

                    foreach (var x in ptasList)
                    {
                        if(model.EmployeeId != null && model.EmployeeId != 0)
                        {
                            var movements = _getTools.PTA
                                .GetTblPTAMovementsByPTAId(x.Id, context)
                                .Where(m => m.NonPlantillaEmployeeId != null && m.NonPlantillaEmployeeId != 0
                                    ? m.NonPlantillaEmployeeId == model.EmployeeId.Value
                                    : m.PlantillaEmployeeId == model.EmployeeId.Value);

                            if(!movements.Any())
                                continue;

                            var ppeModel = new PTAResponseModel
                            {
                                Id = x.Id,
                                Group = x.Group,
                                PropertyNumber = x.PropertyNumber,
                                Category = await _getTools.PTA.GetTblPTACategoryAsync(x.CategoryId, context),
                                Legend = await _getTools.PTA.GetTblPTALegendAsync(x.LegendId, context),
                                Description = x.Description,
                                Brand = x.Brand,
                                Model = x.Model,
                                SerialNumber = x.SerialNumber,
                                UnitOfMeasurement = x.UnitOfMeasurement,
                                UnitValue = x.UnitValue,
                                DateAcquired = x.DateAcquired,
                                EstimatedUsefulLife = x.EstimatedUsefulLife,
                                FiscalYear = x.FiscalYear,
                                Parts = await _getTools.PTA.GetTblPTAPartsByPTAId(x.Id, context).ToListAsync(),
                                Movements = await movements.ToListAsync(),
                                IsActive = x.IsActive,
                                CreatedAt = x.CreatedAt
                            };

                            ptasResponses.Add(ppeModel);
                        }
                        else
                        {
                            var ppeModel = new PTAResponseModel
                            {
                                Id = x.Id,
                                Group = x.Group,
                                PropertyNumber = x.PropertyNumber,
                                Category = await _getTools.PTA.GetTblPTACategoryAsync(x.CategoryId, context),
                                Legend = await _getTools.PTA.GetTblPTALegendAsync(x.LegendId, context),
                                Description = x.Description,
                                Brand = x.Brand,
                                Model = x.Model,
                                SerialNumber = x.SerialNumber,
                                UnitOfMeasurement = x.UnitOfMeasurement,
                                UnitValue = x.UnitValue,
                                DateAcquired = x.DateAcquired,
                                EstimatedUsefulLife = x.EstimatedUsefulLife,
                                FiscalYear = x.FiscalYear,
                                Parts = await _getTools.PTA.GetTblPTAPartsByPTAId(x.Id, context).ToListAsync(),
                                Movements = await _getTools.PTA.GetTblPTAMovementsByPTAId(x.Id, context).ToListAsync(),
                                IsActive = x.IsActive,
                                CreatedAt = x.CreatedAt
                            };

                            ptasResponses.Add(ppeModel);
                        }

                    }

                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    await AuditTrailTool.LogActivityAsync(_options, $"Viewed {model.GroupName}", actionBy: model.ActionBySystemUserId);

                    return Ok(ApiResponse<PTAResponseModel>.OkPaginated(
                        ptasResponses,
                        model.PageNumber,
                        model.PageSize,
                        totalCount,
                        "PTAs have been retrieved"
                    ));
                }
                #endregion

                #region Group by Employee
                else if (model.GroupBy == "Employee")
                {
                    IQueryable<VwPTA?> ptasQuery = _getTools.PTA.GetVwPTAsByGroup(model.GroupName!, context)
                        .Where(x => x.Group == model.GroupName);

                    if (model.CategoryId != null && model.CategoryId != 0)
                        ptasQuery = ptasQuery.Where(x => x.CategoryId == model.CategoryId);

                    if (!string.IsNullOrWhiteSpace(model.SearchString))
                    {
                        string searchLower = model.SearchString.ToLowerInvariant();
                        ptasQuery = ptasQuery.Where(x =>
                                (x.PropertyNumber != null && x.PropertyNumber.ToLowerInvariant().Contains(searchLower)) ||
                                (x.Description != null && x.Description.ToLowerInvariant().Contains(searchLower)) ||
                                (x.Brand != null && x.Brand.ToLowerInvariant().Contains(searchLower)) ||
                                (x.Model != null && x.Model.ToLowerInvariant().Contains(searchLower)) ||
                                (x.SerialNumber != null && x.SerialNumber.ToLowerInvariant().Contains(searchLower)) ||
                                (x.UnitOfMeasurement != null && x.UnitOfMeasurement.ToLowerInvariant().Contains(searchLower)) ||
                                x.UnitValue.ToString().Contains(searchLower) || // UnitValue is value type, safe
                                (x.DateAcquired != null && x.DateAcquired.Value.ToString("yyyy-MM-dd").Contains(searchLower)) ||
                                (model.GroupName == TblPTA.PPE &&
                                 x.EstimatedUsefulLife != null &&
                                 x.EstimatedUsefulLife.Value.ToString().Contains(searchLower))
                            );
                    }

                    // Apply date range filters
                    if (model.StartDate.HasValue)
                        ptasQuery = ptasQuery.Where(x => x.CreatedAt >= model.StartDate.Value);

                    if (model.EndDate.HasValue)
                        ptasQuery = ptasQuery.Where(x => x.CreatedAt <= model.EndDate.Value);

                    // Get distinct employees who have at least one PTA
                    var employeeGroups = ptasQuery
                        .Where(x => x.NonPlantillaEmployeeId.HasValue || x.PlantillaEmployeeId.HasValue)
                        .GroupBy(x => x.NonPlantillaEmployeeId.HasValue ? x.NonPlantillaEmployeeId.Value : x.PlantillaEmployeeId.Value)
                        .Select(g => new
                        {
                            EmployeeId = g.Key,
                            PTAIds = g.Select(p => p.Id).ToList()
                        })
                        .AsEnumerable(); // Switch to client-side for complex grouping logic

                    int totalCount = employeeGroups.Count();
                    int skip = (model.PageNumber - 1) * model.PageSize;

                    var pagedEmployeeGroups = employeeGroups
                        .Skip(skip)
                        .Take(model.PageSize)
                        .ToList();

                    var ptasResponses = new List<PTAGroupedByEmployeeResponseModel>();

                    foreach (var group in pagedEmployeeGroups)
                    {
                        long employeeId = group.EmployeeId;

                        // Get one sample record to extract employee details
                        var samplePta = ptasQuery
                            .FirstOrDefault(x =>
                                (x.PlantillaEmployeeId == employeeId) ||
                                (x.NonPlantillaEmployeeId == employeeId));

                        if (samplePta == null) continue;

                        bool isPlantilla = samplePta.PlantillaEmployeeId == employeeId;

                        long? systemUserId = isPlantilla ? samplePta.PlantillaSystemUserId : samplePta.NonPlantillaSystemUserId;
                        string? employeeIdOriginal = isPlantilla ? samplePta.PlantillaEmployeeIdOriginal : samplePta.NonPlantillaEmployeeIdOriginal;
                        string fullName = isPlantilla
                            ? $"{samplePta.PlantillaEmployeeFirstName} {samplePta.PlantillaEmployeeMiddleName} {samplePta.PlantillaEmployeeLastName} {samplePta.PlantillaEmployeeSuffixName}".Trim()
                            : $"{samplePta.NonPlantillaEmployeeFirstName} {samplePta.NonPlantillaEmployeeMiddleName} {samplePta.NonPlantillaEmployeeLastName} {samplePta.NonPlantillaEmployeeSuffixName}".Trim();

                        long? positionId = isPlantilla ? samplePta.PlantillaPositionId : samplePta.NonPlantillaPositionId;
                        long? employmentTypeId = isPlantilla ? samplePta.PlantillaEmploymentTypeId : samplePta.NonPlantillaEmploymentTypeId;
                        long? officeId = samplePta.ActualOfficeId
                            ?? (isPlantilla ? samplePta.PlantillaOfficeId : samplePta.NonPlantillaOfficeId);
                        long? divisionId = samplePta.ActualDivisionId
                            ?? (isPlantilla ? samplePta.PlantillaDivisionId : samplePta.NonPlantillaDivisionId);

                        var position = positionId.HasValue
                            ? await _getTools.Office.GetTblPositionAsync(positionId.Value, context)
                            : null;
                        var employmentType = employmentTypeId.HasValue
                            ? await _getTools.Office.GetTblEmploymentTypeAsync(employmentTypeId.Value, context)
                            : null;
                        var office = officeId.HasValue
                            ? await _getTools.Office.GetTblOfficeAsync(officeId.Value, context)
                            : null;
                        var division = divisionId.HasValue
                            ? await _getTools.Office.GetTblDivisionAsync(divisionId.Value, context)
                            : null;

                        // Get all PTAs for this employee (filtered already by search/date)
                        var employeePtaList = ptasQuery
                            .Where(x => (isPlantilla ? x.PlantillaEmployeeId : x.NonPlantillaEmployeeId) == employeeId)
                            .ToList();

                        var ptaResponseModels = new List<PTAResponseModel>();

                        foreach (var x in employeePtaList)
                        {
                            var ptaModel = new PTAResponseModel
                            {
                                Id = x.Id,
                                Group = x.Group,
                                PropertyNumber = x.PropertyNumber,
                                Category = await _getTools.PTA.GetTblPTACategoryAsync(x.CategoryId, context),
                                Legend = await _getTools.PTA.GetTblPTALegendAsync(x.LegendId, context),
                                Description = x.Description,
                                Brand = x.Brand,
                                Model = x.Model,
                                SerialNumber = x.SerialNumber,
                                UnitOfMeasurement = x.UnitOfMeasurement,
                                UnitValue = x.UnitValue,
                                DateAcquired = x.DateAcquired,
                                EstimatedUsefulLife = x.EstimatedUsefulLife,
                                Parts = await _getTools.PTA.GetTblPTAPartsByPTAId(x.Id, context).ToListAsync(),
                                Movements = await _getTools.PTA.GetTblPTAMovementsByPTAId(x.Id, context).ToListAsync(),
                                IsActive = x.IsActive,
                                CreatedAt = x.CreatedAt
                            };
                            ptaResponseModels.Add(ptaModel);
                        }

                        ptasResponses.Add(new PTAGroupedByEmployeeResponseModel
                        {
                            EmployeeId = employeeId,
                            SystemUserId = systemUserId,
                            EmployeeIdOriginal = employeeIdOriginal,
                            FullName = fullName,
                            Position = position,
                            EmploymentType = employmentType,
                            Office = office,
                            Division = division,
                            PTA = ptaResponseModels
                        });
                    }

                    await AuditTrailTool.LogActivityAsync(_options, $"Viewed {model.GroupName} grouped by Employee with filters", actionBy: model.ActionBySystemUserId);

                    return Ok(ApiResponse<PTAGroupedByEmployeeResponseModel>.OkPaginated(
                        ptasResponses,
                        model.PageNumber,
                        model.PageSize,
                        totalCount,
                        "PTAs grouped by employee retrieved successfully"
                    ));
                }
                #endregion

                #region Group by Condition
                else if (model.GroupBy == "Condition")
                {
                    IQueryable<VwPTA?> ptasQuery = _getTools.PTA.GetVwPTAsByGroup(model.GroupName!, context)
                        .Where(x => x.Group == model.GroupName);

                    if (model.CategoryId != null && model.CategoryId != 0)
                        ptasQuery = ptasQuery.Where(x => x.CategoryId == model.CategoryId);

                    if (!string.IsNullOrWhiteSpace(model.SearchString))
                    {
                        string searchLower = model.SearchString.ToLowerInvariant();
                        ptasQuery = ptasQuery.Where(x =>
                                (x.PropertyNumber != null && x.PropertyNumber.ToLowerInvariant().Contains(searchLower)) ||
                                (x.Description != null && x.Description.ToLowerInvariant().Contains(searchLower)) ||
                                (x.Brand != null && x.Brand.ToLowerInvariant().Contains(searchLower)) ||
                                (x.Model != null && x.Model.ToLowerInvariant().Contains(searchLower)) ||
                                (x.SerialNumber != null && x.SerialNumber.ToLowerInvariant().Contains(searchLower)) ||
                                (x.UnitOfMeasurement != null && x.UnitOfMeasurement.ToLowerInvariant().Contains(searchLower)) ||
                                x.UnitValue.ToString().Contains(searchLower) || // UnitValue is value type, safe
                                (x.DateAcquired != null && x.DateAcquired.Value.ToString("yyyy-MM-dd").Contains(searchLower)) ||
                                (model.GroupName == TblPTA.PPE &&
                                 x.EstimatedUsefulLife != null &&
                                 x.EstimatedUsefulLife.Value.ToString().Contains(searchLower))
                            );
                    }

                    // Apply date range filters
                    if (model.StartDate.HasValue)
                        ptasQuery = ptasQuery.Where(x => x.CreatedAt >= model.StartDate.Value);

                    if (model.EndDate.HasValue)
                        ptasQuery = ptasQuery.Where(x => x.CreatedAt <= model.EndDate.Value);

                    // Get distinct employees who have at least one PTA
                    var conditionGroups = ptasQuery
                        .Where(x => x.RemarksEncrypted != null && x.RemarksEncrypted != "")
                        .ToList()
                        .GroupBy(x => x.Remarks.ToLower())
                        .Select(g => new
                        {
                            Remarks = g.Key
                        })
                        .AsEnumerable(); // Switch to client-side for complex grouping logic

                    int totalCount = conditionGroups.Count();
                    int skip = (model.PageNumber - 1) * model.PageSize;

                    var pagedEmployeeGroups = conditionGroups
                        .Skip(skip)
                        .Take(model.PageSize)
                        .ToList();

                    var ptasResponses = new List<PTAGroupedByConditionResponseModel>();

                    foreach (var group in pagedEmployeeGroups)
                    {
                        string condition = group.Remarks;

                        var conditionPtaList = ptasQuery.Where(x => x.RemarksEncrypted != null && x.RemarksEncrypted != "")
                         .ToList().Where(x => x.Remarks.ToLower() == condition.ToLower());

                        var ptaResponseModels = new List<PTAResponseModel>();

                        foreach (var x in conditionPtaList)
                        {
                            var ptaModel = new PTAResponseModel
                            {
                                Id = x.Id,
                                Group = x.Group,
                                PropertyNumber = x.PropertyNumber,
                                Category = await _getTools.PTA.GetTblPTACategoryAsync(x.CategoryId, context),
                                Legend = await _getTools.PTA.GetTblPTALegendAsync(x.LegendId, context),
                                Description = x.Description,
                                Brand = x.Brand,
                                Model = x.Model,
                                SerialNumber = x.SerialNumber,
                                UnitOfMeasurement = x.UnitOfMeasurement,
                                UnitValue = x.UnitValue,
                                DateAcquired = x.DateAcquired,
                                EstimatedUsefulLife = x.EstimatedUsefulLife,
                                Parts = await _getTools.PTA.GetTblPTAPartsByPTAId(x.Id, context).ToListAsync(),
                                Movements = await _getTools.PTA.GetTblPTAMovementsByPTAId(x.Id, context).ToListAsync(),
                                IsActive = x.IsActive,
                                CreatedAt = x.CreatedAt
                            };
                            ptaResponseModels.Add(ptaModel);
                        }

                        ptasResponses.Add(new PTAGroupedByConditionResponseModel
                        {
                            Condition = condition,
                            PTA = ptaResponseModels
                        });
                    }

                    await AuditTrailTool.LogActivityAsync(_options, $"Viewed {model.GroupName} grouped by Condition with filters", actionBy: model.ActionBySystemUserId);

                    return Ok(ApiResponse<PTAGroupedByConditionResponseModel>.OkPaginated(
                        ptasResponses,
                        model.PageNumber,
                        model.PageSize,
                        totalCount,
                        "PTAs grouped by condition retrieved successfully"
                    ));
                }
                #endregion

                #region Group by Division
                else if (model.GroupBy == "Division")
                {
                    IQueryable<VwPTA?> ptasQuery = _getTools.PTA.GetVwPTAsByGroup(model.GroupName!, context)
                        .Where(x => x.Group == model.GroupName);

                    if (model.CategoryId != null && model.CategoryId != 0)
                        ptasQuery = ptasQuery.Where(x => x.CategoryId == model.CategoryId);

                    if (!string.IsNullOrWhiteSpace(model.SearchString))
                    {
                        string searchLower = model.SearchString.ToLowerInvariant();
                        ptasQuery = ptasQuery.Where(x =>
                                (x.PropertyNumber != null && x.PropertyNumber.ToLowerInvariant().Contains(searchLower)) ||
                                (x.Description != null && x.Description.ToLowerInvariant().Contains(searchLower)) ||
                                (x.Brand != null && x.Brand.ToLowerInvariant().Contains(searchLower)) ||
                                (x.Model != null && x.Model.ToLowerInvariant().Contains(searchLower)) ||
                                (x.SerialNumber != null && x.SerialNumber.ToLowerInvariant().Contains(searchLower)) ||
                                (x.UnitOfMeasurement != null && x.UnitOfMeasurement.ToLowerInvariant().Contains(searchLower)) ||
                                x.UnitValue.ToString().Contains(searchLower) || // UnitValue is value type, safe
                                (x.DateAcquired != null && x.DateAcquired.Value.ToString("yyyy-MM-dd").Contains(searchLower)) ||
                                (model.GroupName == TblPTA.PPE &&
                                 x.EstimatedUsefulLife != null &&
                                 x.EstimatedUsefulLife.Value.ToString().Contains(searchLower))
                            );
                    }

                    // Apply date range filters
                    if (model.StartDate.HasValue)
                        ptasQuery = ptasQuery.Where(x => x.CreatedAt >= model.StartDate.Value);

                    if (model.EndDate.HasValue)
                        ptasQuery = ptasQuery.Where(x => x.CreatedAt <= model.EndDate.Value);

                    // Get distinct employees who have at least one PTA
                    var divisionGroups = ptasQuery
                        .Where(x => x.ActualDivisionId != null)
                        .GroupBy(x => x.ActualDivisionId)
                        .Select(g => new
                        {
                            DivisionId = g.Key
                        })
                        .AsEnumerable(); // Switch to client-side for complex grouping logic

                    int totalCount = divisionGroups.Count();
                    int skip = (model.PageNumber - 1) * model.PageSize;

                    var pagedEmployeeGroups = divisionGroups
                        .Skip(skip)
                        .Take(model.PageSize)
                        .ToList();

                    var ptasResponses = new List<PTAGroupedByDivisionResponseModel>();

                    foreach (var group in pagedEmployeeGroups)
                    {
                        long? divisionId = group.DivisionId;

                        var divisionPtaList = ptasQuery.Where(x => x.ActualDivisionId == divisionId).ToList();

                        var ptaResponseModels = new List<PTAResponseModel>();

                        foreach (var x in divisionPtaList)
                        {
                            var ptaModel = new PTAResponseModel
                            {
                                Id = x.Id,
                                Group = x.Group,
                                PropertyNumber = x.PropertyNumber,
                                Category = await _getTools.PTA.GetTblPTACategoryAsync(x.CategoryId, context),
                                Legend = await _getTools.PTA.GetTblPTALegendAsync(x.LegendId, context),
                                Description = x.Description,
                                Brand = x.Brand,
                                Model = x.Model,
                                SerialNumber = x.SerialNumber,
                                UnitOfMeasurement = x.UnitOfMeasurement,
                                UnitValue = x.UnitValue,
                                DateAcquired = x.DateAcquired,
                                EstimatedUsefulLife = x.EstimatedUsefulLife,
                                Parts = await _getTools.PTA.GetTblPTAPartsByPTAId(x.Id, context).ToListAsync(),
                                Movements = await _getTools.PTA.GetTblPTAMovementsByPTAId(x.Id, context).ToListAsync(),
                                IsActive = x.IsActive,
                                CreatedAt = x.CreatedAt
                            };
                            ptaResponseModels.Add(ptaModel);
                        }

                        TblDivision? division = await _getTools.Office.GetTblDivisionAsync(divisionId, context);
                        TblOffice? office = await _getTools.Office.GetTblOfficeAsync(division.OfficeId, context);

                        ptasResponses.Add(new PTAGroupedByDivisionResponseModel
                        {
                            DivisionId = division.Id,
                            Name = division.Name,
                            Acronym = division.Acronym,
                            Office = office,
                            PTA = ptaResponseModels
                        });
                    }

                    await AuditTrailTool.LogActivityAsync(_options, $"Viewed {model.GroupName} grouped by Division with filters", actionBy: model.ActionBySystemUserId);

                    return Ok(ApiResponse<PTAGroupedByDivisionResponseModel>.OkPaginated(
                        ptasResponses,
                        model.PageNumber,
                        model.PageSize,
                        totalCount,
                        "PTAs grouped by division retrieved successfully"
                    ));
                }
                #endregion




                else
                {
                    return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.INVALID_INPUT, "Invalid Group By Input"));
                }

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/inventory/pta/se-ppe/all
        [HttpGet("pta/se-ppe/all/{ptaId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
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
                    FiscalYear = pta.FiscalYear,
                    Parts = await _getTools.PTA.GetTblPTAPartsByPTAId(pta.Id, context).ToListAsync(),
                    Movements = await _getTools.PTA.GetTblPTAMovementsByPTAId(pta.Id, context).ToListAsync(),
                    IsActive = pta.IsActive,
                    CreatedAt = pta.CreatedAt
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
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion

        #region POST
        [HttpPost("pta/batch-upload")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> PTABatchUpload([FromQuery] SoloQueryParams model, [Required] IFormFile file)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            if (file == null || file.Length == 0)
                return StatusCode(ApiStatusCode.NotFound, ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "No file uploaded."));

            var fileName = file.FileName.ToLowerInvariant();
            if (!fileName.EndsWith(".csv") && !fileName.EndsWith(".xlsx"))
                return StatusCode(ApiStatusCode.Unauthorized, ApiResponse<object>.Fail(ErrorCodes.FORBIDDEN, "Only CSV and Excel (.xlsx) files are allowed."));

            try
            {
                List<PTAItem> items = _parserTools.ParsePtaFile(file);
                if (!items.Any())
                    return Ok(new List<PTAItem>());

                foreach(PTAItem item in items)
                {
                    long ppeId = 0;
                    long categoryId = 0;
                    long legendId = 0;

                    if (!string.IsNullOrWhiteSpace(item.Category))
                    {
                        var category = await _getTools.PTA.GetTblPTACategoryByNameAsync(item.Category.Trim(), context);

                        if (category != null)
                        {
                            categoryId = category.Id;
                        }
                        else
                        {
                            TblPTACategory newCategory = new()
                            {
                                Name = item.Category,
                                IsActive = true
                            };
                            categoryId = await _editTools.PTA.EditTblPTACategoryAsync(newCategory, model.ActionBySystemUserId, context, true);
                        }
                    }
                    if (!string.IsNullOrWhiteSpace(item.Legend))
                    {
                        var legend = await _getTools.PTA.GetTblPTALegendByNameAsync(item.Legend.Trim(), context);

                        if (legend != null)
                        {
                            legendId = legend.Id;
                        }
                        else
                        {
                            TblPTALegend newLegend = new()
                            {
                                Name = item.Legend,
                                IsActive = true
                            };
                            legendId = await _editTools.PTA.EditTblPTALegendAsync(newLegend, model.ActionBySystemUserId, context, true);
                        }
                    }

                    TblPTA newPTA = new()
                    {
                        Group = item.UnitValue <= 49999.99 ? TblPTA.SE : TblPTA.PPE,
                        PropertyNumber = item.PropertyNumber,
                        CategoryId = categoryId,
                        LegendId = legendId,
                        Description = item.Description,
                        Brand = item.Brand,
                        Model = item.Model,
                        SerialNumber = item.SerialNumber,
                        UnitOfMeasurement = item.UnitOfMeasurement,
                        UnitValue = item.UnitValue,
                        DateAcquired = item.DateAssigned,
                        EstimatedUsefulLife = item.EstimatedUsefulLife,
                        FiscalYear = item.FiscalYear
                    };

                    ppeId = await _editTools.PTA.EditTblPTAAsync(newPTA, model.ActionBySystemUserId, context, true);

                    foreach (PTAPart part in item?.Parts ?? Enumerable.Empty<PTAPart>())
                    {
                        TblPTAPart newPart = new()
                        {
                            PTAId = ppeId,
                            Name = part.PartName,
                            SerialNumber = part.PartSerialNumber
                        };

                        await _editTools.PTA.EditTblPTAPartAsync(newPart, model.ActionBySystemUserId, context, true);
                    }

                    foreach (PTAAnnualCount movement in item?.AnnualCount ?? Enumerable.Empty<PTAAnnualCount>())
                    {

                        long? officeId = null;
                        long? divisionId = null;
                        long? plantillaEmployeeId = null;
                        long? nonPlantillaEmployeeId = null;

                        if (!string.IsNullOrWhiteSpace(movement.ActualOfficeAndDivision))
                        {
                            var parts = movement.ActualOfficeAndDivision.Split(new[] { '/' }, 2, StringSplitOptions.RemoveEmptyEntries)
                                                                        .Select(p => p.Trim())
                                                                        .Where(p => !string.IsNullOrEmpty(p))
                                                                        .ToArray();

                            if (parts.Length >= 1)
                            {
                                var office = await _getTools.Office.GetTblOfficeByAcronymAsync(parts[0], context);
                                officeId = office?.Id;
                            }

                            if (parts.Length >= 2)
                            {
                                var division = await _getTools.Office.GetVwDivisionByAcronymAsync(parts[1], context);
                                divisionId = division?.Id;
                            }
                        }

                        if (!string.IsNullOrEmpty(movement.PlantillaEmployeeId))
                        {
                            TblEmployee? plantillaEmployee = await _getTools.Account.GetEmployeeByEmployeeIdAsync(movement.PlantillaEmployeeId, context);
                            plantillaEmployeeId = plantillaEmployee?.Id;

                            //If actual office/division and non plantilla are nulled, get from the plantilla details
                            if(plantillaEmployee != null && string.IsNullOrEmpty(movement.NonPlantillaEmployeeId) && string.IsNullOrWhiteSpace(movement.ActualOfficeAndDivision))
                            {
                                if(plantillaEmployee.SystemUserId != null)
                                {
                                    TblSystemUser? systemUserInfo = await _getTools.Account.GetTblSystemUserAsync(plantillaEmployee.SystemUserId.Value, context);
                                    divisionId = systemUserInfo.DivisionId;
                                    officeId = systemUserInfo.OfficeId;
                                }
                            }
                        }

                        if (!string.IsNullOrEmpty(movement.NonPlantillaEmployeeId))
                        {
                            TblEmployee? nonPlantillaEmployee = await _getTools.Account.GetEmployeeByEmployeeIdAsync(movement.NonPlantillaEmployeeId, context);
                            nonPlantillaEmployeeId = nonPlantillaEmployee?.Id;

                            //If actual office/division are nulled, get from the non plantilla details
                            if (nonPlantillaEmployee != null && string.IsNullOrWhiteSpace(movement.ActualOfficeAndDivision))
                            {
                                if (nonPlantillaEmployee.SystemUserId != null)
                                {
                                    TblSystemUser? systemUserInfo = await _getTools.Account.GetTblSystemUserAsync(nonPlantillaEmployee.SystemUserId.Value, context);
                                    divisionId = systemUserInfo.DivisionId;
                                    officeId = systemUserInfo.OfficeId;
                                }
                                
                            }
                        }

                        TblPTAMovement newMovement = new()
                        {
                            PTAId = ppeId,
                            DateAssigned = movement.DateAssigned,
                            PARITRNumber = movement.ParItrNumber,
                            PlantillaEmployeeId = plantillaEmployeeId,
                            NonPlantillaEmployeeId = nonPlantillaEmployeeId,
                            PlantillaEmployeeIdOriginal = movement.PlantillaEmployeeId,
                            NonPlantillaEmployeeIdOriginal = movement.NonPlantillaEmployeeId,
                            ActualOfficeId = officeId,
                            ActualDivisionId = divisionId,
                            Remarks = movement.Condition
                        };

                        await _editTools.PTA.EditTblPTAMovementAsync(newMovement, model.ActionBySystemUserId, context, true);
                    }

                }

                await AuditTrailTool.LogActivityAsync(_options, $"Performed batch upload PTA (PPE/SE) with a total of {items.Count()} PTA items", actionBy: model.ActionBySystemUserId);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse<object>.Ok($"{items.Count()} PTA items has been successfully migrated to the database"));
            }
            catch (Exception ex)
            {

                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request. Please check the template format."));

            }
        }

        // POST api/inventory/pta/se-ppe/edit
        [HttpPost("pta/se-ppe/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditPTA([FromBody] EditPTAQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblPTA pta = new()
                {
                    Id = model.Id,
                    Group = model.Group,
                    PropertyNumber = model.PropertyNumber,
                    CategoryId = model.CategoryId,
                    LegendId = model.LegendId,
                    Description = model.Description,
                    Brand = model.Brand,
                    Model = model.Model,
                    SerialNumber = model.SerialNumber,
                    UnitOfMeasurement = model.UnitOfMeasurement,
                    UnitValue = model.UnitValue,
                    DateAcquired = model.DateAcquired,
                    FiscalYear = model.FiscalYear,
                    IsActive = model.IsActive
                };

                if (model.Group == TblPTA.PPE)
                    pta.EstimatedUsefulLife = model.EstimatedUsefulLife;

                long ptaId = await _editTools.PTA.EditTblPTAAsync(pta, model.ActionBySystemUserId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(new { PTAId = ptaId }, $"{(model.Group == TblPTA.PPE ? TblPTA.PPE : TblPTA.SE)} has been {(model.Id == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // POST api/inventory/pta/part/edit
        [HttpPost("pta/part/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditPTAPart([FromBody] EditPTAPartQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblPTAPart ptaPart = new()
                {
                    Id = model.Id,
                    PTAId = model.PTAId,
                    Name = model.Name,
                    SerialNumber = model.SerialNumber,
                    IsActive = model.IsActive
                };

                long ptaPartId = await _editTools.PTA.EditTblPTAPartAsync(ptaPart, model.ActionBySystemUserId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(new { PTAPartId = ptaPartId }, $"PTA Part has been {(model.Id == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // POST api/inventory/pta/movement/edit
        [HttpPost("pta/movement/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
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
                    PARITRNumber = model.ParItrNumber,
                    PlantillaEmployeeId = model.PlantillaEmployeeId,
                    NonPlantillaEmployeeId = model.NonPlantillaEmployeeId,
                    ActualOfficeId = model.ActualOfficeId,
                    ActualDivisionId = model.ActualDivisionId,
                    Remarks = model.Condition,
                    IsActive = model.IsActive
                };

                long ptaMovementId = await _editTools.PTA.EditTblPTAMovementAsync(ptaMovement, model.ActionBySystemUserId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(new { PTAMovementId = ptaMovementId }, $"PTA Movement has been {(model.Id == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // POST api/inventory/pta/category/edit
        [HttpPost("pta/category/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditPTACategory([FromBody] EditPTACategoryQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblPTACategory ptaCategory = new()
                {
                    Id = model.Id,
                    Name = model.Name,
                    GeneralCode = model.GeneralCode,
                    IsActive = model.IsActive
                };

                long ptaCategoryId = await _editTools.PTA.EditTblPTACategoryAsync(ptaCategory, model.ActionBySystemUserId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(new { PTACategoryId = ptaCategoryId }, $"PTA Category has been {(model.Id == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // POST api/inventory/pta/legend/edit
        [HttpPost("pta/legend/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditPTALegend([FromBody] EditPTACategoryQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblPTALegend ptaLegend = new()
                {
                    Id = model.Id,
                    Name = model.Name,
                    IsActive = model.IsActive
                };

                long ptaLegendId = await _editTools.PTA.EditTblPTALegendAsync(ptaLegend, model.ActionBySystemUserId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(new { PTALegendId = ptaLegendId }, $"PTA Legend has been {(model.Id == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
        #endregion

        #region DELETE
        // DELETE api/inventory/pta/delete
        [HttpDelete("pta/delete/{ptaId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeletePTA([FromQuery] SoloQueryParams model, [FromRoute] long ptaId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                bool isDeleted = await _editTools.PTA.DeleteTblPTAAsync(ptaId, model.ActionBySystemUserId, context);

                if (!isDeleted)
                    return Ok(ApiResponse<object>.Ok($"Unable to delete this PTA, try again later"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok($"PTA has been deleted"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // DELETE api/inventory/pta/part/delete
        [HttpDelete("pta/part/delete/{ptaPartId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeletePTAPart([FromQuery] SoloQueryParams model, [FromRoute] long ptaPartId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                bool isDeleted = await _editTools.PTA.DeleteTblPTAPartAsync(ptaPartId, model.ActionBySystemUserId, context);

                if (!isDeleted)
                    return Ok(ApiResponse<object>.Ok($"Unable to delete this PTA Part, try again later"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok($"PTA Part has been deleted"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // DELETE api/inventory/pta/movement/delete
        [HttpDelete("pta/movement/delete/{ptaPartId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeletePTAMovement([FromQuery] SoloQueryParams model, [FromRoute] long ptaPartId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                bool isDeleted = await _editTools.PTA.DeleteTblPTAMovementAsync(ptaPartId, model.ActionBySystemUserId, context);

                if (!isDeleted)
                    return Ok(ApiResponse<object>.Ok($"Unable to delete this PTA Movement, try again later"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok($"PTA Movement has been deleted"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // DELETE api/inventory/pta/category/delete
        [HttpDelete("pta/category/delete/{ptaCategoryId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeletePTACategory([FromQuery] SoloQueryParams model, [FromRoute] long ptaCategoryId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                bool isDeleted = await _editTools.PTA.DeleteTblPTACategoryAsync(ptaCategoryId, model.ActionBySystemUserId, context);

                if (!isDeleted)
                    return Ok(ApiResponse<object>.Ok($"Unable to delete this PTA Category, try again later"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok($"PTA Category has been deleted"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // DELETE api/inventory/pta/legend/delete
        [HttpDelete("pta/legend/delete/{ptaLegendId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeletePTALegend([FromQuery] SoloQueryParams model, [FromRoute] long ptaLegendId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                bool isDeleted = await _editTools.PTA.DeleteTblPTALegendAsync(ptaLegendId, model.ActionBySystemUserId, context);

                if (!isDeleted)
                    return Ok(ApiResponse<object>.Ok($"Unable to delete this PTA Legend, try again later"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok($"PTA Legend has been deleted"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
        #endregion

    }
}
