using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.LOG.AuditTrail;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace PortalTools.Services
{
    public static class AuditTrailTool
    {
        /// <summary>
        /// Adds an audit trail record for an entity change
        /// </summary>
        public static void TrackChanges<T>(
            DbContext context,
            T originalEntity,
            T updatedEntity,
            string tableName,
            long changedBy,
            string action = "Update") where T : class
        {
            if (originalEntity == null && updatedEntity == null)
                return;

            string changesJson;

            if (action == "Insert")
            {
                changesJson = JsonSerializer.Serialize(updatedEntity);
            }
            else if (action == "Delete")
            {
                changesJson = JsonSerializer.Serialize(originalEntity);
            }
            else // Update
            {
                changesJson = BuildChanges(originalEntity, updatedEntity);
                if (string.IsNullOrWhiteSpace(changesJson))
                    return; // No changes
            }

            TblAuditTrail auditTrailInfo = new TblAuditTrail
            {
                TableName = tableName,
                RecordId = (updatedEntity ?? originalEntity!)!.GetPropertyValue<long>("Id"), // requires extension
                Action = action,
                Changes = changesJson,
                ChangedBy = changedBy
            };

            context.Set<TblAuditTrail>().Add(auditTrailInfo);
        }

        /// <summary>
        /// Build JSON of changed properties
        /// </summary>
        public static string BuildChanges<T>(T original, T updated)
        {
            var changes = new Dictionary<string, object>();
            var props = typeof(T).GetProperties();

            foreach (var prop in props)
            {
                var oldValue = prop.GetValue(original)?.ToString();
                var newValue = prop.GetValue(updated)?.ToString();

                if (oldValue != newValue)
                    changes[prop.Name] = new { Old = oldValue, New = newValue };
            }

            return JsonSerializer.Serialize(changes);
        }

        /// <summary>
        /// Extension to get property value by name
        /// </summary>
        private static TValue GetPropertyValue<TValue>(this object obj, string propName)
        {
            return (TValue)obj.GetType().GetProperty(propName)!.GetValue(obj)!;
        }
    }
}
