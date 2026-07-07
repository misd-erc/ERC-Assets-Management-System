using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Entities.DBO.Notification
{
    [Table("tblSystemNotifications", Schema = "dbo")]
    public class TblSystemNotification
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SystemNotificationId")]
        public long Id { get; set; }

        [Column("SystemNotificationTitle")]
        public string? Title { get; set; } = string.Empty;

        [Column("SystemNotificationDescription")]
        public string? Description { get; set; } = string.Empty;

        [Column("SystemNotificationForSystemUserId")]
        public long? SystemUserId { get; set; }

        [Column("SystemNotificationBySystemUserId")]
        public long? CreatedBySystemUserId { get; set; }

        [Column("SystemNotificationModuleId")]
        public long? ModuleId { get; set; }

        // Lets the frontend deep-link a click: ActionType picks the destination (e.g. "IAR_SUBMITTED"),
        // EntityId is the referenced record's id, EntityLabel is a short display hint (e.g. "Supply, PPE").
        [Column("SystemNotificationActionType")]
        public string? ActionType { get; set; }

        [Column("SystemNotificationEntityId")]
        public long? EntityId { get; set; }

        [Column("SystemNotificationEntityLabel")]
        public string? EntityLabel { get; set; }

        [Column("SystemNotificationIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("SystemNotificationCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
