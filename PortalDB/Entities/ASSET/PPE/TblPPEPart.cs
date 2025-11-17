using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PortalCommon.Utilities;

namespace PortalDB.Entities.ASSET.PPE
{
    [Table("tblPPEParts", Schema = "asset")]
    public class TblPPEPart
    {

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        [Column("PPEPartId")]
        public long Id { get; set; }

        [Column("PPEId")]
        public long PPEId { get; set; }

        [Column("PPEPartName")]
        public string? NameEncrypted { get; set; }
        [NotMapped]
        public string? Name
        {
            get => string.IsNullOrEmpty(NameEncrypted) ? null : EncryptionHelper.Decrypt(NameEncrypted);
            set => NameEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PPEPartSerialNumber")]
        public string? SerialNumberEncrypted { get; set; }
        [NotMapped]
        public string? SerialNumber
        {
            get => string.IsNullOrEmpty(SerialNumberEncrypted) ? null : EncryptionHelper.Decrypt(SerialNumberEncrypted);
            set => SerialNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PPEPartIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("PPEPartIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("PPEPartCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


    }
}
