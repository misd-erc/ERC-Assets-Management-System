using API.Attributes;
using API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using Org.BouncyCastle.Utilities;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.Delivery;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.ASSET.Supply;
using PortalDB.Entities.ASSET.Booking;
using PortalDB.Models.QueryParams.Pagination;
using PortalDB.Models.QueryParams.PTA;
using PortalDB.Models.QueryParams.Supply;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.ResponseModels.Account;
using PortalDB.Models.ResponseModels.Office;
using PortalDB.Models.ResponseModels.Supply;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;
using System.Text;
using static Org.BouncyCastle.Crypto.Engines.SM2Engine;

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
        private readonly NotificationBroadcastService _notificationService;

        public SupplyController(DbContextOptions<PortalDbContext> options,
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

        private async Task<List<long>> GetIARRecordIdsAsync(PortalDbContext context, long iarId, long? fallbackRecordId)
        {
            var recordIds = await context.TblSupplyIARDeliveryRecords
                .Where(x => x.SupplyIARId == iarId)
                .Select(x => x.DeliveryRecordId)
                .ToListAsync();

            if (recordIds.Count == 0 && fallbackRecordId.HasValue)
                recordIds.Add(fallbackRecordId.Value);

            return recordIds;
        }

        private async Task<string> GetIARDRNumbersAsync(PortalDbContext context, List<long> recordIds)
        {
            if (recordIds.Count == 0) return "";

            var deliveryRecords = await _getTools.Delivery.GetTblDeliveryRecords(context)
                .Where(x => recordIds.Contains(x.Id))
                .ToListAsync();

            return string.Join(", ", deliveryRecords.Select(x => x.DRNumber).Where(x => !string.IsNullOrWhiteSpace(x)));
        }

        // Distinct asset-group labels (Supply/PPE/SE) across an IAR's linked delivery records, used to
        // tag IAR notifications so staff can tell what kind of delivery it is, and to route notification
        // clicks to the right Asset Booking tab.
        private async Task<string> GetIARItemTypesSummaryAsync(PortalDbContext context, List<long> recordIds)
        {
            if (recordIds.Count == 0) return "";

            var itemTypeIds = await context.TblDeliveryRecordItems
                .Where(x => !x.IsDeleted && x.RecordId.HasValue && recordIds.Contains(x.RecordId.Value))
                .Select(x => x.ItemTypeId)
                .Distinct()
                .ToListAsync();

            var labels = new List<string>();
            if (itemTypeIds.Contains(1)) labels.Add("Supply");
            if (itemTypeIds.Contains(2)) labels.Add("PPE");
            if (itemTypeIds.Contains(3)) labels.Add("SE");

            return string.Join(", ", labels);
        }

        #region GET
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
                        Address = x.Address,
                        Email = x.Email,
                        Contact = x.Contact,
                        ContactPerson = x.ContactPerson,
                        VendorType = x.VendorType,
                        ContractStart = x.ContractStart,
                        ContractEnd = x.ContractEnd,
                        ProcurementTitle = x.ProcurementTitle,
                        Terms = x.Terms,
                        DeliveryDate = x.DeliveryDate,
                        DeliveryDueDate = x.DeliveryDueDate,
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

        [HttpGet("storage-location/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllSupplyStorageLocations([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblSupplyStorageLocation>? supplyStorageLocations = await _getTools.Supply.GetTblSupplyStorageLocations(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    supplyStorageLocations = supplyStorageLocations.Where(x =>
                        (x.Name ?? "").ToLowerInvariant().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    supplyStorageLocations = supplyStorageLocations.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    supplyStorageLocations = supplyStorageLocations.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = supplyStorageLocations.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var supplyStorageLocationsList = supplyStorageLocations
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var supplyStorageLocationsResponses = new List<SupplyStorageLocationResponseModel>();

                foreach (var x in supplyStorageLocationsList)
                {
                    var supplyStorageLocationModel = new SupplyStorageLocationResponseModel
                    {
                        Id = x.Id,
                        Name = x.Name,
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt
                    };
                    supplyStorageLocationsResponses.Add(supplyStorageLocationModel);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed Supply Storage Locations", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<SupplyStorageLocationResponseModel>.OkPaginated(
                    supplyStorageLocationsResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Supply Storage Locations have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("unit/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllSupplyUnits([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblSupplyUnit>? supplyUnits = await _getTools.Supply.GetTblSupplyUnits(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    supplyUnits = supplyUnits.Where(x =>
                        (x.Name ?? "").ToLowerInvariant().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    supplyUnits = supplyUnits.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    supplyUnits = supplyUnits.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = supplyUnits.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var supplyUnitsList = supplyUnits
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var supplyUnitsResponses = new List<SupplyUnitResponseModel>();

                foreach (var x in supplyUnitsList)
                {
                    var supplyUnitModel = new SupplyUnitResponseModel
                    {
                        Id = x.Id,
                        Name = x.Name,
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt
                    };
                    supplyUnitsResponses.Add(supplyUnitModel);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed Supply Units", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<SupplyUnitResponseModel>.OkPaginated(
                    supplyUnitsResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Supply Units have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("item/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllSupplyItems([FromQuery] SupplyItemQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
        
                // 1. Start with IQueryable for SQL-level filtering
                var query = _getTools.Supply.GetTblSupplyItems(context);
                if (query == null) return Ok(ApiResponse<SupplyItemResponseModel>.OkPaginated(new List<SupplyItemResponseModel>(), model.PageNumber, model.PageSize, 0));

                // Apply SQL-level filters first
                if (model.CategoryId.HasValue && model.CategoryId > 0)
                    query = query.Where(x => x.CategoryId == model.CategoryId.Value);
                if (model.StorageLocationId.HasValue && model.StorageLocationId > 0)
                    query = query.Where(x => x.StorageLocationId == model.StorageLocationId.Value);
                if (model.VendorId.HasValue && model.VendorId > 0)
                    query = query.Where(x => x.VendorId == model.VendorId.Value);

                if (model.StartDate.HasValue)
                    query = query.Where(x => x.CreatedAt >= model.StartDate.Value);
                if (model.EndDate.HasValue)
                    query = query.Where(x => x.CreatedAt <= model.EndDate.Value);

                // 2. Fetch to memory for decryption-based filtering
                var supplyItemsRaw = await query.ToListAsync();

                // 3. Apply memory-level filters
                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.Trim().ToLowerInvariant();
                    supplyItemsRaw = supplyItemsRaw.Where(x =>
                        (x.Code ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Description ?? "").ToLowerInvariant().Contains(searchLower)).ToList();
                }

                if (!string.IsNullOrWhiteSpace(model.Status) && model.Status != "all")
                {
                    if (model.Status == "Available")
                        supplyItemsRaw = supplyItemsRaw.Where(x => (x.Quantity ?? 0) > 0).ToList();
                    else if (model.Status == "Out of Stock")
                        supplyItemsRaw = supplyItemsRaw.Where(x => (x.Quantity ?? 0) <= 0).ToList();
                    else if (model.Status == "Low Stock")
                        supplyItemsRaw = supplyItemsRaw.Where(x => (x.Quantity ?? 0) > 0 && (x.Quantity ?? 0) <= (x.ReorderPoint ?? 0)).ToList();
                }

                // 4. Map to Response Models (Individual Items)
                var supplyItemsResponses = new List<SupplyItemResponseModel>();
                foreach (var item in supplyItemsRaw)
                {

                    supplyItemsResponses.Add(new SupplyItemResponseModel
                    {
                        Id = item.Id,
                        Code = item.Code ?? string.Empty,
                        IARId = item.IARId,
                        Category = await _getTools.PTA.GetTblPTACategoryAsync(item.CategoryId, context),
                        MeasurementUnit = await _getTools.Supply.GetTblSupplyUnitAsync(item.MeasurementUnitId, context),
                        Description = item.Description ?? string.Empty,
                        Quantity = (long?)item.Quantity,
                        UnitCost = item.UnitCost,
                        ReorderPoint = item.ReorderPoint,
                        StorageLocation = await _getTools.Supply.GetTblSupplyStorageLocationAsync(item.StorageLocationId, context),
                        Vendor = await _getTools.Supply.GetTblSupplyVendorAsync(item.VendorId, context),
                        IsActive = item.IsActive,
                        CreatedAt = item.CreatedAt
                    });
                }

                // 5. Pagination
                int totalCount = supplyItemsResponses.Count();
                int skip = (model.PageNumber - 1) * model.PageSize;
                var pagedItems = supplyItemsResponses
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                // 6. Return paginated result
                return Ok(ApiResponse<SupplyItemResponseModel>.OkPaginated(
                    pagedItems,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Supply Items have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("item/all/{itemId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetSupplyItemById([FromQuery] SoloQueryParams model, [FromRoute] long itemId)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                TblSupplyItem? item = await _getTools.Supply.GetTblSupplyItemAsync(itemId, context);
                if (item == null)
                {
                    return NotFound(ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "Supply item not found."));
                }

                var response = new SupplyItemResponseModel
                {
                    Id = item.Id,
                    Code = item.Code ?? string.Empty,
                    IARId = item.IARId,
                    Category = await _getTools.PTA.GetTblPTACategoryAsync(item.CategoryId, context),
                    CategoryId = item.CategoryId,
                    MeasurementUnit = await _getTools.Supply.GetTblSupplyUnitAsync(item.MeasurementUnitId, context),
                    MeasurementUnitId = item.MeasurementUnitId,
                    Description = item.Description ?? string.Empty,
                    Quantity = (long?)item.Quantity,
                    UnitCost = item.UnitCost,
                    ReorderPoint = item.ReorderPoint,
                    StorageLocation = await _getTools.Supply.GetTblSupplyStorageLocationAsync(item.StorageLocationId, context),
                    StorageLocationId = item.StorageLocationId,
                    Vendor = await _getTools.Supply.GetTblSupplyVendorAsync(item.VendorId, context),
                    VendorId = item.VendorId,
                    IsActive = item.IsActive,
                    CreatedAt = item.CreatedAt
                };

                return Ok(ApiResponse<SupplyItemResponseModel>.Ok(response, "Supply Item has been retrieved"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("item/grouped/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllSupplyGroups([FromQuery] SupplyItemQueryParams model)
        {

            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                // 1. Start with IQueryable for SQL-level filtering
                var query = _getTools.Supply.GetTblSupplyItems(context);
                if (query == null) return Ok(ApiResponse<SupplyItemGroupedResponseModel>.OkPaginated(new List<SupplyItemGroupedResponseModel>(), model.PageNumber, model.PageSize, 0));

                // Apply SQL-level filters first
                if (model.CategoryId.HasValue && model.CategoryId > 0)
                    query = query.Where(x => x.CategoryId == model.CategoryId.Value);
                if (model.StorageLocationId.HasValue && model.StorageLocationId > 0)
                    query = query.Where(x => x.StorageLocationId == model.StorageLocationId.Value);
                if (model.VendorId.HasValue && model.VendorId > 0)
                    query = query.Where(x => x.VendorId == model.VendorId.Value);

                if (model.StartDate.HasValue)
                    query = query.Where(x => x.CreatedAt >= model.StartDate.Value);
                if (model.EndDate.HasValue)
                    query = query.Where(x => x.CreatedAt <= model.EndDate.Value);

                // 2. Fetch to memory for decryption-based filtering and grouping
                var supplyItems = await query.ToListAsync();

                // 3. Apply memory-level filters
                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.Trim().ToLowerInvariant();
                    supplyItems = supplyItems.Where(x =>
                        (x.Code ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Description ?? "").ToLowerInvariant().Contains(searchLower)).ToList();
                }

                if (!string.IsNullOrWhiteSpace(model.Status) && model.Status != "all")
                {
                    if (model.Status == "Available")
                        supplyItems = supplyItems.Where(x => (x.Quantity ?? 0) > 0).ToList();
                    else if (model.Status == "Out of Stock")
                        supplyItems = supplyItems.Where(x => (x.Quantity ?? 0) <= 0).ToList();
                }

                // 4. Group by Code and Description, compute aggregates
                var groupedItems = supplyItems
                    .GroupBy(x => new { Code = x.Code ?? string.Empty, Description = x.Description ?? string.Empty })
                    .Select(g =>
                    {
                        var firstItem = g.First();
                        return new
                        {
                            Code = g.Key.Code,
                            Description = g.Key.Description,
                            TotalCurrentStock = g.Sum(x => (long)(x.Quantity ?? 0)),
                            UnitCost = firstItem.UnitCost ?? 0,
                            Id = firstItem.Id,
                            IARId = firstItem.IARId,
                            ReorderPoint = firstItem.ReorderPoint,
                            IsActive = firstItem.IsActive,
                            CreatedAt = firstItem.CreatedAt
                        };
                    })
                    .ToList();

                // ===== 5. Fetch fully completed RIS IDs & sum IssueQuantity =====
                var fullyCompletedRisIds = await context.Set<TblSupplyRIS>()
                    .Where(r => r.IsApproved && !r.IsDeleted)
                    .Select(r => r.Id)
                    .ToListAsync();

                var risItemsQuery = _getTools.Supply.GetTblSupplyRISItems(context);

                var filteredRisItems = risItemsQuery != null
                    ? await risItemsQuery
                        .Where(x => x.SupplyRISId.HasValue && fullyCompletedRisIds.Contains(x.SupplyRISId.Value))
                        .ToListAsync()
                    : new List<TblSupplyRISItem>();

                var issuedStockGroup = filteredRisItems
                    .Where(x => !string.IsNullOrEmpty(x.StockNumber) && !string.IsNullOrEmpty(x.ItemDescription))
                    .GroupBy(x => new { StockNumber = x.StockNumber ?? string.Empty, ItemDescription = x.ItemDescription ?? string.Empty })
                    .Select(g => new
                    {
                        g.Key.StockNumber,
                        g.Key.ItemDescription,
                        TotalIssuedQuantity = g.Sum(x => (long)x.IssueQuantity)
                    })
                    .ToDictionary(k => (k.StockNumber, k.ItemDescription), v => v.TotalIssuedQuantity);

                // 6. Count total and paginate
                int totalCount = groupedItems.Count();
                int skip = (model.PageNumber - 1) * model.PageSize;
                var pagedGroups = groupedItems
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                // 7. Map to response model (subtract issued quantity from current stock)
                var supplyItemsResponses = pagedGroups.Select(x =>
                {
                    var key = (x.Code, x.Description);
                    var issuedQty = issuedStockGroup.GetValueOrDefault(key, 0L);

                    // Calculate final stock once so we can use it for both Stock and Cost
                    var finalCurrentStock = Math.Max(0, x.TotalCurrentStock - issuedQty);

                    return new SupplyItemGroupedResponseModel
                    {
                        Id = x.Id,
                        Code = x.Code ?? string.Empty,
                        IARId = x.IARId,
                        Description = x.Description ?? string.Empty,
                        TotalCurrentStock = finalCurrentStock,
                        TotalStockCost = finalCurrentStock * x.UnitCost,
                        ReorderPoint = (int?)x.ReorderPoint,
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt
                    };
                }).ToList();

                // 8. Commit transaction and log audit trail
                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed Grouped Supply Items", actionBy: model.ActionBySystemUserId);

                // 9. Return paginated result (Removed duplicate return block)
                return Ok(ApiResponse<SupplyItemGroupedResponseModel>.OkPaginated(
                    supplyItemsResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Grouped Supply Items have been retrieved"
                ));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("item/grouped/all/{id}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllSupplyGroupedItems(long id, [FromQuery] SupplyItemQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                // 1. Get the target item to obtain its Code and Description
                TblSupplyItem? targetItem = await _getTools.Supply.GetTblSupplyItemAsync(id, context);
                if (targetItem == null)
                {
                    return NotFound(ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "Supply item not found."));
                }

                string targetCode = targetItem.Code ?? string.Empty;
                string targetDescription = targetItem.Description ?? string.Empty;

                // ===== 2. Fetch and decrypt supply items (Additions) =====
                var supplyItemsQuery = _getTools.Supply.GetTblSupplyItems(context);
                var allSupplyItems = supplyItemsQuery != null
                    ? await supplyItemsQuery.ToListAsync()
                    : new List<TblSupplyItem>();

                // Sort by CreatedAt Ascending (Oldest First) to prepare for FIFO deduction
                var matchedSupplyItems = allSupplyItems
                    .Where(x => (x.Code ?? string.Empty).Equals(targetCode, StringComparison.OrdinalIgnoreCase) &&
                                (x.Description ?? string.Empty).Equals(targetDescription, StringComparison.OrdinalIgnoreCase))
                    .OrderBy(x => x.CreatedAt)
                    .ToList();

                // ===== 3. Fetch Fully Completed RIS Items & Calculate Total Issued =====
                var fullyCompletedRisIds = await context.Set<TblSupplyRIS>()
                    .Where(r => r.IsApproved)
                    .Select(r => r.Id)
                    .ToListAsync();

                var risItemsQuery = _getTools.Supply.GetTblSupplyRISItems(context);
                var filteredRisItems = risItemsQuery != null
                    ? await risItemsQuery
                        .Where(x => x.SupplyRISId.HasValue && fullyCompletedRisIds.Contains(x.SupplyRISId.Value))
                        .ToListAsync()
                    : new List<TblSupplyRISItem>();

                long totalIssuedQuantity = filteredRisItems
                    .Where(x => x.StockNumber == targetCode && x.ItemDescription == targetDescription)
                    .Sum(x => x.IssueQuantity);

                // ===== 4. Apply FIFO (First-In, First-Out) Deduction =====
                // We deduct the total issued quantity from the oldest batches first.
                var itemsWithRemainingQty = new List<dynamic>();
                long remainingToDeduct = totalIssuedQuantity;

                foreach (var item in matchedSupplyItems)
                {
                    long batchOriginalQty = item.Quantity ?? 0;
                    long batchRemainingQty = batchOriginalQty;

                    if (remainingToDeduct > 0)
                    {
                        if (remainingToDeduct >= batchOriginalQty)
                        {
                            //This whole batch is used up
                            batchRemainingQty = 0;
                            remainingToDeduct -= batchOriginalQty;
                        }
                        else
                        {
                            //Only part of this batch is used up
                            batchRemainingQty = batchOriginalQty - remainingToDeduct;
                            remainingToDeduct = 0;
                        }
                    }

                    itemsWithRemainingQty.Add(new { Item = item, RemainingQty = batchRemainingQty });
                }

                // ===== 5. Apply Search & Date Filters =====
                var filteredItems = itemsWithRemainingQty.AsEnumerable();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    filteredItems = filteredItems.Where(x =>
                        (x.Item.Code ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Item.Description ?? "").ToLowerInvariant().Contains(searchLower));
                }

                if (model.CategoryId.HasValue && model.CategoryId > 0)
                    filteredItems = filteredItems.Where(x => x.Item.CategoryId == model.CategoryId.Value);
                if (model.StorageLocationId.HasValue && model.StorageLocationId > 0)
                    filteredItems = filteredItems.Where(x => x.Item.StorageLocationId == model.StorageLocationId.Value);
                if (model.VendorId.HasValue && model.VendorId > 0)
                    filteredItems = filteredItems.Where(x => x.Item.VendorId == model.VendorId.Value);

                if (model.StartDate.HasValue)
                    filteredItems = filteredItems.Where(x => x.Item.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    filteredItems = filteredItems.Where(x => x.Item.CreatedAt <= model.EndDate.Value);

                if (!string.IsNullOrWhiteSpace(model.Status) && model.Status != "all")
                {
                    if (model.Status == "Available")
                        filteredItems = filteredItems.Where(x => x.RemainingQty > 0);
                    else if (model.Status == "Out of Stock")
                        filteredItems = filteredItems.Where(x => x.RemainingQty <= 0);
                }

                // ===== 6. Count, Paginate & Re-sort (Newest First for UI) =====
                int totalCount = filteredItems.Count();
                int skip = (model.PageNumber - 1) * model.PageSize;

                var pagedItems = filteredItems
                    .OrderByDescending(x => x.Item.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                // ===== 7. Map to Response Model =====
                var supplyItemsResponses = new List<SupplyItemResponseModel>();
                foreach (var x in pagedItems)
                {
                    TblSupplyItem item = x.Item;
                    var response = new SupplyItemResponseModel
                    {
                        Id = item.Id,
                        Code = item.Code ?? string.Empty,
                        IARId = item.IARId,
                        Category = await _getTools.PTA.GetTblPTACategoryAsync(item.CategoryId, context),
                        MeasurementUnit = await _getTools.Supply.GetTblSupplyUnitAsync(item.MeasurementUnitId, context),
                        Description = item.Description ?? string.Empty,

                        // MAP THE CALCULATED FIFO QUANTITY HERE
                        Quantity = x.RemainingQty,

                        UnitCost = item.UnitCost,
                        ReorderPoint = item.ReorderPoint,
                        StorageLocation = await _getTools.Supply.GetTblSupplyStorageLocationAsync(item.StorageLocationId, context),
                        Vendor = await _getTools.Supply.GetTblSupplyVendorAsync(item.VendorId, context),
                        IsActive = item.IsActive,
                        CreatedAt = item.CreatedAt
                    };
                    supplyItemsResponses.Add(response);
                }

                // ===== 8. Commit & Log =====
                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed grouped supply items for Code: {targetCode}, Description: {targetDescription}", actionBy: model.ActionBySystemUserId);

                return Ok(ApiResponse<SupplyItemResponseModel>.OkPaginated(
                    supplyItemsResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Grouped Supply Items have been retrieved"
                ));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("item/grouped/stock-card/all/{stockNumber}/{description}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetSupplyStockCardItems(
            [FromQuery] SupplyItemQueryParams model,
            string stockNumber,
            string description)
        {
            
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            byte[] stockNumberBytes = Convert.FromBase64String(stockNumber);
            byte[] descriptionBytes = Convert.FromBase64String(description);

            string rawStockNumber = Encoding.UTF8.GetString(stockNumberBytes);
            string rawDescription = Encoding.UTF8.GetString(descriptionBytes);


            string stockNumberString = System.Net.WebUtility.UrlDecode(rawStockNumber);
            string descriptionString = System.Net.WebUtility.UrlDecode(rawDescription);
            try
            {
                string targetCode = stockNumberString ?? string.Empty;
                string targetDesc = descriptionString ?? string.Empty;

                // ===== 1. Fetch and decrypt supply items (additions) =====
                var supplyItemsQuery = _getTools.Supply.GetTblSupplyItems(context);
                var allSupplyItems = supplyItemsQuery != null
                    ? await supplyItemsQuery.ToListAsync()
                    : new List<TblSupplyItem>();

                // Now filter in memory (Client-side evaluation) to safely use decrypted properties
                var additionEvents = allSupplyItems
                    .Where(x => x.Code == targetCode && x.Description == targetDesc && (x.Quantity ?? 0) > 0)
                    .Select(x => new
                    {
                        x.Id,
                        Quantity = x.Quantity,
                        x.CreatedAt,
                        x.IsActive,
                        ItemRemarks = (string?)null,
                        UnitId = x.MeasurementUnitId,
                        Type = "Addition",
                        SupplyRISId = (long?)null,
                        IARId = x.IARId
                    })
                    .ToList();

                // ===== 2. Fetch all issuance events (RIS Items) =====

                // This runs purely in SQL (Extremely Fast) because these columns are NOT encrypted
                var fullyCompletedRisIds = await context.Set<TblSupplyRIS>()
                    .Where(r => r.IsApproved)
                    .Select(r => r.Id)
                    .ToListAsync();

                var risItemsQuery = _getTools.Supply.GetTblSupplyRISItems(context);

                // Optimization: Filter out unapproved RIS items at the SQL level FIRST
                var filteredRisItems = risItemsQuery != null
                    ? await risItemsQuery
                        .Where(x => x.SupplyRISId.HasValue && fullyCompletedRisIds.Contains(x.SupplyRISId.Value))
                        .ToListAsync()
                    : new List<TblSupplyRISItem>();

                // Now filter by the [NotMapped] decrypted properties in memory
                var issuanceEvents = filteredRisItems
                    .Where(x => x.StockNumber == targetCode && x.ItemDescription == targetDesc && x.IssueQuantity > 0)
                    .Select(x => new
                    {
                        x.Id,
                        Quantity = x.IssueQuantity,
                        x.CreatedAt,
                        x.IsActive,
                        x.ItemRemarks,
                        UnitId = x.UnitId,
                        Type = "Issuance",
                        SupplyRISId = x.SupplyRISId
                    })
                    .ToList();

                // ===== 3. Combine and sort chronologically =====
                var allEvents = additionEvents.Cast<dynamic>()
                    .Concat(issuanceEvents.Cast<dynamic>())
                    .OrderBy(e => e.CreatedAt)
                    .ToList();

                // ===== 4. Efficient unit loading =====
                var unitIds = allEvents
                    .Select(e => (long?)e.UnitId)
                    .Where(id => id.HasValue)
                    .Select(id => id.Value)
                    .Distinct()
                    .ToList();

                var units = new Dictionary<long, TblSupplyUnit>();
                if (unitIds.Any())
                {
                    var unitEntities = await _getTools.Supply.GetTblSupplyUnitsByIds(context, unitIds);
                    units = unitEntities.ToDictionary(u => u.Id);
                }

                // ===== 5. Pagination =====
                int totalCount = allEvents.Count;
                int skip = (model.PageNumber - 1) * model.PageSize;
                var pagedEvents = allEvents.Skip(skip).Take(model.PageSize).ToList();

                // ===== 6. Compute running balance before the first event in the page =====
                long previousBalance = 0;
                if (skip > 0)
                {
                    var eventsBeforePage = allEvents.Take(skip);
                    foreach (var evt in eventsBeforePage)
                    {
                        if (evt.Type == "Addition")
                            previousBalance += evt.Quantity;
                        else if (evt.Type == "Issuance")
                            previousBalance -= evt.Quantity;
                    }
                }

                // ===== 7. Build response models for the paged events =====
                var responseItems = new List<SupplyStockCardItemViewModel>();
                long currentBalance = previousBalance;
                foreach (var evt in pagedEvents)
                {
                    long added = 0, issued = 0;
                    long newBalance = currentBalance;

                    if (evt.Type == "Addition")
                    {
                        added = evt.Quantity;
                        newBalance = currentBalance + added;
                    }
                    else if (evt.Type == "Issuance")
                    {
                        issued = evt.Quantity;
                        newBalance = currentBalance - issued;
                    }

                    var unit = evt.UnitId != null && units.ContainsKey(evt.UnitId)
                        ? units[evt.UnitId]
                        : null;

                    // --- ADDED: Fetch Parent RIS, Office, and Division logic ---
                    long? risId = evt.SupplyRISId;
                    var parentRIS = risId.HasValue
                        ? await _getTools.Supply.GetTblSupplyRISAsync(risId.Value, context)
                        : null;

                    // --- Fetch Parent IAR for addition events ---
                    long? iarId = evt.Type == "Addition" ? evt.IARId : null;
                    var parentIAR = iarId.HasValue
                        ? await _getTools.Supply.GetTblSupplyIARAsync(iarId.Value, context)
                        : null;

                    responseItems.Add(new SupplyStockCardItemViewModel
                    {
                        Id = evt.Id,
                        StockNumber = targetCode,
                        Unit = unit,
                        ItemDescription = targetDesc,
                        CurrentStockQuantity = currentBalance,
                        AddedStockQuantity = added,
                        IssuedStockQuantity = issued,
                        NewStockQuantity = newBalance,
                        ItemRemarks = evt.ItemRemarks,
                        IsActive = evt.IsActive,
                        CreatedAt = evt.CreatedAt,
                        SupplyRISId = risId,
                        RISNumber = parentRIS?.RISNumber,
                        IARNumber = parentIAR?.IARNumber,

                        // --- ADDED: Map Office and Division safely ---
                        Office = parentRIS != null
                            ? await _getTools.Office.GetTblOfficeAsync(parentRIS.OfficeId, context)
                            : null,
                        Division = parentRIS != null
                            ? await _getTools.Office.GetTblDivisionAsync(parentRIS.DivisionId, context)
                            : null
                    });

                    currentBalance = newBalance;
                }

                // ===== 8. Commit and log =====
                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options,
                    $"Viewed stock card for {targetCode} - {targetDesc}",
                    actionBy: model.ActionBySystemUserId);

                // ===== 9. Return paginated result =====
                
                return Ok(ApiResponse<SupplyStockCardItemViewModel>.OkPaginated(
                    responseItems,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Stock card items retrieved"
                ));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("item/unique/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllSupplyUniqueRawItems([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblSupplyItem>? supplyItemsRaw = await _getTools.Supply.GetTblSupplyItems(context).ToListAsync();

                var supplyItems = (supplyItemsRaw ?? new List<TblSupplyItem>())
                    .OrderByDescending(x => x.CreatedAt)
                    .GroupBy(i => new { i.Code, i.Description })
                    .Select(g => g.First())
                    .AsEnumerable();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    supplyItems = supplyItems.Where(x =>
                        (x.Code ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Description ?? "").ToLowerInvariant().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                {
                    supplyItems = supplyItems.Where(x => x.CreatedAt >= model.StartDate.Value);
                }

                if (model.EndDate.HasValue)
                {
                    supplyItems = supplyItems.Where(x => x.CreatedAt <= model.EndDate.Value);
                }

                int totalCount = supplyItems.Count();
                int skip = (model.PageNumber - 1) * model.PageSize;

                var supplyItemsList = supplyItems
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var supplyItemsResponses = new List<SupplyItemResponseModel>();

                foreach (var x in supplyItemsList)
                {
                    var supplyUnitModel = new SupplyItemResponseModel
                    {
                        Id = x.Id,
                        Code = x.Code,
                        Category = await _getTools.PTA.GetTblPTACategoryAsync(x.CategoryId, context),
                        MeasurementUnit = await _getTools.Supply.GetTblSupplyUnitAsync(x.MeasurementUnitId, context),
                        Description = x.Description,
                        //CurrentStock = x.CurrentStock,
                        //UnitCost = x.UnitCost,
                        //ReorderPoint = x.ReorderPoint,
                        StorageLocation = await _getTools.Supply.GetTblSupplyStorageLocationAsync(x.StorageLocationId, context),
                        Vendor = await _getTools.Supply.GetTblSupplyVendorAsync(x.VendorId, context),
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt
                    };

                    supplyItemsResponses.Add(supplyUnitModel);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed Supply Items", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<SupplyItemResponseModel>.OkPaginated(
                    supplyItemsResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Supply Items have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("iar/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllIARs([FromQuery] SupplyIARQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblSupplyIAR>? supplyIARs = await _getTools.Supply.GetTblSupplyIARs(context).ToListAsync();

                // Advanced Filtering
                if (!string.IsNullOrWhiteSpace(model.Status) && model.Status != "all")
                {
                    if (model.Status == "Approved")
                        supplyIARs = supplyIARs.Where(x => x.IsApproved);
                    else if (model.Status == "Pending")
                        supplyIARs = supplyIARs.Where(x => !x.IsApproved);
                }

                if (model.VendorId.HasValue && model.VendorId > 0)
                    supplyIARs = supplyIARs.Where(x => x.VendorId == model.VendorId.Value);

                if (model.OfficeId.HasValue && model.OfficeId > 0)
                    supplyIARs = supplyIARs.Where(x => x.OfficeId == model.OfficeId.Value);

                if (model.DivisionId.HasValue && model.DivisionId > 0)
                    supplyIARs = supplyIARs.Where(x => x.DivisionId == model.DivisionId.Value);

                if (model.StartDate.HasValue)
                    supplyIARs = supplyIARs.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    supplyIARs = supplyIARs.Where(x => x.CreatedAt <= model.EndDate.Value);

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    var searchResults = new List<TblSupplyIAR>();
                    foreach (var x in supplyIARs)
                    {
                        var recordIds = await GetIARRecordIdsAsync(context, x.Id, x.RecordId);
                        bool matches = (x.IARNumber ?? "").ToLowerInvariant().Contains(searchLower) ||
                                       (x.IARNumberDate.ToString() ?? "").ToLowerInvariant().Contains(searchLower) ||
                                       (x.PONumber ?? "").ToLowerInvariant().Contains(searchLower) ||
                                       (x.EntityName ?? "").ToLowerInvariant().Contains(searchLower) ||
                                       (x.FundCluster ?? "").ToLowerInvariant().Contains(searchLower);

                        if (!matches && recordIds.Count > 0)
                        {
                            var linkedDRs = await _getTools.Delivery.GetTblDeliveryRecords(context)
                                .Where(d => recordIds.Contains(d.Id))
                                .ToListAsync();
                            matches = linkedDRs.Any(d => (d.DRNumber ?? "").ToLowerInvariant().Contains(searchLower));
                        }

                        if (matches) searchResults.Add(x);
                    }
                    supplyIARs = searchResults;
                }

                int totalCount = supplyIARs.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var supplyIARsList = supplyIARs
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var supplyIResponses = new List<SupplyIARResponseModel>();

                foreach (var x in supplyIARsList)
                {
                    var recordIds = await GetIARRecordIdsAsync(context, x.Id, x.RecordId);
                    var supplyIARModel = new SupplyIARResponseModel
                    {
                        Id = x.Id,
                        RecordId = recordIds.FirstOrDefault(),
                        RecordIds = recordIds,
                        DRNumber = await GetIARDRNumbersAsync(context, recordIds),
                        CenterCode = x.ResponsibilityCenterCode,
                        EntityName = x.EntityName,
                        FundCluster = x.FundCluster,
                        Vendor = await _getTools.Supply.GetTblSupplyVendorAsync(x.VendorId, context),
                        PONumber = x.PONumber,
                        Office = await _getTools.Office.GetTblOfficeAsync(x.OfficeId, context),
                        Division = await _getTools.Office.GetTblDivisionAsync(x.DivisionId, context),
                        IARNumber = x.IARNumber,
                        IARNumberDate = x.IARNumberDate,
                        IARInvoiceNumber = x.IARInvoiceNumber,
                        IARInvoiceNumberDate = x.IARInvoiceNumberDate,
                        PODate = x.PODate,
                        ActualDeliveryDate = x.ActualDeliveryDate,
                        IsActive = x.IsActive,
                        IsApproved = x.IsApproved,
                        SignedFileStorageId = x.SignedFileStorageId,
                        CreatedAt = x.CreatedAt
                    };
                    supplyIResponses.Add(supplyIARModel);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed Supply IAR", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<SupplyIARResponseModel>.OkPaginated(
                    supplyIResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Supply IARs have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("iar/all/{iarId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetIAR([FromQuery] PaginationGenericQueryParams model, [FromRoute] long iarId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                TblSupplyIAR? supplyIAR = await _getTools.Supply.GetTblSupplyIARAsync(iarId, context);

                if (supplyIAR == null)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(ApiStatusCode.NotFound, ApiResponse<object>.NotFound("Supply IAR not found."));
                }

                var recordIds = await GetIARRecordIdsAsync(context, supplyIAR.Id, supplyIAR.RecordId);
                var supplyIARModel = new SupplyIARResponseModel
                {
                    Id = supplyIAR.Id,
                    RecordId = recordIds.FirstOrDefault(),
                    RecordIds = recordIds,
                    DRNumber = await GetIARDRNumbersAsync(context, recordIds),
                    CenterCode = supplyIAR.ResponsibilityCenterCode,
                    EntityName = supplyIAR.EntityName,
                    FundCluster = supplyIAR.FundCluster,
                    Vendor = await _getTools.Supply.GetTblSupplyVendorAsync(supplyIAR.VendorId, context),
                    PONumber = supplyIAR.PONumber,
                    Office = await _getTools.Office.GetTblOfficeAsync(supplyIAR.OfficeId, context),
                    Division = await _getTools.Office.GetTblDivisionAsync(supplyIAR.DivisionId, context),
                    IARNumber = supplyIAR.IARNumber,
                    IARNumberDate = supplyIAR.IARNumberDate,
                    IARInvoiceNumber = supplyIAR.IARInvoiceNumber,
                    IARInvoiceNumberDate = supplyIAR.IARInvoiceNumberDate,
                    PODate = supplyIAR.PODate,
                    ActualDeliveryDate = supplyIAR.ActualDeliveryDate,
                    IsActive = supplyIAR.IsActive,
                    IsApproved = supplyIAR.IsApproved,
                    SignedFileStorageId = supplyIAR.SignedFileStorageId,
                    CreatedAt = supplyIAR.CreatedAt
                };

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed Supply IAR {supplyIAR.Id}", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<SupplyIARResponseModel>.Ok(supplyIARModel, "Supply IAR has been retrieved"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("iar/summary")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetIARSummary([FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var supplyIARs = await _getTools.Supply.GetTblSupplyIARs(context)
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync();

                var responses = new List<SupplyIARResponseModel>();
                foreach (var x in supplyIARs)
                {
                    var recordIds = await GetIARRecordIdsAsync(context, x.Id, x.RecordId);
                    responses.Add(new SupplyIARResponseModel
                    {
                        Id = x.Id,
                        IARNumber = x.IARNumber,
                        IARNumberDate = x.IARNumberDate,
                        IsApproved = x.IsApproved,
                        RecordId = recordIds.FirstOrDefault(),
                        RecordIds = recordIds,
                        CreatedAt = x.CreatedAt
                    });
                }

                return Ok(ApiResponse<List<SupplyIARResponseModel>>.Ok(responses, "IAR summary retrieved"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred."));
            }
        }

        [HttpGet("ris/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllRISs([FromQuery] SupplyRISQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblSupplyRIS>? supplyRISs = await _getTools.Supply.GetTblSupplyRISs(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    supplyRISs = supplyRISs.Where(x =>
                        (!string.IsNullOrEmpty(x.RISNumber) && x.RISNumber.ToLowerInvariant().Contains(searchLower)) ||
                        (!string.IsNullOrEmpty(x.EntityName) && x.EntityName.ToLowerInvariant().Contains(searchLower)) ||
                        (!string.IsNullOrEmpty(x.FundCluster) && x.FundCluster.ToLowerInvariant().Contains(searchLower)));
                }

                if (!string.IsNullOrWhiteSpace(model.Status) && model.Status != "all")
                {
                    if (model.Status == "Pending")
                        supplyRISs = supplyRISs.Where(x => !x.IsApproved);
                    else if (model.Status == "Approved")
                        supplyRISs = supplyRISs.Where(x => x.IsApproved);
                }

                if (model.OfficeId.HasValue && model.OfficeId > 0)
                    supplyRISs = supplyRISs.Where(x => x.OfficeId == model.OfficeId.Value);

                if (model.DivisionId.HasValue && model.DivisionId > 0)
                    supplyRISs = supplyRISs.Where(x => x.DivisionId == model.DivisionId.Value);

                if (model.StartDate.HasValue)
                    supplyRISs = supplyRISs.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    supplyRISs = supplyRISs.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = supplyRISs.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var supplyRISsList = supplyRISs
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var supplyIResponses = new List<SupplyRISResponseModel>();



                foreach (var x in supplyRISsList)
                {
                    // Map ApprovedBySystemUser
                    UserBasicResponseModel? approvedByUser = null;
                    if (x.RISApprovedBySystemUserId.HasValue)
                    {
                        var user = await _getTools.Account.GetTblSystemUserAsync(x.RISApprovedBySystemUserId.Value, context);
                        if (user != null)
                        {
                            approvedByUser = new UserBasicResponseModel
                            {
                                Id = user.Id,
                                FirstName = user.FirstName,
                                LastName = user.LastName,
                                Email = user.Email,
                                EmployeeId = user.EmployeeId,
                                IsActive = user.IsActive
                            };
                        }
                    }

                    // Map IssuedBySystemUser
                    UserBasicResponseModel? issuedByUser = null;
                    if (x.RISIssuedBySystemUserId.HasValue)
                    {
                        var user = await _getTools.Account.GetTblSystemUserAsync(x.RISIssuedBySystemUserId.Value, context);
                        if (user != null)
                        {
                            issuedByUser = new UserBasicResponseModel
                            {
                                Id = user.Id,
                                FirstName = user.FirstName,
                                LastName = user.LastName,
                                Email = user.Email,
                                EmployeeId = user.EmployeeId,
                                IsActive = user.IsActive
                            };
                        }
                    }

                    // Map ReceivedBySystemUser (note spelling of column: RISRecievedBySystemUserId)
                    UserBasicResponseModel? receivedByUser = null;
                    if (x.RISReceivedBySystemUserId.HasValue) // adjust property name if needed
                    {
                        var user = await _getTools.Account.GetTblSystemUserAsync(x.RISReceivedBySystemUserId.Value, context);
                        if (user != null)
                        {
                            receivedByUser = new UserBasicResponseModel
                            {
                                Id = user.Id,
                                FirstName = user.FirstName,
                                LastName = user.LastName,
                                Email = user.Email,
                                EmployeeId = user.EmployeeId,
                                IsActive = user.IsActive
                            };
                        }
                    }

                    UserBasicResponseModel? requestedByUser = null;
                    if (x.RISRequestedBySystemUserId.HasValue) // adjust property name if needed
                    {
                        var user = await _getTools.Account.GetTblSystemUserAsync(x.RISRequestedBySystemUserId.Value, context);
                        if (user != null)
                        {
                            requestedByUser = new UserBasicResponseModel
                            {
                                Id = user.Id,
                                FirstName = user.FirstName,
                                LastName = user.LastName,
                                Email = user.Email,
                                EmployeeId = user.EmployeeId,
                                IsActive = user.IsActive
                            };
                        }
                    }

                    var supplyRISModel = new SupplyRISResponseModel
                    {
                        Id = x.Id,
                        EntityName = x.EntityName,
                        FundCluster = x.FundCluster,
                        Office = await _getTools.Office.GetTblOfficeAsync(x.OfficeId, context),
                        Division = await _getTools.Office.GetTblDivisionAsync(x.DivisionId, context),
                        ResponsibilityCenterCode = x.ResponsibilityCenterCode,
                        RISNumber = x.RISNumber,
                        RISPurpose = x.RISPurpose,
                        RequestedBySystemUser = requestedByUser,
                        RISRequestedDate = x.RISRequestedDate,
                        ApprovedBySystemUser = approvedByUser,
                        RISApprovedDate = x.RISApprovedDate,
                        IssuedBySystemUser = issuedByUser,
                        RISIssuedDate = x.RISIssuedDate,
                        ReceivedBySystemUser = receivedByUser,
                        RISReceivedDate = x.RISReceivedDate,
                        IsApproved = x.IsApproved,
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt
                    };
                    supplyIResponses.Add(supplyRISModel);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed Supply RIS", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<SupplyRISResponseModel>.OkPaginated(
                    supplyIResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Supply RISs have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("ris/{risId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetSupplyRISById([FromQuery] SoloQueryParams model, [FromRoute] long risId)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                TblSupplyRIS? ris = await _getTools.Supply.GetTblSupplyRISAsync(risId, context);
                if (ris == null)
                {
                    return NotFound(ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "Supply RIS not found."));
                }

                // Map ApprovedBySystemUser
                UserBasicResponseModel? approvedByUser = null;
                if (ris.RISApprovedBySystemUserId.HasValue)
                {
                    var user = await _getTools.Account.GetTblSystemUserAsync(ris.RISApprovedBySystemUserId.Value, context);
                    if (user != null)
                    {
                        approvedByUser = new UserBasicResponseModel
                        {
                            Id = user.Id,
                            FirstName = user.FirstName,
                            LastName = user.LastName,
                            Email = user.Email,
                            EmployeeId = user.EmployeeId,
                            IsActive = user.IsActive
                        };
                    }
                }

                // Map IssuedBySystemUser
                UserBasicResponseModel? issuedByUser = null;
                if (ris.RISIssuedBySystemUserId.HasValue)
                {
                    var user = await _getTools.Account.GetTblSystemUserAsync(ris.RISIssuedBySystemUserId.Value, context);
                    if (user != null)
                    {
                        issuedByUser = new UserBasicResponseModel
                        {
                            Id = user.Id,
                            FirstName = user.FirstName,
                            LastName = user.LastName,
                            Email = user.Email,
                            EmployeeId = user.EmployeeId,
                            IsActive = user.IsActive
                        };
                    }
                }

                // Map ReceivedBySystemUser
                UserBasicResponseModel? receivedByUser = null;
                if (ris.RISReceivedBySystemUserId.HasValue)
                {
                    var user = await _getTools.Account.GetTblSystemUserAsync(ris.RISReceivedBySystemUserId.Value, context);
                    if (user != null)
                    {
                        receivedByUser = new UserBasicResponseModel
                        {
                            Id = user.Id,
                            FirstName = user.FirstName,
                            LastName = user.LastName,
                            Email = user.Email,
                            EmployeeId = user.EmployeeId,
                            IsActive = user.IsActive
                        };
                    }
                }

                UserBasicResponseModel? requestedByUser = null;
                if (ris.RISRequestedBySystemUserId.HasValue)
                {
                    var user = await _getTools.Account.GetTblSystemUserAsync(ris.RISRequestedBySystemUserId.Value, context);
                    if (user != null)
                    {
                        requestedByUser = new UserBasicResponseModel
                        {
                            Id = user.Id,
                            FirstName = user.FirstName,
                            LastName = user.LastName,
                            Email = user.Email,
                            EmployeeId = user.EmployeeId,
                            IsActive = user.IsActive
                        };
                    }
                }

                var responseModel = new SupplyRISResponseModel
                {
                    Id = ris.Id,
                    EntityName = ris.EntityName,
                    FundCluster = ris.FundCluster,
                    Office = await _getTools.Office.GetTblOfficeAsync(ris.OfficeId, context),
                    Division = await _getTools.Office.GetTblDivisionAsync(ris.DivisionId, context),
                    ResponsibilityCenterCode = ris.ResponsibilityCenterCode,
                    RISNumber = ris.RISNumber,
                    RISPurpose = ris.RISPurpose,
                    RequestedBySystemUser = requestedByUser,
                    RISRequestedDate = ris.RISRequestedDate,
                    ApprovedBySystemUser = approvedByUser,
                    RISApprovedDate = ris.RISApprovedDate,
                    IssuedBySystemUser = issuedByUser,
                    RISIssuedDate = ris.RISIssuedDate,
                    ReceivedBySystemUser = receivedByUser,
                    RISReceivedDate = ris.RISReceivedDate,
                    IsApproved = ris.IsApproved,
                    IsActive = ris.IsActive,
                    CreatedAt = ris.CreatedAt
                };

                return Ok(ApiResponse<SupplyRISResponseModel>.Ok(responseModel, "Supply RIS has been retrieved"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred."));
            }
        }

        [HttpGet("ris-item/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllSupplyRISItems([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblSupplyRISItem>? supplyRISItems = await _getTools.Supply.GetTblSupplyRISItems(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    supplyRISItems = supplyRISItems.Where(x =>
                        (x.StockNumber ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.ItemDescription ?? "").ToLowerInvariant().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    supplyRISItems = supplyRISItems.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    supplyRISItems = supplyRISItems.Where(x => x.CreatedAt <= model.EndDate.Value);

                int totalCount = supplyRISItems.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var supplyRISItemsList = supplyRISItems
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                var supplyRISItemsResponses = new List<SupplyRISItemResponseModel>();

                foreach (var x in supplyRISItemsList)
                {
                    var supplyRISItemModel = new SupplyRISItemResponseModel
                    {
                        Id = x.Id,
                        RISId = x.SupplyRISId,
                        StockNumber = x.StockNumber,
                        Unit = await _getTools.Supply.GetTblSupplyUnitAsync(x.UnitId, context),
                        ItemDescription = x.ItemDescription,
                        RequisitionQuantity = x.RequisitionQuantity,
                        IsAvailable = x.IsAvailable,
                        IssueQuantity = x.IssueQuantity,
                        ItemRemarks = x.ItemRemarks,
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt
                    };
                    supplyRISItemsResponses.Add(supplyRISItemModel);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed Supply Items", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<SupplyRISItemResponseModel>.OkPaginated(
                    supplyRISItemsResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Supply Items have been retrieved"
                ));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("ris-item/all/{risId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetSupplyRISItemsByRISId(long risId, [FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                // Fetch all supply RIS items from the repository
                IEnumerable<TblSupplyRISItem>? supplyRISItems = await _getTools.Supply.GetTblSupplyRISItems(context).ToListAsync();

                // Filter by the provided RIS ID
                supplyRISItems = supplyRISItems.Where(x => x.SupplyRISId == risId);

                // Apply search filter if provided
                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    supplyRISItems = supplyRISItems.Where(x =>
                        (x.StockNumber ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.ItemDescription ?? "").ToLowerInvariant().Contains(searchLower));
                }

                // Apply date filters
                if (model.StartDate.HasValue)
                    supplyRISItems = supplyRISItems.Where(x => x.CreatedAt >= model.StartDate.Value);
                if (model.EndDate.HasValue)
                    supplyRISItems = supplyRISItems.Where(x => x.CreatedAt <= model.EndDate.Value);

                // Count total before pagination
                int totalCount = supplyRISItems.Count();

                // Apply pagination
                int skip = (model.PageNumber - 1) * model.PageSize;
                var supplyRISItemsList = supplyRISItems
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                // Map to response model
                var supplyRISItemsResponses = new List<SupplyRISItemResponseModel>();
                foreach (var x in supplyRISItemsList)
                {
                    var supplyRISItemModel = new SupplyRISItemResponseModel
                    {
                        Id = x.Id,
                        RISId = x.SupplyRISId,
                        StockNumber = x.StockNumber,
                        Unit = await _getTools.Supply.GetTblSupplyUnitAsync(x.UnitId, context),
                        ItemDescription = x.ItemDescription,
                        RequisitionQuantity = x.RequisitionQuantity,
                        IsAvailable = x.IsAvailable,
                        IssueQuantity = x.IssueQuantity,
                        ItemRemarks = x.ItemRemarks,
                        IsActive = x.IsActive,
                        CreatedAt = x.CreatedAt
                    };
                    supplyRISItemsResponses.Add(supplyRISItemModel);
                }

                // Commit transaction (no changes, but keeps consistency)
                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Log activity
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed Supply RIS Items for RIS ID: {risId}", actionBy: model.ActionBySystemUserId);

                // Return paginated response
                return Ok(ApiResponse<SupplyRISItemResponseModel>.OkPaginated(
                    supplyRISItemsResponses,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Supply RIS Items have been retrieved"
                ));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpGet("rmsi-items/filter/{categoryId}/{startDate}/{endDate}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> FilterRMSIItems([FromQuery] PaginationGenericQueryParams model, [FromRoute] long categoryId, [FromRoute] DateTime startDate, [FromRoute] DateTime endDate)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                // 1. Get supply RIS within date range
                var supplyRISs = await _getTools.Supply.GetTblSupplyRISs(context)
                    .Where(x => x.CreatedAt >= startDate && x.CreatedAt <= endDate)
                    .Select(x => new { x.Id, x.RISNumber, x.ResponsibilityCenterCode, x.OfficeId, x.DivisionId })
                    .ToListAsync();

                if (!supplyRISs.Any())
                {
                    return Ok(ApiResponse<FilteredRMSIItemGroupResponseModel>.OkPaginated(
                        new List<FilteredRMSIItemGroupResponseModel>(),
                        model.PageNumber,
                        model.PageSize,
                        0,
                        "No items found"
                    ));
                }

                var supplyRISIds = supplyRISs.Select(x => x.Id).ToList();

                // 2. Get RIS items for those RIS IDs
                var supplyRISItems = await _getTools.Supply.GetTblSupplyRISItems(context)
                    .Where(x => supplyRISIds.Contains(x.SupplyRISId.Value))
                    .Select(x => new
                    {
                        x.SupplyRISId,
                        x.StockNumber,
                        x.ItemDescription,
                        x.IssueQuantity
                    })
                    .ToListAsync();

                if (!supplyRISItems.Any())
                {
                    return Ok(ApiResponse<FilteredRMSIItemGroupResponseModel>.OkPaginated(
                        new List<FilteredRMSIItemGroupResponseModel>(),
                        model.PageNumber,
                        model.PageSize,
                        0,
                        "No items found"
                    ));
                }

                // 3. Decrypt and get distinct (StockNumber, Description) pairs from RIS items
                var risItemPairs = supplyRISItems
                    .Select(x => new
                    {
                        x.StockNumber,
                        Description = x.ItemDescription
                    })
                    .Where(x => !string.IsNullOrEmpty(x.StockNumber) && !string.IsNullOrEmpty(x.Description))
                    .Distinct()
                    .ToList();

                // 4. Get supply items that match those pairs and have the given category
                var allSupplyItems = await _getTools.Supply.GetTblSupplyItems(context).ToListAsync();
                var matchingSupplyItems = allSupplyItems
                    .Select(x => new
                    {
                        x.Code,
                        x.Description,
                        x.CategoryId
                    })
                    .Where(x => categoryId == 0 || x.CategoryId == categoryId)
                    .ToList();

                // Filter pairs that exist in supply items (i.e., belong to the category)
                var validPairs = risItemPairs
                    .Where(pair => matchingSupplyItems.Any(si => si.Code == pair.StockNumber && si.Description == pair.Description))
                    .ToList();

                if (!validPairs.Any())
                {
                    return Ok(ApiResponse<FilteredRMSIItemGroupResponseModel>.OkPaginated(
                        new List<FilteredRMSIItemGroupResponseModel>(),
                        model.PageNumber,
                        model.PageSize,
                        0,
                        "No items found for the selected category"
                    ));
                }

                // Build a map of RIS details by RIS ID for quick lookup
                var risDetails = supplyRISs.ToDictionary(r => r.Id, r => new { r.RISNumber, r.ResponsibilityCenterCode, r.OfficeId, r.DivisionId });

                // Fetch office and division names
                var officeIds = supplyRISs.Where(r => r.OfficeId.HasValue).Select(r => r.OfficeId.Value).Distinct().ToList();
                var divisionIds = supplyRISs.Where(r => r.DivisionId.HasValue).Select(r => r.DivisionId.Value).Distinct().ToList();

                var offices = await _getTools.Office.GetTblOffices(context)
                    .Where(o => officeIds.Contains(o.Id))
                    .ToDictionaryAsync(o => o.Id, o => o.Name);

                var divisions = await _getTools.Office.GetVwDivisions(context)
                    .Where(d => divisionIds.Contains(d.Id.Value))
                    .ToDictionaryAsync(d => d.Id.Value, d => d.Name);

                // Group RIS items by (StockNumber, Description) and compute total and details
                var decryptedRISItems = supplyRISItems
                    .Select(x => new
                    {
                        RISId = x.SupplyRISId,
                        x.StockNumber,
                        Description = x.ItemDescription,
                        x.IssueQuantity
                    })
                    .Where(x => !string.IsNullOrEmpty(x.StockNumber) && !string.IsNullOrEmpty(x.Description))
                    .ToList();

                var grouped = decryptedRISItems
                    .Where(x => validPairs.Any(vp => vp.StockNumber == x.StockNumber && vp.Description == x.Description))
                    .GroupBy(x => new { x.StockNumber, x.Description })
                    .Select(g => new FilteredRMSIItemGroupResponseModel
                    {
                        StockNumber = g.Key.StockNumber,
                        ItemDescription = g.Key.Description,
                        Total = g.Sum(x => x.IssueQuantity),
                        Items = g.Select(x =>
                        {
                            var hasRis = risDetails.TryGetValue(x.RISId.Value, out var ris);
                            var officeId = hasRis && ris.OfficeId.HasValue ? ris.OfficeId.Value : (long?)null;
                            var divisionId = hasRis && ris.DivisionId.HasValue ? ris.DivisionId.Value : (long?)null;

                            return new FilteredRMSIItemDetailResponseModel
                            {
                                RISNumber = hasRis ? ris.RISNumber : string.Empty,
                                ResponsibilityCenterCode = hasRis ? ris.ResponsibilityCenterCode : string.Empty,
                                OfficeName = officeId.HasValue && offices.TryGetValue(officeId.Value, out var officeName) ? officeName : string.Empty,
                                DivisionName = divisionId.HasValue && divisions.TryGetValue(divisionId.Value, out var divisionName) ? divisionName : string.Empty,
                                IssueQuantity = x.IssueQuantity
                            };
                        }).ToList()
                    })
                    .ToList();

                int totalCount = grouped.Count;
                var pagedGroups = grouped
                    .Skip((model.PageNumber - 1) * model.PageSize)
                    .Take(model.PageSize)
                    .ToList();

                return Ok(ApiResponse<FilteredRMSIItemGroupResponseModel>.OkPaginated(
                    pagedGroups,
                    model.PageNumber,
                    model.PageSize,
                    totalCount,
                    "Filtered RIS items retrieved"
                ));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
        #endregion

        #region IAR Signatory Templates
        [HttpGet("iar/signatory-templates")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetIARSignatoryTemplates([FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var templates = await context.TblIARSignatoryTemplates
                    .Where(t => t.IsActive)
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => new { t.Id, t.Name, t.SignatoryDataJson, t.CreatedAt })
                    .ToListAsync();

                return Ok(ApiResponse<object>.Ok(templates, "IAR signatory templates retrieved"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
        #endregion

        #region POST
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
                    Address = model.Address,
                    Email = model.Email,
                    Contact = model.Contact,
                    ContactPerson = model.ContactPerson,
                    VendorType = model.VendorType,
                    ContractStart = model.ContractStart,
                    ContractEnd = model.ContractEnd,
                    ProcurementTitle = model.ProcurementTitle,
                    Terms = model.Terms,
                    DeliveryDate = model.DeliveryDate,
                    DeliveryDueDate = model.DeliveryDueDate,
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

        [HttpPost("storage-location/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditSupplyStorageLocation([FromBody] EditSupplyStorageLocationQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblSupplyStorageLocation supplyStorageLocation = new()
                {
                    Id = model.Id,
                    Name = model.Name,
                    IsActive = model.IsActive
                };

                long supplyStorageLocationId = await _editTools.Supply.EditTblSupplyStorageLocationAsync(supplyStorageLocation, model.ActionBySystemUserId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(new { SupplyStorageLocationId = supplyStorageLocationId }, $"Supply Storage Location has been {(model.Id == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpPost("unit/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditSupplyUnit([FromBody] EditSupplyUnitQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblSupplyUnit supplyUnit = new()
                {
                    Id = model.Id,
                    Name = model.Name,
                    IsActive = model.IsActive
                };

                long supplyUnitId = await _editTools.Supply.EditTblSupplyUnitAsync(supplyUnit, model.ActionBySystemUserId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(new { SupplyUnitId = supplyUnitId }, $"Supply Unit has been {(model.Id == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpPost("item/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditSupplyItem([FromBody] EditSupplyItemQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                TblSupplyItem supplyItem = new()
                {
                    Id = model.Id,
                    Code = model.Code,
                    CategoryId = model.CategoryId,
                    MeasurementUnitId = model.MeasurementUnitId,
                    Description = model.Description,
                    Quantity = model.Quantity,
                    UnitCost = model.UnitCost,
                    ReorderPoint = model.ReorderPoint,
                    StorageLocationId = model.StorageLocationId,
                    VendorId = model.VendorId,
                    IsActive = model.IsActive,
                    CreatedAt = model.CreatedAt ?? DateTime.UtcNow
                };

                long supplyItemId = await _editTools.Supply.EditTblSupplyItemAsync(supplyItem, model.ActionBySystemUserId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(new { SupplyItemId = supplyItemId }, $"Supply Item has been {(model.Id == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpPost("iar/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditSupplyIAR([FromBody] EditSupplyIARQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var selectedRecordIds = (model.RecordIds?.Count > 0 ? model.RecordIds : model.RecordId.HasValue ? new List<long> { model.RecordId.Value } : new List<long>())
                    .Where(x => x > 0)
                    .Distinct()
                    .ToList();

                if (selectedRecordIds.Count == 0)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(ApiResponse<object>.BadRequest("At least one Delivery Record is required."));
                }

                bool hasLinkedDR = await context.TblSupplyIARDeliveryRecords
                    .AnyAsync(x => selectedRecordIds.Contains(x.DeliveryRecordId) && x.SupplyIARId != model.Id)
                    || await context.TblSupplyIARs
                        .AnyAsync(x => x.RecordId.HasValue && selectedRecordIds.Contains(x.RecordId.Value) && x.Id != model.Id);

                if (hasLinkedDR)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(ApiResponse<object>.BadRequest("One or more Delivery Records are already linked to another IAR."));
                }

                bool wasAlreadyApproved = false;
                if (model.Id > 0)
                {
                    TblSupplyIAR? existingIAR = await _getTools.Supply.GetTblSupplyIARAsync(model.Id, context);
                    wasAlreadyApproved = existingIAR?.IsApproved == true;
                }

                TblSupplyIAR supplyIAR = new()
                {
                    Id = model.Id,
                    RecordId = selectedRecordIds.First(),
                    EntityName = model.EntityName,
                    ResponsibilityCenterCode = model.CenterCode,
                    FundCluster = model.FundCluster,
                    VendorId = model.VendorId,
                    PONumber = model.PONumber,
                    OfficeId = model.OfficeId,
                    DivisionId = model.DivisionId,
                    IARNumber = model.IARNumber,
                    IARNumberDate = model.IARNumberDate,
                    IARInvoiceNumber = model.IARInvoiceNumber,
                    IARInvoiceNumberDate = model.IARInvoiceNumberDate,
                    PODate = model.PODate,
                    ActualDeliveryDate = model.ActualDeliveryDate,
                    IsActive = model.IsActive,
                    IsApproved = model.IsApproved,
                    SignedFileStorageId = model.SignedFileStorageId
                };

                long supplyIARId = await _editTools.Supply.EditTblSupplyIARAsync(supplyIAR, model.ActionBySystemUserId, context);
                supplyIAR.Id = supplyIARId;

                var existingLinks = await context.TblSupplyIARDeliveryRecords
                    .Where(x => x.SupplyIARId == supplyIARId)
                    .ToListAsync();
                context.TblSupplyIARDeliveryRecords.RemoveRange(existingLinks);
                await context.TblSupplyIARDeliveryRecords.AddRangeAsync(selectedRecordIds.Select(recordId => new TblSupplyIARDeliveryRecord
                {
                    SupplyIARId = supplyIARId,
                    DeliveryRecordId = recordId
                }));

                if (supplyIAR.IsApproved && !wasAlreadyApproved)
                {
                    supplyIAR.IsApproved = true;
                    supplyIAR.ApprovedOn = DateTime.UtcNow;

                    var supplyItemsQuery = _getTools.Supply.GetTblSupplyItems(context);
                    var supplyItems = supplyItemsQuery == null ? [] : await supplyItemsQuery.ToListAsync();
                    List<TblDeliveryRecord>? deliveryRecords = _getTools.Delivery.GetTblDeliveryRecords(context)?.Where(x => selectedRecordIds.Contains(x.Id)).ToList();
                    foreach (var deliveryRecord in deliveryRecords)
                    {
                        deliveryRecord.IsReceived = true;
                        List<TblDeliveryRecordItem>? deliveryRecordItems = _getTools.Delivery.GetTblDeliveryRecordItems(context)?.Where(x => x.RecordId == deliveryRecord.Id).ToList();

                        foreach(var deliveryRecordItem in deliveryRecordItems)
                        {
                            if (deliveryRecordItem.ItemTypeId == 1)
                            {
                                var matchingSupplyItem = supplyItems
                                    .Where(s => string.Equals(s.Code, deliveryRecordItem.Code, StringComparison.OrdinalIgnoreCase)
                                        && string.Equals(s.Description, deliveryRecordItem.ItemDescription, StringComparison.OrdinalIgnoreCase))
                                    .OrderByDescending(s => s.CreatedAt)
                                    .FirstOrDefault();

                                TblAssetBookingItem bookingItem = new()
                                {
                                    Group = TblAssetBookingItem.GROUP_SUPPLY,
                                    SupplyIARId = supplyIAR.Id,
                                    DeliveryRecordId = deliveryRecord.Id,
                                    DeliveryRecordItemId = deliveryRecordItem.Id,
                                    Code = deliveryRecordItem.Code,
                                    CategoryId = matchingSupplyItem?.CategoryId ?? deliveryRecordItem.CategoryId,
                                    Description = deliveryRecordItem.ItemDescription,
                                    MeasurementUnitId = deliveryRecordItem.UnitId,
                                    UnitCost = deliveryRecordItem.UnitCost,
                                    ReorderPoint = deliveryRecordItem.ReorderPoint,
                                    StorageLocationId = deliveryRecordItem.StorageLocationId,
                                    VendorId = deliveryRecordItem.VendorId,
                                    Quantity = deliveryRecordItem.ItemQuantity,
                                    DeliveryDate = deliveryRecord.DeliveryDate,
                                    Status = TblAssetBookingItem.STATUS_PENDING
                                };

                                await _editTools.Booking.EditTblAssetBookingItemAsync(bookingItem, model.ActionBySystemUserId, context, isBatch: true);
                            }
                            else if (deliveryRecordItem.ItemTypeId == 2 || deliveryRecordItem.ItemTypeId == 3)
                            {
                                string ptaGroup = deliveryRecordItem.ItemTypeId == 2 ? TblPTA.PPE : TblPTA.SE;

                                int quantity = (deliveryRecordItem.ItemQuantity ?? 1) > 0 ? (deliveryRecordItem.ItemQuantity ?? 1) : 1;
                                for (int i = 0; i < quantity; i++)
                                {
                                    string? propertyNumber = string.IsNullOrWhiteSpace(deliveryRecordItem.Code)
                                        ? null
                                        : $"{deliveryRecordItem.Code}-{i + 1:D3}";

                                    TblAssetBookingItem bookingItem = new()
                                    {
                                        Group = ptaGroup,
                                        SupplyIARId = supplyIAR.Id,
                                        DeliveryRecordId = deliveryRecord.Id,
                                        DeliveryRecordItemId = deliveryRecordItem.Id,
                                        UnitSequence = i + 1,
                                        SuggestedPropertyNumber = propertyNumber,
                                        CategoryId = deliveryRecordItem.CategoryId,
                                        Description = deliveryRecordItem.ItemDescription,
                                        Specification = deliveryRecordItem.ItemSpecification,
                                        MeasurementUnitId = deliveryRecordItem.UnitId,
                                        UnitCost = deliveryRecordItem.UnitCost,
                                        Quantity = 1,
                                        DeliveryDate = deliveryRecord.DeliveryDate,
                                        Status = TblAssetBookingItem.STATUS_PENDING
                                    };

                                    // Unit name and PTA/PTAMovement creation are deferred to booking time
                                    // (BookingController), so a later edit to the unit is still honored.
                                    await _editTools.Booking.EditTblAssetBookingItemAsync(bookingItem, model.ActionBySystemUserId, context, isBatch: true);
                                }
                            }
                        }

                        await _editTools.Delivery.EditTblDeliveryRecordAsync(deliveryRecord, model.ActionBySystemUserId, context);
                    }

                    // Update the IAR again to set ApprovedOn
                    await _editTools.Supply.EditTblSupplyIARAsync(supplyIAR, model.ActionBySystemUserId, context);
                }
                else if (wasAlreadyApproved && !supplyIAR.IsApproved)
                {
                    // IAR un-approved: cancel any still-pending staged booking items tied to it so they
                    // can no longer be booked. Already-Booked items are left untouched (one-way approval).
                    await _editTools.Booking.CancelPendingBySupplyIARIdAsync(supplyIAR.Id, context);
                    await _editTools.Supply.EditTblSupplyIARAsync(supplyIAR, model.ActionBySystemUserId, context);
                }

                

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                if (model.Id == 0)
                {
                    string itemTypesSummary = await GetIARItemTypesSummaryAsync(context, selectedRecordIds);
                    string submittedTitle = string.IsNullOrEmpty(itemTypesSummary)
                        ? NotificationConstants.IAR_SUBMITTED
                        : $"{NotificationConstants.IAR_SUBMITTED} ({itemTypesSummary})";

                    await _notificationService.NotifyModuleUsersAsync(
                        context,
                        submittedTitle,
                        $"IAR {supplyIAR.IARNumber} has been submitted for approval",
                        NotificationConstants.Modules.DELIVERY_RECEIPT,
                        model.ActionBySystemUserId,
                        actionType: NotificationConstants.ActionTypes.IAR_SUBMITTED,
                        entityId: supplyIARId,
                        entityLabel: itemTypesSummary);
                }

                if (supplyIAR.IsApproved && !wasAlreadyApproved)
                {
                    string itemTypesSummary = await GetIARItemTypesSummaryAsync(context, selectedRecordIds);
                    string approvedTitle = string.IsNullOrEmpty(itemTypesSummary)
                        ? NotificationConstants.IAR_APPROVED
                        : $"{NotificationConstants.IAR_APPROVED} ({itemTypesSummary})";

                    await _notificationService.NotifyModuleUsersAsync(
                        context,
                        approvedTitle,
                        $"IAR {supplyIAR.IARNumber} has been approved and delivery marked as received",
                        NotificationConstants.Modules.DELIVERY_RECEIPT,
                        model.ActionBySystemUserId,
                        actionType: NotificationConstants.ActionTypes.IAR_APPROVED,
                        entityId: supplyIAR.Id,
                        entityLabel: itemTypesSummary);
                }

                return Ok(ApiResponse<object>.Ok(new { SupplyIARId = supplyIARId }, $"Supply IAR has been {(model.Id == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpPost("ris/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditSupplyRIS([FromBody] EditSupplyRISQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                bool wasAlreadyApproved = false;
                if (model.Id > 0)
                {
                    TblSupplyRIS? existingRIS = await _getTools.Supply.GetTblSupplyRISAsync(model.Id, context);
                    wasAlreadyApproved = existingRIS?.IsApproved == true;
                }

                TblSupplyRIS supplyRIS = new()
                {
                    Id = model.Id,
                    EntityName = model.EntityName,
                    FundCluster = model.FundCluster,
                    DivisionId = model.DivisionId,
                    OfficeId = model.OfficeId,
                    ResponsibilityCenterCode = model.ResponsibilityCenterCode,
                    RISNumber = model.RISNumber,
                    RISPurpose = model.RISPurpose,
                    RISRequestedBySystemUserId = model.RISRequestedBySystemUserId,
                    RISRequestedDate = model.RISRequestedDate,
                    RISApprovedBySystemUserId = model.RISApprovedBySystemUserId,
                    RISApprovedDate = model.RISApprovedDate,
                    RISIssuedBySystemUserId = model.RISIssuedBySystemUserId,
                    RISIssuedDate = model.RISIssuedDate,
                    RISReceivedBySystemUserId = model.RISReceivedBySystemUserId,
                    RISReceivedDate = model.RISReceivedDate,
                    IsApproved = model.IsApproved,
                    IsActive = model.IsActive
                };


                //if (supplyRIS.IsApproved)
                //{
                //    supplyRIS.IsApproved = true;
                //    supplyRIS.ApprovedOn = DateTime.UtcNow;

                //    List<TblSupplyRISItem>? SupplyRISItems = _getTools.Supply.GetTblSupplyRISItems(context)?.Where(x => x.SupplyRISId == supplyRIS.Id).ToList();
                //    foreach (var SupplyRISItem in SupplyRISItems)
                //    {
                //        //Dito magbabawas ng quantity if approved
                //        // TODO: After implementing quantity deduction, add low stock check:
                //        // if (supplyItem.Quantity <= supplyItem.ReorderPoint) → send SUPPLY_LOW_STOCK notification
                //    }
                //}

                long supplyRISId = await _editTools.Supply.EditTblSupplyRISAsync(supplyRIS, model.ActionBySystemUserId, context);



                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                if (model.Id == 0)
                {
                    await _notificationService.NotifyModuleUsersAsync(
                        context,
                        NotificationConstants.RIS_SUBMITTED,
                        $"New RIS {supplyRIS.RISNumber} has been submitted for approval",
                        NotificationConstants.Modules.SUPPLY_MANAGEMENT,
                        model.ActionBySystemUserId);
                }

                if (supplyRIS.IsApproved && !wasAlreadyApproved && supplyRIS.RISRequestedBySystemUserId.HasValue)
                {
                    await _notificationService.NotifyUserAsync(
                        context,
                        NotificationConstants.RIS_APPROVED,
                        $"RIS {supplyRIS.RISNumber} has been approved",
                        supplyRIS.RISRequestedBySystemUserId.Value,
                        model.ActionBySystemUserId,
                        NotificationConstants.Modules.SUPPLY_MANAGEMENT);
                }

                return Ok(ApiResponse<object>.Ok(new { SupplyRISId = supplyRISId }, $"Supply RIS has been {(model.Id == 0 ? "added" : "updated")}"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpPost("ris-item/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditSupplyRISItem([FromBody] EditSupplyRISItemQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                TblSupplyRISItem supplyRISItem = new()
                {
                    Id = model.Id,
                    SupplyRISId = model.RISId,
                    StockNumber = model.StockNumber,
                    UnitId = model.UnitId,
                    ItemDescription = model.ItemDescription,
                    RequisitionQuantity = model.RequisitionQuantity,
                    IsAvailable = model.IsAvailable,
                    IssueQuantity = model.IssueQuantity,
                    ItemRemarks = model.ItemRemarks,
                    IsActive = model.IsActive,
                    CreatedAt = model.CreatedAt ?? DateTime.UtcNow
                };

                long supplyRISItemId = await _editTools.Supply.EditTblSupplyRISItemAsync(supplyRISItem, model.ActionBySystemUserId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(new { SupplyRISItemId = supplyRISItemId }, $"Supply RIS Item has been {(model.Id == 0 ? "added" : "updated")}"));

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
        [HttpDelete("vendor/delete/{supplyVendorId}")]
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

        [HttpDelete("iar/delete/{iarId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeleteSupplyIAR([FromQuery] SoloQueryParams model, [FromRoute] long iarId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                bool isDeleted = await _editTools.Supply.DeleteTblSupplyIARAsync(iarId, model.ActionBySystemUserId, context);

                if (!isDeleted)
                    return Ok(ApiResponse<object>.OperationFailed("Unable to delete this Supply IAR, try again later"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok($"Supply IAR has been deleted"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpDelete("item/delete/{supplyItemId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeleteSupplyItem([FromQuery] SoloQueryParams model, [FromRoute] long supplyItemId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                bool isDeleted = await _editTools.Supply.DeleteTblSupplyItemAsync(supplyItemId, model.ActionBySystemUserId, context);

                if (!isDeleted)
                    return Ok(ApiResponse<object>.Ok($"Unable to delete this Supply Item, try again later"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok($"Supply Item has been deleted"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpPost("item/delete-batch")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeleteSupplyItems([FromBody] DeleteSupplyItemsQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                int deleted = await _editTools.Supply.DeleteTblSupplyItemsAsync(model.Ids, model.ActionBySystemUserId, context);

                if (deleted == 0)
                    return Ok(ApiResponse<object>.OperationFailed("No Supply Items were deleted"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok(new { Deleted = deleted }, $"{deleted} Supply Item(s) have been deleted"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpDelete("storage-location/delete/{supplyStorageLocationId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeleteSupplyStorageLocation([FromQuery] SoloQueryParams model, [FromRoute] long supplyStorageLocationId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                bool isDeleted = await _editTools.Supply.DeleteTblSupplyStorageLocationAsync(supplyStorageLocationId, model.ActionBySystemUserId, context);

                if (!isDeleted)
                    return Ok(ApiResponse<object>.Ok($"Unable to delete this Supply Storage Location, try again later"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok($"Supply Storage Location has been deleted"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpDelete("unit/delete/{supplyUnitId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeleteSupplyUnit([FromQuery] SoloQueryParams model, [FromRoute] long supplyUnitId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                bool isDeleted = await _editTools.Supply.DeleteTblSupplyUnitAsync(supplyUnitId, model.ActionBySystemUserId, context);

                if (!isDeleted)
                    return Ok(ApiResponse<object>.Ok($"Unable to delete this Supply Unit, try again later"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok($"Supply Unit has been deleted"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpDelete("ris/delete/{risId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeleteSupplyRIS([FromQuery] SoloQueryParams model, [FromRoute] long risId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                bool isDeleted = await _editTools.Supply.DeleteTblSupplyRISAsync(risId, model.ActionBySystemUserId, context);

                if (!isDeleted)
                    return Ok(ApiResponse<object>.Ok($"Unable to delete this Supply RIS, try again later"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok($"Supply RIS has been deleted"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpDelete("ris-item/delete/{supplyRISItemId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeleteSupplyRISItem([FromQuery] SoloQueryParams model, [FromRoute] long supplyRISItemId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                bool isDeleted = await _editTools.Supply.DeleteTblSupplyRISItemAsync(supplyRISItemId, model.ActionBySystemUserId, context);

                if (!isDeleted)
                    return Ok(ApiResponse<object>.Ok($"Unable to delete this Supply RIS Item, try again later"));

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(ApiResponse<object>.Ok($"Supply RIS Item has been deleted"));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
        [HttpPost("iar/signatory-templates/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditIARSignatoryTemplate([FromBody] EditIARSignatoryTemplateQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                if (model.Id == 0)
                {
                    var newTemplate = new TblIARSignatoryTemplate
                    {
                        Name = model.Name.Trim(),
                        SignatoryDataJson = model.SignatoryDataJson,
                        CreatedBy = model.ActionBySystemUserId,
                        CreatedAt = DateTime.UtcNow,
                        IsActive = true
                    };
                    await context.TblIARSignatoryTemplates.AddAsync(newTemplate);
                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    await AuditTrailTool.LogActivityAsync(_options, "Created IAR Signatory Template", actionBy: model.ActionBySystemUserId);
                    return Ok(ApiResponse<object>.Ok(new { newTemplate.Id, newTemplate.Name, newTemplate.SignatoryDataJson, newTemplate.CreatedAt }, "Template saved"));
                }
                else
                {
                    var existing = await context.TblIARSignatoryTemplates.FirstOrDefaultAsync(t => t.Id == model.Id && t.IsActive);
                    if (existing == null)
                        return BadRequest(ApiResponse<object>.Fail("NOT_FOUND", "Template not found."));

                    existing.Name = model.Name.Trim();
                    existing.SignatoryDataJson = model.SignatoryDataJson;
                    context.TblIARSignatoryTemplates.Update(existing);
                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    await AuditTrailTool.LogActivityAsync(_options, "Updated IAR Signatory Template", actionBy: model.ActionBySystemUserId);
                    return Ok(ApiResponse<object>.Ok(new { existing.Id, existing.Name, existing.SignatoryDataJson, existing.CreatedAt }, "Template updated"));
                }
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpDelete("iar/signatory-templates/delete/{templateId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeleteIARSignatoryTemplate([FromQuery] SoloQueryParams model, [FromRoute] long templateId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                var template = await context.TblIARSignatoryTemplates.FirstOrDefaultAsync(t => t.Id == templateId && t.IsActive);
                if (template == null)
                    return BadRequest(ApiResponse<object>.Fail("NOT_FOUND", "Template not found."));

                template.IsActive = false;
                context.TblIARSignatoryTemplates.Update(template);
                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Deleted IAR Signatory Template", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<object>.Ok((object?)null, "Template deleted"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
        #endregion

        #region RIS Signatory Templates
        [HttpGet("ris/signatory-templates")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetRISSignatoryTemplates([FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var templates = await context.TblRISSignatoryTemplates
                    .Where(t => t.IsActive)
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => new { t.Id, t.Name, t.SignatoryDataJson, t.CreatedAt })
                    .ToListAsync();

                return Ok(ApiResponse<object>.Ok(templates, "RIS signatory templates retrieved"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpPost("ris/signatory-templates/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditRISSignatoryTemplate([FromBody] EditRISSignatoryTemplateQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                if (model.Id == 0)
                {
                    var newTemplate = new TblRISSignatoryTemplate
                    {
                        Name = model.Name.Trim(),
                        SignatoryDataJson = model.SignatoryDataJson,
                        CreatedBy = model.ActionBySystemUserId,
                        CreatedAt = DateTime.UtcNow,
                        IsActive = true
                    };
                    await context.TblRISSignatoryTemplates.AddAsync(newTemplate);
                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    await AuditTrailTool.LogActivityAsync(_options, "Created RIS Signatory Template", actionBy: model.ActionBySystemUserId);
                    return Ok(ApiResponse<object>.Ok(new { newTemplate.Id, newTemplate.Name, newTemplate.SignatoryDataJson, newTemplate.CreatedAt }, "Template saved"));
                }
                else
                {
                    var existing = await context.TblRISSignatoryTemplates.FirstOrDefaultAsync(t => t.Id == model.Id && t.IsActive);
                    if (existing == null)
                        return BadRequest(ApiResponse<object>.Fail("NOT_FOUND", "Template not found."));

                    existing.Name = model.Name.Trim();
                    existing.SignatoryDataJson = model.SignatoryDataJson;
                    context.TblRISSignatoryTemplates.Update(existing);
                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    await AuditTrailTool.LogActivityAsync(_options, "Updated RIS Signatory Template", actionBy: model.ActionBySystemUserId);
                    return Ok(ApiResponse<object>.Ok(new { existing.Id, existing.Name, existing.SignatoryDataJson, existing.CreatedAt }, "Template updated"));
                }
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpDelete("ris/signatory-templates/delete/{templateId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeleteRISSignatoryTemplate([FromQuery] SoloQueryParams model, [FromRoute] long templateId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                var template = await context.TblRISSignatoryTemplates.FirstOrDefaultAsync(t => t.Id == templateId && t.IsActive);
                if (template == null)
                    return BadRequest(ApiResponse<object>.Fail("NOT_FOUND", "Template not found."));

                template.IsActive = false;
                context.TblRISSignatoryTemplates.Update(template);
                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Deleted RIS Signatory Template", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<object>.Ok((object?)null, "Template deleted"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }
        #endregion

        #region RSMI Signatory Templates
        [HttpGet("rsmi/signatory-templates")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetRSMISignatoryTemplates([FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var templates = await context.TblRSMISignatoryTemplates
                    .Where(t => t.IsActive)
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => new { t.Id, t.Name, t.SignatoryDataJson, t.CreatedAt })
                    .ToListAsync();

                return Ok(ApiResponse<object>.Ok(templates, "RSMI signatory templates retrieved"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpPost("rsmi/signatory-templates/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditRSMISignatoryTemplate([FromBody] EditRSMISignatoryTemplateQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                if (model.Id == 0)
                {
                    var newTemplate = new TblRSMISignatoryTemplate
                    {
                        Name = model.Name.Trim(),
                        SignatoryDataJson = model.SignatoryDataJson,
                        CreatedBy = model.ActionBySystemUserId,
                        CreatedAt = DateTime.UtcNow,
                        IsActive = true
                    };
                    await context.TblRSMISignatoryTemplates.AddAsync(newTemplate);
                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    await AuditTrailTool.LogActivityAsync(_options, "Created RSMI Signatory Template", actionBy: model.ActionBySystemUserId);
                    return Ok(ApiResponse<object>.Ok(new { newTemplate.Id, newTemplate.Name, newTemplate.SignatoryDataJson, newTemplate.CreatedAt }, "Template saved"));
                }
                else
                {
                    var existing = await context.TblRSMISignatoryTemplates.FirstOrDefaultAsync(t => t.Id == model.Id && t.IsActive);
                    if (existing == null)
                        return BadRequest(ApiResponse<object>.Fail("NOT_FOUND", "Template not found."));

                    existing.Name = model.Name.Trim();
                    existing.SignatoryDataJson = model.SignatoryDataJson;
                    context.TblRSMISignatoryTemplates.Update(existing);
                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    await AuditTrailTool.LogActivityAsync(_options, "Updated RSMI Signatory Template", actionBy: model.ActionBySystemUserId);
                    return Ok(ApiResponse<object>.Ok(new { existing.Id, existing.Name, existing.SignatoryDataJson, existing.CreatedAt }, "Template updated"));
                }
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpDelete("rsmi/signatory-templates/delete/{templateId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeleteRSMISignatoryTemplate([FromQuery] SoloQueryParams model, [FromRoute] long templateId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                var template = await context.TblRSMISignatoryTemplates.FirstOrDefaultAsync(t => t.Id == templateId && t.IsActive);
                if (template == null)
                    return BadRequest(ApiResponse<object>.Fail("NOT_FOUND", "Template not found."));

                template.IsActive = false;
                context.TblRSMISignatoryTemplates.Update(template);
                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Deleted RSMI Signatory Template", actionBy: model.ActionBySystemUserId);
                return Ok(ApiResponse<object>.Ok((object?)null, "Template deleted"));
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
