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
        public long TotalSEIssued { get; set; }
        public long TotalSEStock { get; set; }
        public decimal TotalSEIssuedValue { get; set; }
        public decimal TotalSEStockValue { get; set; }
        public List<PTACategoryBreakdownItem> PPECategoryBreakdown { get; set; } = new();
        public List<PTACategoryBreakdownItem> SECategoryBreakdown { get; set; } = new();
        public List<PTAItem> Items { get; set; } = new();
    }

    public class PTACategoryBreakdownItem
    {
        public string Name { get; set; } = "";
        public int Count { get; set; }
        public decimal Value { get; set; }
        public int IssuedCount { get; set; }
        public int StockCount { get; set; }
    }

    public class PTAItem
    {
        public string Group { get; set; } = "";
        public string Category { get; set; } = "";
        public string? PropertyNumber { get; set; }
        public string? Description { get; set; }
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public decimal Value { get; set; }
        public bool IsIssued { get; set; }
    }
}
