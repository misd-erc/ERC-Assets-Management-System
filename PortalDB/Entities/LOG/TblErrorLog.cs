using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Entities.LOG
{
    [Table("tblErrorLogs", Schema = "log")]
    public class TblErrorLog
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("ErrorLogId")]
        public int Id { get; set; }

        [MaxLength(30)]
        [Column("ErrorLogFile")]
        public string? File { get; set; }

        [MaxLength(30)]
        [Column("ErrorLogLine")]
        public string? Line { get; set; }

        [Column("ErrorLogDescription")]
        public string? Description { get; set; }

        [Column("ErrorLogCreatedAt")]
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    }
}
