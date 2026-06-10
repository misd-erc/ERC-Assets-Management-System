using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.ASSET.Report
{
    [Table("tblReportSerials", Schema = "asset")]
    public class TblReportSerial
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("ReportSerialId")]
        public long Id { get; set; }

        [Column("ReportSerialName")]
        public string ReportName { get; set; } = string.Empty;

        [Column("ReportSerialNumber")]
        public string SerialNumber { get; set; } = string.Empty;

        [Column("ReportSerialMonth")]
        public int Month { get; set; }

        [Column("ReportSerialYear")]
        public int Year { get; set; }

        [Column("ReportSerialSeries")]
        public int Series { get; set; }

        [Column("ReportSerialCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
