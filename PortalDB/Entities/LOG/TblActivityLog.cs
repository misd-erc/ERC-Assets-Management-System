using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Entities.LOG
{
    [Table("tblActivityLogs", Schema = "log")]
    public class TblActivityLog
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("ActivityLogId")]
        public int Id { get; set; }

        [Column("ActivityLogSpecificAction")]
        public string? Action { get; set; }

        [Column("ActivityLogConnectedAuditTrailId")]
        public long? AuditTrailId { get; set; }

        [Column("ActivityLogActionBy")]
        public long? ActionBy { get; set; }

        [Column("ActivityLogCreatedAt")]
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    }
}
