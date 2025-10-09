using System;
using System.Collections.Generic;
using System.Text.Json;

namespace PortalCommon.Utilities
{

    public static class AuditHelper
    {
        public static string BuildChanges<T>(T original, T updated)
        {
            var changes = new Dictionary<string, object>();

            var props = typeof(T).GetProperties();
            foreach (var prop in props)
            {
                var oldValue = prop.GetValue(original)?.ToString();
                var newValue = prop.GetValue(updated)?.ToString();

                if (oldValue != newValue)
                {
                    changes[prop.Name] = new { Old = oldValue, New = newValue };
                }
            }

            return JsonSerializer.Serialize(changes);
        }
    }

}
