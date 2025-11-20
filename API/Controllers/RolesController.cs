using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
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
using PortalTools.Composition;
using PortalTools.Services;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RolesController : ControllerBase
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;
        private readonly IPortalEditTools _editTools;

        public RolesController(
            DbContextOptions<PortalDbContext> options,
            IPortalEditTools editTools,
            IPortalGetTools getTools)
        {
            _options = options;
            _getTools = getTools;
            _editTools = editTools;
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
                IEnumerable<TblSystemRole?> roles = await _getTools.Account
                    .GetSystemRoles(context)
                    .ToListAsync();

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

                var rolesList = roles
                    .OrderByDescending(x => x.CreatedAt)
                    .ToList();

                var roleResponses = new List<SystemRoleResponseModel>(rolesList.Count);

                foreach (var r in rolesList)
                {
                    roleResponses.Add(await _getTools.Account.GetSystemRoleWithScopesAsync(r.Id, context));
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(
                    _options,
                    "Viewed system roles",
                    actionBy: model.ActionBySystemUserId
                );

                // RETURN CLEAN DATA WITHOUT "items"
                return Ok(ApiResponse<List<SystemRoleResponseModel>>.Ok(
                    roleResponses,
                    "System roles have been retrieved"
                ));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(RolesController));
                return StatusCode(
                    ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(
                        ErrorCodes.SERVER_ERROR,
                        "An error occurred while processing your request."
                    )
                );
            }
        }

        // GET api/roles/all/{systemRoleId}
        [HttpGet("all/{systemRoleId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetSystemRoleBySystemRoleId(
            [FromQuery] SoloQueryParams model,
            [FromRoute] long systemRoleId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                SystemRoleResponseModel? role =
                    await _getTools.Account.GetSystemRoleWithScopesAsync(systemRoleId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                await AuditTrailTool.LogActivityAsync(
                    _options,
                    $"Viewed system role information for system role {role.Id}",
                    actionBy: model.ActionBySystemUserId
                );

                return Ok(ApiResponse<object>.Ok(
                    role,
                    $"System role have been retrieved"
                ));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(RolesController));
                return StatusCode(
                    ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(
                        ErrorCodes.SERVER_ERROR,
                        "An error occurred while processing your request."
                    )
                );
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

                long systemRoleId = await _editTools.Account.EditTblSystemRoleAsync(role, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse<object>.Ok(
                    new { SystemRoleId = systemRoleId },
                    $"System role has been {(model.SystemRoleId == 0 ? "added" : "updated")}"
                ));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(RolesController));
                return StatusCode(
                    ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(
                        ErrorCodes.SERVER_ERROR,
                        "An error occurred while processing your request."
                    )
                );
            }
        }

        #endregion

        #region DELETE

        // DELETE api/roles/delete/{roleId}
        [HttpDelete("delete/{roleId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeleteRole(
            [FromQuery] SoloQueryParams model,
            [FromRoute] long roleId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                bool isDeleted =
                    await _editTools.Account.DeleteTblSystemRoleAsync(
                        roleId,
                        model.ActionBySystemUserId,
                        context
                    );

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
                return StatusCode(
                    ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(
                        ErrorCodes.SERVER_ERROR,
                        "An error occurred while processing your request."
                    )
                );
            }
        }

        #endregion
    }
}
