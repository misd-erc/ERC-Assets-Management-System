using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Entities.LOG;
using PortalDB.Entities.LOG.AuditTrail;
using System;
using System.Linq;
using System.Reflection;
using System.ComponentModel.DataAnnotations.Schema;

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
        public DbSet<VwSystemUser> VwSystemUsers { get; set; }
        public DbSet<TblOneTimePassword> TblOneTimePasswords { get; set; }
        public DbSet<TblSystemUserStatus> TblSystemUserStatuses { get; set; }
        public DbSet<TblSessionToken> TblSessionTokens { get; set; }
        public DbSet<TblSystemRole> TblSystemRoles { get; set; }
        #endregion

        #region Office
        public DbSet<TblOffice> TblOffices { get; set; }
        public DbSet<TblDivision> TblDivisions { get; set; }
        #endregion

        #region Audit Trail
        public DbSet<TblAuditTrail> TblAuditTrails { get; set; }
        public DbSet<TblErrorLog> TblErrorLogs { get; set; }
        #endregion

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            var entityTypes = modelBuilder.Model.GetEntityTypes().ToList();

            foreach (var entityType in entityTypes)
            {
                var clrType = entityType.ClrType;
                if (clrType == null)
                    continue;

                var tableAttr = clrType.GetCustomAttribute<TableAttribute>();
                var tableName = tableAttr?.Name ?? entityType.GetTableName();
                var schema = tableAttr?.Schema ?? "dbo";

                bool isKeyless = Attribute.IsDefined(clrType, typeof(KeylessAttribute));
                bool isView = tableName?.StartsWith("vw", StringComparison.OrdinalIgnoreCase) == true;

                if (isKeyless || isView)
                {
                    // ✅ Map it as a view so EF reads data but doesn't migrate schema
                    modelBuilder.Entity(clrType).ToView($"{schema}.{tableName}");

                    // ✅ This is the key fix: mark as ignored for migrations
                    modelBuilder.Entity(clrType).Metadata.SetIsTableExcludedFromMigrations(true);
                }
                else
                {
                    modelBuilder.Entity(clrType).ToTable(tableName, schema);
                }
            }
        }
    }
}
