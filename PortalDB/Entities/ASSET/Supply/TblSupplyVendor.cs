using PortalCommon.Utilities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Entities.ASSET.Supply
{   
    [Table("tblSupplyVendors", Schema = "asset")]
    public class TblSupplyVendor
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SupplyVendorId")]
        public long Id { get; set; }

        [Column("SupplyVendorName")]
        public string? NameEncrypted { get; set; }
        [NotMapped]
        public string? Name
        {
            get => string.IsNullOrEmpty(NameEncrypted) ? null : EncryptionHelper.Decrypt(NameEncrypted);
            set => NameEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyVendorAddress")]
        public string? AddressEncrypted { get; set; }
        [NotMapped]
        public string? Address
        {
            get => string.IsNullOrEmpty(AddressEncrypted) ? null : EncryptionHelper.Decrypt(AddressEncrypted);
            set => AddressEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyVendorEmail")]
        public string? EmailEncrypted { get; set; }
        [NotMapped]
        public string? Email
        {
            get => string.IsNullOrEmpty(EmailEncrypted) ? null : EncryptionHelper.Decrypt(EmailEncrypted);
            set => EmailEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyVendorContactNumber")]
        public string? ContactEncrypted { get; set; }
        [NotMapped]
        public string? Contact
        {
            get => string.IsNullOrEmpty(ContactEncrypted) ? null : EncryptionHelper.Decrypt(ContactEncrypted);
            set => ContactEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyVendorContactPerson")]
        public string? ContactPersonEncrypted { get; set; }
        [NotMapped]
        public string? ContactPerson
        {
            get => string.IsNullOrEmpty(ContactPersonEncrypted) ? null : EncryptionHelper.Decrypt(ContactPersonEncrypted);
            set => ContactPersonEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyVendorIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("SupplyVendorType")]
        public string? VendorTypeEncrypted { get; set; }
        [NotMapped]
        public string? VendorType
        {
            get => string.IsNullOrEmpty(VendorTypeEncrypted) ? null : EncryptionHelper.Decrypt(VendorTypeEncrypted);
            set => VendorTypeEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyVendorContractStart")]
        public DateTime? ContractStart { get; set; }

        [Column("SupplyVendorContractEnd")]
        public DateTime? ContractEnd { get; set; }

        [Column("SupplyVendorProcurementTitle")]
        public string? ProcurementTitleEncrypted { get; set; }
        [NotMapped]
        public string? ProcurementTitle
        {
            get => string.IsNullOrEmpty(ProcurementTitleEncrypted) ? null : EncryptionHelper.Decrypt(ProcurementTitleEncrypted);
            set => ProcurementTitleEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyVendorTerms")]
        public string? TermsEncrypted { get; set; }
        [NotMapped]
        public string? Terms
        {
            get => string.IsNullOrEmpty(TermsEncrypted) ? null : EncryptionHelper.Decrypt(TermsEncrypted);
            set => TermsEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyVendorDeliveryDate")]
        public DateTime? DeliveryDate { get; set; }

        [Column("SupplyVendorDeliveryDueDate")]
        public DateTime? DeliveryDueDate { get; set; }

        [Column("SupplyVendorIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("SupplyVendorCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
