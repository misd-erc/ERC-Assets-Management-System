using Microsoft.EntityFrameworkCore;
using PortalDB.Services;
using PortalTools.Services.DBO.Account;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalTools.Services
{
    public static class ExtensionTools
    {
        /// <summary>
        /// Soft deletes all entities in the query by setting IsDeleted = true and DeletedAt = now.
        /// Tracks the deletion in TblAuditTrail if AuditTrailTool is available.
        /// </summary>
        /// <typeparam name="T">Entity type with IsDeleted property</typeparam>
        /// <param name="query">The query to soft delete</param>
        /// <param name="changedBy">Optional user id for audit trail</param>
        /// <returns>Number of affected rows</returns>
        public static async Task<int> ExecuteSoftDeleteAsync<T>(this IQueryable<T> query, long deletedBy = 0) where T : class
        {
            await using var context = new PortalDbContext(new DbContextOptions<PortalDbContext>());

            var items = await query.ToListAsync();
            foreach (var item in items)
            {
                var type = item.GetType();

                var original = item;

                var isDeletedProp = type.GetProperty("IsDeleted");
                if (isDeletedProp != null)
                    isDeletedProp.SetValue(item, true);

                try
                {
                    AuditTrailTool.TrackChanges(context, original, item, type.Name, deletedBy, "Delete");
                }
                catch (Exception ex) 
                {
                    await ErrorTool.ErrorLogAsync(context, ex, nameof(AccountEditTools));
                }
            }

            return await context.SaveChangesAsync();
        }
    }
}
