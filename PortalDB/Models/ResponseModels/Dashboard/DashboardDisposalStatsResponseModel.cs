namespace PortalDB.Models.ResponseModels.Dashboard
{
    public class DashboardDisposalStatsResponseModel
    {
        public long PendingCount { get; set; }
        public long ApprovedCount { get; set; }
        public long DisposedCount { get; set; }
        public long RejectedCount { get; set; }
        public long TotalCount { get; set; }
    }
}
