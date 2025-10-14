using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddedErrorLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblErrorLogs",
                schema: "log",
                columns: table => new
                {
                    ErrorLogId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ErrorLogController = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    ErrorLogLine = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    ErrorLogDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ErrorLogCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblErrorLogs", x => x.ErrorLogId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblErrorLogs",
                schema: "log");
        }
    }
}
