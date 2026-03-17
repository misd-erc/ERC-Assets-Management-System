using PortalCommon.Utilities;
using PortalDB.Entities.ASSET.Supply;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Models.ResponseModels.Supply
{
    public class SupplyRISItemResponseModel
    {
        public long Id { get; set; }
        public long? RISId { get; set; }
        public string? StockNumber { get; set; } = string.Empty;
        public TblSupplyUnit? SupplyUnit { get; set; }
        public string? ItemDescription { get; set; } = string.Empty;
        public long RequisitionQuantity { get; set; }
        public bool IsAvailable { get; set; } = true;
        public long IssueQuantity { get; set; }
        public string? ItemRemarks { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
    }
}
