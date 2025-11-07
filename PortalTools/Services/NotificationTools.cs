using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Notification;
using PortalDB.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PortalTools.Services
{
    public static class NotificationTools
    {
        /// <summary>
        /// Creates a single system notification using the provided DbContext.
        /// Logs audit trail and returns the new notification ID.
        /// </summary>
        public static async Task<long> CreateNotificationAsync(
            PortalDbContext context,
            string title,
            string description,
            long recipientSystemUserId,
            long actionBySystemUserId)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

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
            await context.SaveChangesAsync(); // Save notification first

            // Log audit (after SaveChanges so Id is populated)
            AuditTrailTool.TrackChanges(
                context,
                null!,
                notification,
                nameof(TblSystemNotification),
                actionBySystemUserId,
                "Insert"
            );

            await context.SaveChangesAsync(); // Save audit
            return notification.Id;
        }

        /// <summary>
        /// Creates multiple notifications in a single batch using the same DbContext.
        /// Returns the number of notifications created.
        /// </summary>
        public static async Task<int> CreateBatchNotificationsAsync(
            PortalDbContext context,
            string title,
            string description,
            IEnumerable<long> recipientSystemUserIds,
            long actionBySystemUserId)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            if (recipientSystemUserIds == null) throw new ArgumentNullException(nameof(recipientSystemUserIds));

            var userIds = recipientSystemUserIds.Distinct().ToList();
            if (!userIds.Any()) return 0;

            var notifications = userIds.Select(userId => new TblSystemNotification
            {
                Title = title,
                Description = description,
                SystemUserId = userId,
                CreatedBySystemUserId = actionBySystemUserId,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            }).ToList();

            await context.TblSystemNotifications.AddRangeAsync(notifications);
            await context.SaveChangesAsync(); // One DB round-trip for all inserts

            // Batch audit logging
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

            await context.SaveChangesAsync(); // One round-trip for all audit entries
            return notifications.Count;
        }
    }
}