using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
using PortalTools.Utilities;

namespace PortalDB.Entities.Account
{
    [Table("SystemUsers")]
    public class SystemUser
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SystemUserId")]
        public long Id { get; set; }

        [Column("MicrosoftEntraId")]
        public byte[]? EntraIdEncrypted { get; set; }

        [NotMapped]
        public long EntraId
        {
            get => EntraIdEncrypted == null || EntraIdEncrypted.Length == 0 ? 0 : long.Parse(EncryptionHelper.Decrypt(Encoding.UTF8.GetString(EntraIdEncrypted)));
            set => EntraIdEncrypted = Encoding.UTF8.GetBytes(EncryptionHelper.Encrypt(value.ToString()));
        }


        [MaxLength(50)]
        [Column("SystemUserFirstName")]
        public byte[]? FirstNameEncrypted { get; set; }
        [NotMapped]
        public string? FirstName
        {
            get => FirstNameEncrypted == null || FirstNameEncrypted.Length == 0? null : EncryptionHelper.Decrypt(Encoding.UTF8.GetString(FirstNameEncrypted));
            set => FirstNameEncrypted = string.IsNullOrEmpty(value) ? null : Encoding.UTF8.GetBytes(EncryptionHelper.Encrypt(value));
        }

        [MaxLength(50)]
        [Column("SystemUserLastName")]
        public byte[]? LastNameEncrypted { get; set; }
        [NotMapped]
        public string? LastName
        {
            get => LastNameEncrypted == null || LastNameEncrypted.Length == 0 ? null : EncryptionHelper.Decrypt(Encoding.UTF8.GetString(LastNameEncrypted));
            set => LastNameEncrypted = string.IsNullOrEmpty(value) ? null : Encoding.UTF8.GetBytes(EncryptionHelper.Encrypt(value));
        }

        [MaxLength(150)]
        [Column("SystemUserEmail")]
        public byte[]? EmailEncrypted { get; set; }
        [NotMapped]
        public string? Email
        {
            get => EmailEncrypted == null || EmailEncrypted.Length == 0 ? null : EncryptionHelper.Decrypt(Encoding.UTF8.GetString(EmailEncrypted));
            set => EmailEncrypted = string.IsNullOrEmpty(value) ? null : Encoding.UTF8.GetBytes(EncryptionHelper.Encrypt(value));
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
    }
}
