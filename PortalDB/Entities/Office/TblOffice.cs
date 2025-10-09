using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Entities.Office
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

        #region Foreign Keys Collection
        public virtual ICollection<Division.TblDivision> Divisions { get; set; } = new List<Division.TblDivision>();
        #endregion
    }
}
