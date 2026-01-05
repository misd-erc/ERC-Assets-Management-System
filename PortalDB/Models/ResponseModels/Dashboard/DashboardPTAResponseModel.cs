using System;
using System.Collections.Generic;
using System.Text;

namespace PortalDB.Models.ResponseModels.Dashboard
{
    public class DashboardPTAResponseModel
    {
        public long TotalPPE { get; set; }
        public long TotalSE { get; set; }
        public decimal TotalPPEValue { get; set; }
        public decimal TotalPPEValuePercentage { get; set; }
        public decimal TotalSEValue { get; set; }
        public decimal TotalSEValuePercentage { get; set; }
    }
}
