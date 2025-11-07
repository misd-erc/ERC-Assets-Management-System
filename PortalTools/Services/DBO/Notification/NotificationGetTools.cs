using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Notification;
using PortalDB.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalTools.Services.DBO.Notification
{
    public class NotificationGetTools
    {
        private readonly PortalDbContext _context;

        public NotificationGetTools(PortalDbContext context)
        {
            _context = context;
        }

        public IQueryable<TblSystemNotification> GetTblSystemNotifications() => _context.TblSystemNotifications.Where(x => !x.IsDeleted);
        public async Task<TblSystemNotification?> GetTblSystemNotificationAsync(long id) => await _context.TblSystemNotifications.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblSystemNotification> GetTblSystemNotificationsBySystemUserId(long systemUserId) => _context.TblSystemNotifications.Where(x => !x.IsDeleted && x.SystemUserId == systemUserId);
        public IQueryable<TblSystemNotification> GetTblSystemNotificationsByCreatedBySystemUserId(long createdBySystemUserId) => _context.TblSystemNotifications.Where(x => !x.IsDeleted && x.CreatedBySystemUserId == createdBySystemUserId);
    }
}
