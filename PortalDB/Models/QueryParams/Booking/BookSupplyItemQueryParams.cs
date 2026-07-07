using System;
using System.ComponentModel.DataAnnotations;

namespace PortalDB.Models.QueryParams.Booking
{
    public class BookSupplyItemQueryParams
    {
        [Required] public long BookingItemId { get; set; }
        public string? Code { get; set; } = string.Empty;
        public long? CategoryId { get; set; }
        public string? Description { get; set; } = string.Empty;
        public long? MeasurementUnitId { get; set; }
        public int? Quantity { get; set; }
        public decimal? UnitCost { get; set; }
        public int? ReorderPoint { get; set; }
        public long? StorageLocationId { get; set; }
        public long? VendorId { get; set; }
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
