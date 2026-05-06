using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;
using PortalDB.Models.QueryParams.Pagination;

namespace PortalDB.Models.QueryParams.Delivery
{
    public class DeliveryRecordQueryParams : PaginationGenericQueryParams
    {
        public string? Status { get; set; } // all, Received, Pending
    }
}
