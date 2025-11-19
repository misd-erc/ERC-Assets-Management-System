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
    [Table("tblPPECategories", Schema = "asset")]
    public class TblPPECategory
    {

        #region Constants
        [NotMapped] public const string ICT_EQ= "Information and Communication Technology Equipment";
        [NotMapped] public const string COM_EQ = "Communication Equipment";
        [NotMapped] public const string MV = "Motor Vehicle";
        [NotMapped] public const string OFF_EQ = "Office Equipment";
        [NotMapped] public const string TECSCI_EQ = "Technical and Scientific Equipment";
        [NotMapped] public const string SPO_EQ = "Sports Equipment";
        [NotMapped] public const string FIXFUR_EQ = "Furniture and Fixtures";
        #endregion

        #region Dictionary
        public static readonly TwoWayDictionaryHelper<long, string> Dictionary = new([
            (1, ICT_EQ),
            (2, COM_EQ),
            (3, MV),
            (4, OFF_EQ),
            (5, TECSCI_EQ),
            (6, SPO_EQ),
            (7, FIXFUR_EQ)
        ]);
        #endregion

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        [Column("PPECategoryId")]
        public long Id { get; set; }

        [Column("PPECategoryName")]
        public string? Name { get; set; }

        [Column("PPECategoryIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("PPECategoryIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("PPECategoryCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


    }
}
