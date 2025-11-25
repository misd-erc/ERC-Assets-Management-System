using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.PPE;
using PortalDB.Entities.ASSET.SE;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Models.ParserModels.PPE;
using PortalDB.Models.ParserModels.SE;
using PortalDB.Models.QueryParams.Office;
using PortalDB.Models.QueryParams.Pagination;
using PortalDB.Models.QueryParams.PPE;
using PortalDB.Models.QueryParams.SE;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.ResponseModels.Account;
using PortalDB.Models.ResponseModels.Office;
using PortalDB.Models.ResponseModels.PPE;
using PortalDB.Models.ResponseModels.SE;
using PortalDB.Models.Responses;
using PortalDB.Models.ViewModels.PPE;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;
using PortalTools.Services.GetEditTools.ASSET.PPE;
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

        // GET api/inventory/ppe/all
        [HttpGet("ppe/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllPPEs([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblPPE?> ppes = await _getTools.PPE.GetTblPPEs(context).ToListAsync();

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

                var ppesResponses = new List<PPEResponseModel>();

                foreach (var x in ppesList)
                {
                    var ppeModel = new PPEResponseModel
                    {
                        Id = x.Id,
                        PropertyNumber = x.PropertyNumber,
                        Category = await _getTools.PPE.GetTblPPECategoryAsync(x.CategoryId, context),
                        Legend = await _getTools.PPE.GetTblPPELegendAsync(x.CategoryId, context),
                        Description = x.Description,
                        Brand = x.Brand,
                        Model = x.Model,
                        SerialNumber = x.SerialNumber,
                        UnitOfMeasurement = x.UnitOfMeasurement,
                        UnitValue = x.UnitValue,
                        DateAcquired = x.DateAcquired,
                        EstimatedUsefulLife = x.EstimatedUsefulLife,
                        Parts = await _getTools.PPE.GetTblPPEPartsByPPEId(x.Id, context).ToListAsync(),
                        Movements = await _getTools.PPE.GetTblPPEMovementsByPPEId(x.Id, context).ToListAsync(),
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt
                    };
                    ppesResponses.Add(ppeModel);
                }


                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed PPEs", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<PPEResponseModel>.OkPaginated(
                    ppesResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "PPEs have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/inventory/ppe/all
        [HttpGet("ppe/all/{ppeId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetPPE([FromQuery] SoloQueryParams model, [FromRoute] long ppeId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblPPE? ppe = await _getTools.PPE.GetTblPPEAsync(ppeId, context);
                var ppeResponses = new List<PPEResponseModel>();
                var ppeModel = new PPEResponseModel
                {
                    Id = ppe.Id,
                    PropertyNumber = ppe.PropertyNumber,
                    Category = await _getTools.PPE.GetTblPPECategoryAsync(ppe.CategoryId, context),
                    Legend = await _getTools.PPE.GetTblPPELegendAsync(ppe.CategoryId, context),
                    Description = ppe.Description,
                    Brand = ppe.Brand,
                    Model = ppe.Model,
                    SerialNumber = ppe.SerialNumber,
                    UnitOfMeasurement = ppe.UnitOfMeasurement,
                    UnitValue = ppe.UnitValue,
                    DateAcquired = ppe.DateAcquired,
                    EstimatedUsefulLife = ppe.EstimatedUsefulLife,
                    Parts = await _getTools.PPE.GetTblPPEPartsByPPEId(ppe.Id, context).ToListAsync(),
                    Movements = await _getTools.PPE.GetTblPPEMovementsByPPEId(ppe.Id, context).ToListAsync(),
                    IsActive = ppe.IsActive,
                    CreatedAt = ppe.CreatedAt
                };
                ppeResponses.Add(ppeModel);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed PPE information for PPE {ppe.Id}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<PPEResponseModel>.Ok(ppeResponses, "PPE have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/inventory/ppe/categories/all
        [HttpGet("ppe/category/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllPPECategories([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblPPECategory?> ppeCategories = await _getTools.PPE.GetTblPPECategories(context).ToListAsync();

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
                await AuditTrailTool.LogActivityAsync(_options, "Viewed PPE Categories", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<TblPPECategory>.OkPaginated(
                    ppeCategoriesResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "PPE Categories have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/inventory/ppe/categories/all
        [HttpGet("ppe/legend/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllPPELegends([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblPPELegend?> ppeLegends = await _getTools.PPE.GetTblPPELegends(context).ToListAsync();

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
                await AuditTrailTool.LogActivityAsync(_options, "Viewed PPE Legends", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<TblPPELegend>.OkPaginated(
                    ppeLegendResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "PPE Legends have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/inventory/se/all
        [HttpGet("se/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllSEs([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblSE?> ses = await _getTools.SE.GetTblSEs(context).ToListAsync();

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

                var sesResponses = new List<SEResponseModel>();

                foreach (var x in sesList)
                {
                    var seModel = new SEResponseModel
                    {
                        Id = x.Id,
                        PropertyNumber = x.PropertyNumber,
                        Category = await _getTools.SE.GetTblSECategoryAsync(x.CategoryId, context),
                        Legend = await _getTools.SE.GetTblSELegendAsync(x.CategoryId, context),
                        Description = x.Description,
                        Brand = x.Brand,
                        Model = x.Model,
                        SerialNumber = x.SerialNumber,
                        UnitOfMeasurement = x.UnitOfMeasurement,
                        UnitValue = x.UnitValue,
                        DateAcquired = x.DateAcquired,
                        Parts = await _getTools.SE.GetTblSEPartsBySEId(x.Id, context).ToListAsync(),
                        Movements = await _getTools.SE.GetTblSEMovementsBySEId(x.Id, context).ToListAsync(),
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt
                    };
                    sesResponses.Add(seModel);
                }


                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed SEs", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<SEResponseModel>.OkPaginated(
                    sesResponses,
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

        // GET api/inventory/se/all
        [HttpGet("se/all/{seId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetSE([FromQuery] SoloQueryParams model, [FromRoute] long seId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblSE? se = await _getTools.SE.GetTblSEAsync(seId, context);
                var seResponses = new List<SEResponseModel>();
                var seModel = new SEResponseModel
                {
                    Id = se.Id,
                    PropertyNumber = se.PropertyNumber,
                    Category = await _getTools.SE.GetTblSECategoryAsync(se.CategoryId, context),
                    Legend = await _getTools.SE.GetTblSELegendAsync(se.CategoryId, context),
                    Description = se.Description,
                    Brand = se.Brand,
                    Model = se.Model,
                    SerialNumber = se.SerialNumber,
                    UnitOfMeasurement = se.UnitOfMeasurement,
                    UnitValue = se.UnitValue,
                    DateAcquired = se.DateAcquired,
                    Parts = await _getTools.SE.GetTblSEPartsBySEId(se.Id, context).ToListAsync(),
                    Movements = await _getTools.SE.GetTblSEMovementsBySEId(se.Id, context).ToListAsync(),
                    IsActive = se.IsActive,
                    CreatedAt = se.CreatedAt
                };
                seResponses.Add(seModel);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed SE information for SE {se.Id}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<SEResponseModel>.Ok(seResponses, "SE have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/inventory/se/categories/all
        [HttpGet("se/category/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllSECategories([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblSECategory?> seCategories = await _getTools.SE.GetTblSECategories(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    seCategories = seCategories.Where(x =>
                        x.Name.ToLower().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    seCategories = seCategories.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    seCategories = seCategories.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = seCategories.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var seCategoryList = seCategories
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var seCategoriesResponses = seCategoryList;

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed SE Categories", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<TblSECategory>.OkPaginated(
                    seCategoriesResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "SE Categories have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/inventory/se/categories/all
        [HttpGet("se/legend/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllSELegends([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblSELegend?> seLegends = await _getTools.SE.GetTblSELegends(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    seLegends = seLegends.Where(x =>
                        x.Name.ToLower().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    seLegends = seLegends.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    seLegends = seLegends.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = seLegends.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var seLegendList = seLegends
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var seLegendResponses = seLegendList;

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed SE Legends", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<TblSELegend>.OkPaginated(
                    seLegendResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "SE Legends have been retrieved"
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
        [HttpPost("ppe/batch-upload")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> PPEBatchUpload([FromQuery] SoloQueryParams model, [Required] IFormFile file)
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

                    foreach (PPEPart part in item?.Parts ?? Enumerable.Empty<PPEPart>())
                    {
                        TblPPEPart newPart = new()
                        {
                            PPEId = ppeId,
                            Name = part.PartName,
                            SerialNumber = part.PartSerialNumber
                        };

                        await _editTools.PPE.EditTblPPEPartAsync(newPart, model.ActionBySystemUserId, context);
                    }

                    foreach (PPEAnnualCount movement in item?.AnnualCount ?? Enumerable.Empty<PPEAnnualCount>())
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

        [HttpPost("se/batch-upload")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> SEBatchUpload([FromQuery] SoloQueryParams model, [Required] IFormFile file)
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
                List<SEItem> items = _parserTools.ParseSeFile(file);
                if (!items.Any())
                    return Ok(new List<SEItem>());

                foreach (SEItem item in items)
                {
                    long ppeId = 0;
                    long categoryId = 0;
                    long legendId = 0;

                    if (!string.IsNullOrWhiteSpace(item.Category))
                    {
                        var category = await _getTools.SE.GetTblSECategoryByNameAsync(item.Category.Trim(), context);

                        if (category != null)
                        {
                            categoryId = category.Id;
                        }
                        else
                        {
                            TblSECategory newCategory = new()
                            {
                                Name = item.Category,
                                IsActive = true
                            };
                            categoryId = await _editTools.SE.EditTblSECategoryAsync(newCategory, model.ActionBySystemUserId, context);
                        }
                    }
                    if (!string.IsNullOrWhiteSpace(item.Legend))
                    {
                        var legend = await _getTools.SE.GetTblSELegendByNameAsync(item.Legend.Trim(), context);

                        if (legend != null)
                        {
                            legendId = legend.Id;
                        }
                        else
                        {
                            TblSELegend newLegend = new()
                            {
                                Name = item.Legend,
                                IsActive = true
                            };
                            legendId = await _editTools.SE.EditTblSELegendAsync(newLegend, model.ActionBySystemUserId, context);
                        }
                    }

                    TblSE newSE = new()
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
                        DateAcquired = item.DateAssigned
                    };

                    ppeId = await _editTools.SE.EditTblSEAsync(newSE, model.ActionBySystemUserId, context);

                    foreach (SEPart part in item?.Parts ?? Enumerable.Empty<SEPart>())
                    {
                        TblSEPart newPart = new()
                        {
                            SEId = ppeId,
                            Name = part.PartName,
                            SerialNumber = part.PartSerialNumber
                        };

                        await _editTools.SE.EditTblSEPartAsync(newPart, model.ActionBySystemUserId, context);
                    }

                    foreach (SEAnnualCount movement in item?.AnnualCount ?? Enumerable.Empty<SEAnnualCount>())
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
                            if (plantillaEmployee != null && string.IsNullOrEmpty(movement.NonPlantillaEmployeeId) && string.IsNullOrWhiteSpace(movement.ActualOfficeAndDivision))
                            {
                                if (plantillaEmployee.SystemUserId != null)
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

                        TblSEMovement newMovement = new()
                        {
                            SEId = ppeId,
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

                        await _editTools.SE.EditTblSEMovementAsync(newMovement, model.ActionBySystemUserId, context);
                    }

                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse<object>.Ok($"{items.Count()} SE items has been successfully migrated to the database"));
            }
            catch (Exception ex)
            {

                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request. Please check the template format."));

            }
        }

        // POST api/inventory/ppe/edit
        [HttpPost("ppe/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditPPE([FromBody] EditPPEQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblPPE ppe = new()
                {
                    Id = model.Id,
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
                    EstimatedUsefulLife = model.EstimatedUsefulLife,
                    IsActive = model.IsActive
                };

                long ppeId = await _editTools.PPE.EditTblPPEAsync(ppe, model.ActionBySystemUserId, context);

                UserSimplePublicResponseModel publicRM = new()
                {
                    SystemUserId = model.ActionBySystemUserId,
                    SessionKey = model.SessionKey
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(publicRM, $"PPE has been {(model.Id == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // POST api/inventory/ppe/part/edit
        [HttpPost("ppe/part/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditPPEPart([FromBody] EditPPEPartQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblPPEPart ppePart = new()
                {
                    Id = model.Id,
                    Name = model.Name,
                    SerialNumber = model.SerialNumber,
                    IsActive = model.IsActive
                };

                long ppePartId = await _editTools.PPE.EditTblPPEPartAsync(ppePart, model.ActionBySystemUserId, context);

                UserSimplePublicResponseModel publicRM = new()
                {
                    SystemUserId = model.ActionBySystemUserId,
                    SessionKey = model.SessionKey
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(publicRM, $"PPE Part has been {(model.Id == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // POST api/inventory/ppe/movement/edit
        [HttpPost("ppe/movement/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditPPEMovement([FromBody] EditPPEMovementQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblPPEMovement ppeMovement = new()
                {
                    Id = model.Id,
                    PPEId = model.PPEId,
                    DateAssigned = model.DateAssigned,
                    PARITRNumber = model.ParItrNumber,
                    PlantillaEmployeeId = model.PlantillaEmployeeId,
                    NonPlantillaEmployeeId = model.NonPlantillaEmployeeId,
                    ActualOfficeId = model.ActualOfficeId,
                    ActualDivisionId = model.ActualDivisionId,
                    Remarks = model.Condition,
                    IsActive = model.IsActive
                };

                long ppeMovementId = await _editTools.PPE.EditTblPPEMovementAsync(ppeMovement, model.ActionBySystemUserId, context);

                UserSimplePublicResponseModel publicRM = new()
                {
                    SystemUserId = model.ActionBySystemUserId,
                    SessionKey = model.SessionKey
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(publicRM, $"PPE Movement has been {(model.Id == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // POST api/inventory/se/edit
        [HttpPost("se/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditSE([FromBody] EditSEQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblSE se = new()
                {
                    Id = model.Id,
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

                long seId = await _editTools.SE.EditTblSEAsync(se, model.ActionBySystemUserId, context);

                UserSimplePublicResponseModel publicRM = new()
                {
                    SystemUserId = model.ActionBySystemUserId,
                    SessionKey = model.SessionKey
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(publicRM, $"SE has been {(model.Id == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // POST api/inventory/se/part/edit
        [HttpPost("se/part/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditSEPart([FromBody] EditSEPartQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblSEPart sePart = new()
                {
                    Id = model.Id,
                    Name = model.Name,
                    SerialNumber = model.SerialNumber,
                    IsActive = model.IsActive
                };

                long sePartId = await _editTools.SE.EditTblSEPartAsync(sePart, model.ActionBySystemUserId, context);

                UserSimplePublicResponseModel publicRM = new()
                {
                    SystemUserId = model.ActionBySystemUserId,
                    SessionKey = model.SessionKey
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(publicRM, $"SE Part has been {(model.Id == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // POST api/inventory/se/movement/edit
        [HttpPost("se/movement/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditSEMovement([FromBody] EditSEMovementQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblSEMovement seMovement = new()
                {
                    Id = model.Id,
                    SEId = model.SEId,
                    DateAssigned = model.DateAssigned,
                    PARITRNumber = model.ParItrNumber,
                    PlantillaEmployeeId = model.PlantillaEmployeeId,
                    NonPlantillaEmployeeId = model.NonPlantillaEmployeeId,
                    ActualOfficeId = model.ActualOfficeId,
                    ActualDivisionId = model.ActualDivisionId,
                    Remarks = model.Condition,
                    IsActive = model.IsActive
                };

                long seMovementId = await _editTools.SE.EditTblSEMovementAsync(seMovement, model.ActionBySystemUserId, context);

                UserSimplePublicResponseModel publicRM = new()
                {
                    SystemUserId = model.ActionBySystemUserId,
                    SessionKey = model.SessionKey
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(publicRM, $"SE Movement has been {(model.Id == 0 ? "added" : "updated")}"));

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
