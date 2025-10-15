using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Entities.DBO.Account
{
    [Table("tblSystemRoles", Schema = "dbo")]
    public class TblSystemRole
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SystemRoleId")]
        public long Id { get; set; }

        [Column("SystemRoleName")]
        public string? RoleName { get; set; }

        [Column("SystemRoleDescription")]
        public string? Description { get; set; }

        [Column("SystemRoleIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("SystemRoleCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    }
}
