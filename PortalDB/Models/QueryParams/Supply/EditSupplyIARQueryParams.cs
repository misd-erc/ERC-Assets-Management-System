using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.QueryParams.Supply
{
    public class EditSupplyIARQueryParams
    {
        [Required] public long Id { get; set; }
        [Required] public string CenterCode { get; set; } = string.Empty;
        [Required] public string EntityName { get; set; } = string.Empty;
        [Required] public string FundCluster { get; set; } = string.Empty;
        [Required] public long VendorId { get; set; }
        [Required] public string PONumber { get; set; } = string.Empty;
        [Required] public long OfficeId { get; set; }
        [Required] public long DivisionId { get; set; }
        [Required] public string IARNumber { get; set; } = string.Empty;
        [Required] public DateTime? IARNumberDate { get; set; }
        [Required] public string IARInvoiceNumber { get; set; } = string.Empty;
        [Required] public DateTime? IARInvoiceNumberDate { get; set; }
        [Required] public DateTime? PODate { get; set; }
        [Required] public bool IsActive { get; set; } = true;
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
