using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.LOG.AuditTrail;
using PortalCommon.Utilities;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Entities.DBO.Office.Division
{
    [Keyless]
    [Table("vwDivisions", Schema = "dbo")]
    public class VwDivision : DivisionEntity
    {

        [Column("DivisionId")]
        public long? Id { get; set; }

        [Column("OfficeName")]
        public string? OfficeName { get; set; }

        [Column("OfficeAcronym")]
        public string? OfficeAcronym { get; set; }

    }
}
