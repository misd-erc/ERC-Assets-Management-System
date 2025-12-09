using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalCommon.Utilities;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Models.QueryParams.Office;
using PortalDB.Models.QueryParams.Pagination;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.ResponseModels.Account;
using PortalDB.Models.ResponseModels.Office;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;
using PortalTools.Services.GetEditTools.DBO.Account;
using PortalTools.Services.GetEditTools.DBO.Office;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OfficeController : ControllerBase
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;
        private readonly IPortalEditTools _editTools;
        private readonly AuthTools _authTools;

        public OfficeController(DbContextOptions<PortalDbContext> options,
            IPortalGetTools getTools,
            IPortalEditTools editTools,
            AuthTools authTools)
            {
                _options = options;
                _getTools = getTools;
                _editTools = editTools;
                _authTools = authTools;
            }

        #region GET

        // GET api/office/all
        [HttpGet("all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllOffices([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblOffice?> offices = await _getTools.Office.GetTblOffices(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    offices = offices.Where(x =>
                        (x.Name ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Acronym ?? "").ToLowerInvariant().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    offices = offices.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    offices = offices.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = offices.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var officesList = offices
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var officesResponses = new List<VwOfficeResponseModel>();

                foreach (var x in officesList)
                {
                    var officeModel = new VwOfficeResponseModel
                    {
                        Id = x.Id,
                        Name = x.Name,
                        GeneralCode = x.GeneralCode,
                        Acronym = x.Acronym,
                        Users = await _getTools.Account.GetTblSystemUsersByOfficeId(x.Id, context).ToListAsync(),
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt
                    };
                    officesResponses.Add(officeModel);
                }


                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed offices", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<VwOfficeResponseModel>.OkPaginated(
                    officesResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Offices have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/office/all/{officeId}
        [HttpGet("all/{officeId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetOfficeByOfficeId([FromQuery] SoloQueryParams model, [FromRoute] long officeId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblOffice? office = await _getTools.Office.GetTblOfficeAsync(officeId, context);

                VwOfficeResponseModel newOfficeResponse = new()
                {
                    Id = office.Id,
                    Name = office.Name,
                    GeneralCode = office.GeneralCode,
                    Acronym = office.Acronym,
                    Users = await _getTools.Account.GetTblSystemUsersByOfficeId(office.Id, context).ToListAsync(),
                    IsActive = office.IsActive,
                    CreatedAt = office.CreatedAt
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed office information for office {officeId}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<VwOfficeResponseModel>.Ok(newOfficeResponse, "Office have been retrieved"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/office/division/all
        [HttpGet("division/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllDivisions([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<VwDivision?> divisions = await _getTools.Office.GetVwDivisions(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    divisions = divisions.Where(x =>
                        (x.Name ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Acronym ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.OfficeName ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.OfficeAcronym ?? "").ToLowerInvariant().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    divisions = divisions.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    divisions = divisions.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = divisions.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var divisionsList = divisions
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var divisionsResponses = new List<VwDivisionResponseModel>();

                foreach (var x in divisionsList)
                {
                    var divisionModel = new VwDivisionResponseModel
                    {
                        Id = x.Id,
                        Name = x.Name,
                        Acronym = x.Acronym,
                        Office = await _getTools.Office.GetTblOfficeAsync(x.OfficeId, context),
                        Users = await _getTools.Account.GetTblSystemUsersByDivisionId(x.Id.Value, context).ToListAsync(),
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt
                    };
                    divisionsResponses.Add(divisionModel);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed divisions", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<VwDivisionResponseModel>.OkPaginated(
                    divisionsResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Divisions have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/office/division/all
        [HttpGet("division/all/{divisionId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetDivisionByDivisionId([FromQuery] SoloQueryParams model, [FromRoute] long divisionId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                VwDivision? division = await _getTools.Office.GetVwDivisionAsync(divisionId, context);

                VwDivisionResponseModel divisionResponse = new ()
                {
                    Id = division.Id,
                    Name = division.Name,
                    Acronym = division.Acronym,
                    Users = await _getTools.Account.GetTblSystemUsersByDivisionId(division.Id.Value, context).ToListAsync(),
                    Office = await _getTools.Office.GetTblOfficeAsync(division.OfficeId, context),
                    IsActive = division.IsActive,
                    CreatedAt = division.CreatedAt
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed division information for division {divisionId}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<VwDivisionResponseModel>.Ok(divisionResponse, "Division have been retrieved"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/office/employment-types/all
        [HttpGet("employment-type/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllEmploymentTypes([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblEmploymentType?> employmentTypes = await _getTools.Office.GetTblEmploymentTypes(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    employmentTypes = employmentTypes.Where(x =>
                        (x.Name ?? "").ToLowerInvariant().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    employmentTypes = employmentTypes.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    employmentTypes = employmentTypes.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = employmentTypes.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var employmentTypesList = employmentTypes
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var employmentTypesResponses = new List<VwEmploymentTypeResponseModel>();

                foreach (var x in employmentTypesList)
                {
                    var employmentTypeModel = new VwEmploymentTypeResponseModel
                    {
                        Id = x.Id,
                        Name = x.Name,
                        Users = await _getTools.Account.GetTblSystemUsersByEmploymentTypeId(x.Id, context).ToListAsync(),
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt
                    };
                    employmentTypesResponses.Add(employmentTypeModel);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed employment types", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<VwEmploymentTypeResponseModel?>.OkPaginated(
                    employmentTypesResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Employment types have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/office/employment-types/all/{employmentTypeId}
        [HttpGet("employment-type/all/{employmentTypeId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllEmploymentTypeByEmploymentTypeId([FromQuery] SoloQueryParams model, [FromRoute] long employmentTypeId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblEmploymentType? employmentType = await _getTools.Office.GetTblEmploymentTypeAsync(employmentTypeId, context);

                VwEmploymentTypeResponseModel employmentTypeResponse = new()
                {
                    Id = employmentType.Id,
                    Name = employmentType.Name,
                    Users = await _getTools.Account.GetTblSystemUsersByEmploymentTypeId(employmentType.Id, context).ToListAsync(),
                    IsActive = employmentType.IsActive,
                    CreatedAt = employmentType.CreatedAt
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed employment type information for employment type {employmentTypeId}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<VwEmploymentTypeResponseModel>.Ok(employmentTypeResponse, "Employment type have been retrieved"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/office/positions/all
        [HttpGet("position/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllPositions([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblPosition?> positions = await _getTools.Office.GetTblPositions(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    positions = positions.Where(x =>
                        (x.Name ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Acronym ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.SalaryGrade ?? "").ToLowerInvariant().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    positions = positions.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    positions = positions.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = positions.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var positionsList = positions
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var positionsResponses = new List<VwPositionResponseModel>();

                foreach (var x in positionsList)
                {
                    var positionModel = new VwPositionResponseModel
                    {
                        Id = x.Id,
                        Name = x.Name,
                        Acronym = x.Acronym,
                        SalaryGrade = x.SalaryGrade,
                        Users = await _getTools.Account.GetTblSystemUsersByPositionId(x.Id, context).ToListAsync(),
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt
                    };
                    positionsResponses.Add(positionModel);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed positions", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<VwPositionResponseModel?>.OkPaginated(
                    positionsResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Positions have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/office/position/all
        [HttpGet("position/all/{positionId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetPositionByPositionId([FromQuery] SoloQueryParams model, [FromRoute] long positionId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblPosition? position = await _getTools.Office.GetTblPositionAsync(positionId, context);

                VwPositionResponseModel positionResponse = new()
                {
                    Id = position.Id,
                    Name = position.Name,
                    Acronym = position.Acronym,
                    SalaryGrade = position.SalaryGrade,
                    Users = await _getTools.Account.GetTblSystemUsersByPositionId(position.Id, context).ToListAsync(),
                    IsActive = position.IsActive,
                    CreatedAt = position.CreatedAt
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed position information for position {positionId}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<VwPositionResponseModel>.Ok(positionResponse, "Position have been retrieved"));

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

        // POST api/office/edit
        [HttpPost("edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditOffice([FromBody] EditOfficeQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblOffice office = new()
                {
                    Id = model.OfficeId,
                    GeneralCode = model.GeneralCode,
                    Name = model.Name,
                    Acronym = model.Acronym,
                    IsActive = model.IsActive
                };

                long officeId = await _editTools.Office.EditTblOfficeAsync(office, model.ActionBySystemUserId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(new { OfficeId = officeId }, $"Office has been {(model.OfficeId == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // POST api/office/division/edit
        [HttpPost("division/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditDivision([FromBody] EditDivisionQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblDivision division = new()
                {
                    Id = model.DivisionId,
                    Name = model.Name,
                    Acronym = model.Acronym,
                    OfficeId = model.OfficeId,
                    IsActive = model.IsActive
                };

                long divisionId = await _editTools.Office.EditTblDivisionAsync(division, model.ActionBySystemUserId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(new { DivisionId = divisionId }, $"Division has been {(model.DivisionId == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // POST api/office/employment-type/edit
        [HttpPost("employment-type/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditEmploymentType([FromBody] EditEmploymentTypeQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {


                TblEmploymentType employmentType = new()
                {
                    Id = model.EmploymentTypeId,
                    Name = model.Name,
                    IsActive = model.IsActive
                };

                long employmentTypeId = await _editTools.Office.EditTblEmploymentTypeAsync(employmentType, model.ActionBySystemUserId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(new { EmploymentTypeId = employmentTypeId }, $"Employment type has been {(model.EmploymentTypeId == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // POST api/office/employment-type/edit
        [HttpPost("position/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditPosition([FromBody] EditPositionQueryParams model)
        {

            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblPosition position = new()
                {
                    Id = model.PositionId,
                    Name = model.Name,
                    Acronym = model.Acronym,
                    SalaryGrade = model.SalaryGrade,
                    IsActive = model.IsActive
                };

                long positionId = await _editTools.Office.EditTblPositionAsync(position, model.ActionBySystemUserId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(new { PositionId = positionId }, $"Position has been {(model.PositionId == 0? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion

        #region DELETE

        // DELETE api/office/delete
        [HttpDelete("delete/{officeId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeleteOffice([FromQuery] SoloQueryParams model, [FromRoute] long officeId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                bool isDeleted = await _editTools.Office.DeleteTblOfficeAsync(officeId, model.ActionBySystemUserId, context);

                if(!isDeleted)
                    return Ok(ApiResponse<object>.Ok($"Unable to delete this office, try again later"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok($"Office has been deleted"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // DELETE api/office/division/delete
        [HttpDelete("division/delete/{divisionId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeleteDivision([FromQuery] SoloQueryParams model, [FromRoute] long divisionId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                bool isDeleted = await _editTools.Office.DeleteTblDivisionAsync(divisionId, model.ActionBySystemUserId, context);

                if (!isDeleted)
                    return Ok(ApiResponse<object>.Ok($"Unable to delete this division, try again later"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok($"Division has been deleted"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // DELETE api/office/employment-type/delete
        [HttpDelete("employment-type/delete/{employmentTypeId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeleteEmploymentType([FromQuery] SoloQueryParams model, [FromRoute] long employmentTypeId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                bool isDeleted = await _editTools.Office.DeleteTblEmploymentTypeAsync(employmentTypeId, model.ActionBySystemUserId, context);

                if (!isDeleted)
                    return Ok(ApiResponse<object>.Ok($"Unable to delete this employment type, try again later"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok($"Employment type has been deleted"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // DELETE api/office/position/delete
        [HttpDelete("position/delete/{positionId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeletePosition([FromQuery] SoloQueryParams model, [FromRoute] long positionId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                bool isDeleted = await _editTools.Office.DeleteTblPositionAsync(positionId, model.ActionBySystemUserId, context);

                if (!isDeleted)
                    return Ok(ApiResponse<object>.Ok($"Unable to delete this position, try again later"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok($"Position has been deleted"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion

    }
}
