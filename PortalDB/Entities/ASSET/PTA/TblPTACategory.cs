using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PortalCommon.Utilities;

namespace PortalDB.Entities.ASSET.PTA
{
    [Table("tblPTACategories", Schema = "asset")]
    public class TblPTACategory
    {

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("PTACategoryId")]
        public long Id { get; set; }

        [Column("PTACategoryName")]
        public string? Name { get; set; }

        [Column("PTACategoryIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("PTACategoryIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("PTACategoryCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


    }
}
