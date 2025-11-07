using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddedModuleRoleScopes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblSystemModules",
                schema: "dbo",
                columns: table => new
                {
                    SystemModuleId = table.Column<long>(type: "bigint", nullable: false),
                    SystemModuleName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SystemModuleAcronym = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SystemModuleIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SystemModuleCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSystemModules", x => x.SystemModuleId);
                });

            migrationBuilder.CreateTable(
                name: "tblSystemRoleScopes",
                schema: "dbo",
                columns: table => new
                {
                    SystemRoleScopeId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SystemRoleId = table.Column<long>(type: "bigint", nullable: true),
                    SystemModuleId = table.Column<long>(type: "bigint", nullable: true),
                    SystemRoleScopeIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SystemRoleScopeIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SystemRoleScopeCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSystemRoleScopes", x => x.SystemRoleScopeId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblSystemModules",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "tblSystemRoleScopes",
                schema: "dbo");
        }
    }
}
