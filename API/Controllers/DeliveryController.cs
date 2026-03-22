using API.Attributes;
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

        public DeliveryController(DbContextOptions<PortalDbContext> options,
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
        [HttpGet("record/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllDeliveryRecords([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblDeliveryRecord>? deliveryRecords = await _getTools.Supply.GetTblDeliveryRecords(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    deliveryRecords = deliveryRecords.Where(x =>
                        (x.DRNumber ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.DeliveryDate).ToString().Contains(searchLower) ||
                        (x.Remarks ?? "").ToLowerInvariant().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    deliveryRecords = deliveryRecords.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    deliveryRecords = deliveryRecords.Where(x => x.CreatedAt <= model.EndDate.Value);

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

                    foreach (var y in unmappedItems)
                    {
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

                    TblSupplyIAR? z = _getTools.Supply.GetTblSupplyIARs(context).FirstOrDefault(iar => iar.Id == x.SupplyIARId);
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
                        IsReceived = x.IsReceived,
                        Items = mappedItems,
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

                var deliveryRecordsResponses = new List<DeliveryRecordResponseModel>();

                    List<TblDeliveryRecordItem>? unmappedItems = await _getTools.Delivery.GetTblDeliveryRecordItemsByRecordId(deliveryRecord.Id, context).ToListAsync();
                    List<DeliveryRecordItemResponseModel>? mappedItems = new List<DeliveryRecordItemResponseModel>();

                    foreach (var y in unmappedItems)
                    {
                        var mappedItemModel = new DeliveryRecordItemResponseModel
                        {
                            Id = y.Id,
                            RecordId = y.RecordId,
                            ItemTypeId = y.ItemTypeId,
                            Category = await _getTools.PTA.GetTblPTACategoryAsync(y.CategoryId, context),
                            ItemDescription = y.ItemDescription,
                            ItemSpecification = y.ItemSpecification,
                            ItemQuantity = y.ItemQuantity,
                            MeasurementUnit = await _getTools.Supply.GetTblSupplyUnitAsync(y.UnitId, context),
                            UnitCost = y.UnitCost,
                            IsActive = y.IsActive,
                            CreatedAt = y.CreatedAt
                        };
                        mappedItems.Add(mappedItemModel);
                    }

                TblSupplyIAR? z = _getTools.Supply.GetTblSupplyIARs(context).FirstOrDefault(iar => iar.Id == deliveryRecord.SupplyIARId);

                var supplyIARModel = new SupplyIARResponseModel
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

                var deliveryRecordModel = new DeliveryRecordResponseModel
                    {
                        Id = deliveryRecord.Id,
                        DRNumber = deliveryRecord.DRNumber,
                        SupplyIAR = supplyIARModel,
                        DeliveryDate = deliveryRecord.DeliveryDate,
                        Employee = await _getTools.Account.GetTblEmployeeAsync(deliveryRecord.EmployeeId, context),
                        Remarks = deliveryRecord.Remarks,
                        IsReceived = deliveryRecord.IsReceived,
                        Items = mappedItems,
                        IsActive = deliveryRecord.IsActive,
                        CreatedAt = deliveryRecord.CreatedAt
                    };
                    deliveryRecordsResponses.Add(deliveryRecordModel);
                

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed Delivery Record {deliveryRecord.Id}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<DeliveryRecordResponseModel>.Ok(deliveryRecordsResponses,"Delivery Record have been retrieved"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(DeliveryController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
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
                    SupplyIARId = model.SupplyIARId,
                    DeliveryDate = model.DeliveryDate,
                    EmployeeId = model.EmployeeId,
                    Remarks = model.Remarks,
                    IsReceived = model.IsReceived,
                    IsActive = model.IsActive
                };

                long deliveryRecordId = await _editTools.Delivery.EditTblDeliveryRecordAsync(deliveryRecord, model.ActionBySystemUserId, context);

                foreach (var x in model.Items)
                {
                    TblDeliveryRecordItem deliveryRecordItem = new()
                    {
                        Id = x.Id,
                        RecordId = deliveryRecordId,
                        Code = x.Code,
                        ItemTypeId = x.ItemTypeId,
                        CategoryId = x.CategoryId,
                        ItemDescription = x.ItemDescription,
                        ItemSpecification = x.ItemSpecification,
                        ItemQuantity = x.ItemQuantity,
                        ReorderPoint = x.ReorderPoint,
                        StorageLocationId = x.StorageLocationId,
                        VendorId = x.VendorId,
                        UnitId = x.MeasurementUnitId,
                        UnitCost = x.UnitCost,
                        IsActive = x.IsActive,
                        IsDeleted = x.IsDeleted
                    };

                    await _editTools.Delivery.EditTblDeliveryRecordItemAsync(deliveryRecordItem, model.ActionBySystemUserId, context);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
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
                    return Ok(ApiResponse<object>.Ok($"Unable to delete this delivery record, try again later"));

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
