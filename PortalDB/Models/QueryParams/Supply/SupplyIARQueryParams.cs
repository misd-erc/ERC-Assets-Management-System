using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;
using PortalDB.Models.QueryParams.Pagination;

namespace PortalDB.Models.QueryParams.Supply
{
    public class SupplyIARQueryParams : PaginationGenericQueryParams
    {
        public string? Status { get; set; } // all, Approved, Pending
        public long? VendorId { get; set; }
        public long? OfficeId { get; set; }
        public long? DivisionId { get; set; }
    }
}
