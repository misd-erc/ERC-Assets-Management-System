using PortalDB.Entities.DBO.Office;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PortalCommon.Utilities;

namespace PortalDB.Entities.DBO.Account
{
    [Table("tblOneTimePasswords", Schema = "dbo")]
    public class TblOneTimePassword
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("OneTimePasswordId")]
        public long Id { get; set; }

        [Column("SystemUserId")]
        public long SystemUserId { get; set; }
        [ForeignKey(nameof(SystemUserId))]
        [System.Text.Json.Serialization.JsonIgnore]
        public virtual TblSystemUser SystemUser { get; set; } = null!;

        [Column("OneTimePasswordOTP")]
        public string? OTPEncrypted { get; set; }
        [NotMapped]
        public long? OTP
        {
            get => long.TryParse(OTPEncrypted is null ? null : EncryptionHelper.Decrypt(OTPEncrypted), out var val) ? val : null;
            set => OTPEncrypted = value.HasValue ? EncryptionHelper.Encrypt(value.Value.ToString()) : null;
        }

        [Column("OneTimePasswordValidUntil")]
        public DateTime? ValidUntil { get; set; }

        [Column("OneTimePasswordIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("OneTimePasswordCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
