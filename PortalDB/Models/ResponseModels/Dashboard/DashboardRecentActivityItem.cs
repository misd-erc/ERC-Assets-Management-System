using System;

namespace PortalDB.Models.ResponseModels.Dashboard
{
    public class DashboardRecentActivityItem
    {
        public long Id { get; set; }
        public string? Action { get; set; }
        public string? PerformedBy { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
