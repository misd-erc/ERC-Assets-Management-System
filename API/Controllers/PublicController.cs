using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Constants;
using PortalDB.Models.ResponseModels.PTA;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PublicController : ControllerBase
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;

        public PublicController(
            DbContextOptions<PortalDbContext> options,
            IPortalGetTools getTools)
        {
            _options = options;
            _getTools = getTools;
        }

        /// <summary>
        /// Public endpoint — no login required.
        /// Returns asset information for a given PTA ID so that a QR code
        /// sticker on the physical item can link directly to the asset record
        /// without requiring the viewer to authenticate to the AMS.
        /// </summary>
        // GET api/public/asset/{ptaId}
        [HttpGet("asset/{ptaId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicAssetInfo([FromRoute] long ptaId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var pta = await _getTools.PTA.GetTblPTAAsync(ptaId, context);

                if (pta == null || pta.IsDeleted)
                    return StatusCode(ApiStatusCode.NotFound, ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "Asset not found."));

                var ptaModel = new PTAResponseModel
                {
                    Id = pta.Id,
                    Group = pta.Group,
                    PropertyNumber = pta.PropertyNumber,
                    Category = await _getTools.PTA.GetTblPTACategoryAsync(pta.CategoryId, context),
                    Legend = await _getTools.PTA.GetTblPTALegendAsync(pta.LegendId, context),
                    Description = pta.Description,
                    Brand = pta.Brand,
                    Model = pta.Model,
                    SerialNumber = pta.SerialNumber,
                    UnitOfMeasurement = pta.UnitOfMeasurement,
                    UnitValue = pta.UnitValue,
                    DateAcquired = pta.DateAcquired,
                    EstimatedUsefulLife = pta.EstimatedUsefulLife,
                    FiscalDate = pta.FiscalDate,
                    Parts = await _getTools.PTA.GetTblPTAPartsByPTAId(pta.Id, context).ToListAsync(),
                    Movements = (await _getTools.PTA.GetTblPTAMovementsByPTAId(pta.Id, context).ToListAsync())
                        .OrderByDescending(m => m.DateAssigned)
                        .ToList(),
                    IsActive = pta.IsActive,
                    CreatedAt = pta.CreatedAt
                };

                await transaction.CommitAsync();
                return Ok(ApiResponse<PTAResponseModel>.Ok(new List<PTAResponseModel> { ptaModel }, "Asset information retrieved."));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(PublicController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
    }
}
