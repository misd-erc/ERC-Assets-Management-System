using System.Collections.Generic;

namespace PortalDB.Models.ResponseModels.Dashboard
{
    public class DashboardAssetOverviewResponseModel
    {
        public List<MonthlyMovementItem> MonthlyMovements { get; set; } = new();
        public List<CategoryBreakdownItem> CategoryBreakdown { get; set; } = new();
        public List<ConditionBreakdownItem> ConditionBreakdown { get; set; } = new();
    }

    public class MonthlyMovementItem
    {
        public string Month { get; set; } = "";
        public int Issued { get; set; }
        public int Transferred { get; set; }
    }

    public class CategoryBreakdownItem
    {
        public string Name { get; set; } = "";
        public int Count { get; set; }
        public decimal Value { get; set; }
    }

    public class ConditionBreakdownItem
    {
        public string Condition { get; set; } = "";
        public int Count { get; set; }
    }
}
