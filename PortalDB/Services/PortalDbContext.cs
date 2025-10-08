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
        public DbSet<SystemUser> SystemUsers { get; set; }
        #endregion

    }
}
