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

        [Required] public long? RISRequestedBySystemUserId { get; set; }

        [Required] public DateTime? RISRequestedDate { get; set; }

        [Required] public long? RISApprovedBySystemUserId { get; set; }

        [Required] public DateTime? RISApprovedDate { get; set; }

        [Required] public long? RISIssuedBySystemUserId { get; set; }

        [Required] public DateTime? RISIssuedDate { get; set; }

        [Required] public long? RISRecievedBySystemUserId { get; set; }

        [Required] public DateTime? RISRecievedDate { get; set; }

        [Required] public bool IsApproved { get; set; } = false;

        [Required] public bool IsActive { get; set; } = true;

        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;

    }
}
