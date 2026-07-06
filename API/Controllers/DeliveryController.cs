using API.Attributes;
using API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.Delivery;
using PortalDB.Entities.ASSET.Supply;
using PortalDB.Models.QueryParams.Delivery;
using PortalDB.Models.QueryParams.Pagination;
using PortalDB.Models.QueryParams.Supply;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.ResponseModels.Delivery;
using PortalDB.Models.ResponseModels.Supply;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DeliveryController : ControllerBase
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;
        private readonly IPortalEditTools _editTools;
        private readonly ParserTools _parserTools;
        private readonly NotificationBroadcastService _notificationService;

        public DeliveryController(DbContextOptions<PortalDbContext> options,
            IPortalGetTools getTools,
            IPortalEditTools editTools,
            ParserTools parserTools,
            NotificationBroadcastService notificationService)

        {
            _options = options;
            _getTools = getTools;
            _editTools = editTools;
            _parserTools = parserTools;
            _notificationService = notificationService;
        }

        private async Task<TblSupplyIAR?> GetLinkedIARAsync(PortalDbContext context, long deliveryRecordId)
        {
            var linkedIARId = await context.TblSupplyIARDeliveryRecords
                .Where(x => x.DeliveryRecordId == deliveryRecordId)
                .Select(x => (long?)x.SupplyIARId)
                .FirstOrDefaultAsync();

            if (linkedIARId.HasValue)
                return await _getTools.Supply.GetTblSupplyIARAsync(linkedIARId.Value, context);

            return await _getTools.Supply.GetTblSupplyIARs(context)
                .FirstOrDefaultAsync(x => x.RecordId == deliveryRecordId);
        }

        #region GET
        [HttpGet("record/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllDeliveryRecords([FromQuery] DeliveryRecordQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblDeliveryRecord>? deliveryRecords = await _getTools.Supply.GetTblDeliveryRecords(context).ToListAsync();

                // Advanced Filtering
                if (!string.IsNullOrWhiteSpace(model.Status) && model.Status != "all")
                {
                    if (model.Status == "Received")
                        deliveryRecords = deliveryRecords.Where(x => x.IsReceived);
                    else if (model.Status == "Pending")
                        deliveryRecords = deliveryRecords.Where(x => !x.IsReceived);
                }

                if (model.StartDate.HasValue)
                    deliveryRecords = deliveryRecords.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    deliveryRecords = deliveryRecords.Where(x => x.CreatedAt <= model.EndDate.Value);

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    var searchResults = new List<TblDeliveryRecord>();
                    foreach (var x in deliveryRecords)
                    {
                        bool matches = (x.DRNumber ?? "").ToLowerInvariant().Contains(searchLower) ||
                                       (x.DeliveryDate).ToString().Contains(searchLower) ||
                                       (x.Remarks ?? "").ToLowerInvariant().Contains(searchLower);

                        if (!matches)
                        {
                            // Check linked IAR for more search matches
                            var iar = await GetLinkedIARAsync(context, x.Id);
                            if (iar != null)
                            {
                                matches = (iar.IARNumber ?? "").ToLowerInvariant().Contains(searchLower) ||
                                          (iar.PONumber ?? "").ToLowerInvariant().Contains(searchLower) ||
                                          (iar.EntityName ?? "").ToLowerInvariant().Contains(searchLower);
                            }
                        }

                        if (matches) searchResults.Add(x);
                    }
                    deliveryRecords = searchResults;
                }

                int totalCount = deliveryRecords.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var deliveryRecordsList = deliveryRecords
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var deliveryRecordsResponses = new List<DeliveryRecordResponseModel>();

                foreach (var x in deliveryRecordsList)
                {
                    List<TblDeliveryRecordItem>? unmappedItems = await _getTools.Delivery.GetTblDeliveryRecordItemsByRecordId(x.Id, context).ToListAsync();
                    List<DeliveryRecordItemResponseModel>? mappedItems = new List<DeliveryRecordItemResponseModel>();
                    decimal recordTotalAmount = 0;

                    foreach (var y in unmappedItems)
                    {
                        recordTotalAmount += (y.ItemQuantity ?? 0) * (y.UnitCost ?? 0);
                        var mappedItemModel = new DeliveryRecordItemResponseModel
                        {
                            Id = y.Id,
                            RecordId = y.RecordId,
                            Code = y.Code,
                            ItemTypeId = y.ItemTypeId,
                            Category = await _getTools.PTA.GetTblPTACategoryAsync(y.CategoryId, context),
                            ItemDescription = y.ItemDescription,
                            ItemSpecification = y.ItemSpecification,
                            ItemQuantity = y.ItemQuantity,
                            MeasurementUnit = await _getTools.Supply.GetTblSupplyUnitAsync(y.UnitId, context),
                            UnitCost = y.UnitCost,
                            ReorderPoint = y.ReorderPoint,
                            StorageLocation = await _getTools.Supply.GetTblSupplyStorageLocationAsync(y.StorageLocationId, context),
                            Vendor = await _getTools.Supply.GetTblSupplyVendorAsync(y.VendorId, context),
                            IsActive = y.IsActive,
                            CreatedAt = y.CreatedAt
                        };
                        mappedItems.Add(mappedItemModel);
                    }

                    TblSupplyIAR? z = await GetLinkedIARAsync(context, x.Id);
                    var supplyIARModel = new SupplyIARResponseModel();
                    if (z != null)
                    {
                        supplyIARModel = new SupplyIARResponseModel
                        {
                            Id = z.Id,
                            CenterCode = z.ResponsibilityCenterCode,
                            EntityName = z.EntityName,
                            FundCluster = z.FundCluster,
                            Vendor = await _getTools.Supply.GetTblSupplyVendorAsync(z.VendorId, context),
                            Office = await _getTools.Office.GetTblOfficeAsync(z.OfficeId, context),
                            Division = await _getTools.Office.GetTblDivisionAsync(z.DivisionId, context),
                            PONumber = z.PONumber,
                            IARNumber = z.IARNumber,
                            IARNumberDate = z.IARNumberDate,
                            IARInvoiceNumber = z.IARInvoiceNumber,
                            IARInvoiceNumberDate = z.IARInvoiceNumberDate,
                            PODate = z.PODate,
                            IsActive = z.IsActive,
                            CreatedAt = z.CreatedAt
                        };
                    }

                    var deliveryRecordModel = new DeliveryRecordResponseModel
                    {
                        Id = x.Id,
                        DRNumber = x.DRNumber,
                        SupplyIAR = supplyIARModel,
                        DeliveryDate = x.DeliveryDate,
                        Employee = await _getTools.Account.GetTblEmployeeAsync(x.EmployeeId, context),
                        Remarks = x.Remarks,
                        FileId = x.FileId,
                        IsReceived = x.IsReceived,
                        Items = mappedItems,
                        TotalAmount = recordTotalAmount,
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt
                    };
                    deliveryRecordsResponses.Add(deliveryRecordModel);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed Delivery Records", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<DeliveryRecordResponseModel>.OkPaginated(
                    deliveryRecordsResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Delivery Records have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DeliveryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("record/all/{recordId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetDeliveryRecord([FromQuery] PaginationGenericQueryParams model, [FromRoute] long recordId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                TblDeliveryRecord? deliveryRecord = await _getTools.Supply.GetTblDeliveryRecordAsync(recordId, context);

                if (deliveryRecord == null)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(ApiStatusCode.NotFound, ApiResponse<object>.NotFound("Delivery record not found."));
                }

                List<TblDeliveryRecordItem>? unmappedItems = await _getTools.Delivery.GetTblDeliveryRecordItemsByRecordId(deliveryRecord.Id, context).ToListAsync();
                List<DeliveryRecordItemResponseModel> mappedItems = new();
                decimal recordTotalAmount = 0;

                foreach (var y in unmappedItems)
                {
                    recordTotalAmount += (y.ItemQuantity ?? 0) * (y.UnitCost ?? 0);
                    mappedItems.Add(new DeliveryRecordItemResponseModel
                    {
                        Id = y.Id,
                        RecordId = y.RecordId,
                        Code = y.Code,
                        ItemTypeId = y.ItemTypeId,
                        Category = await _getTools.PTA.GetTblPTACategoryAsync(y.CategoryId, context),
                        ItemDescription = y.ItemDescription,
                        ItemSpecification = y.ItemSpecification,
                        ItemQuantity = y.ItemQuantity,
                        MeasurementUnit = await _getTools.Supply.GetTblSupplyUnitAsync(y.UnitId, context),
                        UnitCost = y.UnitCost,
                        ReorderPoint = y.ReorderPoint,
                        StorageLocation = await _getTools.Supply.GetTblSupplyStorageLocationAsync(y.StorageLocationId, context),
                        Vendor = await _getTools.Supply.GetTblSupplyVendorAsync(y.VendorId, context),
                        IsActive = y.IsActive,
                        CreatedAt = y.CreatedAt
                    });
                }

                TblSupplyIAR? linkedIar = await GetLinkedIARAsync(context, deliveryRecord.Id);
                SupplyIARResponseModel? supplyIARModel = null;

                if (linkedIar != null)
                {
                    supplyIARModel = new SupplyIARResponseModel
                    {
                        Id = linkedIar.Id,
                        CenterCode = linkedIar.ResponsibilityCenterCode,
                        EntityName = linkedIar.EntityName,
                        FundCluster = linkedIar.FundCluster,
                        Vendor = await _getTools.Supply.GetTblSupplyVendorAsync(linkedIar.VendorId, context),
                        Office = await _getTools.Office.GetTblOfficeAsync(linkedIar.OfficeId, context),
                        Division = await _getTools.Office.GetTblDivisionAsync(linkedIar.DivisionId, context),
                        PONumber = linkedIar.PONumber,
                        IARNumber = linkedIar.IARNumber,
                        IARNumberDate = linkedIar.IARNumberDate,
                        IARInvoiceNumber = linkedIar.IARInvoiceNumber,
                        IARInvoiceNumberDate = linkedIar.IARInvoiceNumberDate,
                        PODate = linkedIar.PODate,
                        IsApproved = linkedIar.IsApproved,
                        IsActive = linkedIar.IsActive,
                        CreatedAt = linkedIar.CreatedAt
                    };
                }

                var deliveryRecordModel = new DeliveryRecordResponseModel
                {
                    Id = deliveryRecord.Id,
                    DRNumber = deliveryRecord.DRNumber,
                    SupplyIAR = supplyIARModel,
                    DeliveryDate = deliveryRecord.DeliveryDate,
                    Employee = await _getTools.Account.GetTblEmployeeAsync(deliveryRecord.EmployeeId, context),
                    Remarks = deliveryRecord.Remarks,
                    FileId = deliveryRecord.FileId,
                    IsReceived = deliveryRecord.IsReceived,
                    Items = mappedItems,
                    TotalAmount = recordTotalAmount,
                    IsActive = deliveryRecord.IsActive,
                    CreatedAt = deliveryRecord.CreatedAt
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed Delivery Record {deliveryRecord.Id}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<DeliveryRecordResponseModel>.Ok(deliveryRecordModel, "Delivery Record has been retrieved"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DeliveryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
        [HttpGet("record/summary")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetDeliveryRecordsSummary([FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var deliveryRecords = await _getTools.Supply.GetTblDeliveryRecords(context)
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync();

                var responses = new List<DeliveryRecordResponseModel>();
                foreach (var x in deliveryRecords)
                {
                    var items = await _getTools.Delivery.GetTblDeliveryRecordItemsByRecordId(x.Id, context).ToListAsync();
                    decimal totalAmount = items.Sum(y => (y.ItemQuantity ?? 0) * (y.UnitCost ?? 0));
                    var linkedIAR = await GetLinkedIARAsync(context, x.Id);

                    responses.Add(new DeliveryRecordResponseModel
                    {
                        Id = x.Id,
                        DRNumber = x.DRNumber,
                        DeliveryDate = x.DeliveryDate,
                        IsReceived = x.IsReceived,
                        TotalAmount = totalAmount,
                        CreatedAt = x.CreatedAt,
                        SupplyIAR = linkedIAR == null
                            ? null
                            : new SupplyIARResponseModel
                            {
                                Id = linkedIAR.Id,
                                IsApproved = linkedIAR.IsApproved,
                                IARNumber = linkedIAR.IARNumber
                            }
                    });
                }

                return Ok(ApiResponse<List<DeliveryRecordResponseModel>>.Ok(responses, "Delivery records summary retrieved"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DeliveryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred."));
            }
        }
        #endregion

        #region POST
        [HttpPost("record/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditDeliveryRecord([FromBody] EditDeliveryRecordQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblDeliveryRecord deliveryRecord = new()
                {
                    Id = model.Id,
                    DRNumber = model.DRNumber,
                    DeliveryDate = model.DeliveryDate,
                    EmployeeId = model.EmployeeId,
                    Remarks = model.Remarks,
                    IsReceived = model.IsReceived,
                    IsActive = model.IsActive
                };

                long deliveryRecordId = await _editTools.Delivery.EditTblDeliveryRecordAsync(deliveryRecord, model.ActionBySystemUserId, context);
                var supplyItemsQuery = _getTools.Supply.GetTblSupplyItems(context);
                var supplyItems = supplyItemsQuery == null ? [] : await supplyItemsQuery.ToListAsync();

                foreach (var x in model.Items)
                {
                    var matchingSupplyItem = x.ItemTypeId == 1
                        ? supplyItems
                            .Where(s => string.Equals(s.Code, x.Code, StringComparison.OrdinalIgnoreCase)
                                && string.Equals(s.Description, x.ItemDescription, StringComparison.OrdinalIgnoreCase))
                            .OrderByDescending(s => s.CreatedAt)
                            .FirstOrDefault()
                        : null;

                    TblDeliveryRecordItem deliveryRecordItem = new()
                    {
                        Id = x.Id,
                        RecordId = deliveryRecordId,
                        Code = x.Code,
                        ItemTypeId = x.ItemTypeId,
                        CategoryId = matchingSupplyItem?.CategoryId ?? x.CategoryId,
                        ItemDescription = x.ItemDescription,
                        ItemSpecification = x.ItemSpecification,
                        ItemQuantity = x.ItemQuantity,
                        ReorderPoint = x.ReorderPoint ?? 0,
                        StorageLocationId = x.StorageLocationId,
                        VendorId = x.VendorId,
                        UnitId = x.MeasurementUnitId,
                        UnitCost = x.UnitCost ?? 0,
                        IsActive = x.IsActive,
                        IsDeleted = x.IsDeleted
                    };

                    await _editTools.Delivery.EditTblDeliveryRecordItemAsync(deliveryRecordItem, model.ActionBySystemUserId, context);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                if (model.Id == 0)
                {
                    await _notificationService.NotifyModuleUsersAsync(
                        context,
                        NotificationConstants.DELIVERY_CREATED,
                        $"New delivery record {model.DRNumber} has been created",
                        NotificationConstants.Modules.DELIVERY_RECEIPT,
                        model.ActionBySystemUserId);
                }

                return Ok(ApiResponse<object>.Ok(new { DeliveryRecordId = deliveryRecordId }, $"Delivery Record has been {(model.Id == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DeliveryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
        #endregion

        #region DELETE
        [HttpDelete("record/delete/{recordId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeleteDeliveryRecord([FromQuery] SoloQueryParams model, [FromRoute] long recordId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                bool isDeleted = await _editTools.Delivery.DeleteTblDeliveryRecordAsync(recordId, model.ActionBySystemUserId, context);

                if (!isDeleted)
                    return Ok(ApiResponse<object>.OperationFailed("Unable to delete this delivery record, try again later"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok($"Delivery Record has been deleted"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DeliveryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
        #endregion
    }
}
