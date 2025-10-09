using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedTblSystemUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_tblAuditTrails_tblSystemUsers_SystemUserId",
                schema: "dbo",
                table: "tblAuditTrails");

            migrationBuilder.DropIndex(
                name: "IX_tblAuditTrails_SystemUserId",
                schema: "dbo",
                table: "tblAuditTrails");

            migrationBuilder.DropColumn(
                name: "SystemUserId",
                schema: "dbo",
                table: "tblAuditTrails");

            migrationBuilder.CreateIndex(
                name: "IX_tblAuditTrails_AuditTrailChangedBySystemUserId",
                schema: "dbo",
                table: "tblAuditTrails",
                column: "AuditTrailChangedBySystemUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_tblAuditTrails_tblSystemUsers_AuditTrailChangedBySystemUserId",
                schema: "dbo",
                table: "tblAuditTrails",
                column: "AuditTrailChangedBySystemUserId",
                principalSchema: "dbo",
                principalTable: "tblSystemUsers",
                principalColumn: "SystemUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_tblAuditTrails_tblSystemUsers_AuditTrailChangedBySystemUserId",
                schema: "dbo",
                table: "tblAuditTrails");

            migrationBuilder.DropIndex(
                name: "IX_tblAuditTrails_AuditTrailChangedBySystemUserId",
                schema: "dbo",
                table: "tblAuditTrails");

            migrationBuilder.AddColumn<long>(
                name: "SystemUserId",
                schema: "dbo",
                table: "tblAuditTrails",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.CreateIndex(
                name: "IX_tblAuditTrails_SystemUserId",
                schema: "dbo",
                table: "tblAuditTrails",
                column: "SystemUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_tblAuditTrails_tblSystemUsers_SystemUserId",
                schema: "dbo",
                table: "tblAuditTrails",
                column: "SystemUserId",
                principalSchema: "dbo",
                principalTable: "tblSystemUsers",
                principalColumn: "SystemUserId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
