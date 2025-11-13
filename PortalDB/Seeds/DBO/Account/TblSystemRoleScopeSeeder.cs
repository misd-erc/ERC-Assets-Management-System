using PortalDB.Entities.DBO.Account;
using PortalDB.Services;
using System;
using System.Collections.Generic;
using System.Linq;

namespace PortalDB.Seeds.DBO.Account
{
    internal static class TblSystemRoleScopeSeeder
    {
        public static void Seed(PortalDbContext context)
        {
            if (context.TblSystemRoleScopes.Any())
                return;

            // --------------------------------
            // VALIDATION STEP (IMPORTANT)
            // --------------------------------
            var moduleCount = context.TblSystemModules.Count();
            var rolesCount = context.TblSystemRoles.Count();

            Console.WriteLine($"[RoleScopeSeeder] Modules: {moduleCount}, Roles: {rolesCount}");

            if (moduleCount == 0)
            {
                Console.WriteLine("[RoleScopeSeeder] ❗ No modules found. Seeder stopped.");
                return;
            }

            if (rolesCount == 0)
            {
                Console.WriteLine("[RoleScopeSeeder] ❗ No roles found. Seeder stopped.");
                return;
            }

            // --------------------------------
            // GET ADMIN ROLE
            // --------------------------------
            var adminRole = context.TblSystemRoles
                .FirstOrDefault(r => r.RoleName == TblSystemRole.ADMINISTRATOR);

            if (adminRole == null)
            {
                Console.WriteLine("[RoleScopeSeeder] ❗ Administrator role missing.");
                return;
            }

            // --------------------------------
            // GET ALL MODULE IDS
            // --------------------------------
            var allModules = context.TblSystemModules
                .Select(m => m.Id)
                .ToList();

            // --------------------------------
            // CREATE SCOPES
            // --------------------------------
            TblSystemRoleScope Scope(long roleId, long moduleId) => new()
            {
                RoleId = roleId,
                ModuleId = moduleId,
                IsActive = true,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow
            };

            var scopes = allModules
                .Select(moduleId => Scope(adminRole.Id, moduleId))
                .ToList();

            context.TblSystemRoleScopes.AddRange(scopes);
            context.SaveChanges();

            Console.WriteLine($"[RoleScopeSeeder] ✔ Created {scopes.Count} admin scopes.");
        }
    }
}
