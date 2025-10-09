using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.Account;
using PortalDB.Entities.Office;
using PortalDB.Entities.Office.Division;

namespace PortalDB.Services
{
    public class PortalDbContext : DbContext
    {
        public PortalDbContext(DbContextOptions<PortalDbContext> options)
            : base(options)
        {
        }

        #region Account
        public DbSet<TblSystemUser> SystemUsers { get; set; }
        #endregion

        #region Office

        public DbSet<TblOffice> Offices { get; set; }

        #region Division
        public DbSet<TblDivision> Divisions { get; set; }
        #endregion

        #endregion

    }
}
