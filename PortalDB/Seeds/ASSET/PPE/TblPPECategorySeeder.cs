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

            TblPPECategory PPECategory(long id, string name) => new()
            {
                Id = id,
                Name = name
            };

            var systemModules = new List<TblPPECategory>
            {
                PPECategory(1, "Information and Communication Technology Equipment"),
                PPECategory(2, "Communication Equipment"),
                PPECategory(3, "Motor Vehicle"),
                PPECategory(4, "Office Equipment"),
                PPECategory(5, "Technical and Scientific Equipment"),
                PPECategory(6, "Sports Equipment"),
                PPECategory(7, "Furniture and Fixtures")
            };

            context.TblPPECategories.AddRange(systemModules);
            context.SaveChanges();
        }
    }
}
