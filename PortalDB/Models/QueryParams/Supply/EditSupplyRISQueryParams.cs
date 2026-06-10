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
        public string? EntityName { get; set; }
        public string? FundCluster { get; set; }
        public long? DivisionId { get; set; }
        public long? OfficeId { get; set; }
        public string? ResponsibilityCenterCode { get; set; }
        public string? RISNumber{ get; set; }
        public string? RISPurpose { get; set; }
        public long? RISRequestedBySystemUserId { get; set; }
        public DateTime? RISRequestedDate { get; set; }
        public long? RISApprovedBySystemUserId { get; set; }
        public DateTime? RISApprovedDate { get; set; }
        public long? RISIssuedBySystemUserId { get; set; }
        public DateTime? RISIssuedDate { get; set; }
        public long? RISReceivedBySystemUserId { get; set; }
        public DateTime? RISReceivedDate { get; set; }
        [Required] public bool IsApproved { get; set; }
        [Required] public bool IsActive { get; set; } = true;
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;

    }
}
