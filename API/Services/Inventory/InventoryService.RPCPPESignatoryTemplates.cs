using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Models.QueryParams.PTA;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Services;

namespace API.Services.Inventory
{
    public partial class InventoryService
    {
        public async Task<IActionResult> GetRPCPPESignatoryTemplates([FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var templates = await context.TblRPCPPESignatoryTemplates
                    .Where(t => t.IsActive)
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => new { t.Id, t.Name, t.SignatoryDataJson, t.CreatedAt })
                    .ToListAsync();

                return Ok(ApiResponse<object>.Ok(templates, "RPCPPE signatory templates retrieved"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryService));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        public async Task<IActionResult> EditRPCPPESignatoryTemplate([FromBody] EditRPCPPESignatoryTemplateQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                if (model.Id == 0)
                {
                    var newTemplate = new TblRPCPPESignatoryTemplate
                    {
                        Name = model.Name.Trim(),
                        SignatoryDataJson = model.SignatoryDataJson,
                        CreatedBy = model.ActionBySystemUserId,
                        CreatedAt = DateTime.UtcNow,
                        IsActive = true
                    };
                    await context.TblRPCPPESignatoryTemplates.AddAsync(newTemplate);
                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    await AuditTrailTool.LogActivityAsync(_options, "Created RPCPPE Signatory Template", actionBy: model.ActionBySystemUserId);
                    return Ok(ApiResponse<object>.Ok(new { newTemplate.Id, newTemplate.Name, newTemplate.SignatoryDataJson, newTemplate.CreatedAt }, "Template saved"));
                }
                else
                {
                    var existing = await context.TblRPCPPESignatoryTemplates.FirstOrDefaultAsync(t => t.Id == model.Id && t.IsActive);
                    if (existing == null)
                        return BadRequest(ApiResponse<object>.Fail("NOT_FOUND", "Template not found."));

                    existing.Name = model.Name.Trim();
                    existing.SignatoryDataJson = model.SignatoryDataJson;
                    context.TblRPCPPESignatoryTemplates.Update(existing);
                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    await AuditTrailTool.LogActivityAsync(_options, "Updated RPCPPE Signatory Template", actionBy: model.ActionBySystemUserId);
                    return Ok(ApiResponse<object>.Ok(new { existing.Id, existing.Name, existing.SignatoryDataJson, existing.CreatedAt }, "Template updated"));
                }
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryService));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        public async Task<IActionResult> DeleteRPCPPESignatoryTemplate([FromQuery] SoloQueryParams model, [FromRoute] long templateId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                var template = await context.TblRPCPPESignatoryTemplates.FirstOrDefaultAsync(t => t.Id == templateId && t.IsActive);
                if (template == null)
                    return BadRequest(ApiResponse<object>.Fail("NOT_FOUND", "Template not found."));

                template.IsActive = false;
                context.TblRPCPPESignatoryTemplates.Update(template);
                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Deleted RPCPPE Signatory Template", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<object>.Ok((object?)null, "Template deleted"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryService));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
    }
}
