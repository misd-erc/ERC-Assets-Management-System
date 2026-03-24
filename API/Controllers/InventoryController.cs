using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
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

        [HttpGet("pta/legend/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllPTALegends([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblPTALegend?> ppeLegends = await _getTools.PTA.GetTblPTALegends(context)
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync();


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

                    // AS OF Filter: Include all assets acquired on or before the specified "as of" date
                    if (model.AsOfDate.HasValue)
                    {
                        ptas = ptas.Where(x => x.DateAcquired <= model.AsOfDate.Value);
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
                             (x.FiscalDate?.ToString("yyyy-MM-dd") ?? "") .Contains(searchLower)
                        );
                    }

                    if (model.StartDate.HasValue)
                        ptas = ptas.Where(x => x.CreatedAt >= model.StartDate.Value);

                    if (model.EndDate.HasValue)
                        ptas = ptas.Where(x => x.CreatedAt <= model.EndDate.Value);

                    int totalCount = ptas.Count();

                    int skip = (model.PageNumber - 1) * model.PageSize;

                    var ptasList = ptas
                        .OrderByDescending(x => x.DateAcquired ?? x.CreatedAt)
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
                                .Where(m => (m.NonPlantillaEmployeeId != null && m.NonPlantillaEmployeeId != 0 && m.NonPlantillaEmployeeId == model.EmployeeId.Value) 
                                || (m.PlantillaEmployeeId != null && m.PlantillaEmployeeId != 0 && m.PlantillaEmployeeId == model.EmployeeId.Value));

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
                                FiscalDate = x.FiscalDate,
                                Parts = await _getTools.PTA.GetTblPTAPartsByPTAId(x.Id, context).ToListAsync(),
                                Movements = (await movements.ToListAsync()).OrderByDescending(m => m.DateAssigned).ToList(),
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
                                FiscalDate = x.FiscalDate,
                                Parts = await _getTools.PTA.GetTblPTAPartsByPTAId(x.Id, context).ToListAsync(),
                                Movements = (await _getTools.PTA.GetTblPTAMovementsByPTAId(x.Id, context).ToListAsync()).OrderByDescending(m => m.DateAssigned).ToList(),
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
                        "PTAs have been retrieved",
                        model.AsOfDate
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

                    // AS OF Filter for Employee GroupBy: Include all assets acquired on or before the "as of" date
                    if (model.AsOfDate.HasValue)
                    {
                        ptasQuery = ptasQuery.Where(x => x.DateAcquired <= model.AsOfDate.Value);
                    }

                    // Get distinct employees who have at least one PTA, ordered latest to oldest by DateAcquired (fallback to CreatedAt)
                    var employeeGroups = ptasQuery
                        .Where(x => x.NonPlantillaEmployeeId.HasValue || x.PlantillaEmployeeId.HasValue)
                        .GroupBy(x => x.NonPlantillaEmployeeId.HasValue ? x.NonPlantillaEmployeeId.Value : x.PlantillaEmployeeId.Value)
                        .Select(g => new
                        {
                            EmployeeId = g.Key,
                            PTAIds = g.Select(p => p.Id).ToList(),
                            LatestDateAcquired = g.Max(p => p.DateAcquired ?? p.CreatedAt)
                        })
                        .AsEnumerable()
                        .OrderByDescending(g => g.LatestDateAcquired); // Switch to client-side for complex grouping logic

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
                            .OrderByDescending(x => x.DateAcquired ?? x.CreatedAt)
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
                                Movements = (await _getTools.PTA.GetTblPTAMovementsByPTAId(x.Id, context).ToListAsync()).OrderByDescending(m => m.DateAssigned).ToList(),
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
                        "PTAs grouped by employee retrieved successfully",
                        model.AsOfDate
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

                    // AS OF Filter for Condition GroupBy: Include all assets acquired on or before the "as of" date
                    if (model.AsOfDate.HasValue)
                    {
                        ptasQuery = ptasQuery.Where(x => x.DateAcquired <= model.AsOfDate.Value);
                    }

                    // Get distinct conditions ordered latest to oldest by DateAcquired (fallback to CreatedAt)
                    var conditionGroups = ptasQuery
                        .Where(x => x.RemarksEncrypted != null && x.RemarksEncrypted != "")
                        .ToList()
                        .GroupBy(x => x.Remarks.ToLower())
                        .Select(g => new
                        {
                            Remarks = g.Key,
                            LatestDateAcquired = g.Max(p => p.DateAcquired ?? p.CreatedAt)
                        })
                        .OrderByDescending(g => g.LatestDateAcquired)
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

                        var conditionPtaList = ptasQuery
                            .Where(x => x.RemarksEncrypted != null && x.RemarksEncrypted != "")
                            .ToList()
                            .Where(x => x.Remarks.ToLower() == condition.ToLower())
                            .OrderByDescending(x => x.DateAcquired ?? x.CreatedAt);

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
                                Movements = (await _getTools.PTA.GetTblPTAMovementsByPTAId(x.Id, context).ToListAsync()).OrderByDescending(m => m.DateAssigned).ToList(),
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
                        "PTAs grouped by condition retrieved successfully",
                        model.AsOfDate
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

                    // AS OF Filter for Division GroupBy: Include all assets acquired on or before the "as of" date
                    if (model.AsOfDate.HasValue)
                    {
                        ptasQuery = ptasQuery.Where(x => x.DateAcquired <= model.AsOfDate.Value);
                    }

                    // Get distinct divisions ordered latest to oldest by DateAcquired (fallback to CreatedAt)
                    var divisionGroups = ptasQuery
                        .Where(x => x.ActualDivisionId != null)
                        .GroupBy(x => x.ActualDivisionId)
                        .Select(g => new
                        {
                            DivisionId = g.Key,
                            LatestDateAcquired = g.Max(p => p.DateAcquired ?? p.CreatedAt)
                        })
                        .AsEnumerable()
                        .OrderByDescending(g => g.LatestDateAcquired); // Switch to client-side for complex grouping logic

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

                        var divisionPtaList = ptasQuery
                            .Where(x => x.ActualDivisionId == divisionId)
                            .OrderByDescending(x => x.DateAcquired ?? x.CreatedAt)
                            .ToList();

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
                                Movements = (await _getTools.PTA.GetTblPTAMovementsByPTAId(x.Id, context).ToListAsync()).OrderByDescending(m => m.DateAssigned).ToList(),
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
                        "PTAs grouped by division retrieved successfully",
                        model.AsOfDate
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
                    FiscalDate = pta.FiscalDate,
                    Parts = await _getTools.PTA.GetTblPTAPartsByPTAId(pta.Id, context).ToListAsync(),
                    Movements = (await _getTools.PTA.GetTblPTAMovementsByPTAId(pta.Id, context).ToListAsync()).OrderByDescending(m => m.DateAssigned).ToList(),
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

        // GET api/inventory/pta/se-ppe/no-movement
        [HttpGet("pta/se-ppe/no-movement")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetPTAsWithNoMovement([FromQuery] PTAPaginationQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                // Get all non-deleted PTAs (optionally filtered by group)
                IEnumerable<TblPTA> ptas = string.IsNullOrWhiteSpace(model.GroupName)
                    ? await _getTools.PTA.GetTblPTAs(context).ToListAsync()
                    : await _getTools.PTA.GetTblPTAsByGroup(model.GroupName, context).ToListAsync();

                // Get all PTA IDs that have at least one non-deleted movement
                var ptaIdsWithMovements = await _getTools.PTA
                    .GetTblPTAMovements(context)
                    .Where(x => x.PTAId.HasValue)
                    .Select(x => x.PTAId!.Value)
                    .Distinct()
                    .ToListAsync();

                var idsWithMovementsSet = new HashSet<long>(ptaIdsWithMovements);

                // Keep only those with no movements
                ptas = ptas.Where(x => !idsWithMovementsSet.Contains(x.Id));

                // Optional search
                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLowerInvariant();
                    ptas = ptas.Where(x =>
                        (x.PropertyNumber ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Description ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Brand ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Model ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.SerialNumber ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.UnitOfMeasurement ?? "").ToLowerInvariant().Contains(searchLower) ||
                        x.UnitValue.ToString().Contains(searchLower) ||
                        (x.DateAcquired?.ToString("yyyy-MM-dd") ?? "").Contains(searchLower)
                    );
                }

                if (model.StartDate.HasValue)
                    ptas = ptas.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    ptas = ptas.Where(x => x.CreatedAt <= model.EndDate.Value);

                if (model.CategoryId != null && model.CategoryId != 0)
                    ptas = ptas.Where(x => x.CategoryId == model.CategoryId);

                int totalCount = ptas.Count();
                int skip = (model.PageNumber - 1) * model.PageSize;

                var ptaList = ptas
                    .OrderByDescending(x => x.DateAcquired ?? x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var ptasResponses = new List<PTAResponseModel>();

                foreach (var x in ptaList)
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
                        FiscalDate = x.FiscalDate,
                        Movements = new List<PTAMovementResponseModel>(),
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt
                    };
                    ptasResponses.Add(ptaModel);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed PTAs with no movements", actionBy: model.ActionBySystemUserId);

                return Ok(ApiResponse<PTAResponseModel>.OkPaginated(
                    ptasResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "PTAs with no movements retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/inventory/pta/se-ppe/for-disposal
        [HttpGet("pta/se-ppe/for-disposal")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetPTAsForDisposal([FromQuery] PTAPaginationQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                // Load all PTAs for the group
                IEnumerable<TblPTA> ptas = string.IsNullOrWhiteSpace(model.GroupName)
                    ? await _getTools.PTA.GetTblPTAs(context).ToListAsync()
                    : await _getTools.PTA.GetTblPTAsByGroup(model.GroupName, context).ToListAsync();

                // Load all movements for these PTAs in one batch
                var ptaIds = ptas.Select(x => x.Id).ToHashSet();

                var allMovements = await context.TblPTAMovements
                    .AsNoTracking()
                    .Where(m => !m.IsDeleted && m.PTAId.HasValue && ptaIds.Contains(m.PTAId.Value))
                    .ToListAsync();

                // After ToListAsync(), Remarks and DateAssigned auto-decrypt via [NotMapped] getters.
                // Get the latest movement per PTA, keep only those whose latest condition is "For Disposal"
                var ptaIdsForDisposal = allMovements
                    .GroupBy(m => m.PTAId!.Value)
                    .Where(g =>
                    {
                        var latest = g.OrderByDescending(m => m.DateAssigned ?? m.CreatedAt).First();
                        return (latest.Remarks ?? "").Equals("Defective For Disposal", StringComparison.OrdinalIgnoreCase);
                    })
                    .Select(g => g.Key)
                    .ToHashSet();

                ptas = ptas.Where(x => ptaIdsForDisposal.Contains(x.Id));

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLowerInvariant();
                    ptas = ptas.Where(x =>
                        (x.PropertyNumber ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Description ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Brand ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Model ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.SerialNumber ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.UnitOfMeasurement ?? "").ToLowerInvariant().Contains(searchLower) ||
                        x.UnitValue.ToString().Contains(searchLower) ||
                        (x.DateAcquired?.ToString("yyyy-MM-dd") ?? "").Contains(searchLower) ||
                        (x.FiscalDate?.ToString("yyyy-MM-dd") ?? "").Contains(searchLower)
                    );
                }

                if (model.CategoryId != null && model.CategoryId != 0)
                    ptas = ptas.Where(x => x.CategoryId == model.CategoryId);

                if (model.StartDate.HasValue)
                    ptas = ptas.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    ptas = ptas.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = ptas.Count();
                int skip = (model.PageNumber - 1) * model.PageSize;

                var ptaList = ptas
                    .OrderByDescending(x => x.DateAcquired ?? x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var ptasResponses = new List<PTAResponseModel>();

                foreach (var x in ptaList)
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
                        FiscalDate = x.FiscalDate,
                        Parts = await _getTools.PTA.GetTblPTAPartsByPTAId(x.Id, context).ToListAsync(),
                        Movements = (await _getTools.PTA.GetTblPTAMovementsByPTAId(x.Id, context).ToListAsync()).OrderByDescending(m => m.DateAssigned).ToList(),
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt
                    };
                    ptasResponses.Add(ptaModel);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed {model.GroupName} PTAs marked for disposal", actionBy: model.ActionBySystemUserId);

                return Ok(ApiResponse<PTAResponseModel>.OkPaginated(
                    ptasResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "PTAs marked for disposal retrieved successfully"
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

                int insertedAssetCount = 0;
                int updatedAssetCount = 0;
                int insertedMovementCount = 0;
                int updatedMovementCount = 0;
                int failedCount = 0;
                var failedDetails = new List<object>();

                Console.WriteLine($"[BATCH_UPLOAD] Starting batch upload with {items.Count()} items");

                foreach(PTAItem item in items)
                {
                    try
                    {
                        Console.WriteLine($"[BATCH_UPLOAD] Processing item: {item?.PropertyNumber ?? "Unknown"}");

                        if (string.IsNullOrWhiteSpace(item?.PropertyNumber))
                        {
                            Console.WriteLine($"[BATCH_UPLOAD] Skipping item: Property Number is empty or missing");
                            failedCount++;
                            failedDetails.Add(new { PropertyNumber = "(empty)", Reason = "Missing Property Number" });
                            continue;
                        }

                        long ppeId = 0;
                        long categoryId = 0;
                        long legendId = 0;
                        bool isAssetUpsertInsert = false;

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

                        // UPSERT LOGIC FOR ASSET: Check if Property Number exists
                        // Load all assets of this group first, then filter in memory
                        var allPTAsOfGroup = await _getTools.PTA.GetTblPTAsByGroup(item.UnitValue <= 49999.99 ? TblPTA.SE : TblPTA.PPE, context)
                            .ToListAsync();
                        
                        TblPTA? existingPTA = allPTAsOfGroup
                            .FirstOrDefault(x => x.PropertyNumber == item.PropertyNumber);

                        if (existingPTA != null)
                        {
                            // UPDATE existing asset
                            Console.WriteLine($"[BATCH_UPLOAD] Updating existing asset: {item.PropertyNumber}");
                            existingPTA.Group = item.UnitValue <= 49999.99 ? TblPTA.SE : TblPTA.PPE;
                            existingPTA.CategoryId = categoryId;
                            existingPTA.LegendId = legendId;
                            existingPTA.Description = item.Description;
                            existingPTA.Brand = item.Brand;
                            existingPTA.Model = item.Model;
                            existingPTA.SerialNumber = item.SerialNumber;
                            existingPTA.UnitOfMeasurement = item.UnitOfMeasurement;
                            existingPTA.UnitValue = item.UnitValue;
                            existingPTA.DateAcquired = item.DateAssigned;
                            existingPTA.FiscalDate = item.FiscalDate;

                            if (existingPTA.Group == TblPTA.PPE)
                                existingPTA.EstimatedUsefulLife = item.EstimatedUsefulLife;

                            ppeId = await _editTools.PTA.EditTblPTAAsync(existingPTA, model.ActionBySystemUserId, context, true);
                            updatedAssetCount++;
                            isAssetUpsertInsert = false;
                            Console.WriteLine($"[BATCH_UPLOAD] Asset updated successfully with ID: {ppeId}");
                        }
                        else
                        {
                            // INSERT new asset
                            Console.WriteLine($"[BATCH_UPLOAD] Inserting new asset: {item.PropertyNumber}");
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
                                FiscalDate = item.FiscalDate
                            };

                            ppeId = await _editTools.PTA.EditTblPTAAsync(newPTA, model.ActionBySystemUserId, context, true);
                            Console.WriteLine($"[BATCH_UPLOAD] Asset inserted successfully with ID: {ppeId}");
                            
                            if (ppeId == 0)
                            {
                                Console.WriteLine($"[BATCH_UPLOAD] WARNING: Asset insertion returned ID 0 for {item.PropertyNumber}");
                                failedCount++;
                                failedDetails.Add(new { PropertyNumber = item.PropertyNumber, Reason = "Asset insertion failed (returned ID 0)" });
                                continue;
                            }
                            
                            insertedAssetCount++;
                            isAssetUpsertInsert = true;
                        }

                        // Handle parts - only insert new parts, don't update existing
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

                        // Collect all movements for this item to determine which is current
                        var movementsForItem = item?.AnnualCount ?? Enumerable.Empty<PTAAnnualCount>();
                        Console.WriteLine($"[BATCH_UPLOAD] Found {movementsForItem.Count()} movements for asset {item.PropertyNumber}");
                        
                        var movementList = new List<(PTAAnnualCount movement, TblPTAMovement tbpMovement, bool isInsert)>();

                        // First pass: prepare all movements
                        foreach (PTAAnnualCount movement in movementsForItem)
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

                            // Determine movement status: use from Excel if provided, otherwise default to New
                            string movementStatus = !string.IsNullOrWhiteSpace(movement.Status) 
                                ? movement.Status 
                                : PortalCommon.Constants.PTAMovementConstants.NEW;

                            // Skip movements with no employee assigned
                            if (plantillaEmployeeId == null && nonPlantillaEmployeeId == null)
                            {
                                Console.WriteLine($"[BATCH_UPLOAD] Skipping movement for {item.PropertyNumber}: No employee assigned");
                                continue;
                            }

                            // UPSERT LOGIC FOR MOVEMENT: Check if movement exists using composite key
                            // Load all movements for this PTA first, then filter in memory
                            var allMovementsForPTA = await context.Set<TblPTAMovement>()
                                .Where(m => m.PTAId == ppeId)
                                .ToListAsync();
                            
                            var existingMovement = allMovementsForPTA
                                .FirstOrDefault(m => 
                                    m.DateAssigned == movement.DateAssigned &&
                                    (
                                        (m.PlantillaEmployeeId == plantillaEmployeeId && plantillaEmployeeId.HasValue) ||
                                        (m.NonPlantillaEmployeeId == nonPlantillaEmployeeId && nonPlantillaEmployeeId.HasValue)
                                    ));

                            if (existingMovement != null)
                            {
                                // UPDATE existing movement
                                Console.WriteLine($"[BATCH_UPLOAD] Updating existing movement for asset {item.PropertyNumber}");
                                existingMovement.PTRITRNumber = movement.PtrItrNumber;
                                existingMovement.PARICSNumber = movement.ParIcsNumber;
                                existingMovement.ActualOfficeId = officeId;
                                existingMovement.ActualDivisionId = divisionId;
                                existingMovement.Remarks = movement.Condition;
                                existingMovement.Status = movementStatus;
                                existingMovement.IsCurrent = false;

                                TblPTAMovement tbpMovement = new()
                                {
                                    Id = existingMovement.Id,
                                    PTAId = existingMovement.PTAId,
                                    DateAssigned = existingMovement.DateAssigned,
                                    PTRITRNumber = existingMovement.PTRITRNumber,
                                    PARICSNumber = existingMovement.PARICSNumber,
                                    PlantillaEmployeeId = existingMovement.PlantillaEmployeeId,
                                    NonPlantillaEmployeeId = existingMovement.NonPlantillaEmployeeId,
                                    PlantillaEmployeeIdOriginal = existingMovement.PlantillaEmployeeIdOriginal,
                                    NonPlantillaEmployeeIdOriginal = existingMovement.NonPlantillaEmployeeIdOriginal,
                                    ActualOfficeId = existingMovement.ActualOfficeId,
                                    ActualDivisionId = existingMovement.ActualDivisionId,
                                    Remarks = existingMovement.Remarks,
                                    Status = existingMovement.Status,
                                    IsCurrent = false
                                };

                                movementList.Add((movement, tbpMovement, false)); // false = update
                                updatedMovementCount++;
                            }
                            else
                            {
                                // INSERT new movement
                                Console.WriteLine($"[BATCH_UPLOAD] Inserting new movement for asset {item.PropertyNumber}");
                                TblPTAMovement newMovement = new()
                                {
                                    PTAId = ppeId,
                                    DateAssigned = movement.DateAssigned,
                                    PTRITRNumber = movement.PtrItrNumber,
                                    PARICSNumber = movement.ParIcsNumber,
                                    PlantillaEmployeeId = plantillaEmployeeId,
                                    NonPlantillaEmployeeId = nonPlantillaEmployeeId,
                                    PlantillaEmployeeIdOriginal = movement.PlantillaEmployeeId,
                                    NonPlantillaEmployeeIdOriginal = movement.NonPlantillaEmployeeId,
                                    ActualOfficeId = officeId,
                                    ActualDivisionId = divisionId,
                                    Remarks = movement.Condition,
                                    Status = movementStatus,
                                    IsCurrent = false // Will be set correctly based on DateAssigned
                                };

                                movementList.Add((movement, newMovement, true)); // true = insert
                                insertedMovementCount++;
                            }
                        }

                        // Second pass: determine which movement is current
                        if (movementList.Any())
                        {
                            // Sort movements by DateAssigned in DESCENDING order (latest first)
                            var sortedMovements = movementList
                                .OrderByDescending(m => m.tbpMovement.DateAssigned ?? DateTime.MinValue)
                                .ToList();

                            // Mark the first (latest) as current, all others as not current
                            for (int i = 0; i < sortedMovements.Count; i++)
                            {
                                // Only the first movement (latest) is current
                                sortedMovements[i].tbpMovement.IsCurrent = (i == 0);
                            }

                            // Save all valid movements
                            foreach (var (movement, tbpMovement, isInsert) in sortedMovements)
                            {
                                await _editTools.PTA.EditTblPTAMovementAsync(tbpMovement, model.ActionBySystemUserId, context, true);
                            }
                        }
                        
                        Console.WriteLine($"[BATCH_UPLOAD] Successfully processed item: {item.PropertyNumber}");
                    }
                    catch (Exception itemEx)
                    {
                        failedCount++;
                        string failReason = itemEx.InnerException?.Message ?? itemEx.Message;
                        failedDetails.Add(new { PropertyNumber = item?.PropertyNumber ?? "(unknown)", Reason = failReason });
                        Console.WriteLine($"[BATCH_UPLOAD] ERROR processing item {item?.PropertyNumber ?? "Unknown"}: {itemEx.Message}");
                        Console.WriteLine($"[BATCH_UPLOAD] Stack Trace: {itemEx.StackTrace}");
                        
                        // Log error with minimal source string to avoid column truncation
                        try
                        {
                            await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), itemEx, "BatchUpload-Item");
                        }
                        catch
                        {
                            // If error logging itself fails, just log to console
                            Console.WriteLine($"[BATCH_UPLOAD] Could not log error to database: {itemEx.InnerException?.Message}");
                        }
                        
                        // Continue processing other items even if one fails
                        continue;
                    }
                }

                Console.WriteLine($"[BATCH_UPLOAD] Batch complete - Assets: {insertedAssetCount} inserted, {updatedAssetCount} updated | Movements: {insertedMovementCount} inserted, {updatedMovementCount} updated | Failed: {failedCount}");

                await AuditTrailTool.LogActivityAsync(_options, $"Performed batch upload PTA (PPE/SE) with UPSERT logic - Total items: {items.Count()}, Inserted assets: {insertedAssetCount}, Updated assets: {updatedAssetCount}, Inserted movements: {insertedMovementCount}, Updated movements: {updatedMovementCount}, Failed: {failedCount}", actionBy: model.ActionBySystemUserId);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                var resultSummary = new
                {
                    TotalRecords = items.Count(),
                    Assets = new
                    {
                        Inserted = insertedAssetCount,
                        Updated = updatedAssetCount
                    },
                    Movements = new
                    {
                        Inserted = insertedMovementCount,
                        Updated = updatedMovementCount
                    },
                    Failed = failedCount,
                    FailedDetails = failedDetails
                };

                return Ok(ApiResponse<object>.Ok(resultSummary, $"Batch upload completed: {insertedAssetCount + updatedAssetCount} assets processed, {insertedMovementCount + updatedMovementCount} movements processed"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                
                // Return more specific error message
                string errorMessage = ex.Message ?? "An error occurred while processing your request. Please check the template format.";
                if (ex.InnerException != null)
                    errorMessage = ex.InnerException.Message ?? errorMessage;
                
                return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, errorMessage));
            }
        }

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
                    FiscalDate = model.FiscalDate,
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
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
        // GET api/inventory/pta/movement/next-number
        [HttpGet("pta/movement/next-number")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetNextTransferNumber([FromQuery] string transferType = "PTR", [FromQuery] SoloQueryParams model = null)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                // Validate transfer type
                if (string.IsNullOrWhiteSpace(transferType) || (!transferType.Equals("PTR", StringComparison.OrdinalIgnoreCase) && !transferType.Equals("ITR", StringComparison.OrdinalIgnoreCase)))
                {
                    return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.VALIDATION_FAILED, "Transfer type must be either 'PTR' or 'ITR'"));
                }

                // Get current date
                var now = DateTime.UtcNow;
                var year = now.Year;
                var month = now.Month.ToString("D2");
                var yearMonth = $"{year}-{month}";

                // Get all movements for the current month and type
                var movements = await _getTools.PTA.GetTblPTAMovements(context).ToListAsync();

                // Filter for current month and transfer type
                var currentMonthMovements = movements
                    .Where(x => !string.IsNullOrEmpty(x.PTRITRNumber) && 
                                x.PTRITRNumber.ToUpper().StartsWith(transferType.ToUpper()) &&
                                x.PTRITRNumber.Contains(yearMonth))
                    .ToList();

                // Extract sequence numbers from the PTR/ITR numbers (format: PTR-yyyy-mm-001)
                var sequenceNumbers = currentMonthMovements
                    .Select(x =>
                    {
                        var parts = x.PTRITRNumber.Split('-');
                        if (parts.Length >= 4 && int.TryParse(parts[3], out var sequence))
                        {
                            return sequence;
                        }
                        return 0;
                    })
                    .Where(x => x > 0)
                    .ToList();

                // Get the maximum sequence number, default to 0 if none found
                var maxSequence = sequenceNumbers.Any() ? sequenceNumbers.Max() : 0;
                var nextSequence = maxSequence + 1;

                // Format the new transfer number
                var nextNumber = $"{transferType.ToUpper()}-{yearMonth}-{nextSequence:D3}";

                Console.WriteLine($"[NEXT_NUMBER] Type: {transferType}, Year-Month: {yearMonth}, Max Sequence: {maxSequence}, Next: {nextNumber}");

                return Ok(ApiResponse<object>.Ok(new { transferNumber = nextNumber, sequence = nextSequence }, "Next transfer number generated successfully"));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating next transfer number: {ex.Message}");
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while generating the transfer number."));
            }
        }

        // GET api/inventory/pta/movement/next-return-number
        [HttpGet("pta/movement/next-return-number")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetNextReturnNumber([FromQuery] string returnType = "RRPPE", [FromQuery] SoloQueryParams model = null)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                // Validate return type
                if (string.IsNullOrWhiteSpace(returnType) || (!returnType.Equals("RRPPE", StringComparison.OrdinalIgnoreCase) && !returnType.Equals("RRSP", StringComparison.OrdinalIgnoreCase)))
                {
                    return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.VALIDATION_FAILED, "Return type must be either 'RRPPE' or 'RRSP'"));
                }

                // Get current date
                var now = DateTime.UtcNow;
                var year = now.Year;
                var month = now.Month.ToString("D2");
                var yearMonth = $"{year}-{month}";

                // Get all movements for the current month and type
                var movements = await _getTools.PTA.GetTblPTAMovements(context).ToListAsync();

                // Filter for current month and return type
                var currentMonthMovements = movements
                    .Where(x => !string.IsNullOrEmpty(x.RRPPERRSPNumber) && 
                                x.RRPPERRSPNumber.ToUpper().StartsWith(returnType.ToUpper()) &&
                                x.RRPPERRSPNumber.Contains(yearMonth))
                    .ToList();

                // Extract sequence numbers from the RRPPE/RRSP numbers (format: RRPPE-yyyy-mm-001)
                var sequenceNumbers = currentMonthMovements
                    .Select(x =>
                    {
                        var parts = x.RRPPERRSPNumber.Split('-');
                        if (parts.Length >= 4 && int.TryParse(parts[3], out var sequence))
                        {
                            return sequence;
                        }
                        return 0;
                    })
                    .Where(x => x > 0)
                    .ToList();

                // Get the maximum sequence number, default to 0 if none found
                var maxSequence = sequenceNumbers.Any() ? sequenceNumbers.Max() : 0;
                var nextSequence = maxSequence + 1;

                // Format the new return number
                var nextNumber = $"{returnType.ToUpper()}-{yearMonth}-{nextSequence:D3}";

                Console.WriteLine($"[NEXT_RETURN_NUMBER] Type: {returnType}, Year-Month: {yearMonth}, Max Sequence: {maxSequence}, Next: {nextNumber}");

                return Ok(ApiResponse<object>.Ok(new { returnNumber = nextNumber, sequence = nextSequence }, "Next return number generated successfully"));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating next return number: {ex.Message}");
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while generating the return number."));
            }
        }

        // GET api/inventory/pta/movement/next-par-number
        [HttpGet("pta/movement/next-par-number")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetNextParIcsNumber([FromQuery] string parType = "PAR", [FromQuery] SoloQueryParams model = null)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                // Validate PAR/ICS type
                if (string.IsNullOrWhiteSpace(parType) || (!parType.Equals("PAR", StringComparison.OrdinalIgnoreCase) && !parType.Equals("ICS", StringComparison.OrdinalIgnoreCase)))
                {
                    return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.VALIDATION_FAILED, "PAR type must be either 'PAR' or 'ICS'"));
                }

                var now = DateTime.UtcNow;
                var year = now.Year;
                var month = now.Month.ToString("D2");
                var yearMonth = $"{year}-{month}";

                // Get all movements for the current month and PAR/ICS type
                var movements = await _getTools.PTA.GetTblPTAMovements(context).ToListAsync();

                var currentMonthMovements = movements
                    .Where(x => !string.IsNullOrEmpty(x.PARICSNumber) &&
                                x.PARICSNumber.ToUpper().StartsWith(parType.ToUpper()) &&
                                x.PARICSNumber.Contains(yearMonth))
                    .ToList();

                // Extract sequence numbers from the PAR/ICS numbers (format: PAR-yyyy-mm-001 / ICS-yyyy-mm-001)
                var sequenceNumbers = currentMonthMovements
                    .Select(x =>
                    {
                        var parts = x.PARICSNumber.Split('-');
                        if (parts.Length >= 4 && int.TryParse(parts[3], out var sequence))
                        {
                            return sequence;
                        }
                        return 0;
                    })
                    .Where(x => x > 0)
                    .ToList();

                var maxSequence = sequenceNumbers.Any() ? sequenceNumbers.Max() : 0;
                var nextSequence = maxSequence + 1;

                var nextNumber = $"{parType.ToUpper()}-{yearMonth}-{nextSequence:D3}";

                Console.WriteLine($"[NEXT_PAR_NUMBER] Type: {parType}, Year-Month: {yearMonth}, Max Sequence: {maxSequence}, Next: {nextNumber}");

                return Ok(ApiResponse<object>.Ok(new { parNumber = nextNumber, sequence = nextSequence }, "Next PAR/ICS number generated successfully"));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating next PAR/ICS number: {ex.Message}");
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while generating the PAR/ICS number."));
            }
        }

        // GET api/inventory/pta/movement/statistics
        [HttpGet("pta/movement/statistics")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetPTAMovementStatistics([FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                // Get all current movements
                var allMovements = await _getTools.PTA.GetTblPTAMovements(context)
                    .Where(x => x.IsCurrent == true && !x.IsDeleted)
                    .ToListAsync();

                // Count unique Active PTR (PTRITRNumber starts with "PTR")
                var activePTR = allMovements
                    .Where(x => !string.IsNullOrEmpty(x.PTRITRNumber) && x.PTRITRNumber.ToUpper().StartsWith("PTR"))
                    .Select(x => x.PTRITRNumber.ToUpper())
                    .Distinct()
                    .Count();

                // Count unique Active ITR (PTRITRNumber starts with "ITR")
                var activeITR = allMovements
                    .Where(x => !string.IsNullOrEmpty(x.PTRITRNumber) && x.PTRITRNumber.ToUpper().StartsWith("ITR"))
                    .Select(x => x.PTRITRNumber.ToUpper())
                    .Distinct()
                    .Count();

                // Count unique Active Returns PPE (RRPPERRSPNumber starts with "RRPPE")
                var activeReturnsPPE = allMovements
                    .Where(x => !string.IsNullOrEmpty(x.RRPPERRSPNumber) && x.RRPPERRSPNumber.ToUpper().StartsWith("RRPPE"))
                    .Select(x => x.RRPPERRSPNumber.ToUpper())
                    .Distinct()
                    .Count();

                // Count unique Active Returns SE (RRPPERRSPNumber starts with "RRSP")
                var activeReturnsSE = allMovements
                    .Where(x => !string.IsNullOrEmpty(x.RRPPERRSPNumber) && x.RRPPERRSPNumber.ToUpper().StartsWith("RRSP"))
                    .Select(x => x.RRPPERRSPNumber.ToUpper())
                    .Distinct()
                    .Count();

                var statistics = new
                {
                    activePTR = activePTR,
                    activeITR = activeITR,
                    activeReturnsPPE = activeReturnsPPE,
                    activeReturnsSE = activeReturnsSE,
                    totalActive = activePTR + activeITR + activeReturnsPPE + activeReturnsSE
                };

                return Ok(ApiResponse<object>.Ok(statistics, "Movement statistics retrieved successfully"));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving movement statistics: {ex.Message}");
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while retrieving statistics."));
            }
        }

        // GET api/inventory/pta/movement/list
        [HttpGet("pta/movement/list")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetPTAMovements([FromQuery] PTAMovementListQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                IQueryable<TblPTAMovement> movements = _getTools.PTA.GetTblPTAMovements(context);

                // Filter by PTA ID if provided
                if (model.PTAId.HasValue && model.PTAId.Value != 0)
                {
                    movements = movements.Where(x => x.PTAId == model.PTAId.Value);
                }

                // Apply date range filters
                if (model.StartDate.HasValue)
                    movements = movements.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    movements = movements.Where(x => x.CreatedAt <= model.EndDate.Value);

                // Load all movements and apply in-memory filters for encrypted fields
                var allMovements = await movements
                    .ToListAsync();
                
                // Filter to only show current movements (IsCurrent == true)
                allMovements = allMovements
                    .Where(x => x.IsCurrent == true)
                    .OrderByDescending(x => x.DateAssigned)
                    .ThenByDescending(x => x.CreatedAt)
                    .ToList();

                // Apply PTR/ITR Filter on in-memory data (since it's encrypted)
                if (!string.IsNullOrWhiteSpace(model.PtrItrFilter))
                {
                    string filterValue = model.PtrItrFilter.Trim();
                    
                    if (filterValue.ToUpper() == "PTR")
                    {
                        allMovements = allMovements.Where(x => !string.IsNullOrEmpty(x.PTRITRNumber) && x.PTRITRNumber.ToUpper().StartsWith("PTR")).ToList();
                    }
                    else if (filterValue.ToUpper() == "ITR")
                    {
                        allMovements = allMovements.Where(x => !string.IsNullOrEmpty(x.PTRITRNumber) && x.PTRITRNumber.ToUpper().StartsWith("ITR")).ToList();
                    }
                    else
                    {
                        // Search for specific PTR/ITR number
                        allMovements = allMovements.Where(x => !string.IsNullOrEmpty(x.PTRITRNumber) && x.PTRITRNumber.ToUpper().Contains(filterValue.ToUpper())).ToList();
                    }
                }

                // Apply RRPPE/RRSP Filter on in-memory data (since it's encrypted)
                if (!string.IsNullOrWhiteSpace(model.RrppeRrspFilter))
                {
                    string filterValue = model.RrppeRrspFilter.Trim();
                    
                    if (filterValue.ToUpper() == "RRPPE")
                    {
                        allMovements = allMovements.Where(x => !string.IsNullOrEmpty(x.RRPPERRSPNumber) && x.RRPPERRSPNumber.ToUpper().StartsWith("RRPPE")).ToList();
                    }
                    else if (filterValue.ToUpper() == "RRSP")
                    {
                        allMovements = allMovements.Where(x => !string.IsNullOrEmpty(x.RRPPERRSPNumber) && x.RRPPERRSPNumber.ToUpper().StartsWith("RRSP")).ToList();
                    }
                    else
                    {
                        // Search for specific RRPPE/RRSP number
                        allMovements = allMovements.Where(x => !string.IsNullOrEmpty(x.RRPPERRSPNumber) && x.RRPPERRSPNumber.ToUpper().Contains(filterValue.ToUpper())).ToList();
                    }
                }

                // Apply PAR/ICS Filter on in-memory data (since it's encrypted)
                if (!string.IsNullOrWhiteSpace(model.ParIcsFilter))
                {
                    string filterValue = model.ParIcsFilter.Trim();
                    
                    if (filterValue.ToUpper() == "PAR")
                    {
                        allMovements = allMovements.Where(x => !string.IsNullOrEmpty(x.PARICSNumber) && x.PARICSNumber.ToUpper().StartsWith("PAR")).ToList();
                    }
                    else if (filterValue.ToUpper() == "ICS")
                    {
                        allMovements = allMovements.Where(x => !string.IsNullOrEmpty(x.PARICSNumber) && x.PARICSNumber.ToUpper().StartsWith("ICS")).ToList();
                    }
                    else
                    {
                        // Search for specific PAR/ICS number
                        allMovements = allMovements.Where(x => !string.IsNullOrEmpty(x.PARICSNumber) && x.PARICSNumber.ToUpper().Contains(filterValue.ToUpper())).ToList();
                    }
                }

                // Calculate total count after filters
                int totalCount = allMovements.Count();
                int skip = (model.PageNumber - 1) * model.PageSize;

                // Apply pagination
                var movementList = allMovements
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                // Enrich the movement list with employee details and PTA items
                // Get ALL movements for each PTA to find previous holders (not just paginated ones)
                var ptaIdsInPage = movementList
                    .Where(x => x.PTAId.HasValue)
                    .Select(x => x.PTAId.Value)
                    .Distinct()
                    .ToList();

                var allMovementsForPtas = await _getTools.PTA.GetTblPTAMovements(context)
                    .Where(x => ptaIdsInPage.Contains(x.PTAId.Value))
                    .ToListAsync();

                var movementsByPta = allMovementsForPtas
                    .OrderBy(x => x.DateAssigned)
                    .GroupBy(x => x.PTAId.Value)
                    .ToDictionary(g => g.Key, g => g.ToList());

                var enrichedMovements = new List<PTAMovementDetailResponseModel>();

                foreach (var movement in movementList)
                {
                    var enrichedMovement = new PTAMovementDetailResponseModel
                    {
                        Id = movement.Id,
                        PTAId = movement.PTAId,
                        DateAssigned = movement.DateAssigned,
                        PTRITRNumber = movement.PTRITRNumber,
                        RRPPERRSPNumber = movement.RRPPERRSPNumber,
                        PARICSNumber = movement.PARICSNumber,
                        Remarks = movement.Remarks,
                        Status = movement.Status,
                        IsActive = movement.IsActive,
                        IsCurrent = movement.IsCurrent,
                        IsDeleted = movement.IsDeleted,
                        CreatedAt = movement.CreatedAt,
                        Employee = new List<EmployeeMovementInfoModel>()
                    };

                    // Get the movement history for this asset to find the previous holder
                    TblPTAMovement previousMovement = null;
                    if (movement.PTAId.HasValue && movementsByPta.TryGetValue(movement.PTAId.Value, out var assetMovements))
                    {
                        var currentIndex = assetMovements.FindIndex(m => m.Id == movement.Id);
                        if (currentIndex > 0)
                        {
                            previousMovement = assetMovements[currentIndex - 1];
                        }
                    }

                    // Add FROM employee (Previous holder from previous movement)
                    if (previousMovement != null)
                    {
                        long? previousHolderId = previousMovement.NonPlantillaEmployeeId ?? previousMovement.PlantillaEmployeeId;
                        if (previousHolderId.HasValue)
                        {
                            var previousEmp = await _getTools.Account.GetTblEmployeeAsync(previousHolderId.Value, context);
                            if (previousEmp != null)
                            {
                                var previousSystemUser = previousEmp.SystemUserId.HasValue ? 
                                    await _getTools.Account.GetTblSystemUserAsync(previousEmp.SystemUserId.Value, context) : null;
                                var previousPosition = (previousSystemUser?.PositionId ?? 0) > 0 ? 
                                    await _getTools.Office.GetTblPositionAsync(previousSystemUser!.PositionId ?? 0, context) : null;
                                    
                                enrichedMovement.Employee.Add(new EmployeeMovementInfoModel
                                {
                                    Id = previousEmp.Id,
                                    FullName = $"{previousEmp.FirstName} {previousEmp.MiddleName} {previousEmp.LastName}".Trim(),
                                    EmployeeIdOriginal = previousMovement.NonPlantillaEmployeeIdOriginal ?? previousMovement.PlantillaEmployeeIdOriginal,
                                    EmployeeType = previousMovement.NonPlantillaEmployeeId.HasValue ? "Non-Plantilla" : "Plantilla",
                                    Position = previousPosition,
                                    Office = previousMovement.ActualOfficeId.HasValue ? 
                                        await _getTools.Office.GetTblOfficeAsync(previousMovement.ActualOfficeId.Value, context) : null,
                                    Division = previousMovement.ActualDivisionId.HasValue ? 
                                        await _getTools.Office.GetTblDivisionAsync(previousMovement.ActualDivisionId.Value, context) : null
                                });
                            }
                        }
                    }

                    // Add TO employee (Current recipient - typically NonPlantilla, or Plantilla if no NonPlantilla)
                    long? currentHolderId = movement.NonPlantillaEmployeeId ?? movement.PlantillaEmployeeId;
                    if (currentHolderId.HasValue)
                    {
                        var currentEmp = await _getTools.Account.GetTblEmployeeAsync(currentHolderId.Value, context);
                        if (currentEmp != null)
                        {
                            var currentSystemUser = currentEmp.SystemUserId.HasValue ? 
                                await _getTools.Account.GetTblSystemUserAsync(currentEmp.SystemUserId.Value, context) : null;
                            var currentPosition = (currentSystemUser?.PositionId ?? 0) > 0 ? 
                                await _getTools.Office.GetTblPositionAsync(currentSystemUser!.PositionId ?? 0, context) : null;
                                
                            enrichedMovement.Employee.Add(new EmployeeMovementInfoModel
                            {
                                Id = currentEmp.Id,
                                FullName = $"{currentEmp.FirstName} {currentEmp.MiddleName} {currentEmp.LastName}".Trim(),
                                EmployeeIdOriginal = movement.NonPlantillaEmployeeIdOriginal ?? movement.PlantillaEmployeeIdOriginal,
                                EmployeeType = movement.NonPlantillaEmployeeId.HasValue ? "Non-Plantilla" : "Plantilla",
                                Position = currentPosition,
                                Office = movement.ActualOfficeId.HasValue ? 
                                    await _getTools.Office.GetTblOfficeAsync(movement.ActualOfficeId.Value, context) : null,
                                Division = movement.ActualDivisionId.HasValue ? 
                                    await _getTools.Office.GetTblDivisionAsync(movement.ActualDivisionId.Value, context) : null
                            });
                        }
                    }

                    // Get Office and Division
                    if (movement.ActualOfficeId.HasValue)
                        enrichedMovement.Office = await _getTools.Office.GetTblOfficeAsync(movement.ActualOfficeId.Value, context);

                    if (movement.ActualDivisionId.HasValue)
                        enrichedMovement.Division = await _getTools.Office.GetTblDivisionAsync(movement.ActualDivisionId.Value, context);

                    // Get the PTA item details
                    var pta = await _getTools.PTA.GetTblPTAAsync(movement.PTAId, context);
                    if (pta != null)
                    {
                        var category = await _getTools.PTA.GetTblPTACategoryAsync(pta.CategoryId, context);
                        enrichedMovement.Items = new List<PTAMovementItemModel>
                        {
                            new PTAMovementItemModel
                            {
                                Id = pta.Id,
                                PropertyNumber = pta.PropertyNumber,
                                Description = pta.Description,
                                Brand = pta.Brand,
                                Model = pta.Model,
                                SerialNumber = pta.SerialNumber,
                                Category = category?.Name,
                                UnitOfMeasurement = pta.UnitOfMeasurement,
                                UnitValue = pta.UnitValue,
                                DateAcquired = pta.DateAcquired,
                                Group = pta.Group
                            }
                        };
                    }

                    enrichedMovements.Add(enrichedMovement);
                }

                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed PTA Movements with filters", actionBy: model.ActionBySystemUserId);

                return Ok(ApiResponse<PTAMovementDetailResponseModel>.OkPaginated(
                    enrichedMovements,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "PTA Movements have been retrieved"
                ));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/inventory/pta/issuance/list
        [HttpGet("pta/issuance/list")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
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
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/inventory/pta/movement/transfer-details
        [HttpGet("pta/movement/transfer-details")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
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
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // POST api/inventory/pta/movement/edit
        

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
                    Description = model.Description,
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
