using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Office;
using PortalDB.Services;
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
        public static async Task<int> ExecuteSoftDeleteAsync<T>(
            this IQueryable<T> query,
            PortalDbContext context,
            long changedBy = 0
        ) where T : class
        {
            var items = await query.ToListAsync();
            foreach (var item in items)
            {
                var type = item.GetType();

                // Track original values
                var original = item; // clone if needed

                // Soft delete properties
                var isDeletedProp = type.GetProperty("IsDeleted");
                if (isDeletedProp != null)
                    isDeletedProp.SetValue(item, true);

                var deletedAtProp = type.GetProperty("DeletedAt");
                if (deletedAtProp != null)
                    deletedAtProp.SetValue(item, DateTime.UtcNow);

                //Hidden due to redundancy
                //AuditTrailTool.TrackChanges(context, original, item, type.Name, changedBy, "Delete");
                
            }

            return await context.SaveChangesAsync();
        }

    }
}
