using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PortalDB.Entities.DBO.Office.Division;

namespace PortalDB.Entities.DBO.Office
{

    [Table("tblOffices", Schema = "dbo")]
    public class TblOffice
    {

        #region Constants
        [NotMapped] public const string OCCM = "Office of the CEO and Commissioner Members";
        [NotMapped] public const string OED = "Office of the Executive Director";
        [NotMapped] public const string OGCS = "Office of the General Counsel and Secretariat";
        [NotMapped] public const string BAC = "Bids and Awards Committee";
        [NotMapped] public const string LS = "Legal Service";
        [NotMapped] public const string ROS = "Regulatory Operations Service";
        [NotMapped] public const string MOS = "Market Operations Service";
        [NotMapped] public const string CRD = "Central Records Division";
        [NotMapped] public const string COA = "Commission on Audit";
        [NotMapped] public const string CAS = "Consumer Affairs Service";
        [NotMapped] public const string FAS = "Financial Administrative Service";
        [NotMapped] public const string PPIS = "Planning and Public Information Service";
        #endregion

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("OfficeId")]
        public long Id { get; set; }

        [MaxLength(50)]
        [Column("OfficeName")]
        public string? Name { get; set; }

        [MaxLength(15)]
        [Column("OfficeAcronym")]
        public string? Acronym { get; set; }

        [Column("OfficeIsActive")]
        public bool? IsActive { get; set; } = true;

        [Column("OfficeIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("OfficeCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    }
}
