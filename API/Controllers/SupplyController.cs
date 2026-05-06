using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using Org.BouncyCastle.Utilities;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.Delivery;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.ASSET.Supply;
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
                            UnitCost = (long)(firstItem.UnitCost ?? 0),
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
                        TotalStockCost = (finalCurrentStock * x.UnitCost), // Now long * long
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
                    .Where(x => x.Code == targetCode && x.Description == targetDesc)
                    .Select(x => new
                    {
                        x.Id,
                        Quantity = x.Quantity,
                        x.CreatedAt,
                        x.IsActive,
                        ItemRemarks = (string?)null,
                        UnitId = x.MeasurementUnitId,
                        Type = "Addition",
                        SupplyRISId = (long?)null
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
                    .Where(x => x.StockNumber == targetCode && x.ItemDescription == targetDesc)
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

                string debugJson = System.Text.Json.JsonSerializer.Serialize(pagedEvents, new System.Text.Json.JsonSerializerOptions
                {
                    WriteIndented = true
                });

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
                        bool matches = (x.IARNumber ?? "").ToLowerInvariant().Contains(searchLower) ||
                                       (x.IARNumberDate.ToString() ?? "").ToLowerInvariant().Contains(searchLower) ||
                                       (x.PONumber ?? "").ToLowerInvariant().Contains(searchLower) ||
                                       (x.EntityName ?? "").ToLowerInvariant().Contains(searchLower) ||
                                       (x.FundCluster ?? "").ToLowerInvariant().Contains(searchLower);

                        if (!matches && x.RecordId.HasValue)
                        {
                            var dr = _getTools.Delivery.GetTblDeliveryRecords(context).FirstOrDefault(d => d.Id == x.RecordId.Value);
                            if (dr != null)
                            {
                                matches = (dr.DRNumber ?? "").ToLowerInvariant().Contains(searchLower);
                            }
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
                    var supplyIARModel = new SupplyIARResponseModel
                    {
                        Id = x.Id,
                        RecordId = x.RecordId.Value,
                        DRNumber = _getTools.Delivery.GetTblDeliveryRecords(context).Where(y => y.Id == x.RecordId).FirstOrDefault()?.DRNumber ?? "",
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
                    responses.Add(new SupplyIARResponseModel
                    {
                        Id = x.Id,
                        IARNumber = x.IARNumber,
                        IARNumberDate = x.IARNumberDate,
                        IsApproved = x.IsApproved,
                        RecordId = x.RecordId.Value,
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
                        (x.RISNumber.ToString() ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.EntityName.ToString() ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.FundCluster.ToString() ?? "").ToLowerInvariant().Contains(searchLower));
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
        public async Task<IActionResult> FilterRMSIItems(long categoryId, DateTime startDate, DateTime endDate, [FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                // 1. Get supply RIS within date range
                var supplyRISs = await _getTools.Supply.GetTblSupplyRISs(context)
                    .Where(x => x.CreatedAt >= startDate && x.CreatedAt <= endDate)
                    .Select(x => new { x.Id, x.RISNumber, x.ResponsibilityCenterCode })
                    .ToListAsync();

                if (!supplyRISs.Any())
                {
                    return Ok(ApiResponse<List<FilteredRMSIItemGroupResponseModel>>.Ok(
                        new List<FilteredRMSIItemGroupResponseModel>(),
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
                    return Ok(ApiResponse<List<FilteredRMSIItemGroupResponseModel>>.Ok(
                        new List<FilteredRMSIItemGroupResponseModel>(),
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
                    .Where(x => x.CategoryId == categoryId)
                    .ToList();

                // Filter pairs that exist in supply items (i.e., belong to the category)
                var validPairs = risItemPairs
                    .Where(pair => matchingSupplyItems.Any(si => si.Code == pair.StockNumber && si.Description == pair.Description))
                    .ToList();

                if (!validPairs.Any())
                {
                    return Ok(ApiResponse<List<FilteredRMSIItemGroupResponseModel>>.Ok(
                        new List<FilteredRMSIItemGroupResponseModel>(),
                        "No items found for the selected category"
                    ));
                }

                // Build a map of RIS details by RIS ID for quick lookup
                var risDetails = supplyRISs.ToDictionary(r => r.Id, r => new { r.RISNumber, r.ResponsibilityCenterCode });

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
                        Items = g.Select(x => new FilteredRMSIItemDetailResponseModel
                        {
                            RISNumber = risDetails.TryGetValue(x.RISId.Value, out var ris) ? ris.RISNumber : string.Empty,
                            ResponsibilityCenterCode = risDetails.TryGetValue(x.RISId.Value, out ris) ? ris.ResponsibilityCenterCode : string.Empty,
                            IssueQuantity = x.IssueQuantity
                        }).ToList()
                    })
                    .ToList();

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse<FilteredRMSIItemGroupResponseModel>.Ok(
                    grouped,
                    "Filtered RIS items retrieved"
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
                    IsActive = model.IsActive
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

                TblSupplyIAR supplyIAR = new()
                {
                    Id = model.Id,
                    RecordId = model.RecordId,
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
                    IsApproved = model.IsApproved
                };

                long supplyIARId = await _editTools.Supply.EditTblSupplyIARAsync(supplyIAR, model.ActionBySystemUserId, context);
                supplyIAR.Id = supplyIARId;

                if (supplyIAR.IsApproved)
                {
                    supplyIAR.IsApproved = true;
                    supplyIAR.ApprovedOn = DateTime.UtcNow;

                    List<TblDeliveryRecord>? deliveryRecords = _getTools.Delivery.GetTblDeliveryRecords(context)?.Where(x => x.Id == supplyIAR.RecordId).ToList();
                    foreach (var deliveryRecord in deliveryRecords)
                    {
                        deliveryRecord.IsReceived = true;
                        List<TblDeliveryRecordItem>? deliveryRecordItems = _getTools.Delivery.GetTblDeliveryRecordItems(context)?.Where(x => x.RecordId == deliveryRecord.Id).ToList();

                        foreach(var deliveryRecordItem in deliveryRecordItems)
                        {
                            if (deliveryRecordItem.ItemTypeId == 1)
                            {
                                TblSupplyItem? supplyItem = new TblSupplyItem()
                                {
                                    Code = deliveryRecordItem.Code,
                                    IARId = supplyIAR.Id,
                                    CategoryId = deliveryRecordItem.CategoryId,
                                    Description = deliveryRecordItem.ItemDescription,
                                    MeasurementUnitId = deliveryRecordItem.UnitId,
                                    UnitCost = deliveryRecordItem.UnitCost,
                                    ReorderPoint = deliveryRecordItem.ReorderPoint,
                                    StorageLocationId = deliveryRecordItem.StorageLocationId,
                                    VendorId = deliveryRecordItem.VendorId,
                                    Quantity = deliveryRecordItem.ItemQuantity
                                };

                                await _editTools.Supply.EditTblSupplyItemAsync(supplyItem, model.ActionBySystemUserId, context);
                            }
                            else if (deliveryRecordItem.ItemTypeId == 2 || deliveryRecordItem.ItemTypeId == 3)
                            {
                                string ptaGroup = deliveryRecordItem.ItemTypeId == 2 ? TblPTA.PPE : TblPTA.SE;

                                TblSupplyUnit? unit = await _getTools.Supply.GetTblSupplyUnitAsync(deliveryRecordItem.UnitId, context);
                                string unitName = unit?.Name ?? string.Empty;

                                int quantity = (deliveryRecordItem.ItemQuantity ?? 1) > 0 ? (deliveryRecordItem.ItemQuantity ?? 1) : 1;
                                for (int i = 0; i < quantity; i++)
                                {
                                    string propertyNumber = $"{deliveryRecordItem.Code}-{i + 1:D3}";

                                    TblPTA pta = new()
                                    {
                                        Group = ptaGroup,
                                        PropertyNumber = propertyNumber,
                                        CategoryId = deliveryRecordItem.CategoryId,
                                        LegendId = null,
                                        Description = deliveryRecordItem.ItemDescription,
                                        Brand = null,
                                        Model = deliveryRecordItem.ItemSpecification,
                                        SerialNumber = null,
                                        UnitOfMeasurement = unitName,
                                        UnitValue = deliveryRecordItem.UnitCost,
                                        DateAcquired = deliveryRecord.DeliveryDate,
                                        FiscalDate = deliveryRecord.DeliveryDate,
                                        IsActive = true
                                    };

                                    if (ptaGroup == TblPTA.PPE)
                                        pta.EstimatedUsefulLife = 0;

                                    await _editTools.PTA.EditTblPTAAsync(pta, model.ActionBySystemUserId, context, isBatch: true);
                                }
                            }
                        }

                        await _editTools.Delivery.EditTblDeliveryRecordAsync(deliveryRecord, model.ActionBySystemUserId, context);
                    }
                    
                    // Update the IAR again to set ApprovedOn
                    await _editTools.Supply.EditTblSupplyIARAsync(supplyIAR, model.ActionBySystemUserId, context);
                }

                

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
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
                    IsActive = model.IsActive,
                    //IsApproved = model.IsApproved
                };

                //if (supplyRIS.IsApproved)
                //{
                //    supplyRIS.IsApproved = true;
                //    supplyRIS.ApprovedOn = DateTime.UtcNow;

                //    List<TblSupplyRISItem>? SupplyRISItems = _getTools.Supply.GetTblSupplyRISItems(context)?.Where(x => x.SupplyRISId == supplyRIS.Id).ToList();
                //    foreach (var SupplyRISItem in SupplyRISItems)
                //    {
                //        //Dito magbabawas ng quantity if approved
                //    }
                //}

                long supplyRISId = await _editTools.Supply.EditTblSupplyRISAsync(supplyRIS, model.ActionBySystemUserId, context);



                await context.SaveChangesAsync();
                await transaction.CommitAsync();
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
                    IsActive = model.IsActive
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
                    return Ok(ApiResponse<object>.Ok($"Unable to delete this Supply IAR, try again later"));

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
        #endregion
    }
}
