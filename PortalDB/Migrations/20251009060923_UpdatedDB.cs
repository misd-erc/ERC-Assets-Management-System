using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedDB : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "SystemUserLastName",
                schema: "dbo",
                table: "tblSystemUsers",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(byte[]),
                oldType: "varbinary(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "SystemUserFirstName",
                schema: "dbo",
                table: "tblSystemUsers",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(byte[]),
                oldType: "varbinary(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "SystemUserEmail",
                schema: "dbo",
                table: "tblSystemUsers",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(byte[]),
                oldType: "varbinary(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "MicrosoftEntraId",
                schema: "dbo",
                table: "tblSystemUsers",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(byte[]),
                oldType: "varbinary(max)",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "tblAuditTrails",
                schema: "dbo",
                columns: table => new
                {
                    AuditTrailId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AuditTrailTableName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AuditTrailRecordId = table.Column<long>(type: "bigint", nullable: true),
                    AuditTrailAction = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    AuditTrailChanges = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    AuditTrailChangedBySystemUserId = table.Column<long>(type: "bigint", nullable: true),
                    SystemUserId = table.Column<long>(type: "bigint", nullable: false),
                    AuditTrailChangedAt = table.Column<DateTime>(type: "datetime2", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblAuditTrails", x => x.AuditTrailId);
                    table.ForeignKey(
                        name: "FK_tblAuditTrails_tblSystemUsers_SystemUserId",
                        column: x => x.SystemUserId,
                        principalSchema: "dbo",
                        principalTable: "tblSystemUsers",
                        principalColumn: "SystemUserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tblAuditTrails_SystemUserId",
                schema: "dbo",
                table: "tblAuditTrails",
                column: "SystemUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblAuditTrails",
                schema: "dbo");

            migrationBuilder.AlterColumn<byte[]>(
                name: "SystemUserLastName",
                schema: "dbo",
                table: "tblSystemUsers",
                type: "varbinary(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<byte[]>(
                name: "SystemUserFirstName",
                schema: "dbo",
                table: "tblSystemUsers",
                type: "varbinary(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<byte[]>(
                name: "SystemUserEmail",
                schema: "dbo",
                table: "tblSystemUsers",
                type: "varbinary(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<byte[]>(
                name: "MicrosoftEntraId",
                schema: "dbo",
                table: "tblSystemUsers",
                type: "varbinary(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);
        }
    }
}
