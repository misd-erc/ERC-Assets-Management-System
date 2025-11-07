using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Entities.DBO.Account
{
    [Table("tblSystemRoleScopes", Schema = "dbo")]
    public class TblSystemRoleScope
    {

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SystemRoleScopeId")]
        public long Id { get; set; }

        [Column("SystemRoleId")]
        public long? RoleId { get; set; }

        [Column("SystemModuleId")]
        public long? ModuleId { get; set; }

        [Column("SystemRoleScopeIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("SystemRoleScopeIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("SystemRoleScopeCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;



    }
}
