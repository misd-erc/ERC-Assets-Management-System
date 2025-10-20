using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Entities.DBO.Office
{
    [Table("tblPositions", Schema = "dbo")]
    public class TblPosition
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("PositionId")]
        public long Id { get; set; }

        [MaxLength(100)]
        [Column("PositionName")]
        public string? PositionName { get; set; }

        [MaxLength(10)]
        [Column("PositionAcronym")]
        public string? PositionAcronym { get; set; }

        [MaxLength(5)]
        [Column("PositionSalaryGrade")]
        public string? SalaryGrade { get; set; }

        [Column("PositionCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
