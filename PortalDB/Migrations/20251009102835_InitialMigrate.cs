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
                name: "log");

            migrationBuilder.EnsureSchema(
                name: "dbo");

            migrationBuilder.CreateTable(
                name: "tblOffices",
                schema: "dbo",
                columns: table => new
                {
                    OfficeId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OfficeName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    OfficeAcronym = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblOffices", x => x.OfficeId);
                });

            migrationBuilder.CreateTable(
                name: "tblSystemUsers",
                schema: "dbo",
                columns: table => new
                {
                    SystemUserId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MicrosoftEntraId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SystemUserFirstName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SystemUserLastName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SystemUserEmail = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SystemUserIsActive = table.Column<bool>(type: "bit", maxLength: 1, nullable: false),
                    SystemUserCreatedAt = table.Column<DateTime>(type: "datetime2", maxLength: 20, nullable: false),
                    SystemUserLastLoginAt = table.Column<DateTime>(type: "datetime2", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSystemUsers", x => x.SystemUserId);
                });

            migrationBuilder.CreateTable(
                name: "tblDivisions",
                schema: "dbo",
                columns: table => new
                {
                    DivisionId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OfficeId = table.Column<long>(type: "bigint", nullable: false),
                    DivisionName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DivisionAcronym = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblDivisions", x => x.DivisionId);
                    table.ForeignKey(
                        name: "FK_tblDivisions_tblOffices_OfficeId",
                        column: x => x.OfficeId,
                        principalSchema: "dbo",
                        principalTable: "tblOffices",
                        principalColumn: "OfficeId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tblAuditTrails",
                schema: "log",
                columns: table => new
                {
                    AuditTrailId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AuditTrailTableName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AuditTrailRecordId = table.Column<long>(type: "bigint", nullable: true),
                    AuditTrailAction = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    AuditTrailChanges = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    AuditTrailChangedBySystemUserId = table.Column<long>(type: "bigint", nullable: true),
                    AuditTrailChangedAt = table.Column<DateTime>(type: "datetime2", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblAuditTrails", x => x.AuditTrailId);
                    table.ForeignKey(
                        name: "FK_tblAuditTrails_tblSystemUsers_AuditTrailChangedBySystemUserId",
                        column: x => x.AuditTrailChangedBySystemUserId,
                        principalSchema: "dbo",
                        principalTable: "tblSystemUsers",
                        principalColumn: "SystemUserId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_tblAuditTrails_AuditTrailChangedBySystemUserId",
                schema: "log",
                table: "tblAuditTrails",
                column: "AuditTrailChangedBySystemUserId");

            migrationBuilder.CreateIndex(
                name: "IX_tblDivisions_OfficeId",
                schema: "dbo",
                table: "tblDivisions",
                column: "OfficeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblAuditTrails",
                schema: "log");

            migrationBuilder.DropTable(
                name: "tblDivisions",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "tblSystemUsers",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "tblOffices",
                schema: "dbo");
        }
    }
}
