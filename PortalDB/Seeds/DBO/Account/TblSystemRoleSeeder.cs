using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Services;
using System.Collections.Generic;
using System.Linq;

namespace PortalDB.Seeds.DBO.Account
{
    internal static class TblSystemRoleSeeder
    {
        public static void Seed(PortalDbContext context)
        {
            if (context.TblSystemRoles.Any())
                return;

            TblSystemRole SystemRole(string name, string description) => new()
            {
                RoleName = name,
                Description = description
            };

            var roles = new List<TblSystemRole>
            {
                SystemRole("Administrator", "Oversees and manages all components of the system"),
                SystemRole("Employee", "Default system role with basic privileges")
            };

            context.TblSystemRoles.AddRange(roles);
            context.SaveChanges();
        }
    }
}
