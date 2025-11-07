using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Entities.DBO.Module
{
    [Table("tblSystemModules", Schema = "dbo")]
    public class TblSystemModule
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        [Column("SystemModuleId")]
        public long Id { get; set; }

        [Column("SystemModuleName")]
        public string? Name { get; set; } = string.Empty;

        [Column("SystemModuleAcronym")]
        public string? Acronym { get; set; } = string.Empty;

        [Column("SystemModuleIsActive")]
        public bool IsActive { get; set; } = false;

        [Column("SystemModuleIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("SystemModuleCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    }
}
