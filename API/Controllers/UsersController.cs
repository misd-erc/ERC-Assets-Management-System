using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalCommon.Enums;
using PortalCommon.Utilities;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Module;
using PortalDB.Entities.DBO.Notification;
using PortalDB.Models.QueryParams.Account;
using PortalDB.Models.QueryParams.OTP;
using PortalDB.Models.QueryParams.Pagination;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.ResponseModels.Account;
using PortalDB.Models.Responses;
using PortalDB.Models.ViewModels.Account;
using PortalDB.Models.ViewModels.Email;
using PortalDB.Services;
using PortalTools.Services;
using PortalTools.Services.DBO.Account;
using PortalTools.Services.DBO.Notification;
using PortalTools.Services.DBO.Office;
using PortalTools.Services.DBO.Storage;
using PortalTools.Services.LOG;
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
		private readonly OfficeGetTools _officeGetTools;
		private readonly LogEditTools _logEditTools;
        private readonly NotificationGetTools _notificationGetTools;
        private readonly StorageGetTools _storageGetTools;
		private readonly AuthTools _authTools;

        public UsersController(AccountGetTools accountGetTools, 
            AccountEditTools accountEditTools,
            LogEditTools logEditTools,
            OfficeGetTools officeGetTools,
			NotificationGetTools notificationGetTools,
            DbContextOptions<PortalDbContext> options,
            StorageGetTools storageGetTools,
			AuthTools authTools)
        {
            _accountGetTools = accountGetTools;
            _accountEditTools = accountEditTools;
            _logEditTools = logEditTools;
            _options = options;
            _authTools = authTools;
            _notificationGetTools = notificationGetTools;
            _officeGetTools = officeGetTools;
            _storageGetTools = storageGetTools;
		}

        #region GET

        // GET api/users/all
        [HttpGet("all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllSystemUsers([FromQuery] PaginationGenericQueryParams model)
        {
			await using var context = new PortalDbContext(_options);
			await using var transaction = await context.Database.BeginTransactionAsync();

			try
            {

				IEnumerable<VwSystemUser?> users = await _accountGetTools.GetVwSystemUsers(context).ToListAsync();
                long systemUserId = await _accountGetTools.GetSystemUserIdBySessionKeyAsync(model.SessionKey, context);

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

                var userBasicResponses = new List<UserBasicResponseModel>();

                foreach (var x in usersList)
                {
                    var userBasicModel = new UserBasicResponseModel
                    {
                        Id = x.Id,
                        FirstName = x.FirstName,
                        LastName = x.LastName,
                        Email = x.Email,
                        EmployeeId = x.EmployeeId,
                        IsActive = x.IsActive,
                        SystemRole = await _accountGetTools.GetSystemRoleWithScopesAsListAsync(x.SystemRoleId, context),
                        SystemUserStatus = await _accountGetTools.GetSystemUserStatusAsync(x.StatusId, context),
                        Office = await _officeGetTools.GetTblOfficeAsync(x.OfficeId, context),
                        Division = await _officeGetTools.GetTblDivisionAsync(x.DivisionId, context),
                        ProfilePictureStorageFile = await _storageGetTools.GetTblFileStorageAsync(x.ProfilePictureFileStorageId, context),
                        CreatedAt = x.CreatedAt,
                        LastLoginAt = x.LastLoginAt
                    };
                    userBasicResponses.Add(userBasicModel);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

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
				await transaction.RollbackAsync();
				await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/users/all
        [HttpGet("all/{systemUserId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetSystemUserBySystemUserId([FromQuery] SoloQueryParams model, [FromRoute] long systemUserId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                VwSystemUser? user = await _accountGetTools.GetVwSystemUserAsync(systemUserId, context);

                UserBasicResponseModel userBasicResponse = new UserBasicResponseModel
                {
					Id = user.Id,
					FirstName = user.FirstName,
					LastName = user.LastName,
					Email = user.Email,
					EmployeeId = user.EmployeeId,
					IsActive = user.IsActive,
					SystemRole = await _accountGetTools.GetSystemRoleWithScopesAsListAsync(user.SystemRoleId, context),
					SystemUserStatus = await _accountGetTools.GetSystemUserStatusAsync(user.StatusId, context),
					Office = await _officeGetTools.GetTblOfficeAsync(user.OfficeId, context),
					Division = await _officeGetTools.GetTblDivisionAsync(user.DivisionId, context),
					ProfilePictureStorageFile = await _storageGetTools.GetTblFileStorageAsync(user.ProfilePictureFileStorageId, context),
					CreatedAt = user.CreatedAt,
					LastLoginAt = user.LastLoginAt
				};


                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed system user information for user {user.Id}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<object>.Ok(userBasicResponse, $"System user have been retrieved"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
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
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblSystemRole?> roles = await _accountGetTools.GetSystemRoles(context).ToListAsync();

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

                var roleEntities = rolesList.Select(x => new
                {
                    x.Id,
                    x.RoleName,
                    x.Description,
                    x.IsActive,
                    x.IsDeleted,
                    x.CreatedAt
                }).ToList();

                var roleResponses = new List<SystemRoleResponseModel>(roleEntities.Count);

                foreach (var r in roleEntities)
                {
                    roleResponses.Add(await _accountGetTools.GetSystemRoleWithScopesAsync(r.Id, context));
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed system roles", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<SystemRoleResponseModel>.OkPaginated(
                    roleResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "System roles have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
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
			await using var context = new PortalDbContext(_options);
			await using var transaction = await context.Database.BeginTransactionAsync();

			try
            {

                SystemRoleResponseModel? role = await _accountGetTools.GetSystemRoleWithScopesAsync(systemRoleId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed system role information for system role {role.Id}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<object>.Ok(role, $"System role have been retrieved"));

            }
            catch (Exception ex)
            {
				await transaction.RollbackAsync();
				await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/users/system-notification/all
        [HttpGet("system-notification/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllSystemNotifications([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblSystemNotification?> notifications = await _notificationGetTools.GetTblSystemNotifications(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    notifications = notifications.Where(x =>
                        x.Title.ToLower().Contains(searchLower) ||
                        x.Description.ToLower().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    notifications = notifications.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    notifications = notifications.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = notifications.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var notificationsList = notifications
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                List<TblSystemNotification> userBasicResponses = notificationsList.Select(x => new TblSystemNotification
                {
                    Id = x.Id,
                    Title = x.Title,
                    Description = x.Description,
                    SystemUserId = x.SystemUserId,
                    CreatedBySystemUserId = x.CreatedBySystemUserId,
                    IsDeleted = x.IsDeleted,
                    CreatedAt = x.CreatedAt
                }).ToList();

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed system notifications", actionBy: await _accountGetTools.GetSystemUserIdBySessionKeyAsync(model.SessionKey, context));
                return Ok(ApiResponse<TblSystemNotification>.OkPaginated(
                    userBasicResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "System notifications have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/users/system-notification/all/{systemUserId}/all
        [HttpGet("system-notification/all/{systemUserId}/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllSystemNotifications([FromQuery] PaginationGenericQueryParams model, [FromRoute] long systemUserId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();
            try
            {

                IEnumerable<TblSystemNotification?> notifications = await _notificationGetTools.GetTblSystemNotificationsByCreatedBySystemUserId(systemUserId, context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    notifications = notifications.Where(x =>
                        x.Title.ToLower().Contains(searchLower) ||
                        x.Description.ToLower().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    notifications = notifications.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    notifications = notifications.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = notifications.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var notificationsList = notifications
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                List<TblSystemNotification> userBasicResponses = notificationsList.Select(x => new TblSystemNotification
                {
                    Id = x.Id,
                    Title = x.Title,
                    Description = x.Description,
                    SystemUserId = x.SystemUserId,
                    CreatedBySystemUserId = x.CreatedBySystemUserId,
                    IsDeleted = x.IsDeleted,
                    CreatedAt = x.CreatedAt
                }).ToList();

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed system notifications for user {systemUserId}", actionBy: await _accountGetTools.GetSystemUserIdBySessionKeyAsync(model.SessionKey, context));
                return Ok(ApiResponse<TblSystemNotification>.OkPaginated(
                    userBasicResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "System notifications have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/users/system-role/all/{systemUserId}/all/{systemNotificationId}
        [HttpGet("system-notification/all/{systemUserId}/all/{systemNotificationId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetSystemNotification([FromQuery] SoloQueryParams model, [FromRoute] long systemUserId, [FromRoute] long systemNotificationId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();
            try
            {

                TblSystemNotification? notification = await _notificationGetTools.GetTblSystemNotificationAsync(systemNotificationId, context);
                TblSystemNotification notificationResponse = new TblSystemNotification
                {
                    Id = notification.Id,
                    Title = notification.Title,
                    Description = notification.Description,
                    SystemUserId = notification.SystemUserId,
                    CreatedBySystemUserId = notification.CreatedBySystemUserId,
                    IsDeleted = notification.IsDeleted,
                    CreatedAt = notification.CreatedAt
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed system notification information for system notification {notification.Id}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<object>.Ok(notificationResponse, $"System notification have been retrieved"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/users/system-modules/all
        [HttpGet("system-modules/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllSystemModules([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblSystemModule?> modules = await _accountGetTools.GetTblSystemModules(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    modules = modules.Where(x =>
                        x.Name.ToLower().Contains(searchLower) ||
                        x.Acronym.ToLower().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    modules = modules.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    modules = modules.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = modules.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var modulesList = modules
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                List<TblSystemModule> modulesResponses = modulesList.Select(x => new TblSystemModule
                {
                    Id = x.Id,
                    Name = x.Name,
                    Acronym = x.Acronym,
                    IsActive = x.IsActive,
                    IsDeleted = x.IsDeleted,
                    CreatedAt = x.CreatedAt
                }).ToList();

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed system modules", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<TblSystemModule>.OkPaginated(
                    modulesResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "System modules have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
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

            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblSystemUser user = new()
                {
                    EntraId = model.EntraId,
                    FirstName = model.FirstName,
                    LastName = model.LastName,
                    Email = model.Email,
                    EmployeeId = model.EmployeeId ?? null
                };

                user.Id = (await _accountGetTools.GetTblSystemUserByEntraIdAndEmailAsync(user.EntraId, user.Email, context))?.Id ?? 0;

                long systemUserId = await _accountEditTools.EditTblSystemUserForLoginAsync(user, context);

                //var (isAllowed, errorMsg, specificError) = await _authTools.ValidateUserStatusAsync(
                //    systemUserId,
                //    context,
                //    _options);

                //var adminQueryable = await _accountGetTools
                //.GetSystemUsersBySystemRoleWithContextAsync(TblSystemRole.ADMINISTRATOR.ToString(), context);

                //var adminIds = await adminQueryable
                //    .Select(u => u.Id)
                //    .ToListAsync();

                //if (!isAllowed) {
                //    await NotificationTools.CreateBatchNotificationsAsync(context, 
                //        NotificationConstants.LOGIN_ATTEMPT_FAILED, 
                //        $"Login attempt failed for {user.FirstName} {user.LastName} due to {specificError}",
                //        adminIds, 
                //        systemUserId);
                //    return StatusCode(401, ApiResponse<object>.Unauthorized(errorMsg!));
                //}

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
                    await EmailTools.SendSystemEmailAsync(
                        _options,
                        subject: EmailConstants.SUBJECT_OTP_EMAIL,
                        templateNameOrBody: EmailConstants.TEMPLATE_OTP_EMAIL,
                        recipient: user.Email,
                        model: new EmailViewModel
                        {
                            Name = user.FirstName,
                            Body = otp.ToString()
                        }
                    );

                    #endregion

                }
                else
                    throw new Exception("SystemUserId was not returned");

                UserSimplePublicResponseModel publicRM = new()
                {
                    SystemUserId = systemUserId
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Microsoft Entra information validated", actionBy: user.Id);
                return Ok(ApiResponse<object>.Ok(publicRM, $"OTP has been sent to email address"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
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

            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                EditSystemUserViewModel user = new()
                {
                    Id = model.SystemUserId,
                    SystemRoleId = model.SystemRoleId,
                    OfficeId = model.OfficeId,
                    DivisionId = model.DivisionId,
                    EmploymentTypeId = model.EmploymentTypeId,
                    PositionId = model.PositionId,
                    StatusId = model.StatusId,
                    IsActive = model.StatusId == TblSystemUserStatus.Dictionary[TblSystemUserStatus.ACTIVE] ? true : false,
                    ActionBySystemUserId = model.ActionBySystemUserId
                };

                TblSystemUser? oldUserInfo = await _accountGetTools.GetTblSystemUserAsync(user.Id, context);
                long systemUserId = await _accountEditTools.EditTblSystemUserAsync(user, context);

                UserSimplePublicResponseModel publicRM = new()
                {
                    SystemUserId = systemUserId,
                    SessionKey = model.SessionKey
                };

                if(oldUserInfo != null && oldUserInfo.StatusId != TblSystemUserStatus.Dictionary[TblSystemUserStatus.INACTIVE] && model.StatusId == TblSystemUserStatus.Dictionary[TblSystemUserStatus.INACTIVE])
                {
                    //email and notify user that the account is set to inactive
                    await NotificationTools.CreateNotificationAsync(context,
                        NotificationConstants.INACTIVE_ACCOUNT,
                        $"User account has been deactivated",
                        systemUserId,
                        model.ActionBySystemUserId);

                    await EmailTools.SendSystemEmailAsync(
                        _options,
                        subject: EmailConstants.SUBJECT_ACCOUNT_STATUS_UPDATE,
                        templateNameOrBody: EmailConstants.TEMPLATE_GENERAL_EMAIL,
                        recipient: oldUserInfo.Email,
                        model: new EmailViewModel
                        {
                            Name = oldUserInfo.FirstName,
                            Body = EmailConstants.BODY_INACTIVE_ACCOUNT
                        }
                    );
                }
                else if (oldUserInfo != null && oldUserInfo.StatusId != TblSystemUserStatus.Dictionary[TblSystemUserStatus.SUSPENDED] && model.StatusId == TblSystemUserStatus.Dictionary[TblSystemUserStatus.SUSPENDED])
                {
                    //email and notify user that the account is set to suspended
                    await NotificationTools.CreateNotificationAsync(context,
                        NotificationConstants.SUSPENDED_ACCOUNT,
                        $"User account has been suspended",
                        systemUserId,
                        model.ActionBySystemUserId);

                    await EmailTools.SendSystemEmailAsync(
                        _options,
                        subject: EmailConstants.SUBJECT_ACCOUNT_STATUS_UPDATE,
                        templateNameOrBody: EmailConstants.TEMPLATE_GENERAL_EMAIL,
                        recipient: oldUserInfo.Email,
                        model: new EmailViewModel
                        {
                            Name = oldUserInfo.FirstName,
                            Body = EmailConstants.BODY_SUSPENDED_ACCOUNT
                        }
                    );
                }
                else if (oldUserInfo != null && oldUserInfo.StatusId != TblSystemUserStatus.Dictionary[TblSystemUserStatus.ACTIVE] && model.StatusId == TblSystemUserStatus.Dictionary[TblSystemUserStatus.ACTIVE])
                {
                    //email and notify user that the account is set to active
                    await NotificationTools.CreateNotificationAsync(context,
                        NotificationConstants.ACTIVE_ACCOUNT,
                        $"User account has been activated",
                        systemUserId,
                        model.ActionBySystemUserId);

                    await EmailTools.SendSystemEmailAsync(
                        _options,
                        subject: EmailConstants.SUBJECT_ACCOUNT_STATUS_UPDATE,
                        templateNameOrBody: EmailConstants.TEMPLATE_GENERAL_EMAIL,
                        recipient: oldUserInfo.Email,
                        model: new EmailViewModel
                        {
                            Name = oldUserInfo.FirstName,
                            Body = EmailConstants.BODY_ACTIVE_ACCOUNT
                        }
                    );
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(publicRM, $"System user account has been {(model.SystemUserId == 0? "added":"updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }

        }

        // POST api/users/otp/re-send
        [HttpPost("otp/re-send")]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> ResendOTP([FromBody] ResendOTPQueryParams model)
        {

            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblSystemUser? user = await _accountGetTools.GetTblSystemUserAsync(model.SystemUserId, context);

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
                    await EmailTools.SendSystemEmailAsync(
                        _options,
                        subject: EmailConstants.SUBJECT_OTP_EMAIL,
                        templateNameOrBody: EmailConstants.TEMPLATE_OTP_EMAIL,
                        recipient: user.Email,
                        model: new EmailViewModel
                        {
                            Name = user.FirstName,
                            Body = otp.ToString()
                        }
                    );
                    #endregion
                }
                else {
                    throw new Exception("SystemUserId was not returned");
                }

                UserSimplePublicResponseModel publicRM = new()
                {
                    SystemUserId = user.Id
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Re-sent email otp", actionBy: user.Id);
                return Ok(ApiResponse<object>.Ok(publicRM, $"OTP has been sent to email address"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }

        }

        // POST api/users/otp/validation
        [HttpPost("otp/validation")]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> ValidateOTP([FromBody] OTPValidationQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                TblOneTimePassword otpModel = new()
                {
                    SystemUserId = model!.SystemUserId,
                    OTP = model.OTP
                };
                
                bool isValid = await _accountGetTools.ValidateOTPAsync(otpModel, context);

                if (isValid)
                {

                    var userInfo = await _accountGetTools.GetTblSystemUserAsync(otpModel.SystemUserId, context);

                    TblSessionToken sessionToken = new()
                    {
                        SystemUserId = otpModel.SystemUserId,
                        Key = EncryptionHelper.Encrypt(DateTime.UtcNow.ToString()),
                        ValidUntil = DateTime.UtcNow.AddDays(1),
                        CreatedAt = DateTime.UtcNow
                    };

                    await _accountEditTools.AddTblSessionTokenAsync(sessionToken, context);

                    UserSimplePublicResponseModel publicRM = new()
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
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion

    }
}
