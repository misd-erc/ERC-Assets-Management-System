using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class MigrationTest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SystemUserFirstName",
                schema: "dbo",
                table: "tblSystemUsers",
                newName: "SystemUserFirstNames");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SystemUserFirstNames",
                schema: "dbo",
                table: "tblSystemUsers",
                newName: "SystemUserFirstName");
        }
    }
}
