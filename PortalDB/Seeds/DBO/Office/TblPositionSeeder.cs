using PortalDB.Entities.DBO.Office;
using PortalDB.Services;
using System.Collections.Generic;
using System.Linq;

namespace PortalDB.Seeds.DBO.Office
{
    internal static class TblPositionSeeder
    {
        public static void Seed(PortalDbContext context)
        {
            if (context.TblPositions.Any())
                return;

            TblPosition Position(string name, string acronym, string salaryGrade) => new() { 
                Name = name,
                Acronym = acronym,
                SalaryGrade = salaryGrade
            };

            var positions = new List<TblPosition>
            {
                Position("Energy Regulation Officer II", "ERO II", "12"),
                Position("Computer Maintenance Technologist III", "CMT III", "12"),
            };

            context.TblPositions.AddRange(positions);
            context.SaveChanges();
        }
    }
}
