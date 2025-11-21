using PortalDB.Entities.DBO.Module;
using PortalDB.Entities.DBO.Office;
using PortalDB.Services;
using System.Collections.Generic;
using System.Linq;

namespace PortalDB.Seeds.DBO.Module
{
    internal static class TblSystemModuleSeeder
    {
        public static void Seed(PortalDbContext context)
        {
            if (context.TblSystemModules.Any())
                return;

            TblSystemModule SystemModule(long id, string name, string acronym) => new()
            {
                Id = id,
                Name = name,
                Acronym = acronym
            };

            var systemModules = new List<TblSystemModule>
            {
                // Overview
                SystemModule(1, "Dashboard", "DB"),

                // Collaboration
                SystemModule(2, "Calendar & Notifications", "CALN"),
                SystemModule(3, "Communication Tools", "CT"),

                // Core Operations
                SystemModule(4, "Category Management", "CATM"),
                SystemModule(5, "Delivery & Receipt of Items", "DRI"),
                SystemModule(6, "Supply Management", "SM"),
                SystemModule(7, "Transfers & Returns", "TR"),
                SystemModule(8, "Disposal of Properties", "DOP"),
                SystemModule(9, "Contract Management", "CM"),

                // Asset Management
                SystemModule(10, "PPE & SE", "PPESE"),
                SystemModule(11, "PPE & Semi-Expendables", "PPESEx"),

                // Reports & Approvals
                SystemModule(12, "Reports Center", "RC"),
                SystemModule(13, "Approvals", "APR"),

                // Administration
                SystemModule(14, "User Management", "UM"),
                SystemModule(15, "Roles Management", "RM"),
                SystemModule(16, "Office Management", "OM"),
                SystemModule(17, "System Settings", "SYSSET"),
                SystemModule(18, "Audit Logs", "AL")
            };

            context.TblSystemModules.AddRange(systemModules);
            context.SaveChanges();
        }
    }
}
