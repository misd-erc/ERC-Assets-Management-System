using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalCommon.Utilities;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Models.QueryParams.Account;
using PortalDB.Models.QueryParams.Pagination;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.ResponseModels.Account;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;
using System.ComponentModel.DataAnnotations;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeeController : ControllerBase
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;
        private readonly IPortalEditTools _editTools;

        public EmployeeController(DbContextOptions<PortalDbContext> options,
            IPortalGetTools getTools,
            IPortalEditTools editTools)
        {
            _options = options;
            _getTools = getTools;
            _editTools = editTools;
        }

        #region GET

        // GET api/employee/all
        [HttpGet("all")]
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
                    employeeResponses.Add(new EmployeeResponseModel
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
                    });
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
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(EmployeeController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // GET api/employee/all/{employeeId}
        [HttpGet("all/{employeeId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetEmployee([FromQuery] SoloQueryParams model, [FromRoute][Required] long employeeId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                TblEmployee? employee = await _getTools.Account.GetTblEmployeeAsync(employeeId, context);

                if (employee == null)
                    return NotFound(ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, $"Employee {employeeId} not found."));

                var employeeResponse = new EmployeeResponseModel
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
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                await AuditTrailTool.LogActivityAsync(_options, $"Viewed employee information for employee {employeeId}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<EmployeeResponseModel>.Ok(new List<EmployeeResponseModel> { employeeResponse }, "Employee has been retrieved"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(EmployeeController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion

        #region POST

        // POST api/employee/edit
        // Direct management edit — accepts IDs for office/division/employment-type/position
        [HttpPost("edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditEmployee([FromBody] ManageEmployeeQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                TblEmployee employee = new()
                {
                    Id = model.EmployeeId,
                    FirstName = model.FirstName,
                    MiddleName = model.MiddleName,
                    LastName = model.LastName,
                    SuffixName = model.SuffixName,
                    EmployeeIdOriginal = model.EmployeeIdOriginal,
                    OfficeId = model.OfficeId,
                    DivisionId = model.DivisionId,
                    EmploymentTypeId = model.EmploymentTypeId,
                    PositionId = model.PositionId,
                    IsActive = model.IsActive
                };

                long employeeId = await _editTools.Account.EditTblEmployeeDirectAsync(employee, model.ActionBySystemUserId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse<object>.Ok(
                    new { EmployeeId = employeeId },
                    $"Employee has been {(model.EmployeeId == 0 ? "added" : "updated")}"
                ));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(EmployeeController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        // POST api/employee/batch/edit
        // Batch import — accepts string names for office/division/employment-type/position (CSV import)
        [HttpPost("batch/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditEmployeeBatch([FromBody] EditEmployeeBatchQueryParams batchModel)
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

                foreach (var item in batchModel.Model)
                {
                    if (string.IsNullOrWhiteSpace(item.EmployeeIdOriginal))
                    {
                        results.Add(new { error = true, employeeIdOriginal = item.EmployeeIdOriginal, message = "EmployeeIdOriginal is required" });
                        continue;
                    }

                    TblOffice? office = null;
                    if (!string.IsNullOrWhiteSpace(item.OfficeName))
                    {
                        office = await context.TblOffices.AsNoTracking()
                            .Where(x => !x.IsDeleted && x.Name == item.OfficeName)
                            .FirstOrDefaultAsync();
                        if (office == null)
                        {
                            results.Add(new { error = true, employeeIdOriginal = item.EmployeeIdOriginal, message = $"Office '{item.OfficeName}' not found" });
                            continue;
                        }
                    }

                    TblDivision? division = null;
                    if (!string.IsNullOrWhiteSpace(item.DivisionName))
                    {
                        division = await context.TblDivisions.AsNoTracking()
                            .Where(x => !x.IsDeleted && x.Name == item.DivisionName)
                            .FirstOrDefaultAsync();
                        if (division == null)
                        {
                            results.Add(new { error = true, employeeIdOriginal = item.EmployeeIdOriginal, message = $"Division '{item.DivisionName}' not found" });
                            continue;
                        }
                    }

                    TblEmploymentType? employmentType = null;
                    if (!string.IsNullOrWhiteSpace(item.EmploymentTypeName))
                    {
                        employmentType = await context.TblEmploymentTypes.AsNoTracking()
                            .Where(x => !x.IsDeleted && x.Name == item.EmploymentTypeName)
                            .FirstOrDefaultAsync();
                        if (employmentType == null)
                        {
                            results.Add(new { error = true, employeeIdOriginal = item.EmployeeIdOriginal, message = $"Employment Type '{item.EmploymentTypeName}' not found" });
                            continue;
                        }
                    }

                    TblPosition? position = null;
                    if (!string.IsNullOrWhiteSpace(item.PositionName))
                    {
                        position = await context.TblPositions.AsNoTracking()
                            .Where(x => !x.IsDeleted && x.Name == item.PositionName)
                            .FirstOrDefaultAsync();
                        if (position == null)
                        {
                            results.Add(new { error = true, employeeIdOriginal = item.EmployeeIdOriginal, message = $"Position '{item.PositionName}' not found" });
                            continue;
                        }
                    }

                    TblEmployee? existingEmployee = await context.TblEmployees
                        .Where(x => !x.IsDeleted && x.EmployeeIdOriginalEncrypted == EncryptionHelper.Encrypt(item.EmployeeIdOriginal!))
                        .FirstOrDefaultAsync();

                    long employeeId = 0;
                    bool isInsert = false;

                    if (existingEmployee != null)
                    {
                        existingEmployee.FirstName = item.FirstName ?? existingEmployee.FirstName;
                        existingEmployee.MiddleName = item.MiddleName ?? existingEmployee.MiddleName;
                        existingEmployee.LastName = item.LastName ?? existingEmployee.LastName;
                        existingEmployee.SuffixName = item.SuffixName ?? existingEmployee.SuffixName;
                        existingEmployee.EmployeeIdOriginal = item.EmployeeIdOriginal ?? existingEmployee.EmployeeIdOriginal;
                        if (office != null) existingEmployee.OfficeId = office.Id;
                        if (division != null) existingEmployee.DivisionId = division.Id;
                        existingEmployee.EmploymentTypeId = employmentType != null ? employmentType.Id : existingEmployee.EmploymentTypeId;
                        existingEmployee.PositionId = position != null ? position.Id : existingEmployee.PositionId;
                        existingEmployee.IsActive = item.IsActive;

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
                                .SetProperty(x => x.IsActive, item.IsActive));

                        employeeId = existingEmployee.Id;
                    }
                    else
                    {
                        if (office == null)
                        {
                            results.Add(new { error = true, employeeIdOriginal = item.EmployeeIdOriginal, message = "Office is required for new employee creation" });
                            continue;
                        }

                        var newEmployee = new TblEmployee
                        {
                            FirstName = item.FirstName,
                            MiddleName = item.MiddleName,
                            LastName = item.LastName,
                            SuffixName = item.SuffixName,
                            EmployeeIdOriginal = item.EmployeeIdOriginal,
                            OfficeId = office.Id,
                            DivisionId = division?.Id,
                            EmploymentTypeId = employmentType?.Id,
                            PositionId = position?.Id,
                            IsActive = item.IsActive,
                            CreatedAt = DateTime.UtcNow
                        };

                        await context.TblEmployees.AddAsync(newEmployee);
                        await context.SaveChangesAsync();
                        employeeId = newEmployee.Id;
                        isInsert = true;
                    }

                    results.Add(new
                    {
                        error = false,
                        employeeIdOriginal = item.EmployeeIdOriginal,
                        employeeId,
                        action = isInsert ? "created" : "updated",
                        message = $"Employee record has been {(isInsert ? "created" : "updated")} successfully"
                    });
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                int successCount = results.Count(r => r.GetType().GetProperty("error")?.GetValue(r)?.Equals(false) ?? false);
                await AuditTrailTool.LogActivityAsync(_options, $"Batch processed {successCount} employee records ({batchModel.Model.Count} total)", actionBy: batchModel.ActionBySystemUserId);

                return Ok(ApiResponse<object>.Ok(
                    results,
                    $"Batch processing completed: {successCount} successful, {results.Count - successCount} failed"
                ));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(EmployeeController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion

        #region DELETE

        // DELETE api/employee/delete/{employeeId}
        [HttpDelete("delete/{employeeId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeleteEmployee([FromQuery] SoloQueryParams model, [FromRoute] long employeeId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                bool isDeleted = await _editTools.Account.DeleteTblEmployeeAsync(employeeId, model.ActionBySystemUserId, context);

                if (!isDeleted)
                    return Ok(ApiResponse<object>.Ok("Unable to delete this employee, try again later"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse<object>.Ok("Employee has been deleted"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(EmployeeController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion
    }
}
