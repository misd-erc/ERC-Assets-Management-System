using Microsoft.EntityFrameworkCore;
using PortalCommon.Constants;
using PortalDB.Entities.DBO.Notification;
using PortalDB.Services;
using PortalTools.Composition;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PortalTools.Services.GetEditTools.DBO.Notification
{
    public class NotificationEditTools
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;
        public NotificationEditTools(DbContextOptions<PortalDbContext> options, IPortalGetTools getTools)
        {
            _options = options;
            _getTools = getTools;
        }

        public async Task<bool> AddTblSystemNotificationAsync(TblSystemNotification model, PortalDbContext context)
        {
            if (model == null)
                return false;

            try
            {
                await context.TblSystemNotifications.AddAsync(model);
                await context.SaveChangesAsync();

                AuditTrailTool.TrackChanges(context, null!, model, nameof(TblSystemNotification), model.CreatedBySystemUserId ?? UniversalConstants.SYSTEM_ID, "Insert");

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(NotificationEditTools));
                throw;
            }
        }

        public async Task<bool> AddTblSystemNotificationReadAsync(TblSystemNotificationRead model, PortalDbContext context)
        {
            if (model == null)
                return false;

            try
            {
                await context.TblSystemNotificationReads.AddAsync(model);
                await context.SaveChangesAsync();

                AuditTrailTool.TrackChanges(context, null!, model, nameof(TblSystemNotification), model.SystemUserId!.Value, "Insert");

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(NotificationEditTools));
                throw;
            }
        }

        public async Task<bool> MarkNotificationAsReadAsync(long notificationId, long systemUserId, PortalDbContext context)
        {
            var alreadyRead = await context.TblSystemNotificationReads
                .AsNoTracking()
                .AnyAsync(x => !x.IsDeleted && x.NotificationId == notificationId && x.SystemUserId == systemUserId);

            if (alreadyRead) return true;

            var readRecord = new TblSystemNotificationRead
            {
                NotificationId = notificationId,
                SystemUserId = systemUserId,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            await context.TblSystemNotificationReads.AddAsync(readRecord);
            await context.SaveChangesAsync();
            return true;
        }

        public async Task<int> MarkAllNotificationsAsReadAsync(long systemUserId, PortalDbContext context)
        {
            var notifications = await _getTools.Notification.GetNotificationsForUserAsync(systemUserId, context);
            var notificationIds = notifications.Select(n => n.Id).ToList();

            var alreadyReadIds = await context.TblSystemNotificationReads
                .AsNoTracking()
                .Where(x => !x.IsDeleted && x.SystemUserId == systemUserId && notificationIds.Contains(x.NotificationId ?? 0))
                .Select(x => x.NotificationId)
                .ToListAsync();

            var unreadIds = notificationIds.Where(id => !alreadyReadIds.Contains(id)).ToList();

            if (!unreadIds.Any()) return 0;

            var readRecords = unreadIds.Select(id => new TblSystemNotificationRead
            {
                NotificationId = id,
                SystemUserId = systemUserId,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            }).ToList();

            await context.TblSystemNotificationReads.AddRangeAsync(readRecords);
            await context.SaveChangesAsync();
            return readRecords.Count;
        }

        public async Task<bool> DeleteNotificationForUserAsync(long notificationId, long systemUserId, PortalDbContext context)
        {
            var notification = await context.TblSystemNotifications
                .Where(x => !x.IsDeleted && x.Id == notificationId && x.SystemUserId == systemUserId)
                .FirstOrDefaultAsync();

            if (notification == null) return false;

            notification.IsDeleted = true;
            await context.SaveChangesAsync();
            return true;
        }
    }
}
