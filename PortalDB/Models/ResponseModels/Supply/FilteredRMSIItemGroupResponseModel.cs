using System;
using System.Collections.Generic;
using System.Text;

namespace PortalDB.Models.ResponseModels.Supply
{
    public class FilteredRMSIItemGroupResponseModel
    {
        public string? StockNumber { get; set; }
        public string? ItemDescription { get; set; }
        public long Total { get; set; }
        public List<FilteredRMSIItemDetailResponseModel>? Items { get; set; }
    }
}
