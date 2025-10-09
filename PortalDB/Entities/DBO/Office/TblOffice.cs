using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PortalDB.Entities.DBO.Office.Division;

namespace PortalDB.Entities.DBO.Office
{
    [Table("tblOffices", Schema = "dbo")]
    public class TblOffice
    {
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

        #region Foreign Key Collection
        public virtual ICollection<TblDivision> Divisions { get; set; } = new List<TblDivision>();
        #endregion

    }
}
