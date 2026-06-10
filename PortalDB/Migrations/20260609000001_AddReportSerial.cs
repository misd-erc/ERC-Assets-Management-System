using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PortalDB.Services;

#nullable disable

namespace PortalDB.Migrations
{
    [DbContext(typeof(PortalDbContext))]
    [Migration("20260609000001_AddReportSerial")]
    public partial class AddReportSerial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(name: "asset");

            migrationBuilder.CreateTable(
                name: "tblReportSerials",
                schema: "asset",
                columns: table => new
                {
                    ReportSerialId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ReportSerialName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReportSerialNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReportSerialMonth = table.Column<int>(type: "int", nullable: false),
                    ReportSerialYear = table.Column<int>(type: "int", nullable: false),
                    ReportSerialSeries = table.Column<int>(type: "int", nullable: false),
                    ReportSerialCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblReportSerials", x => x.ReportSerialId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblReportSerials",
                schema: "asset");
        }
    }
}
