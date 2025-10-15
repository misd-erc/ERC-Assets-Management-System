using PortalDB.Entities.DBO.Office;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.DBO.Office.Division
{
    [Table("tblDivisions", Schema = "dbo")]
    public class TblDivision
    {

        #region Constants
        [NotMapped] public const string CRD = "Central Records Division";
        [NotMapped] public const string AD = "Accounting Division";
        [NotMapped] public const string BD = "Budget Division";
        [NotMapped] public const string GSD = "General Services Division";
        [NotMapped] public const string HRMD = "Human Resources Management Division";

        [NotMapped] public const string LDCC = "Legal Division for Compliance Cases";
        [NotMapped] public const string LDNRC = "Legal Division for Non-Rates Cases";
        [NotMapped] public const string LDRC = "Legal Division for Rates Cases";

        [NotMapped] public const string IDMD = "Information and Data Management Division";
        [NotMapped] public const string MISD = "Management Information System Division";
        [NotMapped] public const string PD = "Planning Division";
        [NotMapped] public const string PID = "Public Information Division";

        [NotMapped] public const string CMD = "Contestable Market Division";
        [NotMapped] public const string LMMD = "Licensing and Market Monitoring Division";
        [NotMapped] public const string RED = "Renewable Energy Division";
        [NotMapped] public const string SMD = "Spot Market Division";

        [NotMapped] public const string CSD = "Consumer Service Division";
        [NotMapped] public const string MD = "Meter Division";
        [NotMapped] public const string MAOD = "Mindanao Area Operations Division";
        [NotMapped] public const string VAOD = "Visayas Area Operations Division";
        #endregion

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        [Column("DivisionId")]
        public long Id { get; set; }

        [Column("OfficeId")]
        public long OfficeId { get; set; }
        [ForeignKey(nameof(OfficeId))]
        public virtual TblOffice Office { get; set; } = null!;

        [MaxLength(50)]
        [Column("DivisionName")]
        public string? Name { get; set; }

        [MaxLength(15)]
        [Column("DivisionAcronym")]
        public string? Acronym { get; set; }
    }
}
