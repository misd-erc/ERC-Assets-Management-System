using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddPrecisionToProceedAmount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SupplyVendeeName",
                schema: "asset",
                table: "tblSupplyVendors");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SupplyVendeeName",
                schema: "asset",
                table: "tblSupplyVendors",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
