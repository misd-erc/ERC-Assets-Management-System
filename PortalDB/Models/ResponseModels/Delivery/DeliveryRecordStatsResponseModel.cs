namespace PortalDB.Models.ResponseModels.Delivery
{
    /// <summary>Month-to-date delivery/receipt metrics for the Deliveries &amp; Receipts header.</summary>
    public class DeliveryRecordStatsResponseModel
    {
        public int TotalDeliveries { get; set; }
        public int PendingDeliveries { get; set; }
        public int ReceivedDeliveries { get; set; }
        public decimal TotalValue { get; set; }
        public decimal PendingValue { get; set; }
        public int DeliveriesMTD { get; set; }
        public decimal ValueReceivedMTD { get; set; }
    }
}
