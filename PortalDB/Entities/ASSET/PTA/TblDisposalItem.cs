using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.ASSET.PTA
{
    [Table("tblDisposalItems", Schema = "asset")]
    public class TblDisposalItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("DisposalItemId")]
        public long Id { get; set; }

        [Column("DisposalId")]
        public long? DisposalId { get; set; }

        [Column("PTAId")]
        public long? PTAId { get; set; }

        [Column("DisposalItemIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("DisposalItemIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("DisposalItemCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
