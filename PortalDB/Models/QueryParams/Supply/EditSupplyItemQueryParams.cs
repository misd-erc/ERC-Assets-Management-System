using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.QueryParams.Supply
{
    public class EditSupplyItemQueryParams
    {
        [Required] public long Id { get; set; }
        [Required] public string Code { get; set; } = string.Empty;
        [Required] public long? CategoryId { get; set; }
        [Required] public string Description { get; set; } = string.Empty;
        [Required] public long? MeasurementUnitId { get; set; }
        [Required] public int? Quantity { get; set; }
        //[Required] public int? CurrentStock { get; set; }
        [Required] public long? UnitCost { get; set; }
        [Required] public int? ReorderPoint { get; set; }
        [Required] public long? StorageLocationId { get; set; }
        [Required] public long? VendorId { get; set; }
        [Required] public bool IsActive { get; set; } = true;
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
