using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PortalCommon.Utilities;

namespace PortalDB.Entities.ASSET.SE
{
    [Table("tblSEParts", Schema = "asset")]
    public class TblSEPart
    {

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SEPartId")]
        public long Id { get; set; }

        [Column("SEId")]
        public long SEId { get; set; }

        [Column("SEPartName")]
        public string? NameEncrypted { get; set; }
        [NotMapped]
        public string? Name
        {
            get => string.IsNullOrEmpty(NameEncrypted) ? null : EncryptionHelper.Decrypt(NameEncrypted);
            set => NameEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SEPartSerialNumber")]
        public string? SerialNumberEncrypted { get; set; }
        [NotMapped]
        public string? SerialNumber
        {
            get => string.IsNullOrEmpty(SerialNumberEncrypted) ? null : EncryptionHelper.Decrypt(SerialNumberEncrypted);
            set => SerialNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SEPartIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("SEPartIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("SEPartCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


    }
}
