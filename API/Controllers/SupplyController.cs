using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.ASSET.Supply;
using PortalDB.Models.QueryParams.Pagination;
using PortalDB.Models.QueryParams.PTA;
using PortalDB.Models.QueryParams.Supply;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.ResponseModels.Office;
using PortalDB.Models.ResponseModels.Supply;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SupplyController : ControllerBase
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;
        private readonly IPortalEditTools _editTools;
        private readonly ParserTools _parserTools;

        public SupplyController(DbContextOptions<PortalDbContext> options,
            IPortalGetTools getTools,
            IPortalEditTools editTools,
            ParserTools parserTools)

        {
            _options = options;
            _getTools = getTools;
            _editTools = editTools;
            _parserTools = parserTools;
        }

        #region GET
        // GET api/supply/vendor/all
        [HttpGet("vendor/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllSupplyVendors([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblSupplyVendor>? supplyVendors = await _getTools.Supply.GetTblSupplyVendors(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    supplyVendors = supplyVendors.Where(x =>
                        (x.Name ?? "").ToLowerInvariant().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    supplyVendors = supplyVendors.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    supplyVendors = supplyVendors.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = supplyVendors.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var supplyVendorsList = supplyVendors
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var supplyVendorsResponses = new List<SupplyVendorResponseModel>();

                foreach (var x in supplyVendorsList)
                {
                    var supplyVendorModel = new SupplyVendorResponseModel
                    {
                        Id = x.Id,
                        Name = x.Name,
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt
                    };
                    supplyVendorsResponses.Add(supplyVendorModel);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed Supply Vendors", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<SupplyVendorResponseModel>.OkPaginated(
                    supplyVendorsResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Supply Vendors have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
        #endregion

        #region POST
        // POST api/supply/vendor/edit
        [HttpPost("vendor/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditSupplyVendor([FromBody] EditSupplyVendorQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblSupplyVendor supplyVendor = new()
                {
                    Id = model.Id,
                    Name = model.Name,
                    IsActive = model.IsActive
                };

                long supplyVendorId = await _editTools.Supply.EditTblSupplyVendorAsync(supplyVendor, model.ActionBySystemUserId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(new { SupplyVendorId = supplyVendorId }, $"Supply Vendor has been {(model.Id == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
        #endregion

        #region DELETE
        // DELETE api/supply/vendor/delete
        [HttpDelete("pta/movement/delete/{supplyVendorId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeleteSupplyVendor([FromQuery] SoloQueryParams model, [FromRoute] long supplyVendorId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                bool isDeleted = await _editTools.Supply.DeleteTblSupplyVendorAsync(supplyVendorId, model.ActionBySystemUserId, context);

                if (!isDeleted)
                    return Ok(ApiResponse<object>.Ok($"Unable to delete this Supply Vendor, try again later"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok($"Supply Vendor has been deleted"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
        #endregion
    }
}
