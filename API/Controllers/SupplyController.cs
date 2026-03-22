using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        public async Task<IActionResult> GetAllSupplyItems([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                IEnumerable<TblSupplyItem>? supplyItems = await _getTools.Supply.GetTblSupplyItems(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    supplyItems = supplyItems.Where(x =>
                        (x.Code ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Description ?? "").ToLowerInvariant().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    supplyItems = supplyItems.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    supplyItems = supplyItems.Where(x => x.CreatedAt <= model.EndDate.Value);

                var groupedItems = supplyItems
                    .GroupBy(x => new { x.Code, x.Description })
                    .Select(g =>
                    {
                        var firstItem = g.First();
                        return new TblSupplyItem
                        {
                            Code = g.Key.Code,
                            Description = g.Key.Description,
                            Quantity = g.Sum(x => x.Quantity),
                            UnitCost = g.Sum(x => x.UnitCost), 

                            Id = firstItem.Id,
                            IARId = firstItem.IARId,
                            CategoryId = firstItem.CategoryId,
                            MeasurementUnitId = firstItem.MeasurementUnitId,
                            ReorderPoint = firstItem.ReorderPoint,
                            StorageLocationId = firstItem.StorageLocationId,
                            VendorId = firstItem.VendorId,
                            IsActive = firstItem.IsActive,
                            CreatedAt = firstItem.CreatedAt
                        };
                    });

                int totalCount = groupedItems.Count();

                int skip = (model.PageNumber - 1) * model.PageSize;

                var supplyItemsList = groupedItems
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
                        IARId = x.IARId,
                        Category = await _getTools.PTA.GetTblPTACategoryAsync(x.CategoryId, context),
                        MeasurementUnit = await _getTools.Supply.GetTblSupplyUnitAsync(x.MeasurementUnitId, context),
                        Description = x.Description,
                        Quantity = x.Quantity,
                        UnitCost = x.UnitCost,
                        ReorderPoint = x.ReorderPoint,
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

        [HttpGet("item/grouped/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllSupplyGroups([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                // 1. Fetch all supply items
                IEnumerable<TblSupplyItem>? supplyItems = await _getTools.Supply.GetTblSupplyItems(context).ToListAsync();

                // 2. Apply filters (same as original)
                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    supplyItems = supplyItems.Where(x =>
                        (x.Code ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Description ?? "").ToLowerInvariant().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    supplyItems = supplyItems.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    supplyItems = supplyItems.Where(x => x.CreatedAt <= model.EndDate.Value);

                // 3. Group by Code and Description, then compute aggregates
                var groupedItems = supplyItems
                    .GroupBy(x => new { x.Code, x.Description })
                    .Select(g =>
                    {
                        var firstItem = g.First(); // representative item for non-aggregated fields

                        return new
                        {
                            // Grouping key
                            Code = g.Key.Code,
                            Description = g.Key.Description,

                            // Aggregated values
                            TotalCurrentStock = g.Sum(x => x.Quantity ?? 0),
                            TotalStockCost = g.Sum(x => (x.Quantity ?? 0) * (x.UnitCost ?? 0)),

                            // Non-aggregated fields (taken from first item)
                            Id = firstItem.Id,
                            IARId = firstItem.IARId,
                            IsActive = firstItem.IsActive,
                            CreatedAt = firstItem.CreatedAt
                        };
                    });

                // 4. Count total before pagination
                int totalCount = groupedItems.Count();

                // 5. Pagination
                int skip = (model.PageNumber - 1) * model.PageSize;
                var pagedGroups = groupedItems
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                // 6. Map to response model
                var supplyItemsResponses = pagedGroups.Select(x => new SupplyItemGroupedResponseModel
                {
                    Id = x.Id,
                    Code = x.Code ?? string.Empty,
                    IARId = x.IARId,
                    Description = x.Description ?? string.Empty,
                    TotalCurrentStock = x.TotalCurrentStock,
                    TotalStockCost = (int?)x.TotalStockCost, // cast if needed; model expects int? (adjust as necessary)
                    IsActive = x.IsActive,
                    CreatedAt = x.CreatedAt
                }).ToList();

                // 7. Commit transaction (though no changes, kept for consistency)
                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                await AuditTrailTool.LogActivityAsync(_options, "Viewed Grouped Supply Items", actionBy: model.ActionBySystemUserId);

                // 8. Return paginated result
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
        public async Task<IActionResult> GetAllSupplyGroupedItems(long id, [FromQuery] PaginationGenericQueryParams model)
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

                // 2. Fetch all supply items
                IEnumerable<TblSupplyItem> allItems = await _getTools.Supply.GetTblSupplyItems(context).ToListAsync();

                // 3. Filter by matching Code and Description
                var filteredItems = allItems.Where(x =>
                    (x.Code ?? string.Empty).Equals(targetCode, StringComparison.OrdinalIgnoreCase) &&
                    (x.Description ?? string.Empty).Equals(targetDescription, StringComparison.OrdinalIgnoreCase));

                // 4. Apply search filter if provided (search across Code and Description)
                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    filteredItems = filteredItems.Where(x =>
                        (x.Code ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.Description ?? "").ToLowerInvariant().Contains(searchLower));
                }

                // 5. Apply date filters
                if (model.StartDate.HasValue)
                    filteredItems = filteredItems.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    filteredItems = filteredItems.Where(x => x.CreatedAt <= model.EndDate.Value);

                // 6. Count total items before pagination
                int totalCount = filteredItems.Count();

                // 7. Apply pagination and ordering
                int skip = (model.PageNumber - 1) * model.PageSize;
                var pagedItems = filteredItems
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip(skip)
                    .Take(model.PageSize)
                    .ToList();

                // 8. Map to response model (including related entities)
                var supplyItemsResponses = new List<SupplyItemResponseModel>();
                foreach (var item in pagedItems)
                {
                    var response = new SupplyItemResponseModel
                    {
                        Id = item.Id,
                        Code = item.Code ?? string.Empty,
                        IARId = item.IARId,
                        Category = await _getTools.PTA.GetTblPTACategoryAsync(item.CategoryId, context),
                        MeasurementUnit = await _getTools.Supply.GetTblSupplyUnitAsync(item.MeasurementUnitId, context),
                        Description = item.Description ?? string.Empty,
                        Quantity = item.Quantity,
                        UnitCost = item.UnitCost,
                        ReorderPoint = item.ReorderPoint,
                        StorageLocation = await _getTools.Supply.GetTblSupplyStorageLocationAsync(item.StorageLocationId, context),
                        Vendor = await _getTools.Supply.GetTblSupplyVendorAsync(item.VendorId, context),
                        IsActive = item.IsActive,
                        CreatedAt = item.CreatedAt
                    };
                    supplyItemsResponses.Add(response);
                }

                // 9. Commit transaction (no changes, but consistent with pattern)
                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                // 10. Log activity
                await AuditTrailTool.LogActivityAsync(_options, $"Viewed grouped supply items for Code: {targetCode}, Description: {targetDescription}", actionBy: model.ActionBySystemUserId);

                // 11. Return paginated result
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
        public async Task<IActionResult> GetAllIARs([FromQuery] PaginationGenericQueryParams model)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                IEnumerable<TblSupplyIAR>? supplyIARs = await _getTools.Supply.GetTblSupplyIARs(context).ToListAsync();

                if (!string.IsNullOrWhiteSpace(model.SearchString))
                {
                    string searchLower = model.SearchString.ToLower();
                    supplyIARs = supplyIARs.Where(x =>
                        (x.IARNumber.ToString() ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.IARNumberDate.ToString() ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.PONumber.ToString() ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.EntityName.ToString() ?? "").ToLowerInvariant().Contains(searchLower) ||
                        (x.FundCluster.ToString() ?? "").ToLowerInvariant().Contains(searchLower));
                }

                if (model.StartDate.HasValue)
                    supplyIARs = supplyIARs.Where(x => x.CreatedAt >= model.StartDate.Value);

                if (model.EndDate.HasValue)
                    supplyIARs = supplyIARs.Where(x => x.CreatedAt <= model.EndDate.Value);

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

        [HttpGet("ris/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllRISs([FromQuery] PaginationGenericQueryParams model)
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
                        RISRequestedDate = x.RISRequestedDate,
                        ApprovedBySystemUser = approvedByUser,
                        RISApprovedDate = x.RISApprovedDate,
                        IssuedBySystemUser = issuedByUser,
                        RISIssuedDate = x.RISIssuedDate,
                        ReceivedBySystemUser = receivedByUser,
                        RISReceivedDate = x.RISReceivedDate,
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
                        SupplyUnit = await _getTools.Supply.GetTblSupplyUnitAsync(x.UnitId, context),
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
                    IsActive = model.IsActive,
                    IsApproved = model.IsApproved
                };

                if (supplyIAR.IsApproved)
                {
                    supplyIAR.IsApproved = true;
                    supplyIAR.ApprovedOn = DateTime.UtcNow;

                    List<TblDeliveryRecord>? deliveryRecords = _getTools.Delivery.GetTblDeliveryRecords(context)?.Where(x => x.SupplyIARId == supplyIAR.Id).ToList();
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
                                    IARId = model.Id,
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
                        }

                        await _editTools.Delivery.EditTblDeliveryRecordAsync(deliveryRecord, model.ActionBySystemUserId, context);
                    }
                }

                long supplyIARId = await _editTools.Supply.EditTblSupplyIARAsync(supplyIAR, model.ActionBySystemUserId, context);

                

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

        //Modifications need approval
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
                    ResponsibilityCenterCodeEncrypted = model.ResponsibilityCenterCode,
                    RISNumberEncrypted = model.RISNumber,
                    RISPurpose = model.RISPurpose,
                    RISRequestedBySystemUserId = model.RISRequestedBySystemUserId,
                    RISRequestedDate = model.RISRequestedDate,
                    RISApprovedBySystemUserId = model.RISApprovedBySystemUserId,
                    RISApprovedDate = model.RISApprovedDate,
                    RISIssuedBySystemUserId = model.RISIssuedBySystemUserId,
                    RISIssuedDate = model.RISIssuedDate,
                    RISReceivedBySystemUserId = model.RISReceivedBySystemUserId,
                    RISReceivedDate = model.RISReceivedDate,
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
                    StockNumberEncrypted = model.StockNumberEncrypted,
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
