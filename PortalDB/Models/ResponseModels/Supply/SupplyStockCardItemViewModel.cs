using PortalDB.Entities.ASSET.Supply;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalDB.Models.ResponseModels.Supply
{
    public class SupplyStockCardItemViewModel
    {
        public long Id { get; set; }
        public string? StockNumber { get; set; }
        public TblSupplyUnit? Unit { get; set; }
        public TblOffice? Office { get; set; }
        public TblDivision? Division { get; set; }
        public string? ItemDescription { get; set; }
        public long CurrentStockQuantity { get; set; }
        public long AddedStockQuantity { get; set; }
        public long IssuedStockQuantity { get; set; }
        public long NewStockQuantity { get; set; }
        public string? ItemRemarks { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
