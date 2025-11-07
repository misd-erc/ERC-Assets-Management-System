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

            TblSystemModule SystemModule(long id, string name, string acronym) => new() { 
                Id = id,
                Name = name, 
                Acronym = acronym 
            };

            var systemModules = new List<TblSystemModule>
            {
                SystemModule(1, "User Account Management Module", "UAMM"),
                SystemModule(2, "Dashboard and Notifications Module", "DNM"),
                SystemModule(3, "Inventory Encoding Module", "IEM"),
                SystemModule(4, "Delivery & Receipt Module", "DRM"),
                SystemModule(5, "Issuance & Requisition Module", "IRM"),
                SystemModule(6, "PAR/ICS Module", "PARICSM"),
                SystemModule(7, "Transfer & Return Module ", "TRM"),
                SystemModule(8, "Disposal & Contract Management Module", "DCMM"),
                SystemModule(9, "Reporting & Audit Module", "RAM"),
                SystemModule(10, "System Integration Module", "SIM"),
                SystemModule(11, "System Configuration & Security Module", "SCSM"),
                SystemModule(12, "Mobile & RFID Support", "MRFIDS")
 
            };

            context.TblSystemModules.AddRange(systemModules);
            context.SaveChanges();
        }
    }
}
