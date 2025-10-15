using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.LOG.AuditTrail;
using PortalDB.Entities.LOG;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office.Division;

namespace PortalDB.Services
{
    public class PortalDbContext : DbContext
    {
        public PortalDbContext(DbContextOptions<PortalDbContext> options)
            : base(options)
        {
        }

        #region Account
        public DbSet<TblSystemUser> TblSystemUsers { get; set; }
        public DbSet<TblOneTimePassword> TblOneTimePasswords { get; set; }
        public DbSet<TblSystemUserStatus> TblSystemUserStatuses { get; set; }
        public DbSet<TblSessionToken> TblSessionTokens { get; set; }
        #endregion

        #region Office

        public DbSet<TblOffice> TblOffices { get; set; }

        #region Division
        public DbSet<TblDivision> TblDivisions { get; set; }
        #endregion

        #endregion

        #region Audit Trail
        public DbSet<TblAuditTrail> TblAuditTrails { get; set; }
        public DbSet<TblErrorLog> TblErrorLogs { get; set; }
        #endregion

    }
}
