using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Notification;
using PortalDB.Services;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PortalTools.Services.GetEditTools.DBO.Notification
{
    public class NotificationGetTools
    {
        public IQueryable<TblSystemNotification> GetTblSystemNotifications(PortalDbContext context) => context.TblSystemNotifications.AsNoTracking().Where(x => !x.IsDeleted);
        public async Task<TblSystemNotification?> GetTblSystemNotificationAsync(long id, PortalDbContext context) => await context.TblSystemNotifications.AsNoTracking().Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblSystemNotification> GetTblSystemNotificationsBySystemUserId(long systemUserId, PortalDbContext context) => context.TblSystemNotifications.AsNoTracking().Where(x => !x.IsDeleted && x.SystemUserId == systemUserId);
        public IQueryable<TblSystemNotification> GetTblSystemNotificationsByCreatedBySystemUserId(long createdBySystemUserId, PortalDbContext context) => context.TblSystemNotifications.AsNoTracking().Where(x => !x.IsDeleted && x.CreatedBySystemUserId == createdBySystemUserId);

        public async Task<List<TblSystemNotification>> GetNotificationsForUserAsync(long systemUserId, PortalDbContext context)
        {
            var user = await context.TblSystemUsers
                .AsNoTracking()
                .Where(x => !x.IsDeleted && x.Id == systemUserId)
                .FirstOrDefaultAsync();

            if (user == null) return new List<TblSystemNotification>();

            var accessibleModuleIds = new List<long>();
            if (user.SystemRoleId != null)
            {
                accessibleModuleIds = await context.TblSystemRoleScopes
                    .AsNoTracking()
                    .Where(x => !x.IsDeleted && x.IsActive && x.RoleId == user.SystemRoleId && x.ModuleId.HasValue)
                    .Select(x => x.ModuleId!.Value)
                    .ToListAsync();
            }

            return await context.TblSystemNotifications
                .AsNoTracking()
                .Where(x => !x.IsDeleted &&
                    (
                        (x.SystemUserId == systemUserId) ||
                        (x.ModuleId.HasValue && accessibleModuleIds.Contains(x.ModuleId.Value) && x.SystemUserId == null)
                    ))
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<int> GetUnreadCountForUserAsync(long systemUserId, PortalDbContext context)
        {
            var notifications = await GetNotificationsForUserAsync(systemUserId, context);
            var notificationIds = notifications.Select(n => n.Id).ToList();

            var readNotificationIds = await context.TblSystemNotificationReads
                .AsNoTracking()
                .Where(x => !x.IsDeleted && x.SystemUserId == systemUserId && notificationIds.Contains(x.NotificationId ?? 0))
                .Select(x => x.NotificationId)
                .ToListAsync();

            return notificationIds.Count(id => !readNotificationIds.Contains(id));
        }
    }
}
