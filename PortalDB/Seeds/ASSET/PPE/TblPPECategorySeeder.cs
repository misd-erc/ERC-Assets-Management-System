using PortalDB.Entities.ASSET.PPE;
using PortalDB.Entities.DBO.Module;
using PortalDB.Entities.DBO.Office;
using PortalDB.Services;
using System.Collections.Generic;
using System.Linq;

namespace PortalDB.Seeds.ASSET.PPE
{
    internal static class TblPPECategorySeeder
    {
        public static void Seed(PortalDbContext context)
        {
            if (context.TblPPECategories.Any())
                return;

            TblPPECategory PPECategory(string name) => new()
            {
                Name = name
            };

            var systemModules = new List<TblPPECategory>
            {
                PPECategory("Information and Communication Technology Equipment"),
                PPECategory("Communication Equipment"),
                PPECategory("Motor Vehicle"),
                PPECategory("Office Equipment"),
                PPECategory("Technical and Scientific Equipment"),
                PPECategory("Sports Equipment"),
                PPECategory("Furniture and Fixtures")
            };

            context.TblPPECategories.AddRange(systemModules);
            context.SaveChanges();
        }
    }
}
