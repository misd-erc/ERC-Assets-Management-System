using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Enums;
using PortalDB.Models.QueryParams.Office;
using PortalDB.Models.QueryParams.Pagination;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.ResponseModels.Account;
using PortalDB.Models.ResponseModels.Office;
using PortalDB.Models.Responses;
using PortalCommon.Utilities;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Services;
using PortalTools.Services;
using PortalTools.Services.DBO.Account;
using PortalTools.Services.DBO.Office;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OfficeController : ControllerBase
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly AccountGetTools _accountGetTools;
        private readonly AccountEditTools _accountEditTools;
        private readonly OfficeGetTools _officeGetTools;
        private readonly OfficeEditTools _officeEditTools;
        private readonly AuthTools _authTools;

        public OfficeController(AccountGetTools accountGetTools,
        AccountEditTools accountEditTools,
        DbContextOptions<PortalDbContext> options,
        OfficeGetTools officeGetTools,
        OfficeEditTools officeEditTools,
        AuthTools authTools)
        {
            _accountGetTools = accountGetTools;
            _accountEditTools = accountEditTools;
            _options = options;
            _authTools = authTools;
            _officeGetTools = officeGetTools;
            _officeEditTools = officeEditTools;
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

                IEnumerable<TblOffice?> offices = await _officeGetTools.GetTblOffices(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    offices = offices.Where(x =>
                        x.Name.ToLower().Contains(searchLower) ||
                        x.Acronym.ToLower().Contains(searchLower));
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
                        Acronym = x.Acronym,
                        Users = await _accountGetTools.GetTblSystemUsersByOfficeId(x.Id, context).ToListAsync(),
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
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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

                TblOffice? office = await _officeGetTools.GetTblOfficeAsync(officeId, context);

                VwOfficeResponseModel newOfficeResponse = new()
                {
                    Id = office.Id,
                    Name = office.Name,
                    Acronym = office.Acronym,
                    Users = await _accountGetTools.GetTblSystemUsersByOfficeId(office.Id, context).ToListAsync(),
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
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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

                IEnumerable<VwDivision?> divisions = await _officeGetTools.GetVwDivisions(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    divisions = divisions.Where(x =>
                        x.Name.ToLower().Contains(searchLower) ||
                        x.Acronym.ToLower().Contains(searchLower) ||
                        x.OfficeName.ToLower().Contains(searchLower) ||
                        x.OfficeAcronym.ToLower().Contains(searchLower));
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
                        Office = await _officeGetTools.GetTblOfficeAsync(x.OfficeId, context),
                        Users = await _accountGetTools.GetTblSystemUsersByDivisionId(x.Id.Value, context).ToListAsync(),
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
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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

                VwDivision? division = await _officeGetTools.GetVwDivisionAsync(divisionId, context);

                VwDivisionResponseModel divisionResponse = new ()
                {
                    Id = division.Id,
                    Name = division.Name,
                    Acronym = division.Acronym,
                    Users = await _accountGetTools.GetTblSystemUsersByDivisionId(division.Id.Value, context).ToListAsync(),
                    Office = await _officeGetTools.GetTblOfficeAsync(division.OfficeId, context),
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
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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

                IEnumerable<TblEmploymentType?> employmentTypes = await _officeGetTools.GetTblEmploymentTypes(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    employmentTypes = employmentTypes.Where(x =>
                        x.Name.ToLower().Contains(searchLower));
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

                var employmentTypesResponses = new List<VwOfficeResponseModel>();

                foreach (var x in employmentTypesList)
                {
                    var employmentTypeModel = new VwOfficeResponseModel
                    {
                        Id = x.Id,
                        Name = x.Name,
                        Users = await _accountGetTools.GetTblSystemUsersByEmploymentTypeId(x.Id, context).ToListAsync(),
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt
                    };
                    employmentTypesResponses.Add(employmentTypeModel);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed employment types", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<VwOfficeResponseModel?>.OkPaginated(
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
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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

                TblEmploymentType? employmentType = await _officeGetTools.GetTblEmploymentTypeAsync(employmentTypeId, context);

                VwEmploymentTypeResponseModel employmentTypeResponse = new()
                {
                    Id = employmentType.Id,
                    Name = employmentType.Name,
                    Users = await _accountGetTools.GetTblSystemUsersByEmploymentTypeId(employmentType.Id, context).ToListAsync(),
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
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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

                IEnumerable<TblPosition?> positions = await _officeGetTools.GetTblPositions(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    positions = positions.Where(x =>
                        x.Name.ToLower().Contains(searchLower) ||
                        x.Acronym.ToLower().Contains(searchLower) ||
                        x.SalaryGrade.ToLower().Contains(searchLower));
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
                        Users = await _accountGetTools.GetTblSystemUsersByPositionId(x.Id, context).ToListAsync(),
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
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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

                TblPosition? position = await _officeGetTools.GetTblPositionAsync(positionId, context);

                VwPositionResponseModel positionResponse = new()
                {
                    Id = position.Id,
                    Name = position.Name,
                    Acronym = position.Acronym,
                    SalaryGrade = position.SalaryGrade,
                    Users = await _accountGetTools.GetTblSystemUsersByPositionId(position.Id, context).ToListAsync(),
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
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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
                    Name = model.Name,
                    Acronym = model.Acronym,
                    IsActive = model.IsActive
                };

                long officeId = await _officeEditTools.EditTblOfficeAsync(office, context);

                UserSimplePublicResponseModel publicRM = new()
                {
                    SystemUserId = model.ActionBySystemUserId,
                    SessionKey = model.SessionKey
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(publicRM, $"Office has been {(model.OfficeId == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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

                long divisionId = await _officeEditTools.EditTblDivisionAsync(division, context);


                UserSimplePublicResponseModel publicRM = new()
                {
                    SystemUserId = model.ActionBySystemUserId,
                    SessionKey = model.SessionKey
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(publicRM, $"Division has been {(model.DivisionId == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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

                long employmentTypeId = await _officeEditTools.EditTblEmploymentTypeAsync(employmentType, context);

                UserSimplePublicResponseModel publicRM = new()
                {
                    SystemUserId = model.ActionBySystemUserId,
                    SessionKey = model.SessionKey
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(publicRM, $"Employment type has been {(model.EmploymentTypeId == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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

                long positionId = await _officeEditTools.EditTblPositionAsync(position, context);

                UserSimplePublicResponseModel publicRM = new()
                {
                    SystemUserId = model.ActionBySystemUserId,
                    SessionKey = model.SessionKey
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(publicRM, $"Position has been {(model.PositionId == 0? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion

    }
}
