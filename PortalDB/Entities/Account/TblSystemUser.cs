using Microsoft.IdentityModel.Tokens;
using PortalDB.Entities.AuditTrail;
using PortalDB.Entities.Office;
using PortalDB.Entities.Office.Division;
using PortalTools.Utilities;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Entities.Account
{
    [Table("tblSystemUsers", Schema = "dbo")]
    public class TblSystemUser
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SystemUserId")]
        public long Id { get; set; }

        [Column("MicrosoftEntraId")]
        public string? EntraIdEncrypted { get; set; }
        [NotMapped]
        public long? EntraId
        {
            get => long.TryParse(EntraIdEncrypted is null ? null : EncryptionHelper.Decrypt(EntraIdEncrypted), out var val) ? val : null;
            set => EntraIdEncrypted = value.HasValue ? EncryptionHelper.Encrypt(value.Value.ToString()) : null;
        }

        [Column("SystemUserFirstName")]
        public string? FirstNameEncrypted { get; set; }
        [NotMapped]
        public string? FirstName
        {
            get => string.IsNullOrEmpty(FirstNameEncrypted) ? null : EncryptionHelper.Decrypt(FirstNameEncrypted);
            set => FirstNameEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SystemUserLastName")]
        public string? LastNameEncrypted { get; set; }
        [NotMapped]
        public string? LastName
        {
            get => string.IsNullOrEmpty(LastNameEncrypted) ? null : EncryptionHelper.Decrypt(LastNameEncrypted);
            set => LastNameEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SystemUserEmail")]
        public string? EmailEncrypted { get; set; }
        [NotMapped]
        public string? Email
        {
            get => string.IsNullOrEmpty(EmailEncrypted) ? null : EncryptionHelper.Decrypt(EmailEncrypted);
            set => EmailEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [MaxLength(1)]
        [Column("SystemUserIsActive")]
        public bool IsActive { get; set; } = true;

        [MaxLength(20)]
        [Column("SystemUserCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(20)]
        [Column("SystemUserLastLoginAt")]
        public DateTime? LastLoginAt { get; set; }

        #region Foreign Key Collection
        public virtual ICollection<TblAuditTrail> AuditTrail { get; set; } = new List<TblAuditTrail>();
        #endregion

    }
}
