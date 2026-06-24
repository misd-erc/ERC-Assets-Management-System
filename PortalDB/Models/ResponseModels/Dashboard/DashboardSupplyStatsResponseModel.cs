using System.Collections.Generic;

namespace PortalDB.Models.ResponseModels.Dashboard
{
    public class DashboardSupplyStatsResponseModel
    {
        public long TotalItems { get; set; }
        public long TotalQuantity { get; set; }
        public decimal TotalValue { get; set; }
        public long LowStockCount { get; set; }
        public long SufficientStockCount { get; set; }
        public List<SupplyCategoryBreakdownItem> CategoryBreakdown { get; set; } = new();
        public List<SupplyStockHealthItem> StockHealthItems { get; set; } = new();
    }

    public class SupplyCategoryBreakdownItem
    {
        public string Name { get; set; } = "";
        public long Quantity { get; set; }
        public decimal Value { get; set; }
    }

    public class SupplyStockHealthItem
    {
        public string Code { get; set; } = "";
        public string Description { get; set; } = "";
        public string Category { get; set; } = "";
        public long StockOnHand { get; set; }
        public decimal UnitCost { get; set; }
        public decimal TotalValue { get; set; }
        public long ReorderPoint { get; set; }
        public bool IsLowStock { get; set; }
    }
}
