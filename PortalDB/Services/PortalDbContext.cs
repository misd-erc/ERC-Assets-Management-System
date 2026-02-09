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
using PortalDB.Entities.DBO.Storage;
using PortalDB.Entities.DBO.Notification;
using PortalDB.Entities.DBO.Module;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Seeds.DBO.Module;
using PortalDB.Entities.ASSET.Supply;
using PortalDB.Entities.ASSET.Delivery;

namespace PortalDB.Services
{
    public class PortalDbContext : DbContext
    {
        public PortalDbContext(DbContextOptions<PortalDbContext> options)
            : base(options)
        {
        }

        #region DBO
        #region Account
        public DbSet<TblSystemUser> TblSystemUsers { get; set; }
        public DbSet<VwSystemUser> VwSystemUsers { get; set; }
        public DbSet<TblOneTimePassword> TblOneTimePasswords { get; set; }
        public DbSet<TblSystemUserStatus> TblSystemUserStatuses { get; set; }
        public DbSet<TblSessionToken> TblSessionTokens { get; set; }
        public DbSet<TblSystemRole> TblSystemRoles { get; set; }
        public DbSet<TblSystemRoleScope> TblSystemRoleScopes { get; set; }
        public DbSet<TblFileStorage> TblFileStorages { get; set; }
        public DbSet<TblSystemNotification> TblSystemNotifications { get; set; }
        public DbSet<TblSystemNotificationRead> TblSystemNotificationReads { get; set; }
        public DbSet<TblSystemModule> TblSystemModules { get; set; }
        public DbSet<TblEmployee> TblEmployees { get; set; }
        #endregion

        #region Office
        public DbSet<TblOffice> TblOffices { get; set; }
        public DbSet<TblDivision> TblDivisions { get; set; }
        public DbSet<VwDivision> VwDivisions { get; set; }
        public DbSet<TblPosition> TblPositions { get; set; }
        public DbSet<TblEmploymentType> TblEmploymentTypes { get; set; }
        #endregion

        #region Audit Trail
        public DbSet<TblAuditTrail> TblAuditTrails { get; set; }
        public DbSet<TblErrorLog> TblErrorLogs { get; set; }
        public DbSet<TblActivityLog> TblActivityLogs { get; set; }
        #endregion

        #endregion
        #region ASSET
        #region PTA

        public DbSet<TblPTA> TblPTAs { get; set; }
        public DbSet<VwPTA> VwPTAs { get; set; }
        public DbSet<TblPTACategory> TblPTACategories { get; set; }
        public DbSet<TblPTALegend> TblPTALegends { get; set; }
        public DbSet<TblPTAMovement> TblPTAMovements { get; set; }
        public DbSet<TblPTAPart> TblPTAParts { get; set; }

        #endregion
        #region Supply
        public DbSet<TblSupplyVendor> TblSupplyVendors { get; set; }
        public DbSet<TblSupplyItem> TblSupplyItems { get; set; }
        public DbSet<TblSupplyStorageLocation> TblSupplyStorageLocations { get; set; }
        public DbSet<TblSupplyUnit> TblSupplyUnits { get; set; }
        #endregion
        #region Delivery
        public DbSet<TblDeliveryRecord> TblDeliveryRecords { get; set; }
        public DbSet<TblDeliveryRecordItem> TblDeliveryRecordItems { get; set; }
        #endregion
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
                    // Correct: pass view name and schema separately
                    modelBuilder.Entity(clrType).ToView(tableName, schema);
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
