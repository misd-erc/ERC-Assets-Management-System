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
            migrationBuilder.AlterColumn<DateTime>(
                name: "AuditTrailChangedAt",
                schema: "log",
                table: "tblAuditTrails",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblSystemRoles",
                schema: "dbo");

            migrationBuilder.AlterColumn<DateTime>(
                name: "AuditTrailChangedAt",
                schema: "log",
                table: "tblAuditTrails",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");
        }
    }
}
