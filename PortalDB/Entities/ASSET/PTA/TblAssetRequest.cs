using PortalCommon.Utilities;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.ASSET.PTA
{
    [Table("tblAssetRequests", Schema = "asset")]
    public class TblAssetRequest
    {
        [NotMapped] public const string PENDING = "Pending";
        [NotMapped] public const string UNDER_REVIEW = "UnderReview";
        [NotMapped] public const string ASSIGNED = "Assigned";
        [NotMapped] public const string IN_PROGRESS = "InProgress";
        [NotMapped] public const string RESOLVED = "Resolved";
        [NotMapped] public const string REJECTED = "Rejected";
        [NotMapped] public const string COMPLETED = "Completed";

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("AssetRequestId")]
        public long Id { get; set; }

        [Column("AssetRequestNumber")]
        public string? RequestNumberEncrypted { get; set; }
        [NotMapped]
        public string? RequestNumber
        {
            get => string.IsNullOrEmpty(RequestNumberEncrypted) ? null : EncryptionHelper.Decrypt(RequestNumberEncrypted);
            set => RequestNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("AssetRequestEmployeeSystemUserId")]
        public long EmployeeSystemUserId { get; set; }

        [Column("AssetRequestAssignedCommitteeSystemUserId")]
        public long? AssignedCommitteeSystemUserId { get; set; }

        [Column("AssetRequestAssignedPersonnelSystemUserId")]
        public long? AssignedPersonnelSystemUserId { get; set; }

        [Column("AssetRequestStatus")]
        public string Status { get; set; } = PENDING;

        [Column("AssetRequestIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("AssetRequestIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("AssetRequestCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("AssetRequestUpdatedAt")]
        public DateTime? UpdatedAt { get; set; }
    }
}
