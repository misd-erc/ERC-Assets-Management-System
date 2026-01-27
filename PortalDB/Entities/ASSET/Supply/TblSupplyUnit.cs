using PortalCommon.Utilities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Entities.ASSET.Supply
{   
    [Table("tblSupplyUnits", Schema = "asset")]
    public class TblSupplyUnit
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SupplyUnitId")]
        public long Id { get; set; }

        [Column("SupplyUnitName")]
        public string? Name { get; set; }

        [Column("SupplyUnitIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("SupplyUnitIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("SupplyUnitCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
