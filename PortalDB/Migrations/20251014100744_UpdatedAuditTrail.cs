using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedAuditTrail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_tblAuditTrails_tblSystemUsers_AuditTrailChangedBySystemUserId",
                schema: "log",
                table: "tblAuditTrails");

            migrationBuilder.DropIndex(
                name: "IX_tblAuditTrails_AuditTrailChangedBySystemUserId",
                schema: "log",
                table: "tblAuditTrails");

            migrationBuilder.CreateTable(
                name: "tblOneTimePasswords",
                schema: "dbo",
                columns: table => new
                {
                    OneTimePasswordId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SystemUserId = table.Column<long>(type: "bigint", nullable: false),
                    OneTimePasswordOTP = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OneTimePasswordValidUntil = table.Column<DateTime>(type: "datetime2", maxLength: 20, nullable: true),
                    OneTimePasswordCreatedAt = table.Column<DateTime>(type: "datetime2", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblOneTimePasswords", x => x.OneTimePasswordId);
                    table.ForeignKey(
                        name: "FK_tblOneTimePasswords_tblSystemUsers_SystemUserId",
                        column: x => x.SystemUserId,
                        principalSchema: "dbo",
                        principalTable: "tblSystemUsers",
                        principalColumn: "SystemUserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tblOneTimePasswords_SystemUserId",
                schema: "dbo",
                table: "tblOneTimePasswords",
                column: "SystemUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblOneTimePasswords",
                schema: "dbo");

            migrationBuilder.CreateIndex(
                name: "IX_tblAuditTrails_AuditTrailChangedBySystemUserId",
                schema: "log",
                table: "tblAuditTrails",
                column: "AuditTrailChangedBySystemUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_tblAuditTrails_tblSystemUsers_AuditTrailChangedBySystemUserId",
                schema: "log",
                table: "tblAuditTrails",
                column: "AuditTrailChangedBySystemUserId",
                principalSchema: "dbo",
                principalTable: "tblSystemUsers",
                principalColumn: "SystemUserId");
        }
    }
}
