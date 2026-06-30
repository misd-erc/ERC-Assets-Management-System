using System.ComponentModel.DataAnnotations;

namespace PortalDB.Models.QueryParams.Notification
{
    public class MarkNotificationReadParams
    {
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
        [Required] public long NotificationId { get; set; }
    }

    public class SendNotificationParams
    {
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
        [Required] public string Title { get; set; } = string.Empty;
        [Required] public string Description { get; set; } = string.Empty;
        public long? RecipientSystemUserId { get; set; }
        public long? ModuleId { get; set; }
    }
}
