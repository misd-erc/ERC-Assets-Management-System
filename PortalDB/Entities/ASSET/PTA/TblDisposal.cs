using PortalCommon.Utilities;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace PortalDB.Entities.ASSET.PTA
{
    [Table("tblDisposals", Schema = "asset")]
    public class TblDisposal
    {
        #region Constants
        [NotMapped] public const string PENDING = "Pending";
        [NotMapped] public const string APPROVED = "Approved";
        [NotMapped] public const string DISPOSED = "Disposed";
        [NotMapped] public const string REJECTED = "Rejected";
        #endregion

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("DisposalId")]
        public long Id { get; set; }

        [Column("DisposalGroup")]
        public string? Group { get; set; }

        [Column("DisposalNumber")]
        public string? DisposalNumberEncrypted { get; set; }
        [NotMapped]
        public string? DisposalNumber
        {
            get => string.IsNullOrEmpty(DisposalNumberEncrypted) ? null : EncryptionHelper.Decrypt(DisposalNumberEncrypted);
            set => DisposalNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("DisposalReason")]
        public string? ReasonEncrypted { get; set; }
        [NotMapped]
        public string? Reason
        {
            get => string.IsNullOrEmpty(ReasonEncrypted) ? null : EncryptionHelper.Decrypt(ReasonEncrypted);
            set => ReasonEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("DisposalMethod")]
        public string? MethodEncrypted { get; set; }
        [NotMapped]
        public string? Method
        {
            get => string.IsNullOrEmpty(MethodEncrypted) ? null : EncryptionHelper.Decrypt(MethodEncrypted);
            set => MethodEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("DisposalRequestedBySystemUserId")]
        public long? RequestedBySystemUserId { get; set; }

        [Column("DisposalApprovedBySystemUserId")]
        public long? ApprovedBySystemUserId { get; set; }

        [Column("DisposalDateRequested")]
        public DateTime? DateRequested { get; set; }

        [Column("DisposalDateApproved")]
        public DateTime? DateApproved { get; set; }

        [Column("DisposalDateDisposed")]
        public DateTime? DateDisposed { get; set; }

        [Column("DisposalProceedAmount")]
        [Precision(18, 2)]
        public decimal? ProceedAmount { get; set; }

        [Column("DisposalBuyer")]
        public string? BuyerEncrypted { get; set; }
        [NotMapped]
        public string? Buyer
        {
            get => string.IsNullOrEmpty(BuyerEncrypted) ? null : EncryptionHelper.Decrypt(BuyerEncrypted);
            set => BuyerEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("DisposalRemarks")]
        public string? RemarksEncrypted { get; set; }
        [NotMapped]
        public string? Remarks
        {
            get => string.IsNullOrEmpty(RemarksEncrypted) ? null : EncryptionHelper.Decrypt(RemarksEncrypted);
            set => RemarksEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("DisposalStatus")]
        public string? Status { get; set; }

        [Column("DisposalIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("DisposalIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("DisposalCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
