using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Account;
using PortalDB.Services;
using System.Collections.Generic;
using System.Linq;

namespace PortalDB.Seeds.DBO.Account
{
    internal static class TblSystemUserStatusSeeder
    {
        public static void Seed(PortalDbContext context)
        {
            if (context.TblSystemUserStatuses.Any())
                return;

            TblSystemUserStatus SystemUserStatus(long id, string name) => new()
            {
                Id = id,
                Name = name
            };

            var systemUserStatuses = new List<TblSystemUserStatus>
            {
                SystemUserStatus(TblSystemUserStatus.Dictionary[TblSystemUserStatus.ACTIVE], TblSystemUserStatus.ACTIVE),
                SystemUserStatus(TblSystemUserStatus.Dictionary[TblSystemUserStatus.INACTIVE], TblSystemUserStatus.INACTIVE),
                SystemUserStatus(TblSystemUserStatus.Dictionary[TblSystemUserStatus.SUSPENDED], TblSystemUserStatus.SUSPENDED),
                SystemUserStatus(TblSystemUserStatus.Dictionary[TblSystemUserStatus.PENDING], TblSystemUserStatus.PENDING),
            };

            context.TblSystemUserStatuses.AddRange(systemUserStatuses);
            context.SaveChanges();
        }
    }
}
