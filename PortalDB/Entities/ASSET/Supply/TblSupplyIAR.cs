using PortalCommon.Utilities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Entities.ASSET.Supply
{
    [Table("tblSupplyIARs", Schema = "asset")]
    public class TblSupplyIAR
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SupplyIARId")]
        public long Id { get; set; }

        [Column("DeliveryRecordId")]
        public long? RecordId { get; set; }

        [Column("SupplyResponsibilityCenterCode")]
        public string? ResponsibilityCenterCodeEncrypted { get; set; }
        [NotMapped]
        public string? ResponsibilityCenterCode
        {
            get => string.IsNullOrEmpty(ResponsibilityCenterCodeEncrypted) ? null : EncryptionHelper.Decrypt(ResponsibilityCenterCodeEncrypted);
            set => ResponsibilityCenterCodeEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }


        [Column("SupplyIAREntityName")]
        public string? EntityNameEncrypted { get; set; }
        [NotMapped]
        public string? EntityName
        {
            get => string.IsNullOrEmpty(EntityNameEncrypted) ? null : EncryptionHelper.Decrypt(EntityNameEncrypted);
            set => EntityNameEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyIARFundCluster")]
        public string? FundClusterEncrypted { get; set; }
        [NotMapped]
        public string? FundCluster
        {
            get => string.IsNullOrEmpty(FundClusterEncrypted) ? null : EncryptionHelper.Decrypt(FundClusterEncrypted);
            set => FundClusterEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyVendorId")]
        public long? VendorId { get; set; }

        [Column("SupplyIARPONumber")]
        public string? PONumberEncrypted { get; set; }
        [NotMapped]
        public string? PONumber
        {
            get => string.IsNullOrEmpty(PONumberEncrypted) ? null : EncryptionHelper.Decrypt(PONumberEncrypted);
            set => PONumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("OfficeId")]
        public long? OfficeId { get; set; }

        [Column("DivisionId")]
        public long? DivisionId { get; set; }

        [Column("SupplyIARNumber")]
        public string? IARNumberEncrypted { get; set; }
        [NotMapped]
        public string? IARNumber
        {
            get => string.IsNullOrEmpty(IARNumberEncrypted) ? null : EncryptionHelper.Decrypt(IARNumberEncrypted);
            set => IARNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyIARNumberDate")]
        public DateTime? IARNumberDate { get; set; }

        [Column("SupplyIARInvoiceNumber")]
        public string? IARInvoiceNumberEncrypted { get; set; }
        [NotMapped]
        public string? IARInvoiceNumber
        {
            get => string.IsNullOrEmpty(IARInvoiceNumberEncrypted) ? null : EncryptionHelper.Decrypt(IARInvoiceNumberEncrypted);
            set => IARInvoiceNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyIARInvoiceDate")]
        public DateTime? IARInvoiceNumberDate { get; set; }

        [Column("SupplyIARIsApproved")]
        public bool IsApproved { get; set; } = false;

        [Column("SupplyIARPODate")]
        public DateTime? PODate { get; set; }

        [Column("SupplyIARActualDeliveryDate")]
        public DateTime? ActualDeliveryDate { get; set; }

        [Column("SupplyIARIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("SupplyIARIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("SupplyIARApprovedOn")]
        public DateTime? ApprovedOn { get; set; }

        [Column("SupplyIARCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
