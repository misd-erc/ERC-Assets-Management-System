using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.Office.Division
{
    [Table("tblDivisions", Schema = "dbo")]
    public class TblDivision
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
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
