using PortalCommon.Utilities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Models.QueryParams.Supply
{
    public class EditSupplyRISQueryParams
    {
        [Required] public long Id { get; set; }
        [Required] public string? EntityName { get; set; }
        [Required] public string? FundCluster { get; set; }
        [Required] public long? DivisionId { get; set; }
        [Required] public long? OfficeId { get; set; }
        [Required] public string? ResponsibilityCenterCode { get; set; }
        [Required] public string? RISNumber{ get; set; }
        [Required] public string? RISPurpose { get; set; }
        public long? RISRequestedBySystemUserId { get; set; }
        public DateTime? RISRequestedDate { get; set; }
        public long? RISApprovedBySystemUserId { get; set; }
        public DateTime? RISApprovedDate { get; set; }
        public long? RISIssuedBySystemUserId { get; set; }
        public DateTime? RISIssuedDate { get; set; }
        public long? RISReceivedBySystemUserId { get; set; }
        public DateTime? RISReceivedDate { get; set; }
        [Required] public bool IsActive { get; set; } = true;
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;

    }
}
