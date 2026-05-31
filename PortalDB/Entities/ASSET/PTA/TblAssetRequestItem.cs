using PortalCommon.Utilities;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.ASSET.PTA
{
    [Table("tblAssetRequestItems", Schema = "asset")]
    public class TblAssetRequestItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("AssetRequestItemId")]
        public long Id { get; set; }

        [Column("AssetRequestId")]
        public long AssetRequestId { get; set; }

        [Column("PTAId")]
        public long? PTAId { get; set; }

        [Column("AssetRequestItemPropertyNumber")]
        public string? PropertyNumberEncrypted { get; set; }
        [NotMapped]
        public string? PropertyNumber
        {
            get => string.IsNullOrEmpty(PropertyNumberEncrypted) ? null : EncryptionHelper.Decrypt(PropertyNumberEncrypted);
            set => PropertyNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("AssetRequestItemRemarks")]
        public string? RemarksEncrypted { get; set; }
        [NotMapped]
        public string? Remarks
        {
            get => string.IsNullOrEmpty(RemarksEncrypted) ? null : EncryptionHelper.Decrypt(RemarksEncrypted);
            set => RemarksEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("AssetRequestItemIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("AssetRequestItemIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("AssetRequestItemCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("AssetRequestItemUpdatedAt")]
        public DateTime? UpdatedAt { get; set; }
    }
}
