using PortalDB.Entities.DBO.Office;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.DBO.Office.Division
{
    [Table("tblDivisions", Schema = "dbo")]
    public class TblDivision : DivisionEntity
    {

        #region Constants
        [NotMapped] public const string OCC_ADMIN = "Office of the Chairperson and CEO-Admin";
        [NotMapped] public const string OCC_LTECH = "Office of the Chairperson and CEO-Legal and Technical";
        [NotMapped] public const string OCMRLF = "Office of Commissioner Marko Romeo L. Fuentes";
        [NotMapped] public const string OCAAL = "Office of Commissioner Amante A. Liberato";
        [NotMapped] public const string OCPGR = "Office of Commissioner Paris G. Real";
        [NotMapped] public const string OCFGBD = "Office of Commissioner Floresinda G. Baldo-Digal";
        [NotMapped] public const string IAD = "Internal Audit Division";
        [NotMapped] public const string SECRETARIAT = "Secretariat";
        [NotMapped] public const string CRD = "Central Records Division";
        [NotMapped] public const string OD = "Office of the Director";
        [NotMapped] public const string LDRC = "Legal Division for Rates Cases";
        [NotMapped] public const string LDCC = "Legal Division for Compliance Cases";
        [NotMapped] public const string LDNRC = "Legal Division for Non-Rates Cases";
        [NotMapped] public const string IDMD = "Information and Data Management Division";
        [NotMapped] public const string MISD = "Management Information System Division";
        [NotMapped] public const string PD = "Planning Division";
        [NotMapped] public const string PID = "Public Information Division";
        [NotMapped] public const string TRD = "Tariffs and Rates Division";
        [NotMapped] public const string SD = "Standards Division";
        [NotMapped] public const string IED_DUs = "Investigation and Enforcement Division for Distribution Utilities";
        [NotMapped] public const string IED_TRANSMISSION = "Investigation and Enforcement Division for Transmission";
        [NotMapped] public const string IED_ADJU = "Investigation and Enforcement Division for Adjudication";
        [NotMapped] public const string OU_GROUP = "Over/Under Group";
        [NotMapped] public const string CMD = "Contestable Market Division";
        [NotMapped] public const string LMMD = "Licensing and Market Monitoring Division";
        [NotMapped] public const string RED = "Renewable Energy Division";
        [NotMapped] public const string SMD = "Spot Market Division";
        [NotMapped] public const string IEGSD = "Investigation and Enforcement GenCo and Supply Division";
        [NotMapped] public const string GCSMD = "Generation Company Standards and Monitoring Division";
        [NotMapped] public const string RMD = "Retail Market Division";
        [NotMapped] public const string CSD = "Consumer Service Division";
        [NotMapped] public const string MD = "Meter Division";
        [NotMapped] public const string VAOD = "Visayas Area Operations Division";
        [NotMapped] public const string MAOD = "Mindanao Area Operations Division";
        [NotMapped] public const string AD = "Accounting Division";
        [NotMapped] public const string BD = "Budget Division";
        [NotMapped] public const string GSD = "General Services Division";
        [NotMapped] public const string HRMD = "Human Resources Management Division";
        [NotMapped] public const string PMS = "Procurement Management Section";
        [NotMapped] public const string COA = "Commission on Audit";
        #endregion

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("DivisionId")]
        public long Id { get; set; }

    }

    public class DivisionEntity()
    {
        [Column("OfficeId")]
        public long OfficeId { get; set; }

        [MaxLength(100)]
        [Column("DivisionName")]
        public string? Name { get; set; }

        [MaxLength(15)]
        [Column("DivisionAcronym")]
        public string? Acronym { get; set; }

        [Column("DivisionIsActive")]
        public bool? IsActive { get; set; } = true;

        [Column("DivisionIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("DivisionCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
