using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.QueryParams.Delivery
{
    public class EditDeliveryRecordItemRawQueryParams
    {
        public long Id { get; set; }
        public long? RecordId { get; set; }
        public string? Code { get; set; } = string.Empty;
        public long? ItemTypeId { get; set; }
        public long? CategoryId { get; set; }
        public string? ItemDescription { get; set; } = string.Empty;
        public string? ItemSpecification { get; set; } = string.Empty;
        public int? ItemQuantity { get; set; }
        public int? ReorderPoint { get; set; }
        public long? MeasurementUnitId { get; set; }
        public long? UnitCost { get; set; }
        public long? StorageLocationId { get; set; }
        public long? VendorId { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;
    }
}
