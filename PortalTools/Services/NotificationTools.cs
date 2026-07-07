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
        public static async Task<TblSystemNotification> CreateNotificationAsync(
            PortalDbContext context,
            string title,
            string description,
            long recipientSystemUserId,
            long actionBySystemUserId,
            long? moduleId = null,
            string? actionType = null,
            long? entityId = null,
            string? entityLabel = null)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            var notification = new TblSystemNotification
            {
                Title = title,
                Description = description,
                SystemUserId = recipientSystemUserId,
                CreatedBySystemUserId = actionBySystemUserId,
                ModuleId = moduleId,
                ActionType = actionType,
                EntityId = entityId,
                EntityLabel = entityLabel,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            await context.TblSystemNotifications.AddAsync(notification);
            await context.SaveChangesAsync();

            AuditTrailTool.TrackChanges(
                context,
                null!,
                notification,
                nameof(TblSystemNotification),
                actionBySystemUserId,
                "Insert"
            );

            await context.SaveChangesAsync();
            return notification;
        }

        public static async Task<List<TblSystemNotification>> CreateBatchNotificationsAsync(
            PortalDbContext context,
            string title,
            string description,
            IEnumerable<long> recipientSystemUserIds,
            long actionBySystemUserId,
            long? moduleId = null,
            string? actionType = null,
            long? entityId = null,
            string? entityLabel = null)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            if (recipientSystemUserIds == null) throw new ArgumentNullException(nameof(recipientSystemUserIds));

            var userIds = recipientSystemUserIds.Distinct().ToList();
            if (!userIds.Any()) return new List<TblSystemNotification>();

            var notifications = userIds.Select(userId => new TblSystemNotification
            {
                Title = title,
                Description = description,
                SystemUserId = userId,
                CreatedBySystemUserId = actionBySystemUserId,
                ModuleId = moduleId,
                ActionType = actionType,
                EntityId = entityId,
                EntityLabel = entityLabel,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            }).ToList();

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
            return notifications;
        }

        public static async Task<List<long>> GetUserIdsWithModuleAccessAsync(
            PortalDbContext context,
            long moduleId)
        {
            var roleIds = await context.TblSystemRoleScopes
                .AsNoTracking()
                .Where(x => !x.IsDeleted && x.IsActive && x.ModuleId == moduleId)
                .Select(x => x.RoleId)
                .Distinct()
                .ToListAsync();

            return await context.TblSystemUsers
                .AsNoTracking()
                .Where(x => !x.IsDeleted && x.IsActive && roleIds.Contains(x.SystemRoleId))
                .Select(x => x.Id)
                .ToListAsync();
        }
    }
}
