using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.PPE;
using PortalDB.Entities.DBO.Account;
using PortalDB.Models.ParserModels.PPE;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.Responses;
using PortalDB.Models.ViewModels.PPE;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;
using PortalTools.Services.GetEditTools.ASSET.PPE;
using PortalTools.Services.GetEditTools.DBO.Account;
using PortalTools.Services.GetEditTools.DBO.Office;
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

        /// <summary>
        /// Upload PPE batch file (CSV or Excel .xlsx)
        /// </summary>
        [HttpPost("ppe/batch-upload")]
        [ValidateSessionToken]
        public async Task<IActionResult> PPEBatchUpload([FromQuery] SoloQueryParams model, IFormFile file)
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
                List<PPEItem> items = _parserTools.ParsePpeFile(file);
                if (!items.Any())
                    return Ok(new List<PPEItem>());

                foreach(PPEItem item in items)
                {
                    long ppeId = 0;
                    long categoryId = 0;
                    long legendId = 0;

                    if (!string.IsNullOrWhiteSpace(item.Category))
                    {
                        var category = await _getTools.PPE.GetTblPPECategoryByNameAsync(item.Category.Trim(), context);

                        if (category != null)
                        {
                            categoryId = category.Id;
                        }
                        else
                        {
                            TblPPECategory newCategory = new()
                            {
                                Name = item.Category,
                                IsActive = true
                            };
                            categoryId = await _editTools.PPE.EditTblPPECategoryAsync(newCategory, model.ActionBySystemUserId, context);
                        }
                    }
                    if (!string.IsNullOrWhiteSpace(item.Legend))
                    {
                        var legend = await _getTools.PPE.GetTblPPELegendByNameAsync(item.Legend.Trim(), context);

                        if (legend != null)
                        {
                            legendId = legend.Id;
                        }
                        else
                        {
                            TblPPELegend newLegend = new()
                            {
                                Name = item.Legend,
                                IsActive = true
                            };
                            legendId = await _editTools.PPE.EditTblPPELegendAsync(newLegend, model.ActionBySystemUserId, context);
                        }
                    }

                    TblPPE newPPE = new()
                    {
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
                        EstimatedUsefulLife = item.EstimatedUsefulLife
                    };

                    ppeId = await _editTools.PPE.EditTblPPEAsync(newPPE, model.ActionBySystemUserId, context);

                    foreach (Part part in item?.Parts ?? Enumerable.Empty<Part>())
                    {
                        TblPPEPart newPart = new()
                        {
                            PPEId = ppeId,
                            Name = part.PartName,
                            SerialNumber = part.PartSerialNumber
                        };

                        await _editTools.PPE.EditTblPPEPartAsync(newPart, model.ActionBySystemUserId, context);
                    }

                    foreach (AnnualCount movement in item?.AnnualCount ?? Enumerable.Empty<AnnualCount>())
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
                        }
                        if (!string.IsNullOrEmpty(movement.NonPlantillaEmployeeId))
                        {
                            TblEmployee? nonPlantillaEmployee = await _getTools.Account.GetEmployeeByEmployeeIdAsync(movement.NonPlantillaEmployeeId, context);
                            nonPlantillaEmployeeId = nonPlantillaEmployee?.Id;
                        }

                        TblPPEMovement newMovement = new()
                            {
                                PPEId = ppeId,
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

                        await _editTools.PPE.EditTblPPEMovementAsync(newMovement, model.ActionBySystemUserId, context);
                    }

                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse<object>.Ok($"{items.Count()} PPE items has been successfully migrated to the database"));
            }
            catch (Exception ex)
            {

                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request. Please check the template format."));

            }
        }
    }
}