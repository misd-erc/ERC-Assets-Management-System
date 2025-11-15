using PortalDB.Entities.DBO.Office;
using PortalDB.Services;
using System.Collections.Generic;
using System.Linq;

namespace PortalDB.Seeds.DBO.Office
{
    internal static class TblEmploymentTypeSeeder
    {
        public static void Seed(PortalDbContext context)
        {
            if (context.TblEmploymentTypes.Any())
                return;

            TblEmploymentType EmploymentType(string name) => new() { 
                Name = name
            };

            var employmentTypes = new List<TblEmploymentType>
            {
                EmploymentType("Plantilla"),
                EmploymentType("Contract of Service"),
                EmploymentType("Co-Terminous"),
                EmploymentType("Contractual"),
                EmploymentType("Job Order")
            };

            context.TblEmploymentTypes.AddRange(employmentTypes);
            context.SaveChanges();
        }
    }
}

