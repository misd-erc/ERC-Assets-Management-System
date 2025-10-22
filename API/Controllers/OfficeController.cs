using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Enums;
using PortalCommon.QueryParams.Pagination;
using PortalCommon.QueryParams.Universal;
using PortalCommon.ResponseModels.Account;
using PortalCommon.ResponseModels.Office;
using PortalCommon.Responses;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Services;
using PortalTools.Services;
using PortalTools.Services.DBO.Account;
using PortalTools.Services.DBO.Office;
using PortalTools.Utilities;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OfficeController : ControllerBase
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly AccountGetTools _accountGetTools;
        private readonly OfficeGetTools _officeGetTools;
        private readonly AccountEditTools _accountEditTools;
        private readonly AuthTools _authTools;

        public OfficeController(AccountGetTools accountGetTools,
        AccountEditTools accountEditTools,
        DbContextOptions<PortalDbContext> options,
        OfficeGetTools officeGetTools,
        AuthTools authTools)
        {
            _accountGetTools = accountGetTools;
            _accountEditTools = accountEditTools;
            _options = options;
            _authTools = authTools;
            _officeGetTools = officeGetTools;
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
        #endregion

        #region POST

        #endregion

    }
}
