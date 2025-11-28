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
                Division(offices.Where(x => x.Name == TblOffice.OCCM).First().Id, "Office of the Chairperson and CEO-Admin", "OCC-Admin"),
                Division(offices.Where(x => x.Name == TblOffice.OCCM).First().Id, "Office of the Chairperson and CEO-Legal and Technical", "OCC-LTECH"),
                Division(offices.Where(x => x.Name == TblOffice.OCCM).First().Id, "Office of Commissioner Marko Romeo L. Fuentes", "OCMRLF"),
                Division(offices.Where(x => x.Name == TblOffice.OCCM).First().Id, "Office of Commissioner Amante A. Liberato", "OCAAL"),
                Division(offices.Where(x => x.Name == TblOffice.OCCM).First().Id, "Office of Commissioner Paris G. Real", "OCPGR"),
                Division(offices.Where(x => x.Name == TblOffice.OCCM).First().Id, "Office of Commissioner Floresinda G. Baldo-Digal", "OCFGBD"),
                Division(offices.Where(x => x.Name == TblOffice.OCCM).First().Id, "Internal Audit Division", "IAD"),

                Division(offices.Where(x => x.Name == TblOffice.OGCS).First().Id, "Secretariat", "Secretariat"),
                Division(offices.Where(x => x.Name == TblOffice.OGCS).First().Id, "Central Records Division", "CRD"),

                Division(offices.Where(x => x.Name == TblOffice.LS).First().Id, "Office of the Director", "OD"),
                Division(offices.Where(x => x.Name == TblOffice.LS).First().Id, "Legal Division for Rates Cases", "LDRC"),
                Division(offices.Where(x => x.Name == TblOffice.LS).First().Id, "Legal Division for Compliance Cases", "LDCC"),
                Division(offices.Where(x => x.Name == TblOffice.LS).First().Id, "Legal Division for Non-Rates Cases", "LDNRC"),

                Division(offices.Where(x => x.Name == TblOffice.PPIS).First().Id, "Office of the Director", "OD"),
                Division(offices.Where(x => x.Name == TblOffice.PPIS).First().Id, "Information and Data Management Division", "IDMD"),
                Division(offices.Where(x => x.Name == TblOffice.PPIS).First().Id, "Management Information System Division", "MISD"),
                Division(offices.Where(x => x.Name == TblOffice.PPIS).First().Id, "Planning Division", "PD"),
                Division(offices.Where(x => x.Name == TblOffice.PPIS).First().Id, "Public Information Division", "PID"),

                Division(offices.Where(x => x.Name == TblOffice.ROS).First().Id, "Tariffs and Rates Division", "TRD"),
                Division(offices.Where(x => x.Name == TblOffice.ROS).First().Id, "Standards Division", "SD"),
                Division(offices.Where(x => x.Name == TblOffice.ROS).First().Id, "Investigation and Enforcement Division for Distribution Utilities", "IED-DUs"),
                Division(offices.Where(x => x.Name == TblOffice.ROS).First().Id, "Investigation and Enforcement Division for Transmission", "IED-Transmission"),
                Division(offices.Where(x => x.Name == TblOffice.ROS).First().Id, "Investigation and Enforcement Division for Adjudication", "IED-Adju"),
                Division(offices.Where(x => x.Name == TblOffice.ROS).First().Id, "Over/Under Group", "OU Group"),

                Division(offices.Where(x => x.Name == TblOffice.MOS).First().Id, "Office of the Director", "OD"),
                Division(offices.Where(x => x.Name == TblOffice.MOS).First().Id, "Contestable Market Division", "CMD"),
                Division(offices.Where(x => x.Name == TblOffice.MOS).First().Id, "Licensing and Market Monitoring Division", "LMMD"),
                Division(offices.Where(x => x.Name == TblOffice.MOS).First().Id, "Renewable Energy Division", "RED"),
                Division(offices.Where(x => x.Name == TblOffice.MOS).First().Id, "Spot Market Division", "SMD"),
                Division(offices.Where(x => x.Name == TblOffice.MOS).First().Id, "Investigation and Enforcement GenCo and Supply Division", "IEGSD"),
                Division(offices.Where(x => x.Name == TblOffice.MOS).First().Id, "Generation Company Standards and Monitoring Division", "GCSMD"),
                Division(offices.Where(x => x.Name == TblOffice.MOS).First().Id, "Retail Market Division", "RMD"),

                Division(offices.Where(x => x.Name == TblOffice.CAS).First().Id, "Office of the Director", "OD"),
                Division(offices.Where(x => x.Name == TblOffice.CAS).First().Id, "Consumer Service Division", "CSD"),
                Division(offices.Where(x => x.Name == TblOffice.CAS).First().Id, "Meter Division", "MD"),
                Division(offices.Where(x => x.Name == TblOffice.CAS).First().Id, "Visayas Area Operations Division", "VAOD  "),
                Division(offices.Where(x => x.Name == TblOffice.CAS).First().Id, "Mindanao Area Operations Division", "MAOD"),

                Division(offices.Where(x => x.Name == TblOffice.FAS).First().Id, "Office of the Director", "OD"),
                Division(offices.Where(x => x.Name == TblOffice.FAS).First().Id, "Accounting Division", "AD"),
                Division(offices.Where(x => x.Name == TblOffice.FAS).First().Id, "Budget Division", "BD"),
                Division(offices.Where(x => x.Name == TblOffice.FAS).First().Id, "General Services Division", "GSD"),
                Division(offices.Where(x => x.Name == TblOffice.FAS).First().Id, "Human Resources Management Division", "HRMD"),
                Division(offices.Where(x => x.Name == TblOffice.FAS).First().Id, "Procurement Management Section", "PMS"),
                Division(offices.Where(x => x.Name == TblOffice.FAS).First().Id, "Commission on Audit", "COA"),

            };

            context.TblDivisions.AddRange(divisions);
            context.SaveChanges();
        }
    }
}
