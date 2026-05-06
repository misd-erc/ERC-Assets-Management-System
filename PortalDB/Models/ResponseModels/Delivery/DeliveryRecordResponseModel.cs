using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.ASSET.Supply;
using PortalDB.Entities.DBO.Account;
using PortalDB.Models.ResponseModels.Supply;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.ResponseModels.Delivery
{
    public class DeliveryRecordResponseModel
    {

        public long Id { get; set; }
        public string DRNumber { get; set; } = string.Empty;
        public SupplyIARResponseModel? SupplyIAR { get; set; }
        public DateTime? DeliveryDate { get; set; }
        public TblEmployee? Employee { get; set; }
        public string Remarks { get; set; } = string.Empty;
        public long? FileId { get; set; }
        public bool IsReceived { get; set; } = false;
        public List<DeliveryRecordItemResponseModel>? Items { get; set; }
        public decimal TotalAmount { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? CreatedAt { get; set; }

    }
}
