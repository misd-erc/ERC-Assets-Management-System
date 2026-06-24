using System.Collections.Generic;

namespace PortalDB.Models.ResponseModels.Dashboard
{
    public class DashboardSupplyStatsResponseModel
    {
        public long TotalItems { get; set; }
        public long TotalQuantity { get; set; }
        public decimal TotalValue { get; set; }
        public long LowStockCount { get; set; }
        public List<SupplyCategoryBreakdownItem> CategoryBreakdown { get; set; } = new();
    }

    public class SupplyCategoryBreakdownItem
    {
        public string Name { get; set; } = "";
        public long Quantity { get; set; }
        public decimal Value { get; set; }
    }
}
