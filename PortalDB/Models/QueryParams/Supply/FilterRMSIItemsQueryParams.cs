using System;
using System.Collections.Generic;
using System.Text;

namespace PortalDB.Models.QueryParams.Supply
{
    public class FilterRMSIItemsQueryParams
    {
        public long CategoryId {  get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }
}
