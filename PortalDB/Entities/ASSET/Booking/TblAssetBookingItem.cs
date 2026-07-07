using PortalCommon.Utilities;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.ASSET.Booking
{
    [Table("tblAssetBookingItems", Schema = "asset")]
    public class TblAssetBookingItem
    {

        #region Constants
        [NotMapped] public const string GROUP_SUPPLY = "Supply";
        [NotMapped] public const string GROUP_PPE = "PPE";
        [NotMapped] public const string GROUP_SE = "SE";

        [NotMapped] public const string STATUS_PENDING = "Pending";
        [NotMapped] public const string STATUS_BOOKED = "Booked";
        [NotMapped] public const string STATUS_CANCELLED = "Cancelled";
        #endregion

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("AssetBookingItemId")]
        public long Id { get; set; }

        [Column("AssetBookingItemGroup")]
        [MaxLength(20)]
        public string? Group { get; set; }

        [Column("SupplyIARId")]
        public long? SupplyIARId { get; set; }

        [Column("DeliveryRecordId")]
        public long? DeliveryRecordId { get; set; }

        [Column("DeliveryRecordItemId")]
        public long? DeliveryRecordItemId { get; set; }

        [Column("AssetBookingItemUnitSequence")]
        public int? UnitSequence { get; set; }

        [Column("PTACategoryId")]
        public long? CategoryId { get; set; }

        [Column("AssetBookingItemCode")]
        public string? CodeEncrypted { get; set; }
        [NotMapped]
        public string? Code
        {
            get => string.IsNullOrEmpty(CodeEncrypted) ? null : EncryptionHelper.Decrypt(CodeEncrypted);
            set => CodeEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("AssetBookingItemDescription")]
        public string? DescriptionEncrypted { get; set; }
        [NotMapped]
        public string? Description
        {
            get => string.IsNullOrEmpty(DescriptionEncrypted) ? null : EncryptionHelper.Decrypt(DescriptionEncrypted);
            set => DescriptionEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("AssetBookingItemSpecification")]
        public string? SpecificationEncrypted { get; set; }
        [NotMapped]
        public string? Specification
        {
            get => string.IsNullOrEmpty(SpecificationEncrypted) ? null : EncryptionHelper.Decrypt(SpecificationEncrypted);
            set => SpecificationEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyUnitId")]
        public long? MeasurementUnitId { get; set; }

        [Column("AssetBookingItemQuantity")]
        public int? Quantity { get; set; }

        [Column("AssetBookingItemUnitCost", TypeName = "decimal(18,2)")]
        public decimal? UnitCost { get; set; }

        [Column("AssetBookingItemReorderPoint")]
        public int? ReorderPoint { get; set; }

        [Column("SupplyStorageLocationId")]
        public long? StorageLocationId { get; set; }

        [Column("SupplyVendorId")]
        public long? VendorId { get; set; }

        [Column("AssetBookingItemDeliveryDate")]
        public DateTime? DeliveryDate { get; set; }

        [Column("AssetBookingItemSuggestedPropertyNumber")]
        public string? SuggestedPropertyNumberEncrypted { get; set; }
        [NotMapped]
        public string? SuggestedPropertyNumber
        {
            get => string.IsNullOrEmpty(SuggestedPropertyNumberEncrypted) ? null : EncryptionHelper.Decrypt(SuggestedPropertyNumberEncrypted);
            set => SuggestedPropertyNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("AssetBookingItemStatus")]
        [MaxLength(20)]
        public string Status { get; set; } = STATUS_PENDING;

        [Column("AssetBookingItemBookedAt")]
        public DateTime? BookedAt { get; set; }

        [Column("AssetBookingItemBookedBySystemUserId")]
        public long? BookedBySystemUserId { get; set; }

        [Column("FinalizedSupplyItemId")]
        public long? FinalizedSupplyItemId { get; set; }

        [Column("FinalizedPTAId")]
        public long? FinalizedPTAId { get; set; }

        [Column("AssetBookingItemIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("AssetBookingItemIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("AssetBookingItemCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    }
}
