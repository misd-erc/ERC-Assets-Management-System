using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Entities.DBO.Office
{
    [Table("tblEmploymentTypes", Schema = "dbo")]
    public class TblEmploymentType
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("EmploymentTypeId")]
        public long Id { get; set; }

        [MaxLength(100)]
        [Column("EmploymentTypeName")]
        public string? Name { get; set; }

        [Column("EmploymentTypeIsActive")]
        public bool? IsActive { get; set; } = true;

        [Column("EmploymentTypeIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("EmploymentTypeCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
