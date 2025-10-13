using Microsoft.EntityFrameworkCore;
using PortalDB.Seeds.DBO.Office;

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
                TblOfficeSeeder.Seed(context);
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
