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
        public TblPTACategory? Category { get; set; }
        public string Description { get; set; } = string.Empty;
        //public int? CurrentStock { get; set; }
        public long? Quantity { get; set; }
        public long? UnitCost { get; set; }
        public int? ReorderPoint { get; set; }
        public TblSupplyStorageLocation? StorageLocation { get; set; }
        public TblSupplyVendor? Vendor { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? CreatedAt { get; set; }

    }

    public class SupplyItemGroupedResponseModel
    {

        public long Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public long? IARId { get; set; }
        public string Description { get; set; } = string.Empty;
        public int? TotalCurrentStock { get; set; }
        public int? TotalStockCost { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? CreatedAt { get; set; }

    }
}
