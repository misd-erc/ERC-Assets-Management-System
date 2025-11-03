using API.Attributes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Graph.Models;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalCommon.Enums;
using PortalCommon.Models.QueryParams.Account;
using PortalCommon.Models.QueryParams.OTP;
using PortalCommon.Models.QueryParams.Pagination;
using PortalCommon.Models.QueryParams.Session;
using PortalCommon.Models.QueryParams.Universal;
using PortalCommon.Models.QueryParams.Uploader;
using PortalCommon.Models.ResponseModels.Account;
using PortalCommon. Models.ResponseModels.Log.AuditTrail;
using PortalCommon.Models.ResponseModels.Uploader;
using PortalCommon.Models.Responses;
using PortalCommon.Models.ViewModels.Account;
using PortalCommon.Models.ViewModels.Email;
using PortalCommon.Utilities;
using PortalCommon.Utilities;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Entities.DBO.Storage;
using PortalDB.Entities.LOG.AuditTrail;
using PortalDB.Services;
using PortalTools.Services;
using PortalTools.Services.DBO.Account;
using PortalTools.Services.LOG;
using System;
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
        private readonly LogEditTools _logEditTools;
        private readonly AuthTools _authTools;

        public UsersController(AccountGetTools accountGetTools, 
            AccountEditTools accountEditTools,
            LogEditTools logEditTools,
            DbContextOptions<PortalDbContext> options,
            AuthTools authTools)
        {
            _accountGetTools = accountGetTools;
            _accountEditTools = accountEditTools;
            _logEditTools = logEditTools;
            _options = options;
            _authTools = authTools;
        }

        #region GET

        // GET api/users/all
        [HttpGet("all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllSystemUsers([FromQuery] PaginationGenericQueryParams model)
        {
            try
            {

                IEnumerable<VwSystemUser?> users = await _accountGetTools.GetVwSystemUsers().ToListAsync();
                long systemUserId = await _accountGetTools.GetSystemUserIdBySessionKey(model.SessionKey);

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
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

                if (model.StartDate.HasValue)
                    users = users.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    users = users.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = users.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var usersList = users
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                List<UserBasicResponseModel> userBasicResponses = usersList.Select(x => new UserBasicResponseModel
                {
                    Id = x.Id,
                    FirstName = x.FirstName,
                    LastName = x.LastName,
                    Email = x.Email,
                    SystemRoleId = x.SystemRoleId,
                    SystemRoleName = x.SystemRoleName,
                    EmployeeId = x.EmployeeId,
                    StatusId = x.StatusId,
                    StatusName = x.StatusName,
                    OfficeId = x.OfficeId,
                    OfficeName = x.OfficeName,
                    OfficeAcronym  = x.OfficeAcronym,
                    DivisionId = x.DivisionId,
                    DivisionName = x.DivisionName,
                    DivisionAcronym = x.DivisionAcronym,
                    IsActive = x.IsActive,
                    ProfilePictureStorageFileId = x.ProfilePictureFileStorageId,
                    CreatedAt =  x.CreatedAt,
                    LastLoginAt = x.LastLoginAt
                }).ToList();

                await AuditTrailTool.LogActivityAsync(_options, "Viewed system users", actionBy: systemUserId);
                return Ok(ApiResponse<UserBasicResponseModel>.OkPaginated(
                    userBasicResponses,
                    model.PageNumber,
                    model.PageSize,
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
        [HttpGet("all/{systemUserId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task   <IActionResult> GetSystemUserBySystemUserId([FromQuery] SoloQueryParams model, [FromRoute] long systemUserId)
        {
            try
            {

                VwSystemUser? user = await _accountGetTools.GetVwSystemUser(systemUserId);

                UserBasicResponseModel userBasicResponse = new UserBasicResponseModel
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    SystemRoleId = user.SystemRoleId,
                    SystemRoleName = user.SystemRoleName,
                    EmployeeId = user.EmployeeId,
                    StatusId = user.StatusId,
                    StatusName = user.StatusName,
                    OfficeId = user.OfficeId,
                    OfficeName = user.OfficeName,
                    OfficeAcronym = user.OfficeAcronym,
                    DivisionId = user.DivisionId,
                    DivisionName = user.DivisionName,
                    DivisionAcronym = user.DivisionAcronym,
                    ProfilePictureStorageFileId = user.ProfilePictureFileStorageId,
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt
                };

                await AuditTrailTool.LogActivityAsync(_options, $"Viewed system user information for user {user.Id}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<object>.Ok(userBasicResponse, $"System user have been retrieved"));

            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/users/system-role/all
        [HttpGet("system-role/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllSystemRoles([FromQuery] PaginationGenericQueryParams model)
        {
            try
            {

                IEnumerable<TblSystemRole?> roles = await _accountGetTools.GetSystemRoles().ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    roles = roles.Where(x =>
                        x.RoleName.ToLower().Contains(searchLower) ||
                        x.Description.ToLower().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    roles = roles.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    roles = roles.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = roles.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var rolesList = roles
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                List<TblSystemRole> roleResponses = rolesList.Select(x => new TblSystemRole
                {
                    Id = x.Id,
                    RoleName = x.RoleName,
                    Description = x.Description,
                    IsActive = x.IsActive,
                    CreatedAt = x.CreatedAt
                }).ToList();

                await AuditTrailTool.LogActivityAsync(_options, "Viewed system roles", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<TblSystemRole>.OkPaginated(
                    roleResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "System roles have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/users/system-role/all
        [HttpGet("system-role/all/{systemRoleId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetSystemRoleBySystemRoleId([FromQuery] SoloQueryParams model, [FromRoute] long systemRoleId)
        {
            try
            {

                TblSystemRole? role = await _accountGetTools.GetSystemRole(systemRoleId);

                TblSystemRole roleResponse = new TblSystemRole
                {
                    Id = role.Id,
                    RoleName = role.RoleName,
                    Description = role.Description,
                    IsActive = role.IsActive,
                    CreatedAt = role.CreatedAt
                };

                await AuditTrailTool.LogActivityAsync(_options, $"Viewed system role information for system role {role.Id}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<object>.Ok(roleResponse, $"System role have been retrieved"));

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
        [ValidateModelRequiredFields]
        public async Task<IActionResult> ValidateUser([FromBody] UserValidationQueryParams model)
        {

            try
            {

                #region Transaction
                await using var context = new PortalDbContext(_options);
                await using var transaction = await context.Database.BeginTransactionAsync();

                TblSystemUser user = new()
                {
                    EntraId = model.EntraId,
                    FirstName = model.FirstName,
                    LastName = model.LastName,
                    Email = model.Email,
                    EmployeeId = model.EmployeeId ?? null
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
                    var renderer = new RazorRendererTools();

                    EmailViewModel otpEmailPreModel = new()
                    {
                        Subject = "Your AMS One-Time Password (OTP)",
                        Name = user.FirstName,
                        Body = otp.ToString()
                    };

                    string htmlBody = await renderer.RenderAsync("OTPEmailTemplate.cshtml", otpEmailPreModel);

                    EmailViewModel emailModel = new()
                    {
                        Emails = new List<string> { user.Email },
                        Name = $"{user.FirstName} {user.LastName}",
                        Subject = "Your AMS One-Time Password (OTP)",
                        Body = htmlBody,
                        IsHTML = true
                    };

                    await AzureTools.SendEmailAsync(emailModel, _options);

                    #endregion

                }
                else
                    throw new Exception("SystemUserId was not returned");

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                #endregion

                UserEncryptedPublicResponseModel publicRM = new()
                {
                    SystemUserId = systemUserId
                };

                await AuditTrailTool.LogActivityAsync(_options, $"Microsoft Entra information validated", actionBy: user.Id);
                return Ok(ApiResponse<object>.Ok(publicRM, $"OTP has been sent to email address"));

            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }

        }

        // POST api/users/validation
        [HttpPost("edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditUser([FromBody] EditSystemUserQueryParams model)
        {

            try
            {

                #region Transaction
                await using var context = new PortalDbContext(_options);
                await using var transaction = await context.Database.BeginTransactionAsync();

                EditSystemUserViewModel user = new()
                {
                    Id = model.SystemUserId,
                    SystemRoleId = model.SystemRoleId,
                    OfficeId = model.OfficeId,
                    DivisionId = model.DivisionId,
                    EmploymentTypeId = model.EmploymentTypeId,
                    PositionId = model.PositionId,
                    StatusId = model.StatusId,
                    IsActive = model.IsActive,
                    ActionBySystemUserId = model.ActionBySystemUserId
                };

                long systemUserId = await _accountEditTools.EditTblSystemUserAsync(user, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                #endregion

                UserEncryptedPublicResponseModel publicRM = new()
                {
                    SystemUserId = systemUserId,
                    SessionKey = model.SessionKey
                };

                return Ok(ApiResponse<object>.Ok(publicRM, $"System user account has been {(model.SystemUserId == 0? "added":"updated")}"));

            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }

        }

        // POST api/users/otp/re-send
        [HttpPost("otp/re-send")]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> ResendOTP([FromBody] ResendOTPQueryParams model)
        {

            try
            {

                #region Transaction
                await using var context = new PortalDbContext(_options);
                await using var transaction = await context.Database.BeginTransactionAsync();

                TblSystemUser? user = await _accountGetTools.GetTblSystemUser(model.SystemUserId);

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
                    var renderer = new RazorRendererTools();

                    EmailViewModel otpEmailPreModel = new()
                    {
                        Subject = "Your AMS One-Time Password (OTP)",
                        Name = user.FirstName,
                        Body = otp.ToString()
                    };

                    string htmlBody = await renderer.RenderAsync("OTPEmailTemplate.cshtml", otpEmailPreModel);

                    EmailViewModel emailModel = new()
                    {
                        Emails = new List<string> { user.Email },
                        Name = $"{user.FirstName} {user.LastName}",
                        Subject = "Your AMS One-Time Password (OTP)",
                        Body = htmlBody,
                        IsHTML = true
                    };

                    await AzureTools.SendEmailAsync(emailModel, _options);

                    #endregion
                }
                else {
                    throw new Exception("SystemUserId was not returned");
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                #endregion

                UserEncryptedPublicResponseModel publicRM = new()
                {
                    SystemUserId = user.Id
                };

                await AuditTrailTool.LogActivityAsync(_options, $"Re-sent email otp", actionBy: user.Id);
                return Ok(ApiResponse<object>.Ok(publicRM, $"OTP has been sent to email address"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }

        }

        // POST api/users/otp/validation
        [HttpPost("otp/validation")]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> ValidateOTP([FromBody] OTPValidationQueryParams model)
        {

            try
            {
                TblOneTimePassword otpModel = new()
                {
                    SystemUserId = model!.SystemUserId,
                    OTP = model.OTP
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

                    UserEncryptedPublicResponseModel publicRM = new()
                    {
                        SystemUserId = model.SystemUserId,
                        SessionKey = sessionToken.Key
                    };

                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    await AuditTrailTool.LogActivityAsync(_options, $"OTP has been verified", actionBy: sessionToken.SystemUserId);
                    await AuditTrailTool.LogActivityAsync(_options, $"Successfully logged in", actionBy: sessionToken.SystemUserId);
                    return Ok(ApiResponse<object>.Ok(publicRM, $"OTP has been verified"));

                }
                else
                await AuditTrailTool.LogActivityAsync(_options, $"OTP invalid", actionBy: otpModel.SystemUserId);
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

                    UserEncryptedPublicResponseModel publicRM = new()
                    {
                        SystemUserIdEncrypted = EncryptionHelper.Encrypt(model.SystemUserIdEncrypted)
                    };

                    return Ok(ApiResponse<object>.Ok(publicRM, $"OTP has been verified"));

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
