using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace PortalDB.Entities.ASSET.Supply
{
    [Index(nameof(DeliveryRecordId), IsUnique = true)]
    [Index(nameof(SupplyIARId), nameof(DeliveryRecordId), IsUnique = true)]
    [Table("tblSupplyIARDeliveryRecords", Schema = "asset")]
    public class TblSupplyIARDeliveryRecord
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SupplyIARDeliveryRecordId")]
        public long Id { get; set; }

        [Column("SupplyIARId")]
        public long SupplyIARId { get; set; }

        [Column("DeliveryRecordId")]
        public long DeliveryRecordId { get; set; }

        [Column("SupplyIARDeliveryRecordCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
