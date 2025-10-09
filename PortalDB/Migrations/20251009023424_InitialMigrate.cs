using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class InitialMigrate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "dbo");

            migrationBuilder.CreateTable(
                name: "tblSystemUsers",
                schema: "dbo",
                columns: table => new
                {
                    SystemUserId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MicrosoftEntraId = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    SystemUserFirstName = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    SystemUserLastName = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    SystemUserEmail = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    SystemUserIsActive = table.Column<bool>(type: "bit", maxLength: 1, nullable: false),
                    SystemUserCreatedAt = table.Column<DateTime>(type: "datetime2", maxLength: 20, nullable: false),
                    SystemUserLastLoginAt = table.Column<DateTime>(type: "datetime2", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSystemUsers", x => x.SystemUserId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblSystemUsers",
                schema: "dbo");
        }
    }
}
