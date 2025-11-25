using Microsoft.EntityFrameworkCore;
using PortalCommon.Constants;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Notification;
using PortalDB.Services;
using PortalTools.Composition;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
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

        /// <summary>
        /// Updates an existing TblSystemNotification.
        /// Returns true if update succeeds, false otherwise.
        /// </summary>
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

        /// <summary>
        /// Updates an existing TblSystemNotificationRead.
        /// Returns true if update succeeds, false otherwise.
        /// </summary>
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

    }
}
