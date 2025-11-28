using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Models.ParserModels.PTA;
using PortalDB.Models.ParserModels.PTA;
using PortalDB.Models.QueryParams.Office;
using PortalDB.Models.QueryParams.Pagination;
using PortalDB.Models.QueryParams.PTA;
using PortalDB.Models.QueryParams.PTA;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.ResponseModels.Account;
using PortalDB.Models.ResponseModels.Office;
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

        // GET api/inventory/pta/ppe/categories/all
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
                        x.Name.ToLower().Contains(searchLower));
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
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/inventory/pta/ppe/categories/all
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
                        x.Name.ToLower().Contains(searchLower));
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
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/inventory/pta/ppe/all
        [HttpGet("pta/ppe/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllPTAs([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblPTA?> ppes = await _getTools.PTA.GetTblPTAsByGroup(TblPTA.PPE, context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    ppes = ppes.Where(x =>
                        x.PropertyNumber.ToLower().Contains(searchLower) ||
                        x.Description.ToLower().Contains(searchLower) ||
                        x.Brand.ToLower().Contains(searchLower) ||
                        x.Model.ToLower().Contains(searchLower) ||
                        x.SerialNumber.ToLower().Contains(searchLower) ||
                        x.UnitOfMeasurement.ToLower().Contains(searchLower) ||
                        x.UnitValue.ToString().Contains(searchLower) ||
                        x.DateAcquired.ToString().Contains(searchLower) ||
                        x.EstimatedUsefulLife.ToString().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    ppes = ppes.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    ppes = ppes.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = ppes.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var ppesList = ppes
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var ppesResponses = new List<PTAResponseModel>();

                foreach (var x in ppesList)
                {
                    var ppeModel = new PTAResponseModel
                    {
                        Id = x.Id,
                        Group = x.Group,
                        PropertyNumber = x.PropertyNumber,
                        Category = await _getTools.PTA.GetTblPTACategoryAsync(x.CategoryId, context),
                        Legend = await _getTools.PTA.GetTblPTALegendAsync(x.CategoryId, context),
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
                    ppesResponses.Add(ppeModel);
                }


                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed PTAs", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<PTAResponseModel>.OkPaginated(
                    ppesResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "PTAs have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/inventory/pta/ppe/all
        [HttpGet("pta/ppe/all/{ppeId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetPTA([FromQuery] SoloQueryParams model, [FromRoute] long ppeId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblPTA? ppe = await _getTools.PTA.GetTblPTAAsync(ppeId, context);
                var ppeResponses = new List<PTAResponseModel>();
                var ppeModel = new PTAResponseModel
                {
                    Id = ppe.Id,
                    Group = ppe.Group,
                    PropertyNumber = ppe.PropertyNumber,
                    Category = await _getTools.PTA.GetTblPTACategoryAsync(ppe.CategoryId, context),
                    Legend = await _getTools.PTA.GetTblPTALegendAsync(ppe.CategoryId, context),
                    Description = ppe.Description,
                    Brand = ppe.Brand,
                    Model = ppe.Model,
                    SerialNumber = ppe.SerialNumber,
                    UnitOfMeasurement = ppe.UnitOfMeasurement,
                    UnitValue = ppe.UnitValue,
                    DateAcquired = ppe.DateAcquired,
                    EstimatedUsefulLife = ppe.EstimatedUsefulLife,
                    Parts = await _getTools.PTA.GetTblPTAPartsByPTAId(ppe.Id, context).ToListAsync(),
                    Movements = await _getTools.PTA.GetTblPTAMovementsByPTAId(ppe.Id, context).ToListAsync(),
                    IsActive = ppe.IsActive,
                    CreatedAt = ppe.CreatedAt
                };
                ppeResponses.Add(ppeModel);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed PTA information for PTA {ppe.Id}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<PTAResponseModel>.Ok(ppeResponses, "PTA have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/inventory/pta/se/all
        [HttpGet("pta/se/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllSEs([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblPTA?> ses = await _getTools.PTA.GetTblPTAsByGroup(TblPTA.SE, context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    ses = ses.Where(x =>
                        x.PropertyNumber.ToLower().Contains(searchLower) ||
                        x.Description.ToLower().Contains(searchLower) ||
                        x.Brand.ToLower().Contains(searchLower) ||
                        x.Model.ToLower().Contains(searchLower) ||
                        x.SerialNumber.ToLower().Contains(searchLower) ||
                        x.UnitOfMeasurement.ToLower().Contains(searchLower) ||
                        x.UnitValue.ToString().Contains(searchLower) ||
                        x.DateAcquired.ToString().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    ses = ses.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    ses = ses.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = ses.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var sesList = ses
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var ptasResponses = new List<PTAResponseModel>();

                foreach (var x in sesList)
                {
                    var seModel = new PTAResponseModel
                    {
                        Id = x.Id,
                        Group = x.Group,
                        PropertyNumber = x.PropertyNumber,
                        Category = await _getTools.PTA.GetTblPTACategoryAsync(x.CategoryId, context),
                        Legend = await _getTools.PTA.GetTblPTALegendAsync(x.CategoryId, context),
                        Description = x.Description,
                        Brand = x.Brand,
                        Model = x.Model,
                        SerialNumber = x.SerialNumber,
                        UnitOfMeasurement = x.UnitOfMeasurement,
                        UnitValue = x.UnitValue,
                        DateAcquired = x.DateAcquired,
                        Parts = await _getTools.PTA.GetTblPTAPartsByPTAId(x.Id, context).ToListAsync(),
                        Movements = await _getTools.PTA.GetTblPTAMovementsByPTAId(x.Id, context).ToListAsync(),
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt
                    };
                    ptasResponses.Add(seModel);
                }


                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed SEs", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<PTAResponseModel>.OkPaginated(
                    ptasResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "SEs have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/inventory/pta/se/all
        [HttpGet("pta/se/all/{ptaId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetSE([FromQuery] SoloQueryParams model, [FromRoute] long ptaId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblPTA? se = await _getTools.PTA.GetTblPTAAsync(ptaId, context);
                var ptaResponse = new List<PTAResponseModel>();
                var seModel = new PTAResponseModel
                {
                    Id = se.Id,
                    Group = se.Group,
                    PropertyNumber = se.PropertyNumber,
                    Category = await _getTools.PTA.GetTblPTACategoryAsync(se.CategoryId, context),
                    Legend = await _getTools.PTA.GetTblPTALegendAsync(se.CategoryId, context),
                    Description = se.Description,
                    Brand = se.Brand,
                    Model = se.Model,
                    SerialNumber = se.SerialNumber,
                    UnitOfMeasurement = se.UnitOfMeasurement,
                    UnitValue = se.UnitValue,
                    DateAcquired = se.DateAcquired,
                    Parts = await _getTools.PTA.GetTblPTAPartsByPTAId(se.Id, context).ToListAsync(),
                    Movements = await _getTools.PTA.GetTblPTAMovementsByPTAId(se.Id, context).ToListAsync(),
                    IsActive = se.IsActive,
                    CreatedAt = se.CreatedAt
                };
                ptaResponse.Add(seModel);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed PTA information for PTA {se.Id}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<PTAResponseModel>.Ok(ptaResponse, "PTA have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
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
                            categoryId = await _editTools.PTA.EditTblPTACategoryAsync(newCategory, model.ActionBySystemUserId, context);
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
                            legendId = await _editTools.PTA.EditTblPTALegendAsync(newLegend, model.ActionBySystemUserId, context);
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
                        EstimatedUsefulLife = item.EstimatedUsefulLife
                    };

                    ppeId = await _editTools.PTA.EditTblPTAAsync(newPTA, model.ActionBySystemUserId, context);

                    foreach (PTAPart part in item?.Parts ?? Enumerable.Empty<PTAPart>())
                    {
                        TblPTAPart newPart = new()
                        {
                            PTAId = ppeId,
                            Name = part.PartName,
                            SerialNumber = part.PartSerialNumber
                        };

                        await _editTools.PTA.EditTblPTAPartAsync(newPart, model.ActionBySystemUserId, context);
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

                        await _editTools.PTA.EditTblPTAMovementAsync(newMovement, model.ActionBySystemUserId, context);
                    }

                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse<object>.Ok($"{items.Count()} PTA items has been successfully migrated to the database"));
            }
            catch (Exception ex)
            {

                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
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
                    IsActive = model.IsActive
                };

                if (model.Group == TblPTA.PPE)
                    pta.EstimatedUsefulLife = model.EstimatedUsefulLife;

                long ptaId = await _editTools.PTA.EditTblPTAAsync(pta, model.ActionBySystemUserId, context);

                UserSimplePublicResponseModel publicRM = new()
                {
                    SystemUserId = model.ActionBySystemUserId,
                    SessionKey = model.SessionKey
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(publicRM, $"{(model.Group == TblPTA.PPE ? TblPTA.PPE : TblPTA.SE)} has been {(model.Id == 0 ? "added" : "updated")}"));

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

                TblPTAPart ppePart = new()
                {
                    Id = model.Id,
                    Name = model.Name,
                    SerialNumber = model.SerialNumber,
                    IsActive = model.IsActive
                };

                long ppePartId = await _editTools.PTA.EditTblPTAPartAsync(ppePart, model.ActionBySystemUserId, context);

                UserSimplePublicResponseModel publicRM = new()
                {
                    SystemUserId = model.ActionBySystemUserId,
                    SessionKey = model.SessionKey
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(publicRM, $"PTA Part has been {(model.Id == 0 ? "added" : "updated")}"));

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

                TblPTAMovement ppeMovement = new()
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

                long ppeMovementId = await _editTools.PTA.EditTblPTAMovementAsync(ppeMovement, model.ActionBySystemUserId, context);

                UserSimplePublicResponseModel publicRM = new()
                {
                    SystemUserId = model.ActionBySystemUserId,
                    SessionKey = model.SessionKey
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(publicRM, $"PTA Movement has been {(model.Id == 0 ? "added" : "updated")}"));

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
