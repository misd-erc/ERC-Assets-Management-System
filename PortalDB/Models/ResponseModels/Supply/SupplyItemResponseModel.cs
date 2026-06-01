using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.ASSET.Supply;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.ResponseModels.Supply
{
    public class SupplyItemResponseModel
    {

        public long Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public long? IARId { get; set; }
        public TblSupplyUnit? MeasurementUnit { get; set; }
        public long? MeasurementUnitId { get; set; }
        public TblPTACategory? Category { get; set; }
        public long? CategoryId { get; set; }
        public string Description { get; set; } = string.Empty;
        //public int? CurrentStock { get; set; }
        public long? Quantity { get; set; }
        public decimal? UnitCost { get; set; }
        public int? ReorderPoint { get; set; }
        public TblSupplyStorageLocation? StorageLocation { get; set; }
        public long? StorageLocationId { get; set; }
        public TblSupplyVendor? Vendor { get; set; }
        public long? VendorId { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? CreatedAt { get; set; }

    }

    public class SupplyItemGroupedResponseModel
    {

        public long Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public long? IARId { get; set; }
        public string Description { get; set; } = string.Empty;
        public long? TotalCurrentStock { get; set; }
        public decimal? TotalStockCost { get; set; }
        public int? ReorderPoint { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? CreatedAt { get; set; }

    }
}
