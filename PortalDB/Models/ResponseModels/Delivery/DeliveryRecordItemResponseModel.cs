using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.ASSET.Supply;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Models.ResponseModels.Delivery
{
    public class DeliveryRecordItemResponseModel
    {

        public long Id { get; set; }
        public long? RecordId { get; set; }
        public string? Code { get; set; }
        public long? ItemTypeId { get; set; }
        public TblPTACategory? Category { get; set; }
        public string ItemDescription { get; set; } = string.Empty;
        public string ItemSpecification { get; set; } = string.Empty;
        public long? ItemQuantity { get; set; }
        //public int? CurrentStock { get; set; }
        public TblSupplyUnit? MeasurementUnit { get; set; }
        public long? UnitCost { get; set; }
        public int? ReorderPoint { get; set; }
        public TblSupplyStorageLocation? StorageLocation { get; set; }
        public TblSupplyVendor? Vendor { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? CreatedAt { get; set; }

    }
}
