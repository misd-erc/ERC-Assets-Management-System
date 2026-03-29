using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class UodateTblSupplyVendor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SupplyVendeeName",
                schema: "asset",
                table: "tblSupplyVendors",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SupplyVendorAddress",
                schema: "asset",
                table: "tblSupplyVendors",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SupplyVendorContactNumber",
                schema: "asset",
                table: "tblSupplyVendors",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SupplyVendorContactPerson",
                schema: "asset",
                table: "tblSupplyVendors",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SupplyVendorEmail",
                schema: "asset",
                table: "tblSupplyVendors",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SupplyVendeeName",
                schema: "asset",
                table: "tblSupplyVendors");

            migrationBuilder.DropColumn(
                name: "SupplyVendorAddress",
                schema: "asset",
                table: "tblSupplyVendors");

            migrationBuilder.DropColumn(
                name: "SupplyVendorContactNumber",
                schema: "asset",
                table: "tblSupplyVendors");

            migrationBuilder.DropColumn(
                name: "SupplyVendorContactPerson",
                schema: "asset",
                table: "tblSupplyVendors");

            migrationBuilder.DropColumn(
                name: "SupplyVendorEmail",
                schema: "asset",
                table: "tblSupplyVendors");
        }
    }
}
