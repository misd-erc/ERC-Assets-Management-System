using PortalCommon.Utilities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Entities.ASSET.Supply
{
    [Table("tblSupplyRISs", Schema = "asset")]
    public class TblSupplyRIS
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SupplyRISId")]
        public long Id { get; set; }

        [Column("SupplyRISEntityName")]
        public string? EntityNameEncrypted { get; set; }

        [NotMapped]
        public string? EntityName
        {
            get => string.IsNullOrEmpty(EntityNameEncrypted) ? null : EncryptionHelper.Decrypt(EntityNameEncrypted);
            set => EntityNameEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyRISFundCluster")]
        public string? FundClusterEncrypted { get; set; }
        [NotMapped]
        public string? FundCluster
        {
            get => string.IsNullOrEmpty(FundClusterEncrypted) ? null : EncryptionHelper.Decrypt(FundClusterEncrypted);
            set => FundClusterEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("DivisionId")]
        public long? DivisionId { get; set; }

        [Column("OfficeId")]
        public long? OfficeId { get; set; }

        [Column("SupplyResponsibilityCenterCode")]
        public string? ResponsibilityCenterCodeEncrypted { get; set; }
        [NotMapped]
        public string? ResponsibilityCenterCode
        {
            get => string.IsNullOrEmpty(ResponsibilityCenterCodeEncrypted) ? null : EncryptionHelper.Decrypt(ResponsibilityCenterCodeEncrypted);
            set => ResponsibilityCenterCodeEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyRISNumber")]
        public string? RISNumberEncrypted { get; set; }
        [NotMapped]
        public string? RISNumber
        {
            get => string.IsNullOrEmpty(RISNumberEncrypted) ? null : EncryptionHelper.Decrypt(RISNumberEncrypted);
            set => RISNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyRISPurpose")]
        public string? RISPurposeEncrypted { get; set; }
        [NotMapped]
        public string? RISPurpose
        {
            get => string.IsNullOrEmpty(RISPurposeEncrypted) ? null : EncryptionHelper.Decrypt(RISPurposeEncrypted);
            set => RISPurposeEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyRISRequestedBySystemUserId")]
        public long? RISRequestedBySystemUserId { get; set; }

        [Column("SupplyRISRequestedDate")]
        public DateTime? RISRequestedDate { get; set; }

        [Column("SupplyRISApprovedBySystemUserId")]
        public long? RISApprovedBySystemUserId { get; set; }

        [Column("SupplyRISApprovedDate")]
        public DateTime? RISApprovedDate { get; set; }

        [Column("SupplyRISIssuedBySystemUserId")]
        public long? RISIssuedBySystemUserId { get; set; }

        [Column("SupplyRISIssuedDate")]
        public DateTime? RISIssuedDate { get; set; }

        [Column("SupplyRISRecievedBySystemUserId")]
        public long? RISRecievedBySystemUserId { get; set; }

        [Column("SupplyRISRecievedDate")]
        public DateTime? RISRecievedDate { get; set; }

        [Column("SupplyRISIsApproved")]
        public bool IsApproved { get; set; } = false;

        [Column("SupplyRISIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("SupplyRISIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("SupplyRISApprovedOn")]
        public DateTime? ApprovedOn { get; set; }

        [Column("SupplyRISCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
