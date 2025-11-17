using Microsoft.IdentityModel.Tokens;
using PortalDB.Entities.LOG.AuditTrail;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalCommon.Utilities;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Entities.DBO.Account
{
    [Table("tblEmployees", Schema = "dbo")]
    public class TblEmployee
    {

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("EmployeeId")]
        public long Id { get; set; }

        [Column("SystemUserId")]
        public long? SystemUserIdd { get; set; }

        [Column("EmployeeFirstName")]
        public string? FirstNameEncrypted { get; set; }
        [NotMapped]
        public string? FirstName
        {
            get => string.IsNullOrEmpty(FirstNameEncrypted) ? null : EncryptionHelper.Decrypt(FirstNameEncrypted);
            set => FirstNameEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("EmployeeLastName")]
        public string? LastNameEncrypted { get; set; }
        [NotMapped]
        public string? LastName
        {
            get => string.IsNullOrEmpty(LastNameEncrypted) ? null : EncryptionHelper.Decrypt(LastNameEncrypted);
            set => LastNameEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("EmployeeIdOriginal")]
        public string? EmployeeIdOriginalEncrypted { get; set; }
        [NotMapped]
        public string? EmployeeIdOriginal
        {
            get => string.IsNullOrEmpty(EmployeeIdOriginalEncrypted) ? null : EncryptionHelper.Decrypt(EmployeeIdOriginalEncrypted);
            set => EmployeeIdOriginalEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("OfficeId")]
        public long? OfficeId { get; set; }

        [Column("DivisionId")]
        public long? DivisionId { get; set; }

        [Column("EmploymentTypeId")]
        public long? EmploymentTypeId { get; set; }

        [Column("PositionId")]
        public long? PositionId { get; set; }

        [Column("EmployeeIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("EmployeeIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("EmployeeCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

}
