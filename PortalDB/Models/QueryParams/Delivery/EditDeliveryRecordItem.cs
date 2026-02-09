using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.QueryParams.Delivery
{
    public class EditDeliveryRecordItemQueryParams
    {
        [Required] public long Id { get; set; }
        [Required] public long RecordId { get; set; }
        [Required] public long ItemTypeId { get; set; }
        [Required] public long CategoryId { get; set; }
        [Required] public string ItemDescription { get; set; } = string.Empty;
        [Required] public string ItemSpecification { get; set; } = string.Empty;
        [Required] public long ItemQuantity { get; set; }
        [Required] public long UnitId { get; set; }
        [Required] public long UnitCost { get; set; }
        [Required] public bool IsActive { get; set; } = true;
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
