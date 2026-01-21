using API.Attributes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Graph.Models;
using Microsoft.Graph.Models.CallRecords;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalCommon.Utilities;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Module;
using PortalDB.Entities.DBO.Notification;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Models.QueryParams.Account;
using PortalDB.Models.QueryParams.OTP;
using PortalDB.Models.QueryParams.Pagination;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.ResponseModels.Account;
using PortalDB.Models.Responses;
using PortalDB.Models.ViewModels.Account;
using PortalDB.Models.ViewModels.Email;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;
using System.ComponentModel.DataAnnotations;
using static System.Net.WebRequestMethods;

namespace API.Controllers
{

    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;
        private readonly IPortalEditTools _editTools;
		private readonly AuthTools _authTools;

        public UsersController(DbContextOptions<PortalDbContext> options,
            IPortalGetTools get, 
            IPortalEditTools edit,
            AuthTools authTools)
        {
            _options = options;
            _getTools = get;
            _editTools = edit;
            _authTools = authTools;
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

				IEnumerable<VwSystemUser?> users = await _getTools.Account.GetVwSystemUsers(context).ToListAsync();
                long systemUserId = await _getTools.Account.GetSystemUserIdBySessionKeyAsync(model.SessionKey, context);

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    users = users.Where(x =>
                        (x.Email ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.FirstName ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.LastName ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.SystemRoleName ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.StatusName ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.OfficeName ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.OfficeAcronym ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.DivisionName ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.DivisionAcronym ?? "").ToLowerInvariant().Contains(searchLower));
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
                        SystemRole = await _getTools.Account.GetSystemRoleWithScopesAsListAsync(x.SystemRoleId, context),
                        SystemUserStatus = await _getTools.Account.GetSystemUserStatusAsync(x.StatusId, context),
                        Office = await _getTools.Office.GetTblOfficeAsync(x.OfficeId, context),
                        Division = await _getTools.Office.GetTblDivisionAsync(x.DivisionId, context),
                        EmploymentType = await _getTools.Office.GetTblEmploymentTypeAsync(x.EmploymentTypeId ?? 0, context),
                        Position = await _getTools.Office.GetTblPositionAsync(x.PositionId ?? 0, context),
                        ProfilePictureStorageFile = await _getTools.Storage.GetTblFileStorageAsync(x.ProfilePictureFileStorageId, context),
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
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/users/employees/all
        [HttpGet("employees/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllEmployees([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblEmployee?> employees = await _getTools.Account.GetEmployees(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    employees = employees.Where(x =>
                        (x.FirstName ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.MiddleName ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.LastName ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.SuffixName ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.EmployeeIdOriginal ?? "").ToLowerInvariant().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    employees = employees.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    employees = employees.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = employees.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var employeesList = employees
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var employeeResponses = new List<EmployeeResponseModel>();

                foreach (var x in employeesList)
                {
                    var userBasicModel = new EmployeeResponseModel
                    {
                        Id = x.Id,
                        SystemUser = x.SystemUserId.HasValue ? await _getTools.Account.GetTblSystemUserAsync(x.SystemUserId.Value, context) : null,
                        FirstName = x.FirstName,
                        MiddleName = x.MiddleName,
                        LastName = x.LastName,
                        SuffixName = x.SuffixName,
                        EmployeeIdOriginal = x.EmployeeIdOriginal,
                        Office = await _getTools.Office.GetTblOfficeAsync(x.OfficeId, context),
                        Division = await _getTools.Office.GetTblDivisionAsync(x.DivisionId, context),
                        EmploymentType = await _getTools.Office.GetTblEmploymentTypeAsync(x.EmploymentTypeId ?? 0, context),
                        Position = await _getTools.Office.GetTblPositionAsync(x.PositionId ?? 0, context),
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt,
                    };
                    employeeResponses.Add(userBasicModel);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                await AuditTrailTool.LogActivityAsync(_options, "Viewed employees", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<EmployeeResponseModel>.OkPaginated(
                    employeeResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Employees have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/users/employees/all
        [HttpGet("employees/all/{employeeId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetEmployee([FromQuery] SoloQueryParams model, [Required] long employeeId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblEmployee? employee = await _getTools.Account.GetTblEmployeeAsync(employeeId, context);

                var employeeResponse = new List<EmployeeResponseModel>
                {
                    new EmployeeResponseModel
                    {
                        Id = employee.Id,
                        SystemUser = employee.SystemUserId.HasValue
                            ? await _getTools.Account.GetTblSystemUserAsync(employee.SystemUserId.Value, context)
                            : null,
                        FirstName = employee.FirstName,
                        MiddleName = employee.MiddleName,
                        LastName = employee.LastName,
                        SuffixName = employee.SuffixName,
                        EmployeeIdOriginal = employee.EmployeeIdOriginal,
                        Office = await _getTools.Office.GetTblOfficeAsync(employee.OfficeId, context),
                        Division = await _getTools.Office.GetTblDivisionAsync(employee.DivisionId, context),
                        EmploymentType = await _getTools.Office.GetTblEmploymentTypeAsync(employee.EmploymentTypeId ?? 0, context),
                        Position = await _getTools.Office.GetTblPositionAsync(employee.PositionId ?? 0, context),
                        IsActive = employee.IsActive,
                        CreatedAt = employee.CreatedAt
                    }
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                await AuditTrailTool.LogActivityAsync(_options, $"Viewed employee information for employee {employeeId}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<EmployeeResponseModel>.Ok(
                    employeeResponse,
                    "Employees have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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

                VwSystemUser? user = await _getTools.Account.GetVwSystemUserAsync(systemUserId, context);

                UserBasicResponseModel userBasicResponse = new UserBasicResponseModel
                {
					Id = user.Id,
					FirstName = user.FirstName,
					LastName = user.LastName,
					Email = user.Email,
					EmployeeId = user.EmployeeId,
					IsActive = user.IsActive,
					SystemRole = await _getTools.Account.GetSystemRoleWithScopesAsListAsync(user.SystemRoleId, context),
					SystemUserStatus = await _getTools.Account.GetSystemUserStatusAsync(user.StatusId, context),
					Office = await _getTools.Office.GetTblOfficeAsync(user.OfficeId, context),
					Division = await _getTools.Office.GetTblDivisionAsync(user.DivisionId, context),
					EmploymentType = await _getTools.Office.GetTblEmploymentTypeAsync(user.EmploymentTypeId ?? 0, context),
					Position = await _getTools.Office.GetTblPositionAsync(user.PositionId ?? 0, context),
					ProfilePictureStorageFile = await _getTools.Storage.GetTblFileStorageAsync(user.ProfilePictureFileStorageId, context),
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
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        //     // GET api/users/system-role/all
   //     [HttpGet("system-role/all")]
   //     [ValidateSessionToken]
   //     [ValidateModelRequiredFields]
   //     public async Task<IActionResult> GetAllSystemRoles([FromQuery] PaginationGenericQueryParams model)
   //     {
   //         await using var context = new PortalDbContext(_options);
   //         await using var transaction = await context.Database.BeginTransactionAsync();

   //         try
   //         {

   //             IEnumerable<TblSystemRole?> roles = await _getTools.Account.GetSystemRoles(context).ToListAsync();

   //             if (!string.IsNullOrWhiteSpace(model.SearchString))
   //             {
   //                 string searchLower = model.SearchString.ToLower();
   //                 roles = roles.Where(x =>
   //                     x.RoleName.ToLower().Contains(searchLower) ||
   //                     x.Description.ToLower().Contains(searchLower));
   //             }

   //             if (model.StartDate.HasValue)
   //                 roles = roles.Where(x => x.CreatedAt >= model.StartDate.Value);

   //             if (model.EndDate.HasValue)
   //                 roles = roles.Where(x => x.CreatedAt <= model.EndDate.Value);

   //             int totalCount = roles.Count();

   //             int skip = (model.PageNumber - 1) * model.PageSize;

   //             var rolesList = roles
   //                 .OrderByDescending(x => x.CreatedAt)
   //                 .Skip(skip)
   //                 .Take(model.PageSize)
   //                 .ToList();

   //             var roleEntities = rolesList.Select(x => new
   //             {
   //                 x.Id,
   //                 x.RoleName,
   //                 x.Description,
   //                 x.IsActive,
   //                 x.IsDeleted,
   //                 x.CreatedAt
   //             }).ToList();

   //             var roleResponses = new List<SystemRoleResponseModel>(roleEntities.Count);

   //             foreach (var r in roleEntities)
   //             {
   //                 roleResponses.Add(await _getTools.Account.GetSystemRoleWithScopesAsync(r.Id, context));
   //             }

   //             await context.SaveChangesAsync();
   //             await transaction.CommitAsync();
   //             await AuditTrailTool.LogActivityAsync(_options, "Viewed system roles", actionBy: model.ActionBySystemUserId);
   //             return Ok(ApiResponse<SystemRoleResponseModel>.OkPaginated(
   //                 roleResponses,
   //                 model.PageNumber,
   //                 model.PageSize,
   //                 totalCount,
   //                 "System roles have been retrieved"
   //             ));

   //         }
   //         catch (Exception ex)
   //         {
   //             await transaction.RollbackAsync();
   //             await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
   //            return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
   //         }
   //     }

   //     // GET api/users/system-role/all
   //     [HttpGet("system-role/all/{systemRoleId}")]
   //     [ValidateSessionToken]
   //     [ValidateModelRequiredFields]
   //     public async Task<IActionResult> GetSystemRoleBySystemRoleId([FromQuery] SoloQueryParams model, [FromRoute] long systemRoleId)
   //     {
			//await using var context = new PortalDbContext(_options);
			//await using var transaction = await context.Database.BeginTransactionAsync();

			//try
   //         {

   //             SystemRoleResponseModel? role = await _getTools.Account.GetSystemRoleWithScopesAsync(systemRoleId, context);

   //             await context.SaveChangesAsync();
   //             await transaction.CommitAsync();
   //             await AuditTrailTool.LogActivityAsync(_options, $"Viewed system role information for system role {role.Id}", actionBy: model.ActionBySystemUserId);
   //             return Ok(ApiResponse<object>.Ok(role, $"System role have been retrieved"));

   //         }
   //         catch (Exception ex)
   //         {
			//	await transaction.RollbackAsync();
			//	await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
   //            return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
   //         }
   //     }

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

                IEnumerable<TblSystemNotification?> notifications = await _getTools.Notification.GetTblSystemNotifications(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    notifications = notifications.Where(x =>
                        (x.Title ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Description ?? "").ToLowerInvariant().Contains(searchLower));
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
                await AuditTrailTool.LogActivityAsync(_options, "Viewed system notifications", actionBy: await _getTools.Account.GetSystemUserIdBySessionKeyAsync(model.SessionKey, context));
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
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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

                IEnumerable<TblSystemNotification?> notifications = await _getTools.Notification.GetTblSystemNotificationsByCreatedBySystemUserId(systemUserId, context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    notifications = notifications.Where(x =>
                        (x.Title ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Description ?? "").ToLowerInvariant().Contains(searchLower));
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
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed system notifications for user {systemUserId}", actionBy: await _getTools.Account.GetSystemUserIdBySessionKeyAsync(model.SessionKey, context));
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
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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

                TblSystemNotification? notification = await _getTools.Notification.GetTblSystemNotificationAsync(systemNotificationId, context);
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
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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

                IEnumerable<TblSystemModule?> modules = await _getTools.Account.GetTblSystemModules(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    modules = modules.Where(x =>
                        (x.Name ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Acronym ?? "").ToLowerInvariant().Contains(searchLower));
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
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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

                user.Id = (await _getTools.Account.GetTblSystemUserByEntraIdAndEmailAsync(user.EntraId, user.Email, context))?.Id ?? 0;

                long systemUserId = await _editTools.Account.EditTblSystemUserForLoginAsync(user, context);

                //var (isAllowed, errorMsg, specificError) = await _authTools.ValidateUserStatusAsync(
                //    systemUserId,
                //    context,
                //    _options);

                //var adminQueryable = await _getTools.Account
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
                //    return StatusCode(ApiStatusCode.Unauthorized, ApiResponse<object>.Unauthorized(errorMsg!));
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
                    await _editTools.Account.AddTblOneTimePasswordAsync(otpGenerated, context);
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

                return Ok(ApiResponse<object>.Ok(publicRM, $"OTP has been sent to email address"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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

                TblSystemUser? oldUserInfo = await _getTools.Account.GetTblSystemUserAsync(user.Id, context);
                long systemUserId = await _editTools.Account.EditTblSystemUserAsync(user, context);

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
                return Ok(ApiResponse<object>.Ok(new { SystemUserId = systemUserId }, $"System user account has been {(model.SystemUserId == 0? "added":"updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }

        }

        // POST api/users/employees/edit
        [HttpPost("employees/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditEmployee([FromBody] EditEmployeeBatchQueryParams batchModel)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                if (batchModel?.Model == null || !batchModel.Model.Any())
                {
                    await transaction.RollbackAsync();
                    return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.ValidationFailed("No employee records provided"));
                }

                var results = new List<object>();

                foreach (var model in batchModel.Model)
                {
                    // Validate that EmployeeIdOriginal is not empty
                    if (string.IsNullOrWhiteSpace(model.EmployeeIdOriginal))
                    {
                        results.Add(new { 
                            error = true, 
                            employeeIdOriginal = model.EmployeeIdOriginal, 
                            message = "EmployeeIdOriginal is required" 
                        });
                        continue;
                    }

                    // Search for office by name (only if provided)
                    TblOffice? office = null;
                    if (!string.IsNullOrWhiteSpace(model.OfficeName))
                    {
                        office = await context.TblOffices
                            .AsNoTracking()
                            .Where(x => !x.IsDeleted && x.Name == model.OfficeName)
                            .FirstOrDefaultAsync();

                        if (office == null)
                        {
                            results.Add(new { 
                                error = true, 
                                employeeIdOriginal = model.EmployeeIdOriginal, 
                                message = $"Office '{model.OfficeName}' not found" 
                            });
                            continue;
                        }
                    }

                    // Search for division by name (only if provided)
                    TblDivision? division = null;
                    if (!string.IsNullOrWhiteSpace(model.DivisionName))
                    {
                        division = await context.TblDivisions
                            .AsNoTracking()
                            .Where(x => !x.IsDeleted && x.Name == model.DivisionName)
                            .FirstOrDefaultAsync();

                        if (division == null)
                        {
                            results.Add(new { 
                                error = true, 
                                employeeIdOriginal = model.EmployeeIdOriginal, 
                                message = $"Division '{model.DivisionName}' not found" 
                            });
                            continue;
                        }
                    }

                    // Search for employment type by name (if provided)
                    TblEmploymentType? employmentType = null;
                    if (!string.IsNullOrWhiteSpace(model.EmploymentTypeName))
                    {
                        employmentType = await context.TblEmploymentTypes
                            .AsNoTracking()
                            .Where(x => !x.IsDeleted && x.Name == model.EmploymentTypeName)
                            .FirstOrDefaultAsync();

                        if (employmentType == null)
                        {
                            results.Add(new { 
                                error = true, 
                                employeeIdOriginal = model.EmployeeIdOriginal, 
                                message = $"Employment Type '{model.EmploymentTypeName}' not found" 
                            });
                            continue;
                        }
                    }

                    // Search for position by name (if provided)
                    TblPosition? position = null;
                    if (!string.IsNullOrWhiteSpace(model.PositionName))
                    {
                        position = await context.TblPositions
                            .AsNoTracking()
                            .Where(x => !x.IsDeleted && x.Name == model.PositionName)
                            .FirstOrDefaultAsync();

                        if (position == null)
                        {
                            results.Add(new { 
                                error = true, 
                                employeeIdOriginal = model.EmployeeIdOriginal, 
                                message = $"Position '{model.PositionName}' not found" 
                            });
                            continue;
                        }
                    }

                    TblEmployee? existingEmployee = null;
                    long employeeId = 0;
                    bool isInsert = false;

                    // Check if employee exists by EmployeeIdOriginal
                    if (!string.IsNullOrWhiteSpace(model.EmployeeIdOriginal))
                    {
                        existingEmployee = await context.TblEmployees
                            .Where(x => !x.IsDeleted && x.EmployeeIdOriginalEncrypted == EncryptionHelper.Encrypt(model.EmployeeIdOriginal))
                            .FirstOrDefaultAsync();
                    }

                    if (existingEmployee != null)
                    {
                        // Update existing employee
                        existingEmployee.FirstName = model.FirstName ?? existingEmployee.FirstName;
                        existingEmployee.MiddleName = model.MiddleName ?? existingEmployee.MiddleName;
                        existingEmployee.LastName = model.LastName ?? existingEmployee.LastName;
                        existingEmployee.SuffixName = model.SuffixName ?? existingEmployee.SuffixName;
                        existingEmployee.EmployeeIdOriginal = model.EmployeeIdOriginal ?? existingEmployee.EmployeeIdOriginal;
                        
                        if (office != null)
                            existingEmployee.OfficeId = office.Id;
                        if (division != null)
                            existingEmployee.DivisionId = division.Id;
                        
                        existingEmployee.EmploymentTypeId = employmentType != null ? employmentType.Id : existingEmployee.EmploymentTypeId;
                        existingEmployee.PositionId = position != null ? position.Id : existingEmployee.PositionId;
                        existingEmployee.IsActive = model.IsActive;

                        await context.TblEmployees.Where(x => x.Id == existingEmployee.Id)
                            .ExecuteUpdateAsync(e => e
                                .SetProperty(x => x.FirstNameEncrypted, existingEmployee.FirstNameEncrypted)
                                .SetProperty(x => x.MiddleNameEncrypted, existingEmployee.MiddleNameEncrypted)
                                .SetProperty(x => x.LastNameEncrypted, existingEmployee.LastNameEncrypted)
                                .SetProperty(x => x.SuffixNameEncrypted, existingEmployee.SuffixNameEncrypted)
                                .SetProperty(x => x.EmployeeIdOriginalEncrypted, existingEmployee.EmployeeIdOriginalEncrypted)
                                .SetProperty(x => x.OfficeId, office != null ? office.Id : existingEmployee.OfficeId)
                                .SetProperty(x => x.DivisionId, division != null ? division.Id : existingEmployee.DivisionId)
                                .SetProperty(x => x.EmploymentTypeId, employmentType != null ? employmentType.Id : existingEmployee.EmploymentTypeId)
                                .SetProperty(x => x.PositionId, position != null ? position.Id : existingEmployee.PositionId)
                                .SetProperty(x => x.IsActive, model.IsActive));

                        employeeId = existingEmployee.Id;
                    }
                    else
                    {
                        // Create new employee (only if office is provided)
                        if (office == null)
                        {
                            results.Add(new { 
                                error = true, 
                                employeeIdOriginal = model.EmployeeIdOriginal, 
                                message = "Office is required for new employee creation" 
                            });
                            continue;
                        }

                        var newEmployee = new TblEmployee
                        {
                            FirstName = model.FirstName,
                            MiddleName = model.MiddleName,
                            LastName = model.LastName,
                            SuffixName = model.SuffixName,
                            EmployeeIdOriginal = model.EmployeeIdOriginal,
                            OfficeId = office.Id,
                            DivisionId = division?.Id,
                            EmploymentTypeId = employmentType?.Id,
                            PositionId = position?.Id,
                            IsActive = model.IsActive,
                            CreatedAt = DateTime.UtcNow
                        };

                        await context.TblEmployees.AddAsync(newEmployee);
                        await context.SaveChangesAsync();
                        employeeId = newEmployee.Id;
                        isInsert = true;
                    }

                    results.Add(new { 
                        error = false, 
                        employeeIdOriginal = model.EmployeeIdOriginal, 
                        employeeId = employeeId,
                        action = isInsert ? "created" : "updated",
                        message = $"Employee record has been {(isInsert ? "created" : "updated")} successfully" 
                    });
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Log activity
                int successCount = results.Count(r => r.GetType().GetProperty("error")?.GetValue(r)?.Equals(false) ?? false);
                await AuditTrailTool.LogActivityAsync(_options, $"Processed {successCount} employee records ({batchModel.Model.Count} total)", 
                    actionBy: batchModel.ActionBySystemUserId);

                return Ok(ApiResponse<object>.Ok(
                    results,
                    $"Batch processing completed: {successCount} successful, {results.Count - successCount} failed"
                ));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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

                TblSystemUser? user = await _getTools.Account.GetTblSystemUserAsync(model.SystemUserId, context);

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
                    await _editTools.Account.AddTblOneTimePasswordAsync(otpGenerated, context);
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
                //await AuditTrailTool.LogActivityAsync(_options, $"Re-sent email otp", actionBy: user.Id);
                return Ok(ApiResponse<object>.Ok(publicRM, $"OTP has been sent to email address"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(UsersController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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
                
                bool isValid = await _getTools.Account.ValidateOTPAsync(otpModel, context);

                if (isValid)
                {

                    var userInfo = await _getTools.Account.GetTblSystemUserAsync(otpModel.SystemUserId, context);

                    TblSessionToken sessionToken = new()
                    {
                        SystemUserId = otpModel.SystemUserId,
                        Key = EncryptionHelper.Encrypt(DateTime.UtcNow.ToString()),
                        ValidUntil = DateTime.UtcNow.AddDays(1),
                        CreatedAt = DateTime.UtcNow
                    };

                    await _editTools.Account.AddTblSessionTokenAsync(sessionToken, context);

                    UserSimplePublicResponseModel publicRM = new()
                    {
                        SystemUserId = model.SystemUserId,
                        SessionKey = sessionToken.Key
                    };

                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    if (userInfo.IsActive)
                        await AuditTrailTool.LogActivityAsync(_options, $"Successfully logged in", actionBy: sessionToken.SystemUserId);
                    else if (!userInfo.IsActive && userInfo.StatusId == TblSystemUserStatus.Dictionary[TblSystemUserStatus.PENDING])
                    {
                        await EmailTools.SendSystemEmailAsync(
                            _options,
                            subject: EmailConstants.SUBJECT_ACCOUNT_STATUS_UPDATE,
                            templateNameOrBody: EmailConstants.TEMPLATE_GENERAL_EMAIL,
                            recipient: userInfo.Email,
                            model: new EmailViewModel
                            {
                                Name = userInfo.FirstName,
                                Body = EmailConstants.BODY_PENDING_ACCOUNT
                            }
                        );

                            var adminQueryable = await _getTools.Account
                            .GetSystemUsersBySystemRoleWithContextAsync(TblSystemRole.ADMINISTRATOR.ToString(), context);

                            var adminEmails = await adminQueryable
                                .Select(u => EncryptionHelper.Decrypt(u.EmailEncrypted))
                                .ToListAsync();

                            await EmailTools.SendSystemEmailAsync(
                            _options,
                            subject: EmailConstants.SUBJECT_ACCOUNT_STATUS_UPDATE,
                            templateNameOrBody: EmailConstants.TEMPLATE_PENDING_USER_FOR_ADMIN_EMAIL,
                            recipients: adminEmails,
                            model: new EmailViewModel
                            {
                                Name = $"{userInfo.FirstName} {userInfo.LastName}{(userInfo.EmployeeId != null ? $" - {userInfo.EmployeeId}" : "")}",
                                Body = EmailConstants.BODY_PENDING_ACCOUNT_ADMIN_APPROVAL_REQUEST
                            }
                        );

                    }

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
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion


    }
}
