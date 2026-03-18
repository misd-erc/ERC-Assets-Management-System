using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.QueryParams.Delivery
{
    public class EditDeliveryRecordItemRawQueryParams
    {
        [Required] public long Id { get; set; }
        [Required] public long RecordId { get; set; }
        public string Code { get; set; } = string.Empty;
        [Required] public long ItemTypeId { get; set; }
        [Required] public long CategoryId { get; set; }
        [Required] public string ItemDescription { get; set; } = string.Empty;
        public string ItemSpecification { get; set; } = string.Empty;
        [Required] public long ItemQuantity { get; set; }
        //public int CurrentStock { get; set; }
        public int ReorderPoint { get; set; }
        [Required] public long UnitId { get; set; }
        [Required] public long UnitCost { get; set; }
        public long StorageLocationId { get; set; }
        public long VendorId { get; set; }
        [Required] public bool IsActive { get; set; } = true;
        [Required] public bool IsDeleted { get; set; } = false;
    }
}
