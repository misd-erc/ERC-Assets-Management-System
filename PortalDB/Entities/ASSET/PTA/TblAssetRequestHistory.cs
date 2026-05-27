using PortalCommon.Utilities;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.ASSET.PTA
{
    [Table("tblAssetRequestHistories", Schema = "asset")]
    public class TblAssetRequestHistory
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("AssetRequestHistoryId")]
        public long Id { get; set; }

        [Column("AssetRequestId")]
        public long AssetRequestId { get; set; }

        [Column("AssetRequestHistoryActionType")]
        public string ActionType { get; set; } = "Created";

        [Column("AssetRequestHistoryFromStatus")]
        public string? FromStatus { get; set; }

        [Column("AssetRequestHistoryToStatus")]
        public string? ToStatus { get; set; }

        [Column("AssetRequestHistoryAssignedCommitteeSystemUserId")]
        public long? AssignedCommitteeSystemUserId { get; set; }

        [Column("AssetRequestHistoryAssignedPersonnelSystemUserId")]
        public long? AssignedPersonnelSystemUserId { get; set; }

        [Column("AssetRequestHistoryRemarks")]
        public string? RemarksEncrypted { get; set; }
        [NotMapped]
        public string? Remarks
        {
            get => string.IsNullOrEmpty(RemarksEncrypted) ? null : EncryptionHelper.Decrypt(RemarksEncrypted);
            set => RemarksEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("AssetRequestHistoryUpdatedBySystemUserId")]
        public long UpdatedBySystemUserId { get; set; }

        [Column("AssetRequestHistoryActionAt")]
        public DateTime ActionAt { get; set; } = DateTime.UtcNow;

        [Column("AssetRequestHistoryIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("AssetRequestHistoryIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("AssetRequestHistoryCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("AssetRequestHistoryUpdatedAt")]
        public DateTime? UpdatedAt { get; set; }
    }
}
