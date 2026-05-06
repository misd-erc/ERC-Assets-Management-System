using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.QueryParams.Delivery
{
    public class EditDeliveryRecordQueryParams
    {
        public long Id { get; set; }
        public string? DRNumber { get; set; } = string.Empty;
        public DateTime? DeliveryDate { get; set; }
        public long? EmployeeId { get; set; }
        public string? Remarks { get; set; } = string.Empty;
        public bool IsReceived { get; set; } = false;
        public bool IsActive { get; set; } = true;
        [Required] public List<EditDeliveryRecordItemRawQueryParams>? Items { get; set; }
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
