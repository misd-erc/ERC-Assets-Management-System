using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Notification;
using PortalDB.Services;
using System;
using System.Threading.Tasks;

namespace PortalTools.Services
{
    public static class NotificationTools
    {
        /// <summary>
        /// Creates and saves a new system notification for a single user.
        /// Automatically logs an audit trail.
        /// </summary>
        public static async Task<long> CreateNotificationAsync(
            DbContextOptions<PortalDbContext> options,
            string title,
            string description,
            long recipientSystemUserId,
            long actionBySystemUserId)
        {
            await using var context = new PortalDbContext(options);

            var notification = new TblSystemNotification
            {
                Title = title,
                Description = description,
                SystemUserId = recipientSystemUserId,
                CreatedBySystemUserId = actionBySystemUserId,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            await context.TblSystemNotifications.AddAsync(notification);
            await context.SaveChangesAsync();

            // Log AuditTrail
            AuditTrailTool.TrackChanges(
                context,
                null!,
                notification,
                nameof(TblSystemNotification),
                actionBySystemUserId,
                "Insert"
            );

            // Save audit entry
            await context.SaveChangesAsync();

            return notification.Id;
        }

        /// <summary>
        /// Sends the same notification to multiple users at once.
        /// Returns the number of created notifications.
        /// </summary>
        public static async Task<int> CreateBatchNotificationsAsync(
            DbContextOptions<PortalDbContext> options,
            string title,
            string description,
            IEnumerable<long> recipientSystemUserIds,
            long actionBySystemUserId)
        {
            await using var context = new PortalDbContext(options);

            var notifications = new List<TblSystemNotification>();

            foreach (var userId in recipientSystemUserIds)
            {
                var notification = new TblSystemNotification
                {
                    Title = title,
                    Description = description,
                    SystemUserId = userId,
                    CreatedBySystemUserId = actionBySystemUserId,
                    CreatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };
                notifications.Add(notification);
            }

            await context.TblSystemNotifications.AddRangeAsync(notifications);
            await context.SaveChangesAsync();

            foreach (var notif in notifications)
            {
                AuditTrailTool.TrackChanges(
                    context,
                    null!,
                    notif,
                    nameof(TblSystemNotification),
                    actionBySystemUserId,
                    "Insert"
                );
            }

            await context.SaveChangesAsync();

            return notifications.Count;
        }
    }
}
