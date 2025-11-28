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
                Position("Energy Regulation Officer I", "ERO I", "15"),
                Position("Energy Regulation Officer II", "ERO II", "18"),
                Position("Engineer I", "ENG I", "16"),
                Position("Data Controller II", "DC II", "13"),
                Position("Clerk III", "CLK III", "12"),
                Position("Clerk II", "CLK II", "12"),
                Position("Legal Assistant I", "LA I", "13"),
                Position("Legal Assistant II", "LA II", "15"),
                Position("Stenographic Reporter II", "SR II", "14"),
                Position("Stenographic Reporter III", "SR III", "16"),
                Position("Administrative Officer I", "AO I", "14"),
                Position("Administrative Officer II", "AO II", "16"),
                Position("Planning Officer II", "PO II", "17"),
                Position("Secretary I", "SEC I", "13"),
                Position("Driver I", "DRV I", "12"),
                Position("Bus Driver", "BUS DRV", "12"),
                Position("Computer Maintenance Technologist III", "CMT III", "17"),
                Position("IT Support Aide", "ITSA", "13"),
                Position("Energy Regulation Assistant", "ERA", "14"),
                Position("Utility Worker/Messenger", "UWM", "12"),
                Position("Accounting Clerk II", "AC II", "13"),
                Position("Bookkeeper", "Bookkeeper", "15"),
                Position("Budgeting Assistant", "BA", "14"),
                Position("Human Resource Management Officer I", "HRMO I", "15"),
                Position("Human Resource Management Officer II", "HRMO II", "17"),
                Position("Human Resource Management Assistant", "HRMA", "13"),
                Position("Human Resource Management Technical Staff", "HRMTS", "14"),
                Position("Human Resource Management Technical Support Staff", "HRMTSS", "14"),
                Position("ERC Physician", "ERCPHYS", "18"),
                Position("Senior Computer Programmer", "SRCP", "18"),
                Position("Junior Computer Programmer", "JRCP", "15"),
                Position("Junior Systems Analyst", "JSA", "16")
            };

            context.TblPositions.AddRange(positions);
            context.SaveChanges();
        }
    }
}
