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

namespace API.Controllers
{

    [Route("api/[controller]")]
    /*[Authorize]*/
    [ApiController]
    public class RolesController : ControllerBase
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly AccountGetTools _accountGetTools;
        private readonly AccountEditTools _accountEditTools;

        public RolesController(AccountGetTools accountGetTools,
            AccountEditTools accountEditTools,
            DbContextOptions<PortalDbContext> options)
        {
            _accountGetTools = accountGetTools;
            _accountEditTools = accountEditTools;
            _options = options;
        }

        #region GET

        // GET api/roles/all
        [HttpGet("all")]
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
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(RolesController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/roles/all/{systemRoleId}
        [HttpGet("all/{systemRoleId}")]
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
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(RolesController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion

        #region POST
        // POST api/roles/edit
        [HttpPost("edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditSystemRole([FromBody] EditSystemRoleQueryParams model)
        {

            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                EditSystemRoleViewModel role = new()
                {
                    Id = model.SystemRoleId,
                    RoleName = model.SystemRoleName,
                    Description = model.SystemRoleDescription,
                    IsActive = model.SystemRoleIsActive,
                    Scopes = model.SystemRoleScopes?.Select(s => new EditSystemRoleScopeViewModel
                    {
                        ModuleId = s.SystemModuleId,
                        IsActive = s.SystemRoleScopeIsActive
                    }).ToList(),
                    ActionBySystemUserId = model.ActionBySystemUserId
                };

                long systemRoleId = await _accountEditTools.EditTblSystemRoleAsync(role, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(new { SystemRoleId = systemRoleId }, $"System role has been {(model.SystemRoleId == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(RolesController));
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }

        }

        #endregion

        #region DELETE
        // DELETE api/roles/delete
        [HttpDelete("delete/{roleId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeleteRole([FromQuery] SoloQueryParams model, [FromRoute] long roleId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                bool isDeleted = await _accountEditTools.DeleteTblSystemRoleAsync(roleId, model.ActionBySystemUserId, context);

                if (!isDeleted)
                    return Ok(ApiResponse<object>.Ok($"Unable to delete this role, try again later"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok($"Role has been deleted"));

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
