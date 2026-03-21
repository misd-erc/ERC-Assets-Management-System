using PortalCommon.Utilities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Entities.ASSET.Supply
{
    [Table("tblRISItems", Schema = "asset")]
    public class TblSupplyRISItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SupplyRISItemId")]
        public long Id { get; set; }

        [Column("SupplyRISId")]
        public long? RISId { get; set; }

        [Column("SupplyRISItemStockNumber")]
        public string? StockNumberEncrypted { get; set; }
        [NotMapped]
        public string? StockNumber
        {
            get => string.IsNullOrEmpty(StockNumberEncrypted) ? null : EncryptionHelper.Decrypt(StockNumberEncrypted);
            set => StockNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyRISItemUnitId")]
        public long? UnitId { get; set; }

        [Column("SupplyRISItemDescription")]
        public string? ItemDescriptionEncrypted { get; set; }
        [NotMapped]
        public string? ItemDescription
        {
            get => string.IsNullOrEmpty(ItemDescriptionEncrypted) ? null : EncryptionHelper.Decrypt(ItemDescriptionEncrypted);
            set => ItemDescriptionEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }


        [Column("SupplyRISItemRequisitionQuantity")]
        public long RequisitionQuantity { get; set; }

        [Column("SupplyRISItemIsAvailable")]
        public bool IsAvailable { get; set; }

        [Column("SupplyRISItemIssueQuantity")]
        public long IssueQuantity { get; set; }

        [Column("SupplyRISItemRemarks")]
        public string? ItemRemarksEncrypted { get; set; }
        [NotMapped]
        public string? ItemRemarks
        {
            get => string.IsNullOrEmpty(ItemRemarksEncrypted) ? null : EncryptionHelper.Decrypt(ItemRemarksEncrypted);
            set => ItemRemarksEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyRISItemIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("SupplyRISItemIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("SupplyRISItemCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
