using Microsoft.IdentityModel.Tokens;
using PortalDB.Entities.LOG.AuditTrail;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalTools.Utilities;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Entities.DBO.Account
{
    [Table("tblSystemUsers", Schema = "dbo")]
    public class TblSystemUser : SystemUserEntity
    {

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SystemUserId")]
        public long Id { get; set; }

        // EntraId is ObjectId in Azure AD
        [Column("MicrosoftEntraId")]
        public string? EntraIdEncrypted { get; set; }
        [NotMapped]
        public long? EntraId
        {
            get => long.TryParse(EntraIdEncrypted is null ? null : EncryptionHelper.Decrypt(EntraIdEncrypted), out var val) ? val : null;
            set => EntraIdEncrypted = value.HasValue ? EncryptionHelper.Encrypt(value.Value.ToString()) : null;
        }

        #region Foreign Key Collection
        //public virtual ICollection<TblAuditTrail> AuditTrail { get; set; } = new List<TblAuditTrail>();
        public virtual ICollection<TblOneTimePassword> OneTimePassword { get; set; } = new List<TblOneTimePassword>();
        public virtual ICollection<TblSessionToken> TblSessionToken { get; set; } = new List<TblSessionToken>();
        #endregion

    }

    public class SystemUserEntity()
    {
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

        [Column("SystemRoleId")]
        public long? SystemRoleId { get; set; }

        [Column("SystemUserStatusId")]
        public long? StatusId { get; set; }

        [Column("OfficeId")]
        public long? OfficeId { get; set; }

        [Column("DivisionId")]
        public long? DivisionId { get; set; }

        [Column("SystemUserIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("SystemUserCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("SystemUserLastLoginAt")]
        public DateTime? LastLoginAt { get; set; }
    }

}
