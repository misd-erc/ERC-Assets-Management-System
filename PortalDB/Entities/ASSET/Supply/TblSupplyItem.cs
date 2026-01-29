using PortalCommon.Utilities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Entities.ASSET.Supply
{
    [Table("tblSupplyItems", Schema = "asset")]
    public class TblSupplyItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SupplyItemId")]
        public long Id { get; set; }

        [Column("SupplyItemCode")]
        public string? CodeEncrypted { get; set; }
        [NotMapped]
        public string? Code
        {
            get => string.IsNullOrEmpty(CodeEncrypted) ? null : EncryptionHelper.Decrypt(CodeEncrypted);
            set => CodeEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyCategoryId")]
        public long? CategoryId { get; set; }

        [Column("SupplyItemDescription")]
        public string? DescriptionEncrypted { get; set; }
        [NotMapped]
        public string? Description
        {
            get => string.IsNullOrEmpty(DescriptionEncrypted) ? null : EncryptionHelper.Decrypt(DescriptionEncrypted);
            set => DescriptionEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyItemUnitId")]
        public long? MeasurementUnitId { get; set; }

        [Column("SupplyItemCurrentStock")]
        public int? CurrentStock { get; set; }

        [Column("SupplyItemUnitCost")]
        public long? UnitCost { get; set; }

        [Column("SupplyItemReorderPoint")]
        public int? ReorderPoint { get; set; }

        [Column("SupplyStorageLocationId")]
        public long? StorageLocationId { get; set; }

        [Column("SupplyVendorId")]
        public long? VendorId { get; set; }

        [Column("SupplyItemIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("SupplyItemIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("SupplyItemCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    }
}
