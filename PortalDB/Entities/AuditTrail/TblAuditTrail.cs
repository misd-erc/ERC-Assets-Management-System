using PortalDB.Entities.Account;
using PortalDB.Entities.Office;
using PortalTools.Utilities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Entities.AuditTrail
{
    [Table("tblAuditTrails", Schema = "dbo")]
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
        [ForeignKey(nameof(ChangedBy))]
        public virtual TblSystemUser SystemUser { get; set; } = null!;

        [MaxLength(20)]
        [Column("AuditTrailChangedAt")]
        public DateTime? ChangedAt { get; set; } = DateTime.UtcNow;
    }
}
