using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "log");

            migrationBuilder.EnsureSchema(
                name: "dbo");

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
                    AuditTrailChangedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblAuditTrails", x => x.AuditTrailId);
                });

            migrationBuilder.CreateTable(
                name: "tblErrorLogs",
                schema: "log",
                columns: table => new
                {
                    ErrorLogId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ErrorLogFile = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    ErrorLogLine = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    ErrorLogDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ErrorLogCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblErrorLogs", x => x.ErrorLogId);
                });

            migrationBuilder.CreateTable(
                name: "tblOffices",
                schema: "dbo",
                columns: table => new
                {
                    OfficeId = table.Column<long>(type: "bigint", nullable: false),
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
                    SystemUserSystemRoleId = table.Column<long>(type: "bigint", nullable: true),
                    SystemUserStatus = table.Column<long>(type: "bigint", nullable: false),
                    SystemUserIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SystemUserCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SystemUserLastLoginAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSystemUsers", x => x.SystemUserId);
                });

            migrationBuilder.CreateTable(
                name: "tblSystemUserStatuses",
                schema: "dbo",
                columns: table => new
                {
                    SystemUserStatusId = table.Column<long>(type: "bigint", nullable: false),
                    SystemUserStatusName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SystemUserCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSystemUserStatuses", x => x.SystemUserStatusId);
                });

            migrationBuilder.CreateTable(
                name: "tblDivisions",
                schema: "dbo",
                columns: table => new
                {
                    DivisionId = table.Column<long>(type: "bigint", nullable: false),
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
                name: "tblOneTimePasswords",
                schema: "dbo",
                columns: table => new
                {
                    OneTimePasswordId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SystemUserId = table.Column<long>(type: "bigint", nullable: false),
                    OneTimePasswordOTP = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OneTimePasswordValidUntil = table.Column<DateTime>(type: "datetime2", nullable: true),
                    OneTimePasswordCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
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
                name: "IX_tblDivisions_OfficeId",
                schema: "dbo",
                table: "tblDivisions",
                column: "OfficeId");

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
                name: "tblAuditTrails",
                schema: "log");

            migrationBuilder.DropTable(
                name: "tblDivisions",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "tblErrorLogs",
                schema: "log");

            migrationBuilder.DropTable(
                name: "tblOneTimePasswords",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "tblSystemUserStatuses",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "tblOffices",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "tblSystemUsers",
                schema: "dbo");
        }
    }
}
