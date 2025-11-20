using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Notification;
using PortalDB.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalTools.Services.GetEditTools.DBO.Notification
{
    public class NotificationGetTools
    {

        public IQueryable<TblSystemNotification> GetTblSystemNotifications(PortalDbContext context) => context.TblSystemNotifications.Where(x => !x.IsDeleted);
        public async Task<TblSystemNotification?> GetTblSystemNotificationAsync(long id, PortalDbContext context) => await context.TblSystemNotifications.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblSystemNotification> GetTblSystemNotificationsBySystemUserId(long systemUserId, PortalDbContext context) => context.TblSystemNotifications.Where(x => !x.IsDeleted && x.SystemUserId == systemUserId);
        public IQueryable<TblSystemNotification> GetTblSystemNotificationsByCreatedBySystemUserId(long createdBySystemUserId, PortalDbContext context) => context.TblSystemNotifications.Where(x => !x.IsDeleted && x.CreatedBySystemUserId == createdBySystemUserId);
    }
}
