using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddedActivityLogsTbl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblActivityLogs",
                schema: "log",
                columns: table => new
                {
                    ActivityLogId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActivityLogSpecificAction = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ActivityLogConnectedAuditTrailId = table.Column<long>(type: "bigint", nullable: true),
                    ActivityLogActionBy = table.Column<long>(type: "bigint", nullable: true),
                    ActivityLogCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblActivityLogs", x => x.ActivityLogId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblActivityLogs",
                schema: "log");
        }
    }
}
