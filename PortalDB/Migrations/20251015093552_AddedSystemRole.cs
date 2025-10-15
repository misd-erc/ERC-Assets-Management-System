using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddedSystemRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "SystemUserSystemRoleId",
                schema: "dbo",
                table: "tblSystemUsers",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "tblSystemRoles",
                schema: "dbo",
                columns: table => new
                {
                    SystemRoleId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SystemRoleName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SystemRoleDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SystemRoleIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SystemRoleCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSystemRoles", x => x.SystemRoleId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tblSystemUsers_SystemUserSystemRoleId",
                schema: "dbo",
                table: "tblSystemUsers",
                column: "SystemUserSystemRoleId");

            migrationBuilder.AddForeignKey(
                name: "FK_tblSystemUsers_tblSystemRoles_SystemUserSystemRoleId",
                schema: "dbo",
                table: "tblSystemUsers",
                column: "SystemUserSystemRoleId",
                principalSchema: "dbo",
                principalTable: "tblSystemRoles",
                principalColumn: "SystemRoleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_tblSystemUsers_tblSystemRoles_SystemUserSystemRoleId",
                schema: "dbo",
                table: "tblSystemUsers");

            migrationBuilder.DropTable(
                name: "tblSystemRoles",
                schema: "dbo");

            migrationBuilder.DropIndex(
                name: "IX_tblSystemUsers_SystemUserSystemRoleId",
                schema: "dbo",
                table: "tblSystemUsers");

            migrationBuilder.DropColumn(
                name: "SystemUserSystemRoleId",
                schema: "dbo",
                table: "tblSystemUsers");
        }
    }
}
