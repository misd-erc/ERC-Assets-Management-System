using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.ASSET.Supply;
using System;

namespace PortalDB.Models.ResponseModels.Booking
{
    public class BookingItemResponseModel
    {
        public long Id { get; set; }
        public string Group { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;

        public long? SupplyIARId { get; set; }
        public string? IARNumber { get; set; }
        public long? DeliveryRecordId { get; set; }
        public string? DRNumber { get; set; }
        public int? UnitSequence { get; set; }

        public TblPTACategory? Category { get; set; }
        public long? CategoryId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Specification { get; set; }
        public TblSupplyUnit? MeasurementUnit { get; set; }
        public long? MeasurementUnitId { get; set; }
        public int? Quantity { get; set; }
        public decimal? UnitCost { get; set; }

        // Supply-only
        public int? ReorderPoint { get; set; }
        public TblSupplyStorageLocation? StorageLocation { get; set; }
        public long? StorageLocationId { get; set; }
        public TblSupplyVendor? Vendor { get; set; }
        public long? VendorId { get; set; }

        // PPE/SE-only
        public string? SuggestedPropertyNumber { get; set; }

        public DateTime? DeliveryDate { get; set; }
        public DateTime? BookedAt { get; set; }
        public long? FinalizedSupplyItemId { get; set; }
        public long? FinalizedPTAId { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
