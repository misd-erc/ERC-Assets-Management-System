using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.ASSET.Supply;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Models.ResponseModels.Office;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.ResponseModels.Supply
{
    public class SupplyIARResponseModel
    {

        public long Id { get; set; }
        public string CenterCode { get; set; } = string.Empty;
        public string EntityName { get; set; } = string.Empty;
        public string FundCluster { get; set; } = string.Empty;
        public TblSupplyVendor? Vendor { get; set; }
        public string PONumber { get; set; } = string.Empty;
        public TblOffice? Office { get; set; }
        public TblDivision? Division { get; set; }
        public string IARNumber { get; set; } = string.Empty;
        public DateTime? IARNumberDate { get; set; }
        public string IARInvoiceNumber { get; set; } = string.Empty;
        public DateTime? IARInvoiceNumberDate { get; set; }
        public DateTime? PODate { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? CreatedAt { get; set; }

    }
}
