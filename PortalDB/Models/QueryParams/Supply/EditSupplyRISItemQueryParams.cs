using PortalCommon.Utilities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Models.QueryParams.Supply
{
    public class EditSupplyRISItemQueryParams
    {
        [Required] public long Id { get; set; }
        [Required] public long? RISId { get; set; }
        [Required] public string? StockNumber { get; set; }
        [Required] public long? UnitId { get; set; }
        [Required] public string? ItemDescription { get; set; }
        [Required] public long RequisitionQuantity { get; set; }
        [Required] public bool IsAvailable { get; set; }
        [Required] public long IssueQuantity { get; set; }
        public string? ItemRemarks { get; set; }
        [Required] public bool IsActive { get; set; }
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
