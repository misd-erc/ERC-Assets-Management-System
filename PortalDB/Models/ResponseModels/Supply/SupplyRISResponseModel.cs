using PortalCommon.Utilities;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Models.ResponseModels.Account;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Models.ResponseModels.Supply
{
    public class SupplyRISResponseModel
    {
        public long Id { get; set; }
        public string? EntityName { get; set; } = string.Empty;

        public string? FundCluster { get; set; } = string.Empty;
        public TblDivision? Division { get; set; }
        public TblOffice? Office { get; set; }
        public string? ResponsibilityCenterCode { get; set; } = string.Empty;
        public string? RISNumber { get; set; } = string.Empty;
        public string? RISPurpose { get; set; } = string.Empty;
        public UserBasicResponseModel? RequestedBySystemUser { get; set; }
        public DateTime? RISRequestedDate { get; set; }
        public long? ApprovedBySystemUserId { get; set; }
        public DateTime? RISApprovedDate { get; set; }
        public long? IssuedBySystemUserId { get; set; }
        public DateTime? RISIssuedDate { get; set; }
        public long? RecievedBySystemUserId { get; set; }
        public DateTime? RISRecievedDate { get; set; }
        public bool IsApproved { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public DateTime? ApprovedOn { get; set; }
        public DateTime CreatedAt { get; set; }

    }
}
