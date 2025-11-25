using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PortalCommon.Utilities;

namespace PortalDB.Entities.ASSET.SE
{
    [Table("tblSECategories", Schema = "asset")]
    public class TblSECategory
    {

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SECategoryId")]
        public long Id { get; set; }

        [Column("SECategoryName")]
        public string? Name { get; set; }

        [Column("SECategoryIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("SECategoryIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("SECategoryCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


    }
}
