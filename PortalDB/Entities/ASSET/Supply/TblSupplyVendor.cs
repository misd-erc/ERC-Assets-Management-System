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

        [Column("SupplyVendorIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("SupplyVendorIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("SupplyVendorCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
