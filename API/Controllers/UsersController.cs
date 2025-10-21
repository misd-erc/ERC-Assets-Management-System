using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Enums;
using PortalCommon.QueryParams.Account;
using PortalCommon.QueryParams.OTP;
using PortalCommon.QueryParams.Pagination;
using PortalCommon.QueryParams.Session;
using PortalCommon.QueryParams.Universal;
using PortalCommon.ResponseModels.Account;
using PortalCommon.ResponseModels.Log.AuditTrail;
using PortalCommon.Responses;
using PortalCommon.Utilities;
using PortalCommon.ViewModels.Account;
using PortalCommon.ViewModels.SMTP;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Entities.LOG.AuditTrail;
using PortalDB.Services;
using PortalTools.Services;
using PortalTools.Services.DBO.Account;
using PortalTools.Services.LOG;
using PortalTools.Utilities;
using System.Diagnostics;
using System.Text.Json;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;
using static System.Net.WebRequestMethods;

namespace API.Controllers
{

    [Route("api/[controller]")]
    /*[Authorize]*/
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly AccountGetTools _accountGetTools;
        private readonly AccountEditTools _accountEditTools;
        private readonly AuthTools _authTools;

        public UsersController(AccountGetTools accountGetTools, 
            AccountEditTools accountEditTools,
            DbContextOptions<PortalDbContext> options,
            AuthTools authTools)
        {
            _accountGetTools = accountGetTools;
            _accountEditTools = accountEditTools;
            _options = options;
            _authTools = authTools;
        }

        #region GET

        // GET api/users/all
        [HttpGet("all")]
        public async Task<IActionResult> GetAllSystemUsers([FromQuery] PaginationGenericQueryParams query)
        {
            try
            {
                #region Token Validator
                if (!await _authTools.ValidateSessionTokenInternally(long.Parse(EncryptionHelper.Decrypt(query.ActionBySystemUserIdEncrypted))))
                    return Ok(ApiResponse<object>.SessionTokenExpired());
                #endregion

                IEnumerable<VwSystemUser?> users = await _accountGetTools.GetVwSystemUsers().ToListAsync();

                if (!string.IsNullOrWhiteSpace(query.SearchString))
                {
                    string searchLower = query.SearchString.ToLower();
                    users = users.Where(x =>
                        x.Email.ToLower().Contains(searchLower) ||
                        x.FirstName.ToLower().Contains(searchLower) ||
                        x.LastName.ToLower().Contains(searchLower) ||
                        x.SystemRoleName.ToLower().Contains(searchLower) ||
                        x.StatusName.ToLower().Contains(searchLower) ||
                        x.OfficeName.ToLower().Contains(searchLower) ||
                        x.OfficeAcronym.ToLower().Contains(searchLower) ||
                        x.DivisionName.ToLower().Contains(searchLower) ||
                        x.DivisionAcronym.ToLower().Contains(searchLower));
                }

                if (query.StartDate.HasValue)
                    users = users.Where(x => x.CreatedAt >= query.StartDate.Value);

                if (query.EndDate.HasValue)
                    users = users.Where(x => x.CreatedAt <= query.EndDate.Value);

                int totalCount = users.Count();

                int skip = (query.PageNumber - 1) * query.PageSize;

                var usersList = users
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(query.PageSize)
                    .ToList();

                List<UserBasicResponseModel> userBasicResponses = usersList.Select(x => new UserBasicResponseModel
                {
                    Id = x.Id,
                    FirstName = x.FirstName,
                    LastName = x.LastName,
                    Email = x.Email,
                    SystemRoleId = x.SystemRoleId,
                    SystemRoleName = x.SystemRoleName,
                    StatusId = x.StatusId,
                    StatusName = x.StatusName,
                    OfficeId = x.OfficeId,
                    OfficeName = x.OfficeName,
                    OfficeAcronym  = x.OfficeAcronym,
                    DivisionId = x.DivisionId,
                    DivisionName = x.DivisionName,
                    DivisionAcronym = x.DivisionAcronym,
                    IsActive = x.IsActive,
                    CreatedAt =  x.CreatedAt,
                    LastLoginAt = x.LastLoginAt
                }).ToList();

                return Ok(ApiResponse<UserBasicResponseModel>.OkPaginated(
                    userBasicResponses,
                    query.PageNumber,
                    query.PageSize,
                    totalCount,
                    "System users have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/users/all
        [HttpGet("all/{systemUserIdEncrypted}")]
        public async Task   <IActionResult> GetSystemUserBySystemUserId([FromQuery] SoloQueryParams query, [FromRoute] string systemUserIdEncrypted)
        {
            try
            {

                #region Token Validator
                if (!await _authTools.ValidateSessionTokenInternally(long.Parse(EncryptionHelper.Decrypt(query.ActionBySystemUserIdEncrypted))))
                    return Ok(ApiResponse<object>.SessionTokenExpired());
                #endregion

                VwSystemUser? user = await _accountGetTools.GetVwSystemUser(long.Parse(EncryptionHelper.Decrypt(systemUserIdEncrypted)));

                UserBasicResponseModel userBasicResponse = new UserBasicResponseModel
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    SystemRoleId = user.SystemRoleId,
                    SystemRoleName = user.SystemRoleName,
                    StatusId = user.StatusId,
                    StatusName = user.StatusName,
                    OfficeId = user.OfficeId,
                    OfficeName = user.OfficeName,
                    OfficeAcronym = user.OfficeAcronym,
                    DivisionId = user.DivisionId,
                    DivisionName = user.DivisionName,
                    DivisionAcronym = user.DivisionAcronym,
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt
                };

                return Ok(ApiResponse<object>.Ok(userBasicResponse, $"System user have been retrieved"));

            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion

        #region POST
        // POST api/users/validation
        [HttpPost("validation")]
        public async Task<IActionResult> ValidateUser([FromBody] UserValidationQueryParams model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.EntraIdEncrypted) || string.IsNullOrWhiteSpace(model.EmailEncrypted))
                return BadRequest(ApiResponse<object>.Fail(ErrorCodes.INVALID_INPUT, "Invalid request payload."));

            try
            {

                #region Transaction
                await using var context = new PortalDbContext(_options);
                await using var transaction = await context.Database.BeginTransactionAsync();

                TblSystemUser user = new()
                {
                    EntraId = long.Parse(EncryptionHelper.Decrypt(model.EntraIdEncrypted)),
                    FirstName = EncryptionHelper.Decrypt(model.FirstNameEncrypted),
                    LastName = EncryptionHelper.Decrypt(model.LastNameEncrypted),
                    Email = EncryptionHelper.Decrypt(model.EmailEncrypted),
                };

                user.Id = (await _accountGetTools.GetTblSystemUserByEntraIdAndEmail(user.EntraId, user.Email))?.Id ?? 0;

                long systemUserId = await _accountEditTools.EditTblSystemUserForLoginAsync(user, context);

                if (systemUserId > 0)
                {
                    #region OTP Generation
                    var (otp, expiry) = OTPHelper.GenerateTimedOTP(user.EntraId.ToString(), 3);

                    TblOneTimePassword otpGenerated = new()
                    {
                        SystemUserId = systemUserId,
                        OTP = otp,
                        ValidUntil = expiry
                    };
                    #endregion
                    #region OTP Insert
                    await _accountEditTools.AddTblOneTimePasswordAsync(otpGenerated, context);
                    #endregion
                    #region OTP Email Sender
                    EmailViewModel newEmail = new()
                    {
                        Email = user.Email,
                        Name = $"{user.FirstName} {user.LastName}",
                        Subject = "Your AMS One-Time Password (OTP)",
                        Body = $"Hello {user.FirstName},<br/><br/>Your One-Time Password (OTP) is: <strong>{otp}</strong><br/>This OTP is valid for 3 minutes.<br/><br/>If you did not request this, please contact support immediately.<br/><br/>Best regards,<br/>AMS Team"
                    };

                    await EmailHelper.SendEmailAsync(newEmail);

                    #endregion
                }
                else
                    throw new Exception("SystemUserId was not returned");

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                #endregion

                UserEncryptedPublicResponseModel publicVM = new()
                {
                    SystemUserIdEncrypted = EncryptionHelper.Encrypt(systemUserId.ToString()),
                };

                return Ok(ApiResponse<object>.Ok(publicVM, $"OTP has been sent to email address"));

            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }

        }

        // POST api/users/validation
        [HttpPost("edit")]
        public async Task<IActionResult> EditUser([FromBody] EditSystemUserQueryParams model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.SystemUserIdEncrypted) || string.IsNullOrWhiteSpace(model.SystemRoleIdEncrypted) 
                || string.IsNullOrWhiteSpace(model.StatusIdEncrypted) || string.IsNullOrWhiteSpace(model.IsActiveEncrypted) || string.IsNullOrWhiteSpace(model.ActionBySystemUserIdEncrypted))
                return BadRequest(ApiResponse<object>.Fail(ErrorCodes.INVALID_INPUT, "Invalid request payload."));

            try
            {

                #region Transaction
                await using var context = new PortalDbContext(_options);
                await using var transaction = await context.Database.BeginTransactionAsync();

                EditSystemUserViewModel user = new()
                {
                    Id = long.Parse(EncryptionHelper.Decrypt(model.SystemUserIdEncrypted)),
                    SystemRoleId = long.Parse(EncryptionHelper.Decrypt(model.SystemRoleIdEncrypted)),
                    StatusId = long.Parse(EncryptionHelper.Decrypt(model.StatusIdEncrypted)),
                    IsActive = bool.Parse(EncryptionHelper.Decrypt(model.IsActiveEncrypted)),
                    ActionBy = long.Parse(EncryptionHelper.Decrypt(model.ActionBySystemUserIdEncrypted))
                };

                #region Token Validator
                if (!await _authTools.ValidateSessionTokenInternally(user.ActionBy))
                    return Ok(ApiResponse<object>.SessionTokenExpired());
                #endregion

                long systemUserId = await _accountEditTools.EditTblSystemUserAsync(user, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                #endregion

                UserEncryptedPublicResponseModel publicVM = new()
                {
                    SystemUserIdEncrypted = EncryptionHelper.Decrypt(systemUserId.ToString())
                };

                return Ok(ApiResponse<object>.Ok(publicVM, $"System user account has been updated"));

            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }

        }

        // POST api/users/otp/re-send
        [HttpPost("otp/re-send")]
        public async Task<IActionResult> ResendOTP([FromBody] ResendOTPQueryParams model)
        {
            if (string.IsNullOrWhiteSpace(model.SystemUserIdEncrypted))
                return BadRequest(ApiResponse<object>.Fail(ErrorCodes.INVALID_INPUT, "Invalid request payload."));

            try
            {

                #region Transaction
                await using var context = new PortalDbContext(_options);
                await using var transaction = await context.Database.BeginTransactionAsync();

                TblSystemUser? user = await _accountGetTools.GetTblSystemUser(long.Parse(EncryptionHelper.Decrypt(model.SystemUserIdEncrypted)));

                if (user != null)
                {
                    #region OTP Generation
                    var (otp, expiry) = OTPHelper.GenerateTimedOTP(user.Id.ToString(), 3);

                    TblOneTimePassword otpGenerated = new()
                    {
                        SystemUserId = user.Id,
                        OTP = otp,
                        ValidUntil = expiry
                    };
                    #endregion
                    #region OTP Insert
                    await _accountEditTools.AddTblOneTimePasswordAsync(otpGenerated, context);
                    #endregion
                    #region OTP Email Sender
                    EmailViewModel newEmail = new()
                    {
                        Email = user.Email,
                        Name = $"{user.FirstName} {user.LastName}",
                        Subject = "Your AMS One-Time Password (OTP)",
                        Body = $"Hello {user.FirstName},<br/><br/>Your One-Time Password (OTP) is: <strong>{otp}</strong><br/>This OTP is valid for 3 minutes.<br/><br/>If you did not request this, please contact support immediately.<br/><br/>Best regards,<br/>AMS Team"
                    };

                    await EmailHelper.SendEmailAsync(newEmail);

                    #endregion
                }
                else {
                    throw new Exception("SystemUserId was not returned");
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                #endregion

                UserEncryptedPublicResponseModel publicVM = new()
                {
                    SystemUserIdEncrypted = EncryptionHelper.Encrypt(user.Id.ToString()),
                };

                return Ok(ApiResponse<object>.Ok(publicVM, $"OTP has been sent to email address"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }

        }

        // POST api/users/otp/validation
        [HttpPost("otp/validation")]
        public async Task<IActionResult> ValidateOTP([FromBody] OTPValidationQueryParams model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.SystemUserIdEncrypted) || string.IsNullOrWhiteSpace(model.OTPEncrypted))
                return BadRequest(ApiResponse<object>.Fail(ErrorCodes.INVALID_INPUT, "Invalid request payload."));

            try
            {
                TblOneTimePassword otpModel = new()
                {
                    SystemUserId = long.Parse(EncryptionHelper.Decrypt(model!.SystemUserIdEncrypted)),
                    OTP = long.Parse(EncryptionHelper.Decrypt(model.OTPEncrypted)),
                };

                bool isValid = await _accountGetTools.ValidateOTPAsync(otpModel);

                if (isValid)
                {
                    await using var context = new PortalDbContext(_options);
                    await using var transaction = await context.Database.BeginTransactionAsync();

                    var userInfo = await _accountGetTools.GetTblSystemUser(otpModel.SystemUserId);

                    TblSessionToken sessionToken = new()
                    {
                        SystemUserId = otpModel.SystemUserId,
                        Key = EncryptionHelper.Encrypt(DateTime.UtcNow.ToString()),
                        ValidUntil = DateTime.UtcNow.AddDays(1),
                        CreatedAt = DateTime.UtcNow
                    };

                    await _accountEditTools.AddTblSessionTokenAsync(sessionToken, context);

                    UserEncryptedPublicResponseModel publicVM = new()
                    {
                        SystemUserIdEncrypted = EncryptionHelper.Encrypt(model.SystemUserIdEncrypted)
                    };

                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(ApiResponse<object>.Ok(publicVM, $"OTP has been verified"));

                }
                else
                    return Ok(ApiResponse<object>.ValidationFailed($"Invalid OTP"));

            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        /*// POST api/users/expiry-token/validation
        [HttpPost("expiry-token/validation")]
        public async Task<IActionResult> ValidateSessionToken([FromBody] SessionTokenValidationQueryParams model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.KeyEncrypted) || string.IsNullOrWhiteSpace(model.SystemUserIdEncrypted))
                return BadRequest(ApiResponse<object>.Fail(ErrorCodes.INVALID_INPUT, "Invalid request payload."));

            try
            {
                TblSessionToken sessionTokenModel = new()
                {
                    Key = EncryptionHelper.Decrypt(model!.KeyEncrypted),
                    SystemUserId = long.Parse(EncryptionHelper.Decrypt(model.SystemUserIdEncrypted)),
                };

                bool isValid = await _accountGetTools.ValidateTokenSessionAsync(sessionTokenModel);

                if (isValid)
                {

                    var userInfo = await _accountGetTools.GetTblSystemUser(sessionTokenModel.SystemUserId);

                    UserEncryptedPublicResponseModel publicVM = new()
                    {
                        SystemUserIdEncrypted = EncryptionHelper.Encrypt(model.SystemUserIdEncrypted)
                    };

                    return Ok(ApiResponse<object>.Ok(publicVM, $"OTP has been verified"));

                }
                else
                    return Ok(ApiResponse<object>.ValidationFailed($"Session token expired"));

            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }*/

        #endregion

    }
}
