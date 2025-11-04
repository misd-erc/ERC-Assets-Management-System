using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Entities.DBO.Notification
{
    [Table("tblSystemNotificationReads", Schema = "dbo")]
    public class TblSystemNotificationRead
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SystemNotificationReadId")]
        public long Id { get; set; }

        [Column("SystemNotificationId")]
        public long? NotificationId { get; set; }

        [Column("SystemNotificationReadBySystemUserId")]
        public long? SystemUserId { get; set; }

        [Column("SystemNotificationReadIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("SystemNotificationReadCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
