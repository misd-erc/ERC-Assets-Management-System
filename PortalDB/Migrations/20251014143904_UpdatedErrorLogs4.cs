using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedErrorLogs4 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ErrorLogController",
                schema: "log",
                table: "tblErrorLogs",
                newName: "ErrorLogFile");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ErrorLogFile",
                schema: "log",
                table: "tblErrorLogs",
                newName: "ErrorLogController");
        }
    }
}
