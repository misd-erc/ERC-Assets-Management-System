using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PortalCommon.Utilities;

namespace PortalDB.Entities.ASSET.PPE
{
    [Table("tblPPELegends", Schema = "asset")]
    public class TblPPELegend
    {

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("PPELegendId")]
        public long Id { get; set; }

        [Column("PPELegendName")]
        public string? Name { get; set; }

        [Column("PPELegendIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("PPELegendIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("PPELegendCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


    }
}
