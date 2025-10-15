using PortalDB.Entities.DBO.Office;
using PortalDB.Services;
using System.Collections.Generic;
using System.Linq;

namespace PortalDB.Seeds.DBO.Office
{
    internal static class TblOfficeSeeder
    {
        public static void Seed(PortalDbContext context)
        {
            if (context.TblOffices.Any())
                return;

            TblOffice Office(long id, string name, string acronym) => new() { 
                Id = id,
                Name = name, 
                Acronym = acronym 
            };

            var offices = new List<TblOffice>
            {
                Office(1, "Office of the CEO and Commissioner Members", "OCCM"),
                Office(2, "Office of the Executive Director", "OED"),
                Office(3, "Office of the General Counsel and Secretariat", "OGCS"),
                Office(4, "Bids and Awards Committee", "BAC"),
                Office(5, "Legal Service", "LS"),
                Office(6, "Regulatory Operations Service", "ROS"),
                Office(7, "Market Operations Service", "MOS"),
                Office(8, "Central Records Division", "CRD"),
                Office(9, "Commission on Audit", "COA"),
                Office(10, "Consumer Affairs Service", "CAS"),
                Office(11, "Financial Administrative Service", "FAS"),
                Office(12, "Planning and Public Information Service", "PPIS")
            };

            context.TblOffices.AddRange(offices);
            context.SaveChanges();
        }
    }
}
