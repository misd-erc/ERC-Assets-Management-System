using System;
using System.Collections.Generic;
using System.Text;

namespace PortalDB.Models.ResponseModels.Supply
{
    public class FilteredRMSIItemDetailResponseModel
    {
        public string? RISNumber { get; set; }
        public string? ResponsibilityCenterCode { get; set; }
        public long IssueQuantity { get; set; }
    }
}
