using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Seeds.DBO.Account;
using PortalDB.Seeds.DBO.Module;
using PortalDB.Seeds.DBO.Office;
using PortalDB.Seeds.DBO.Office.Division;

namespace PortalDB.Services
{
    public static class DbSeeder
    {
        /// <summary>
        /// Seeds initial data into the database. 
        /// Applies migrations first, then runs entity-specific seeders.
        /// </summary>
        /// <param name="context">The database context</param>
        public static void Seed(PortalDbContext context)
        {
            context.Database.Migrate();
            Console.WriteLine("Starting database seeding...");

            try
            {
                #region Account
                TblSystemUserStatusSeeder.Seed(context);
                TblSystemRoleSeeder.Seed(context);
                TblSystemRoleScopeSeeder.Seed(context);
                TblSystemModuleSeeder.Seed(context);
                #endregion

                #region Office
                TblOfficeSeeder.Seed(context);
                TblSystemModuleSeeder.Seed(context);
                #region Division
                TblDivisionSeeder.Seed(context);
                #endregion

                TblEmploymentTypeSeeder.Seed(context);
                TblPositionSeeder.Seed(context);
                #endregion

                Console.WriteLine("Database seeding completed successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Seeding failed: {ex.Message}");
                throw;
            }
        }
    }
}
