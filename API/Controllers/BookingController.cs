using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.Booking;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.ASSET.Supply;
using PortalDB.Models.QueryParams.Booking;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.ResponseModels.Booking;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;
using System;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingController : ControllerBase
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;
        private readonly IPortalEditTools _editTools;

        public BookingController(DbContextOptions<PortalDbContext> options,
            IPortalGetTools getTools,
            IPortalEditTools editTools)
        {
            _options = options;
            _getTools = getTools;
            _editTools = editTools;
        }

        private async Task<BookingItemResponseModel> ToResponseModelAsync(TblAssetBookingItem item, PortalDbContext context)
        {
            var iar = item.SupplyIARId.HasValue ? await _getTools.Supply.GetTblSupplyIARAsync(item.SupplyIARId, context) : null;
            var deliveryRecord = item.DeliveryRecordId.HasValue ? await _getTools.Supply.GetTblDeliveryRecordAsync(item.DeliveryRecordId, context) : null;

            return new BookingItemResponseModel
            {
                Id = item.Id,
                Group = item.Group ?? string.Empty,
                Status = item.Status,
                SupplyIARId = item.SupplyIARId,
                IARNumber = iar?.IARNumber,
                DeliveryRecordId = item.DeliveryRecordId,
                DRNumber = deliveryRecord?.DRNumber,
                UnitSequence = item.UnitSequence,
                Category = await _getTools.PTA.GetTblPTACategoryAsync(item.CategoryId, context),
                CategoryId = item.CategoryId,
                Code = item.Code ?? string.Empty,
                Description = item.Description ?? string.Empty,
                Specification = item.Specification,
                MeasurementUnit = await _getTools.Supply.GetTblSupplyUnitAsync(item.MeasurementUnitId, context),
                MeasurementUnitId = item.MeasurementUnitId,
                Quantity = item.Quantity,
                UnitCost = item.UnitCost,
                ReorderPoint = item.ReorderPoint,
                StorageLocation = await _getTools.Supply.GetTblSupplyStorageLocationAsync(item.StorageLocationId, context),
                StorageLocationId = item.StorageLocationId,
                Vendor = await _getTools.Supply.GetTblSupplyVendorAsync(item.VendorId, context),
                VendorId = item.VendorId,
                SuggestedPropertyNumber = item.SuggestedPropertyNumber,
                DeliveryDate = item.DeliveryDate,
                BookedAt = item.BookedAt,
                FinalizedSupplyItemId = item.FinalizedSupplyItemId,
                FinalizedPTAId = item.FinalizedPTAId,
                CreatedAt = item.CreatedAt
            };
        }

        #region GET
        [HttpGet("pending/list")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetPendingBookingItems([FromQuery] GetBookingItemsQueryParams model)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                var query = _getTools.Booking.GetTblAssetBookingItemsByGroup(model.Group, model.Status, context);
                var items = await query.OrderBy(x => x.CreatedAt).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.Trim().ToLowerInvariant();
                    items = items.Where(x =>
                        (x.Code ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Description ?? "").ToLowerInvariant().Contains(searchLower)).ToList();
                }

                int totalCount = items.Count;
                var page = items
                    .Skip((model.PageNumber - 1) * model.PageSize)
                    .Take(model.PageSize)
                    .ToList();

                var responses = new List<BookingItemResponseModel>();
                foreach (var item in page)
                    responses.Add(await ToResponseModelAsync(item, context));

                return Ok(ApiResponse<BookingItemResponseModel>.OkPaginated(responses, model.PageNumber, model.PageSize, totalCount));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(BookingController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("pending/{id}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetPendingBookingItem([FromQuery] SoloQueryParams model, [FromRoute] long id)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                TblAssetBookingItem? item = await _getTools.Booking.GetTblAssetBookingItemAsync(id, context);

                if (item == null)
                    return NotFound(ApiResponse<object>.NotFound("Booking item not found."));

                return Ok(ApiResponse<BookingItemResponseModel>.Ok(await ToResponseModelAsync(item, context)));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(BookingController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("pending/statistics")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetPendingBookingStatistics([FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                var pendingItems = await _getTools.Booking.GetTblAssetBookingItems(context)
                    .Where(x => x.Status == TblAssetBookingItem.STATUS_PENDING)
                    .ToListAsync();

                var statistics = new
                {
                    PendingSupply = pendingItems.Count(x => x.Group == TblAssetBookingItem.GROUP_SUPPLY),
                    PendingPPE = pendingItems.Count(x => x.Group == TblAssetBookingItem.GROUP_PPE),
                    PendingSE = pendingItems.Count(x => x.Group == TblAssetBookingItem.GROUP_SE),
                    TotalPending = pendingItems.Count
                };

                return Ok(ApiResponse<object>.Ok(statistics));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(BookingController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
        #endregion

        #region POST
        [HttpPost("supply/book")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> BookSupplyItem([FromBody] BookSupplyItemQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                TblAssetBookingItem? stagedItem = await _getTools.Booking.GetTblAssetBookingItemAsync(model.BookingItemId, context);

                if (stagedItem == null)
                {
                    await transaction.RollbackAsync();
                    return NotFound(ApiResponse<object>.NotFound("Booking item not found."));
                }

                if (stagedItem.Status != TblAssetBookingItem.STATUS_PENDING)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(ApiStatusCode.Conflict, ApiResponse<object>.Conflict("This item has already been booked or cancelled."));
                }

                string? code = model.Code ?? stagedItem.Code;
                string? description = model.Description ?? stagedItem.Description;
                int quantity = model.Quantity ?? stagedItem.Quantity ?? 0;

                TblSupplyItem? matchingSupplyItem = await _getTools.Supply.GetTblSupplyItems(context)
                    .Where(s => string.Equals(s.Code, code, StringComparison.OrdinalIgnoreCase)
                        && string.Equals(s.Description, description, StringComparison.OrdinalIgnoreCase))
                    .OrderByDescending(s => s.CreatedAt)
                    .FirstOrDefaultAsync();

                long finalizedSupplyItemId;

                if (matchingSupplyItem != null)
                {
                    await context.TblSupplyItems.Where(x => x.Id == matchingSupplyItem.Id)
                        .ExecuteUpdateAsync(u => u.SetProperty(x => x.Quantity, (matchingSupplyItem.Quantity ?? 0) + quantity));

                    finalizedSupplyItemId = matchingSupplyItem.Id;
                }
                else
                {
                    TblSupplyItem newSupplyItem = new()
                    {
                        Code = code,
                        IARId = stagedItem.SupplyIARId,
                        CategoryId = model.CategoryId ?? stagedItem.CategoryId,
                        Description = description,
                        MeasurementUnitId = model.MeasurementUnitId ?? stagedItem.MeasurementUnitId,
                        UnitCost = model.UnitCost ?? stagedItem.UnitCost,
                        ReorderPoint = model.ReorderPoint ?? stagedItem.ReorderPoint,
                        StorageLocationId = model.StorageLocationId ?? stagedItem.StorageLocationId,
                        VendorId = model.VendorId ?? stagedItem.VendorId,
                        Quantity = quantity
                    };

                    finalizedSupplyItemId = await _editTools.Supply.EditTblSupplyItemAsync(newSupplyItem, model.ActionBySystemUserId, context);
                }

                int rowsAffected = await _editTools.Booking.MarkBookedAsync(model.BookingItemId, finalizedSupplyItemId, null, model.ActionBySystemUserId, context);

                if (rowsAffected == 0)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(ApiStatusCode.Conflict, ApiResponse<object>.Conflict("This item has already been booked or cancelled."));
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse<object>.Ok(new { SupplyItemId = finalizedSupplyItemId }, "Supply item has been booked"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(BookingController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpPost("pta/book")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> BookPTAItem([FromBody] BookPTAItemQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                TblAssetBookingItem? stagedItem = await _getTools.Booking.GetTblAssetBookingItemAsync(model.BookingItemId, context);

                if (stagedItem == null)
                {
                    await transaction.RollbackAsync();
                    return NotFound(ApiResponse<object>.NotFound("Booking item not found."));
                }

                if (stagedItem.Status != TblAssetBookingItem.STATUS_PENDING)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(ApiStatusCode.Conflict, ApiResponse<object>.Conflict("This item has already been booked or cancelled."));
                }

                long? unitId = model.MeasurementUnitId ?? stagedItem.MeasurementUnitId;
                TblSupplyUnit? unit = await _getTools.Supply.GetTblSupplyUnitAsync(unitId, context);
                string unitName = unit?.Name ?? string.Empty;

                TblPTA pta = new()
                {
                    Group = stagedItem.Group,
                    PropertyNumber = model.PropertyNumber ?? stagedItem.SuggestedPropertyNumber,
                    CategoryId = model.CategoryId ?? stagedItem.CategoryId,
                    LegendId = null,
                    Description = model.Description ?? stagedItem.Description,
                    Brand = null,
                    Model = model.Specification ?? stagedItem.Specification,
                    SerialNumber = null,
                    UnitOfMeasurement = unitName,
                    UnitValue = (double?)(model.UnitCost ?? stagedItem.UnitCost),
                    DateAcquired = stagedItem.DeliveryDate,
                    FiscalDate = stagedItem.DeliveryDate,
                    IsActive = true
                };

                if (stagedItem.Group == TblPTA.PPE)
                    pta.EstimatedUsefulLife = 0;

                long ptaId = await _editTools.PTA.EditTblPTAAsync(pta, model.ActionBySystemUserId, context, isBatch: false);

                if (model.PlantillaEmployeeId.HasValue || model.NonPlantillaEmployeeId.HasValue)
                {
                    TblPTAMovement movement = new()
                    {
                        PTAId = ptaId,
                        DateAssigned = model.DateAssigned ?? DateTime.UtcNow,
                        PlantillaEmployeeId = model.PlantillaEmployeeId,
                        NonPlantillaEmployeeId = model.NonPlantillaEmployeeId,
                        ActualOfficeId = model.ActualOfficeId,
                        ActualDivisionId = model.ActualDivisionId,
                        IsCurrent = true,
                        IsActive = true
                    };

                    await _editTools.PTA.EditTblPTAMovementAsync(movement, model.ActionBySystemUserId, context, isBatch: false);
                }

                int rowsAffected = await _editTools.Booking.MarkBookedAsync(model.BookingItemId, null, ptaId, model.ActionBySystemUserId, context);

                if (rowsAffected == 0)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(ApiStatusCode.Conflict, ApiResponse<object>.Conflict("This item has already been booked or cancelled."));
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse<object>.Ok(new { PTAId = ptaId }, "Asset has been booked"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(BookingController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
        #endregion

        #region DELETE
        [HttpDelete("pending/cancel/{id}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> CancelBookingItem([FromQuery] SoloQueryParams model, [FromRoute] long id)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                int rowsAffected = await _editTools.Booking.CancelTblAssetBookingItemAsync(id, model.ActionBySystemUserId, context);

                if (rowsAffected == 0)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(ApiStatusCode.Conflict, ApiResponse<object>.Conflict("This item has already been booked or cancelled."));
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse<object>.Ok("Booking item has been cancelled"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(BookingController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
        #endregion
    }
}
