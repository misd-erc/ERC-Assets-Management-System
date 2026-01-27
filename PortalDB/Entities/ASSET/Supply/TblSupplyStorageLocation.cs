using PortalCommon.Utilities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Entities.ASSET.Supply
{   
    [Table("tblSupplyStorageLocations", Schema = "asset")]
    public class TblSupplyStorageLocation
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SupplyStorageLocationId")]
        public long Id { get; set; }

        [Column("SupplyStorageLocationName")]
        public string? Name { get; set; }

        [Column("SupplyStorageLocationIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("SupplyStorageLocationIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("SupplyStorageLocationCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
