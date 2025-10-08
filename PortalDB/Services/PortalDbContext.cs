using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.Account;

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

    }
}
