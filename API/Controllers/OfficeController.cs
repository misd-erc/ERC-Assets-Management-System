using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Enums;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Services;
using PortalTools.Services;
using PortalTools.Services.DBO.Account;
using PortalTools.Services.DBO.Office;
using PortalCommon.Utilities;
using PortalCommon.Models.Responses;
using PortalCommon.Models.QueryParams.Office;
using PortalCommon.Models.QueryParams.Pagination;
using PortalCommon.Models.QueryParams.Universal;
using PortalCommon.Models.ResponseModels.Account;
using PortalCommon.Models.ResponseModels.Office;

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
        public async Task<IActionResult> GetAllOffices([FromQuery] PaginationGenericQueryParams query)
        {
            try
            {
                #region Token Validator
                if (!await _authTools.ValidateSessionTokenInternally(long.Parse(EncryptionHelper.Decrypt(query.ActionBySystemUserIdEncrypted))))
                    return Ok(ApiResponse<object>.SessionTokenExpired());
                #endregion

                IEnumerable<TblOffice?> offices = await _officeGetTools.GetTblOffices().ToListAsync();

                if (!string.IsNullOrWhiteSpace(query.SearchString))
                {
                    string searchLower = query.SearchString.ToLower();
                    offices = offices.Where(x =>
                        x.Name.ToLower().Contains(searchLower) ||
                        x.Acronym.ToLower().Contains(searchLower));
                }

                if (query.StartDate.HasValue)
                    offices = offices.Where(x => x.CreatedAt >= query.StartDate.Value);

                if (query.EndDate.HasValue)
                    offices = offices.Where(x => x.CreatedAt <= query.EndDate.Value);

                int totalCount = offices.Count();

                int skip = (query.PageNumber - 1) * query.PageSize;

                var officesList = offices
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(query.PageSize)
                    .ToList();

                List<OfficeResponseModel> officesResponses = officesList.Select(x => new OfficeResponseModel
                {
                    Id = x.Id,
                    Name = x.Name,
                    Acronym = x.Acronym,
                    CreatedAt = x.CreatedAt
                }).ToList();

                return Ok(ApiResponse<OfficeResponseModel>.OkPaginated(
                    officesResponses,
                    query.PageNumber,
                    query.PageSize,
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
        public async Task<IActionResult> GetOfficeByOfficeId([FromQuery] SoloQueryParams query, [FromRoute] long officeId)
        {
            try
            {
                #region Token Validator
                if (!await _authTools.ValidateSessionTokenInternally(long.Parse(EncryptionHelper.Decrypt(query.ActionBySystemUserIdEncrypted))))
                    return Ok(ApiResponse<object>.SessionTokenExpired());
                #endregion

                TblOffice? office = await _officeGetTools.GetTblOffice(officeId);

                DivisionResponseModel newOfficeResponse = new()
                {
                    Id = office.Id,
                    Name = office.Name,
                    Acronym = office.Acronym,
                    CreatedAt = office.CreatedAt
                };

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
        public async Task<IActionResult> GetAllDivisions([FromQuery] PaginationGenericQueryParams query)
        {
            try
            {
                #region Token Validator
                if (!await _authTools.ValidateSessionTokenInternally(long.Parse(EncryptionHelper.Decrypt(query.ActionBySystemUserIdEncrypted))))
                    return Ok(ApiResponse<object>.SessionTokenExpired());
                #endregion

                IEnumerable<VwDivision?> divisions = await _officeGetTools.GetVwDivisions().ToListAsync();

                if (!string.IsNullOrWhiteSpace(query.SearchString))
                {
                    string searchLower = query.SearchString.ToLower();
                    divisions = divisions.Where(x =>
                        x.Name.ToLower().Contains(searchLower) ||
                        x.Acronym.ToLower().Contains(searchLower) ||
                        x.OfficeName.ToLower().Contains(searchLower) ||
                        x.OfficeAcronym.ToLower().Contains(searchLower));
                }

                if (query.StartDate.HasValue)
                    divisions = divisions.Where(x => x.CreatedAt >= query.StartDate.Value);

                if (query.EndDate.HasValue)
                    divisions = divisions.Where(x => x.CreatedAt <= query.EndDate.Value);

                int totalCount = divisions.Count();

                int skip = (query.PageNumber - 1) * query.PageSize;

                var divisionsList = divisions
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(query.PageSize)
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

                return Ok(ApiResponse<VwDivisionResponseModel>.OkPaginated(
                    divisionsResponses,
                    query.PageNumber,
                    query.PageSize,
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
        public async Task<IActionResult> GetDivisionByDivisionId([FromQuery] SoloQueryParams query, [FromRoute] long divisionId)
        {
            try
            {
                #region Token Validator
                if (!await _authTools.ValidateSessionTokenInternally(long.Parse(EncryptionHelper.Decrypt(query.ActionBySystemUserIdEncrypted))))
                    return Ok(ApiResponse<object>.SessionTokenExpired());
                #endregion

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
        public async Task<IActionResult> GetAllEmploymentTypes([FromQuery] PaginationGenericQueryParams query)
        {
            try
            {
                #region Token Validator
                if (!await _authTools.ValidateSessionTokenInternally(long.Parse(EncryptionHelper.Decrypt(query.ActionBySystemUserIdEncrypted))))
                    return Ok(ApiResponse<object>.SessionTokenExpired());
                #endregion

                IEnumerable<TblEmploymentType?> employmentTypes = await _officeGetTools.GetTblEmploymentTypes().ToListAsync();

                if (!string.IsNullOrWhiteSpace(query.SearchString))
                {
                    string searchLower = query.SearchString.ToLower();
                    employmentTypes = employmentTypes.Where(x =>
                        x.Name.ToLower().Contains(searchLower));
                }

                if (query.StartDate.HasValue)
                    employmentTypes = employmentTypes.Where(x => x.CreatedAt >= query.StartDate.Value);

                if (query.EndDate.HasValue)
                    employmentTypes = employmentTypes.Where(x => x.CreatedAt <= query.EndDate.Value);

                int totalCount = employmentTypes.Count();

                int skip = (query.PageNumber - 1) * query.PageSize;

                var employmentTypesList = employmentTypes
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(query.PageSize)
                    .ToList();

                List<TblEmploymentType?> officesResponses = employmentTypesList;

                return Ok(ApiResponse<TblEmploymentType?>.OkPaginated(
                    officesResponses,
                    query.PageNumber,
                    query.PageSize,
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
        public async Task<IActionResult> GetAllEmploymentTypeByEmploymentTypeId([FromQuery] SoloQueryParams query, [FromRoute] long employmentTypeId)
        {
            try
            {
                #region Token Validator
                if (!await _authTools.ValidateSessionTokenInternally(long.Parse(EncryptionHelper.Decrypt(query.ActionBySystemUserIdEncrypted))))
                    return Ok(ApiResponse<object>.SessionTokenExpired());
                #endregion

                TblEmploymentType? employmentType = await _officeGetTools.GetTblEmploymentType(employmentTypeId);

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
        public async Task<IActionResult> GetAllPositions([FromQuery] PaginationGenericQueryParams query)
        {
            try
            {
                #region Token Validator
                if (!await _authTools.ValidateSessionTokenInternally(long.Parse(EncryptionHelper.Decrypt(query.ActionBySystemUserIdEncrypted))))
                    return Ok(ApiResponse<object>.SessionTokenExpired());
                #endregion

                IEnumerable<TblPosition?> positions = await _officeGetTools.GetTblPositions().ToListAsync();

                if (!string.IsNullOrWhiteSpace(query.SearchString))
                {
                    string searchLower = query.SearchString.ToLower();
                    positions = positions.Where(x =>
                        x.Name.ToLower().Contains(searchLower) ||
                        x.Acronym.ToLower().Contains(searchLower) ||
                        x.SalaryGrade.ToLower().Contains(searchLower));
                }

                if (query.StartDate.HasValue)
                    positions = positions.Where(x => x.CreatedAt >= query.StartDate.Value);

                if (query.EndDate.HasValue)
                    positions = positions.Where(x => x.CreatedAt <= query.EndDate.Value);

                int totalCount = positions.Count();

                int skip = (query.PageNumber - 1) * query.PageSize;

                var positionsList = positions
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(query.PageSize)
                    .ToList();

                List<TblPosition?> positionsResponses = positionsList;

                return Ok(ApiResponse<TblPosition?>.OkPaginated(
                    positionsList,
                    query.PageNumber,
                    query.PageSize,
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
        public async Task<IActionResult> GetPositionByPositionId([FromQuery] SoloQueryParams query, [FromRoute] long positionId)
        {
            try
            {
                #region Token Validator
                if (!await _authTools.ValidateSessionTokenInternally(long.Parse(EncryptionHelper.Decrypt(query.ActionBySystemUserIdEncrypted))))
                    return Ok(ApiResponse<object>.SessionTokenExpired());
                #endregion

                TblPosition? position = await _officeGetTools.GetTblPosition(positionId);

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
