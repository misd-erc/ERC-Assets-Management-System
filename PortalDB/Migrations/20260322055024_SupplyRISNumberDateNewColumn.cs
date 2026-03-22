using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class SupplyRISNumberDateNewColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SupplyItemCurrentStock",
                schema: "asset",
                table: "tblSupplyItems");

            migrationBuilder.DropColumn(
                name: "DeliveryRecordItemCurrentStock",
                schema: "asset",
                table: "tblDeliveryRecordItems");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SupplyItemCurrentStock",
                schema: "asset",
                table: "tblSupplyItems",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeliveryRecordItemCurrentStock",
                schema: "asset",
                table: "tblDeliveryRecordItems",
                type: "int",
                nullable: true);
        }
    }
}
