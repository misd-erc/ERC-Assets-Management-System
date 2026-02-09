using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.QueryParams.Delivery
{
    public class EditDeliveryRecordQueryParams
    {
        [Required] public long Id { get; set; }
        [Required] public string DRNumber { get; set; } = string.Empty;
        [Required] public string PONumber { get; set; } = string.Empty;
        [Required] public long VendorId { get; set; }
        [Required] public DateTime DeliveryDate { get; set; }
        [Required] public long EmployeeId { get; set; }
        [Required] public string Remarks { get; set; } = string.Empty;
        [Required] public bool IsReceived { get; set; } = false;
        [Required] public bool IsActive { get; set; } = true;
        [Required] public List<EditDeliveryRecordItemRawQueryParams>? Items { get; set; }
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
