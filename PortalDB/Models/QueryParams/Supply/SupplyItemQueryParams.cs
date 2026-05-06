using PortalDB.Models.QueryParams.Pagination;
using System;

namespace PortalDB.Models.QueryParams.Supply
{
    public class SupplyItemQueryParams : PaginationGenericQueryParams
    {
        public long? CategoryId { get; set; }
        public string? Status { get; set; }
        public long? StorageLocationId { get; set; }
        public long? VendorId { get; set; }
    }
}
