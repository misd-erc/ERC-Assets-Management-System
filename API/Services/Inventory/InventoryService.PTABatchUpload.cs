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
                        // Search ALL non-deleted PTAs (across both SE and PPE groups) to avoid duplicates when group changes
                        var allPTAs = await _getTools.PTA.GetTblPTAs(context).ToListAsync();
                        
                        TblPTA? existingPTA = allPTAs
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

                        // Handle parts - skip parts that already exist for this asset
                        if (item?.Parts != null && item.Parts.Any())
                        {
                            var existingParts = await context.Set<TblPTAPart>()
                                .Where(p => p.PTAId == ppeId && !p.IsDeleted)
                                .ToListAsync();

                            foreach (PTAPart part in item.Parts)
                            {
                                bool partExists = existingParts.Any(ep =>
                                    ep.SerialNumber == part.PartSerialNumber &&
                                    ep.Name == part.PartName);

                                if (!partExists)
                                {
                                    TblPTAPart newPart = new()
                                    {
                                        PTAId = ppeId,
                                        Name = part.PartName,
                                        SerialNumber = part.PartSerialNumber
                                    };

                                    await _editTools.PTA.EditTblPTAPartAsync(newPart, model.ActionBySystemUserId, context, true);
                                }
                            }
                        }

                        // Collect all movements for this item to determine which is current
                        var movementsForItem = item?.AnnualCount ?? Enumerable.Empty<PTAAnnualCount>();
                        Console.WriteLine($"[BATCH_UPLOAD] Found {movementsForItem.Count()} movements for asset {item.PropertyNumber}");
                        
                        var movementList = new List<(PTAAnnualCount movement, TblPTAMovement tbpMovement, bool isInsert)>();

                        // Load all existing movements for this PTA once (outside the loop)
                        var allMovementsForPTA = await context.Set<TblPTAMovement>()
                            .Where(m => m.PTAId == ppeId && !m.IsDeleted)
                            .ToListAsync();

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
                            var existingMovement = allMovementsForPTA
                                .FirstOrDefault(m => 
                                    m.DateAssigned?.Date == movement.DateAssigned?.Date &&
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
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryService));
                
                // Return more specific error message
                string errorMessage = ex.Message ?? "An error occurred while processing your request. Please check the template format.";
                if (ex.InnerException != null)
                    errorMessage = ex.InnerException.Message ?? errorMessage;
                
                return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, errorMessage));
            }
        }
    }
}
