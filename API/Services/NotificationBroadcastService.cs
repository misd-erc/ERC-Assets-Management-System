using API.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Notification;
using PortalDB.Services;
using PortalTools.Services;

namespace API.Services
{
    public class NotificationBroadcastService
    {
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly DbContextOptions<PortalDbContext> _options;

        public NotificationBroadcastService(
            IHubContext<NotificationHub> hubContext,
            DbContextOptions<PortalDbContext> options)
        {
            _hubContext = hubContext;
            _options = options;
        }

        public async Task NotifyModuleUsersAsync(
            PortalDbContext context,
            string title,
            string description,
            long moduleId,
            long excludeSystemUserId)
        {
            var userIds = await NotificationTools.GetUserIdsWithModuleAccessAsync(context, moduleId);
            userIds = userIds.Where(id => id != excludeSystemUserId).ToList();

            if (!userIds.Any()) return;

            var notifications = await NotificationTools.CreateBatchNotificationsAsync(
                context, title, description, userIds, excludeSystemUserId, moduleId);

            foreach (var notif in notifications)
            {
                if (notif.SystemUserId.HasValue)
                {
                    await _hubContext.Clients.Group($"User_{notif.SystemUserId.Value}")
                        .SendAsync("ReceiveNotification", notif);
                }
            }
        }

        public async Task NotifyUserAsync(
            PortalDbContext context,
            string title,
            string description,
            long recipientSystemUserId,
            long actionBySystemUserId,
            long moduleId)
        {
            if (recipientSystemUserId == actionBySystemUserId) return;

            var notification = await NotificationTools.CreateNotificationAsync(
                context, title, description, recipientSystemUserId, actionBySystemUserId, moduleId);

            await _hubContext.Clients.Group($"User_{recipientSystemUserId}")
                .SendAsync("ReceiveNotification", notification);
        }
    }
}
