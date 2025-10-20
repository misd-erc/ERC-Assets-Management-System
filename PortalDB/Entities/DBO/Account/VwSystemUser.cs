using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Entities.LOG.AuditTrail;
using PortalTools.Utilities;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Entities.DBO.Account
{
    [Keyless]
    [Table("vwSystemUsers", Schema = "dbo")]
    public class VwSystemUser : SystemUserEntity
    {

        [Column("SystemUserId")]
        public long? Id { get; set; }

        [Column("SystemRoleName")]
        public string? SystemRoleName { get; set; }

        [Column("SystemUserStatusName")]
        public string? StatusName { get; set; }

        [Column("OfficeName")]
        public string? OfficeName { get; set; }

        [Column("OfficeAcronym")]
        public string? OfficeAcronym { get; set; }

        [Column("DivisionName")]
        public string? DivisionName { get; set; }

        [Column("DivisionAcronym")]
        public string? DivisionACronym { get; set; }

    }
}
