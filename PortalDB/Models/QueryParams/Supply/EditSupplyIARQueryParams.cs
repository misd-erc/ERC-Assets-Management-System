using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.QueryParams.Supply
{
    public class EditSupplyIARQueryParams
    {
        public long Id { get; set; }
        public long? RecordId { get; set; }
        public string? CenterCode { get; set; } = string.Empty;
        public string? EntityName { get; set; } = string.Empty;
        public string? FundCluster { get; set; } = string.Empty;
        public long? VendorId { get; set; }
        public string? PONumber { get; set; } = string.Empty;
        public long? OfficeId { get; set; }
        public long? DivisionId { get; set; }
        public string? IARNumber { get; set; } = string.Empty;
        public DateTime? IARNumberDate { get; set; }
        public string? IARInvoiceNumber { get; set; } = string.Empty;
        public DateTime? IARInvoiceNumberDate { get; set; }
        public DateTime? PODate { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsApproved { get; set; } = false;
        public DateTime? ApprovedOn { get; set; }
        public DateTime? ActualDeliveryDate { get; set; }
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
