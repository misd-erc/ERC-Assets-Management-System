using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.ASSET.PTA
{
    [Table("tblPTACategoryModules", Schema = "asset")]
    public class TblPTACategoryModule
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("PTACategoryModuleId")]
        public long Id { get; set; }

        [Column("PTACategoryId")]
        public long CategoryId { get; set; }

        [Column("SystemModuleId")]
        public long ModuleId { get; set; }

        [Column("PTACategoryModuleIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("PTACategoryModuleIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("PTACategoryModuleCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
