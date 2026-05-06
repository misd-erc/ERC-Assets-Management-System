using PortalDB.Models.QueryParams.Pagination;
using System;

namespace PortalDB.Models.QueryParams.Supply
{
    public class SupplyRISQueryParams : PaginationGenericQueryParams
    {
        public string? Status { get; set; }
        public long? OfficeId { get; set; }
        public long? DivisionId { get; set; }
    }
}
