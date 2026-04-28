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
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryService));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
    }
}
