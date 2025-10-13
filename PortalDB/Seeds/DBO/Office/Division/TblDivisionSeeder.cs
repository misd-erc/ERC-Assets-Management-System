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

            TblDivision Division(long officeId, string name, string acronym) => new()
            {
                OfficeId = officeId,
                Name = name,
                Acronym = acronym
            };

            var divisions = new List<TblDivision>
            {
                Division(offices.Where(x => x.Name == TblOffice.OGCS).First().Id, "Central Records Division", "CRD"),

                Division(offices.Where(x => x.Name == TblOffice.FAS).First().Id, "Accounting Division", "AD"),
                Division(offices.Where(x => x.Name == TblOffice.FAS).First().Id, "Budget Division", "BD"),
                Division(offices.Where(x => x.Name == TblOffice.FAS).First().Id, "General Services Division", "GSD"),
                Division(offices.Where(x => x.Name == TblOffice.FAS).First().Id, "Human Resources Management Division", "HRMD"),

                Division(offices.Where(x => x.Name == TblOffice.LS).First().Id, "Legal Division for Compliance Cases", "LDCC"),
                Division(offices.Where(x => x.Name == TblOffice.LS).First().Id, "Legal Division for Non-Rates Cases", "LDNRC"),
                Division(offices.Where(x => x.Name == TblOffice.LS).First().Id, "Legal Division for Rates Cases", "LDRC"),

                Division(offices.Where(x => x.Name == TblOffice.PPIS).First().Id, "Information and Data Management Division", "IDMD"),
                Division(offices.Where(x => x.Name == TblOffice.PPIS).First().Id, "Management Information System Division", "MISD"),
                Division(offices.Where(x => x.Name == TblOffice.PPIS).First().Id, "Planning Division", "PD"),
                Division(offices.Where(x => x.Name == TblOffice.PPIS).First().Id, "Public Information Division", "PID"),

                Division(offices.Where(x => x.Name == TblOffice.MOS).First().Id, "Contestable Market Division", "CMD"),
                Division(offices.Where(x => x.Name == TblOffice.MOS).First().Id, "Licensing and Market Monitoring Division", "LMMD"),
                Division(offices.Where(x => x.Name == TblOffice.MOS).First().Id, "Renewable Energy Division", "RED"),
                Division(offices.Where(x => x.Name == TblOffice.MOS).First().Id, "Spot Market Division", "SMD"),

                Division(offices.Where(x => x.Name == TblOffice.CAS).First().Id, "Consumer Service Division", "CSD"),
                Division(offices.Where(x => x.Name == TblOffice.CAS).First().Id, "Meter Division", "MD"),
                Division(offices.Where(x => x.Name == TblOffice.CAS).First().Id, "Mindanao Area Operations Division", "MAOD"),
                Division(offices.Where(x => x.Name == TblOffice.CAS).First().Id, "Visayas Area Operations Division", "VAOD")
            };

            context.TblDivisions.AddRange(divisions);
            context.SaveChanges();
        }
    }
}
