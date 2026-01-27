using PortalCommon.Utilities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Entities.ASSET.Supply
{   
    [Table("tblSupplyCategories", Schema = "asset")]
    public class TblSupplyCategory
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SupplyCategoryId")]
        public long Id { get; set; }

        [Column("SupplyCategoryName")]
        public string? Name { get; set; }

        [Column("SupplyCategoryIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("SupplyCategoryIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("SupplyCategoryCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
