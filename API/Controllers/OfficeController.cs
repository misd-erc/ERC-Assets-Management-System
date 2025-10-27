using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Enums;
using PortalCommon.Models.QueryParams.Office;
using PortalCommon.Models.QueryParams.Pagination;
using PortalCommon.Models.QueryParams.Universal;
using PortalCommon.Models.ResponseModels.Account;
using PortalCommon.Models.ResponseModels.Office;
using PortalCommon.Models.Responses;
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
            try
            {

                IEnumerable<TblOffice?> offices = await _officeGetTools.GetTblOffices().ToListAsync();

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

                List<OfficeResponseModel> officesResponses = officesList.Select(x => new OfficeResponseModel
                {
                    Id = x.Id,
                    Name = x.Name,
                    Acronym = x.Acronym,
                    CreatedAt = x.CreatedAt
                }).ToList();

                await AuditTrailTool.LogActivityAsync(_options, "Viewed offices", actionBy: long.Parse(EncryptionHelper.Decrypt(model.ActionBySystemUserIdEncrypted)));
                return Ok(ApiResponse<OfficeResponseModel>.OkPaginated(
                    officesResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Offices have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/office/all/{officeId}
        [HttpGet("all/{officeId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        [DecodeRouteParameter(nameof(officeId))]
        public async Task<IActionResult> GetOfficeByOfficeId([FromQuery] SoloQueryParams model, [FromRoute] long officeId)
        {
            try
            {

                TblOffice? office = await _officeGetTools.GetTblOffice(officeId);

                DivisionResponseModel newOfficeResponse = new()
                {
                    Id = office.Id,
                    Name = office.Name,
                    Acronym = office.Acronym,
                    CreatedAt = office.CreatedAt
                };

                await AuditTrailTool.LogActivityAsync(_options, $"Viewed office information for office {officeId}", actionBy: long.Parse(EncryptionHelper.Decrypt(model.ActionBySystemUserIdEncrypted)));
                return Ok(ApiResponse<DivisionResponseModel>.Ok(newOfficeResponse, "Office have been retrieved"));

            }
            catch (Exception ex)
            {
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
            try
            {

                IEnumerable<VwDivision?> divisions = await _officeGetTools.GetVwDivisions().ToListAsync();

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

                List<VwDivisionResponseModel> divisionsResponses = divisionsList.Select(x => new VwDivisionResponseModel
                {
                    Id = x.Id,
                    OfficeId = x.OfficeId,
                    Name = x.Name,
                    Acronym = x.Acronym,
                    OfficeName = x.OfficeName,
                    OfficeAcronym = x.OfficeAcronym,
                    CreatedAt = x.CreatedAt
                }).ToList();

                await AuditTrailTool.LogActivityAsync(_options, "Viewed divisions", actionBy: long.Parse(EncryptionHelper.Decrypt(model.ActionBySystemUserIdEncrypted)));
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
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/office/division/all
        [HttpGet("division/all/{divisionId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        [DecodeRouteParameter(nameof(divisionId))]
        public async Task<IActionResult> GetDivisionByDivisionId([FromQuery] SoloQueryParams model, [FromRoute] long divisionId)
        {
            try
            {

                VwDivision? division = await _officeGetTools.GetVwDivision(divisionId);

                VwDivisionResponseModel divisionResponse = new ()
                {
                    Id = division.Id,
                    OfficeId = division.OfficeId,
                    Name = division.Name,
                    Acronym = division.Acronym,
                    OfficeName = division.OfficeName,
                    OfficeAcronym = division.OfficeAcronym,
                    CreatedAt = division.CreatedAt
                };

                await AuditTrailTool.LogActivityAsync(_options, $"Viewed division information for division {divisionId}", actionBy: long.Parse(EncryptionHelper.Decrypt(model.ActionBySystemUserIdEncrypted)));
                return Ok(ApiResponse<VwDivisionResponseModel>.Ok(divisionResponse, "Division have been retrieved"));

            }
            catch (Exception ex)
            {
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
            try
            {

                IEnumerable<TblEmploymentType?> employmentTypes = await _officeGetTools.GetTblEmploymentTypes().ToListAsync();

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

                List<TblEmploymentType?> officesResponses = employmentTypesList;

                await AuditTrailTool.LogActivityAsync(_options, "Viewed employment types", actionBy: long.Parse(EncryptionHelper.Decrypt(model.ActionBySystemUserIdEncrypted)));
                return Ok(ApiResponse<TblEmploymentType?>.OkPaginated(
                    officesResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Employment types have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/office/employment-types/all/{employmentTypeId}
        [HttpGet("employment-type/all/{employmentTypeId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        [DecodeRouteParameter(nameof(employmentTypeId))]
        public async Task<IActionResult> GetAllEmploymentTypeByEmploymentTypeId([FromQuery] SoloQueryParams model, [FromRoute] long employmentTypeId)
        {
            try
            {

                TblEmploymentType? employmentType = await _officeGetTools.GetTblEmploymentType(employmentTypeId);

                await AuditTrailTool.LogActivityAsync(_options, $"Viewed employment type information for employment type {employmentTypeId}", actionBy: long.Parse(EncryptionHelper.Decrypt(model.ActionBySystemUserIdEncrypted)));
                return Ok(ApiResponse<TblEmploymentType>.Ok(employmentType, "Employment type have been retrieved"));
            }
            catch (Exception ex)
            {
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
            try
            {

                IEnumerable<TblPosition?> positions = await _officeGetTools.GetTblPositions().ToListAsync();

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

                List<TblPosition?> positionsResponses = positionsList;

                await AuditTrailTool.LogActivityAsync(_options, "Viewed positions", actionBy: long.Parse(EncryptionHelper.Decrypt(model.ActionBySystemUserIdEncrypted)));
                return Ok(ApiResponse<TblPosition?>.OkPaginated(
                    positionsList,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Positions have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/office/position/all
        [HttpGet("position/all/{positionId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        [DecodeRouteParameter(nameof(positionId))]
        public async Task<IActionResult> GetPositionByPositionId([FromQuery] SoloQueryParams model, [FromRoute] long positionId)
        {
            try
            {

                TblPosition? position = await _officeGetTools.GetTblPosition(positionId);

                await AuditTrailTool.LogActivityAsync(_options, $"Viewed position information for position {positionId}", actionBy: long.Parse(EncryptionHelper.Decrypt(model.ActionBySystemUserIdEncrypted)));
                return Ok(ApiResponse<TblPosition>.Ok(position, "Employment type have been retrieved"));

            }
            catch (Exception ex)
            {
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
        public async Task<IActionResult> EditOffice([FromQuery] EditOfficeQueryParams model)
        {

            if (model == null || string.IsNullOrWhiteSpace(model.NameEncrypted) || string.IsNullOrWhiteSpace(model.AcronymEncrypted))
                return BadRequest(ApiResponse<object>.Fail(ErrorCodes.INVALID_INPUT, "Invalid request payload."));

            try
            {
                #region Transaction
                await using var context = new PortalDbContext(_options);
                await using var transaction = await context.Database.BeginTransactionAsync();

                TblOffice office = new()
                {
                    Id = string.IsNullOrEmpty(model.OfficeIdEncrypted) ? 0 : long.Parse(EncryptionHelper.Decrypt(model.OfficeIdEncrypted)),
                    Name = EncryptionHelper.Decrypt(model.NameEncrypted),
                    Acronym = EncryptionHelper.Decrypt(model.AcronymEncrypted)
                };

                long officeId = await _officeEditTools.EditTblOfficeAsync(office, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                #endregion

                UserEncryptedPublicResponseModel publicVM = new()
                {
                    SystemUserIdEncrypted = model.ActionBySystemUserIdEncrypted
                };

                return Ok(ApiResponse<object>.Ok(publicVM, $"Office has been {(string.IsNullOrEmpty(model.OfficeIdEncrypted) ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion

    }
}
