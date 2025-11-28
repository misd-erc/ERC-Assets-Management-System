using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.DBO.Module;
using PortalDB.Entities.DBO.Office;
using PortalDB.Services;
using System.Collections.Generic;
using System.Linq;

namespace PortalDB.Seeds.ASSET.PPE
{
    internal static class TblPTACategorySeeder
    {
        public static void Seed(PortalDbContext context)
        {
            if (context.TblPTACategories.Any())
                return;

            TblPTACategory PPECategory(string name) => new()
            {
                Name = name
            };

            var ptaCategories = new List<TblPTACategory>
            {
                PPECategory("Information and Communication Technology Equipment"),
                PPECategory("Communication Equipment"),
                PPECategory("Motor Vehicle"),
                PPECategory("Office Equipment"),
                PPECategory("Technical and Scientific Equipment"),
                PPECategory("Sports Equipment"),
                PPECategory("Furniture and Fixtures")
            };

            context.TblPTACategories.AddRange(ptaCategories);
            context.SaveChanges();
        }
    }
}
