using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Seeds.DBO.Office.Division
{
    internal class TblDivisionSeeder
    {
        public static void Seed(PortalDbContext context)
        {
            if (context.TblDivisions.Any())
                return;

            IEnumerable<TblOffice> offices = context.TblOffices;

            TblDivision Division(long id, long officeId, string name, string acronym) => new()
            {
                Id = id,
                OfficeId = officeId,
                Name = name,
                Acronym = acronym
            };

            var divisions = new List<TblDivision>
            {
                Division(1, offices.Where(x => x.Name == TblOffice.OCCM).First().Id, "Internal Audit Division", "IAD"),

                Division(2, offices.Where(x => x.Name == TblOffice.OGCS).First().Id, "Central Records Division", "CRD"),

                Division(3, offices.Where(x => x.Name == TblOffice.FAS).First().Id, "Accounting Division", "AD"),
                Division(4, offices.Where(x => x.Name == TblOffice.FAS).First().Id, "Budget Division", "BD"),
                Division(5, offices.Where(x => x.Name == TblOffice.FAS).First().Id, "General Services Division", "GSD"),
                Division(6, offices.Where(x => x.Name == TblOffice.FAS).First().Id, "Human Resources Management Division", "HRMD"),

                Division(7, offices.Where(x => x.Name == TblOffice.LS).First().Id, "Legal Division for Compliance Cases", "LDCC"),
                Division(8, offices.Where(x => x.Name == TblOffice.LS).First().Id, "Legal Division for Non-Rates Cases", "LDNRC"),
                Division(9, offices.Where(x => x.Name == TblOffice.LS).First().Id, "Legal Division for Rates Cases", "LDRC"),

                Division(10, offices.Where(x => x.Name == TblOffice.PPIS).First().Id, "Information and Data Management Division", "IDMD"),
                Division(11, offices.Where(x => x.Name == TblOffice.PPIS).First().Id, "Management Information System Division", "MISD"),
                Division(12, offices.Where(x => x.Name == TblOffice.PPIS).First().Id, "Planning Division", "PD"),
                Division(13, offices.Where(x => x.Name == TblOffice.PPIS).First().Id, "Public Information Division", "PID"),

                Division(14, offices.Where(x => x.Name == TblOffice.MOS).First().Id, "Contestable Market Division", "CMD"),
                Division(15, offices.Where(x => x.Name == TblOffice.MOS).First().Id, "Licensing and Market Monitoring Division", "LMMD"),
                Division(16, offices.Where(x => x.Name == TblOffice.MOS).First().Id, "Renewable Energy Division", "RED"),
                Division(17, offices.Where(x => x.Name == TblOffice.MOS).First().Id, "Spot Market Division", "SMD"),

                Division(18, offices.Where(x => x.Name == TblOffice.CAS).First().Id, "Consumer Service Division", "CSD"),
                Division(19, offices.Where(x => x.Name == TblOffice.CAS).First().Id, "Meter Division", "MD"),
                Division(20, offices.Where(x => x.Name == TblOffice.CAS).First().Id, "Mindanao Area Operations Division", "MAOD"),
                Division(21, offices.Where(x => x.Name == TblOffice.CAS).First().Id, "Visayas Area Operations Division", "VAOD")
            };

            context.TblDivisions.AddRange(divisions);
            context.SaveChanges();
        }
    }
}
