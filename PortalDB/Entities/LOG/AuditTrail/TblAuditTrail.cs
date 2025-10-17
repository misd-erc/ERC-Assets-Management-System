using PortalDB.Entities.DBO.Account;
using PortalTools.Utilities;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.LOG.AuditTrail
{
    [Table("tblAuditTrails", Schema = "log")]
    public class TblAuditTrail
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("AuditTrailId")]
        public int Id { get; set; }

        [Column("AuditTrailTableName")]
        public string? TableName { get; set; }

        [Column("AuditTrailRecordId")]
        public long? RecordId { get; set; }

        [MaxLength(10)]
        [Column("AuditTrailAction")]
        public string? Action { get; set; }

        [Column("AuditTrailChanges")]
        public byte[]? ChangesEncrypted { get; set; }
        [NotMapped]
        public string? Changes
        {
            get => ChangesEncrypted == null || ChangesEncrypted.Length == 0 ? null : EncryptionHelper.DecryptFromBytes(ChangesEncrypted);
            set => ChangesEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.EncryptToBytes(value);
        }

        [Column("AuditTrailChangedBySystemUserId")]
        public long? ChangedBy { get; set; }
        //Temporarily removed due to issue when inserting new data/handled by the system
        //[ForeignKey(nameof(ChangedBy))]
        //public virtual TblSystemUser SystemUser { get; set; } = null!;

        [Column("AuditTrailChangedAt")]
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    }
}
