using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedOfficeAndPTACategCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PTAGeneralCode",
                schema: "asset",
                table: "tblPTACategories",
                type: "nvarchar(15)",
                maxLength: 15,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OfficeGeneralCode",
                schema: "dbo",
                table: "tblOffices",
                type: "nvarchar(15)",
                maxLength: 15,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PTAGeneralCode",
                schema: "asset",
                table: "tblPTACategories");

            migrationBuilder.DropColumn(
                name: "OfficeGeneralCode",
                schema: "dbo",
                table: "tblOffices");
        }
    }
}
