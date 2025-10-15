using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Office.Division;
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

                #region Office
                TblSystemRoleSeeder.Seed(context);
                #region Division
                TblDivisionSeeder.Seed(context);
                #endregion
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
