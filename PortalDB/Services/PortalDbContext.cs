using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.Account;
using PortalDB.Entities.Office;
using PortalDB.Entities.Office.Division;
using PortalDB.Entities.AuditTrail;

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
        #endregion

        #region Office

        public DbSet<TblOffice> TblOffices { get; set; }

        #region Division
        public DbSet<TblDivision> TblDivisions { get; set; }
        #endregion

        #endregion

        #region Audit Trail
        public DbSet<TblAuditTrail> TblAuditTrails { get; set; }
        #endregion

    }
}
