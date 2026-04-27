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
public async Task<IActionResult> GetAllPTAs([FromQuery] PTAPaginationQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                #region General PTA By SE/PPE

                if (model.GroupBy == null || string.IsNullOrEmpty(model.GroupBy)) { 
                    IEnumerable<TblPTA?> ptas = await _getTools.PTA.GetTblPTAsByGroup(model.GroupName!, context).Where(x => x.Group == model.GroupName).ToListAsync();

                    // ----------------------------------------------------------------
                    // Pre-filter by movement-level attributes:
                    // Employee, Office, Division, Condition
                    // These must run BEFORE pagination so counts are correct.
                    // ----------------------------------------------------------------
                    bool needsMovementFilter =
                        (model.EmployeeId.HasValue && model.EmployeeId.Value != 0) ||
                        (model.OfficeId.HasValue && model.OfficeId.Value != 0) ||
                        (model.DivisionId.HasValue && model.DivisionId.Value != 0) ||
                        !string.IsNullOrWhiteSpace(model.Condition);

                    if (needsMovementFilter)
                    {
                        // Get all PTA IDs in current set, then load their latest movements once.
                        var allPtaIds = ptas.Where(x => x != null).Select(x => x!.Id).ToList();

                        var rawMovements = await _getTools.PTA.GetTblPTAMovements(context)
                            .Where(m => m.PTAId.HasValue && allPtaIds.Contains(m.PTAId.Value))
                            .ToListAsync();

                        // Keep only the latest movement per PTA
                        var latestMovementByPta = rawMovements
                            .GroupBy(m => m.PTAId!.Value)
                            .Select(g => g.OrderByDescending(m => m.CreatedAt).ThenByDescending(m => m.Id).First())
                            .ToDictionary(m => m.PTAId!.Value, m => m);

                        // Apply each movement-level filter in sequence
                        var matchingPtaIds = new HashSet<long>(latestMovementByPta.Keys);

                        if (model.EmployeeId.HasValue && model.EmployeeId.Value != 0)
                        {
                            var empId = model.EmployeeId.Value;
                            matchingPtaIds = matchingPtaIds
                                .Where(ptaId =>
                                {
                                    var mv = latestMovementByPta[ptaId];
                                    return (mv.PlantillaEmployeeId.HasValue && mv.PlantillaEmployeeId.Value == empId) ||
                                           (mv.NonPlantillaEmployeeId.HasValue && mv.NonPlantillaEmployeeId.Value == empId);
                                })
                                .ToHashSet();
                        }

                        if (model.OfficeId.HasValue && model.OfficeId.Value != 0)
                        {
                            var offId = model.OfficeId.Value;
                            matchingPtaIds = matchingPtaIds
                                .Where(ptaId => latestMovementByPta[ptaId].ActualOfficeId == offId)
                                .ToHashSet();
                        }

                        if (model.DivisionId.HasValue && model.DivisionId.Value != 0)
                        {
                            var divId = model.DivisionId.Value;
                            matchingPtaIds = matchingPtaIds
                                .Where(ptaId => latestMovementByPta[ptaId].ActualDivisionId == divId)
                                .ToHashSet();
                        }

                        if (!string.IsNullOrWhiteSpace(model.Condition))
                        {
                            string condFilter = model.Condition.Trim().ToUpper();
                            matchingPtaIds = matchingPtaIds
                                .Where(ptaId =>
                                {
                                    var mv = latestMovementByPta[ptaId];
                                    return !string.IsNullOrWhiteSpace(mv.Status) &&
                                           mv.Status.Trim().ToUpper().Contains(condFilter);
                                })
                                .ToHashSet();
                        }

                        ptas = ptas.Where(x => x != null && matchingPtaIds.Contains(x!.Id));
                    }
                    // ----------------------------------------------------------------
                    if (model.AsOfDate.HasValue)
                    {
                        if (model.IsAsOf == true)
                            ptas = ptas.Where(x => x != null && x.DateAcquired.HasValue && x.DateAcquired.Value.Date <= model.AsOfDate.Value.Date);
                        else
                        {
                            var ptaIdsList = ptas.Where(x => x != null).Select(x => x!.Id).ToList();
                            var movementsForFilter = await _getTools.PTA.GetTblPTAMovements(context)
                                .Where(m => m.PTAId.HasValue && ptaIdsList.Contains(m.PTAId.Value))
                                .ToListAsync();
                            var validPtaIds = movementsForFilter
                                .Where(m => m.DateAssigned.HasValue && m.DateAssigned.Value.Date == model.AsOfDate.Value.Date)
                                .Select(m => m.PTAId!.Value)
                                .ToHashSet();
                            ptas = ptas.Where(x => x != null && validPtaIds.Contains(x.Id));
                        }
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
                        .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
                        .Skip(skip)
                        .Take(model.PageSize)
                        .ToList();

                    var ptasResponses = new List<PTAResponseModel>();

                    foreach (var x in ptasList)
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
                            CreatedAt = x.CreatedAt,
                            UpdatedAt = x.UpdatedAt
                        };

                        ptasResponses.Add(ppeModel);
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

                    // Get distinct employees who have at least one PTA, ordered latest to oldest by UpdatedAt/CreatedAt
                    var employeeGroups = ptasQuery
                        .Where(x => x.NonPlantillaEmployeeId.HasValue || x.PlantillaEmployeeId.HasValue)
                        .GroupBy(x => x.NonPlantillaEmployeeId.HasValue ? x.NonPlantillaEmployeeId.Value : x.PlantillaEmployeeId.Value)
                        .Select(g => new
                        {
                            EmployeeId = g.Key,
                            PTAIds = g.Select(p => p.Id).ToList(),
                            LatestDateAcquired = g.Max(p => p.UpdatedAt ?? p.CreatedAt)
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
                            .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
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
                                CreatedAt = x.CreatedAt,
                                UpdatedAt = x.UpdatedAt
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

                    // Get distinct conditions ordered latest to oldest by UpdatedAt/CreatedAt
                    var conditionGroups = ptasQuery
                        .Where(x => x.RemarksEncrypted != null && x.RemarksEncrypted != "")
                        .ToList()
                        .GroupBy(x => x.Remarks.ToLower())
                        .Select(g => new
                        {
                            Remarks = g.Key,
                            LatestDateAcquired = g.Max(p => p.UpdatedAt ?? p.CreatedAt)
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
                            .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt);

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
                                CreatedAt = x.CreatedAt,
                                UpdatedAt = x.UpdatedAt
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

                    // Get distinct divisions ordered latest to oldest by UpdatedAt/CreatedAt
                    var divisionGroups = ptasQuery
                        .Where(x => x.ActualDivisionId != null)
                        .GroupBy(x => x.ActualDivisionId)
                        .Select(g => new
                        {
                            DivisionId = g.Key,
                            LatestDateAcquired = g.Max(p => p.UpdatedAt ?? p.CreatedAt)
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
                            .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
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
                                CreatedAt = x.CreatedAt,
                                UpdatedAt = x.UpdatedAt
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
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryService));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
    }
}
