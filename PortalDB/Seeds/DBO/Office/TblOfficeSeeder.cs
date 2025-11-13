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

            TblOffice Office(string name, string acronym) => new() { 
                Name = name, 
                Acronym = acronym 
            };

            var offices = new List<TblOffice>
            {
                Office("Office of the CEO and Commissioner Members", "OCCM"),
                Office("Office of the Executive Director", "OED"),
                Office("Office of the General Counsel and Secretariat", "OGCS"),
                Office("Bids and Awards Committee", "BAC"),
                Office("Legal Service", "LS"),
                Office("Regulatory Operations Service", "ROS"),
                Office("Market Operations Service", "MOS"),
                Office("Commission on Audit", "COA"),
                Office("Consumer Affairs Service", "CAS"),
                Office("Financial Administrative Service", "FAS"),
                Office("Planning and Public Information Service", "PPIS")
            };

            context.TblOffices.AddRange(offices);
            context.SaveChanges();
        }
    }
}
