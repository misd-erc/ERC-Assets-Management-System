using Microsoft.Graph.Models;
using PortalCommon.Utilities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Entities.ASSET.Delivery
{
    [Table("tblDeliveryRecordItems", Schema = "asset")]
    public class TblDeliveryRecordItem
    {

        #region Constants
        [NotMapped] public const string ITEM_TYPE_SUPPLY = "Supply";
        [NotMapped] public const string ITEM_TYPE_PPE = "Property, Plant & Equipment (PPE)";
        [NotMapped] public const string ITEM_TYPE_SE = "Semi-Expendable";
        #endregion

        #region Dictionary
        public static readonly TwoWayDictionaryHelper<long, string> Dictionary = new([
            (1, ITEM_TYPE_SUPPLY),
            (2, ITEM_TYPE_PPE),
            (3, ITEM_TYPE_SE),
        ]);
        #endregion

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("DeliveryRecordItemId")]
        public long Id { get; set; }

        [Column("DeliveryRecordItemCode")]
        public string? CodeEncrypted { get; set; }
        [NotMapped]
        public string? Code
        {
            get => string.IsNullOrEmpty(CodeEncrypted) ? null : EncryptionHelper.Decrypt(CodeEncrypted);
            set => CodeEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("DeliveryRecordId")]
        public long? RecordId { get; set; }

        [Column("DeliveryRecordItemType")]
        public long? ItemTypeId { get; set; }

        [Column("PTACategoryId")]
        public long? CategoryId { get; set; }

        [Column("DeliveryRecordItemDescription")]
        public string? ItemDescriptionEncrypted { get; set; }
        [NotMapped]
        public string? ItemDescription
        {
            get => string.IsNullOrEmpty(ItemDescriptionEncrypted) ? null : EncryptionHelper.Decrypt(ItemDescriptionEncrypted);
            set => ItemDescriptionEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("DeliveryRecordItemSpecification")]
        public string? ItemSpecificationEncrypted { get; set; }
        [NotMapped]
        public string? ItemSpecification
        {
            get => string.IsNullOrEmpty(ItemSpecificationEncrypted) ? null : EncryptionHelper.Decrypt(ItemSpecificationEncrypted);
            set => ItemSpecificationEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("DeliveryRecordItemQuantity")]
        public long? ItemQuantity { get; set; }

        [Column("DeliveryRecordItemCurrentStock")]
        public int? CurrentStock { get; set; }

        [Column("SupplyUnitId")]
        public long? UnitId { get; set; }

        [Column("DeliveryRecordUnitCost")]
        public long? UnitCost { get; set; }

        [Column("DeliveryRecordItemReorderPoint")]
        public int? ReorderPoint { get; set; }

        [Column("SupplyStorageLocationId")]
        public long? StorageLocationId { get; set; }

        [Column("SupplyVendorId")]
        public long? VendorId { get; set; }

        [Column("DeliveryRecordItemIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("DeliveryRecordItemIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("DeliveryRecordItemCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    }
}
