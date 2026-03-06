using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTblIAR : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SupplySupplyVendorId",
                schema: "asset",
                table: "tblSupplyIARs",
                newName: "SupplyVendorId");

            migrationBuilder.RenameColumn(
                name: "SupplyOfficeId",
                schema: "asset",
                table: "tblSupplyIARs",
                newName: "OfficeId");

            migrationBuilder.RenameColumn(
                name: "SupplyDivisionId",
                schema: "asset",
                table: "tblSupplyIARs",
                newName: "DivisionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SupplyVendorId",
                schema: "asset",
                table: "tblSupplyIARs",
                newName: "SupplySupplyVendorId");

            migrationBuilder.RenameColumn(
                name: "OfficeId",
                schema: "asset",
                table: "tblSupplyIARs",
                newName: "SupplyOfficeId");

            migrationBuilder.RenameColumn(
                name: "DivisionId",
                schema: "asset",
                table: "tblSupplyIARs",
                newName: "SupplyDivisionId");
        }
    }
}
