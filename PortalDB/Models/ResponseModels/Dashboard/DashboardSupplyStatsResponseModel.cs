namespace PortalDB.Models.ResponseModels.Dashboard
{
    public class DashboardSupplyStatsResponseModel
    {
        public long TotalItems { get; set; }
        public long TotalQuantity { get; set; }
        public decimal TotalValue { get; set; }
        public long LowStockCount { get; set; }
    }
}
