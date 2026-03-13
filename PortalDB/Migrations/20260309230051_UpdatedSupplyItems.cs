using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedSupplyItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "SupplyIARId",
                schema: "asset",
                table: "tblSupplyItems",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryRecordItemCode",
                schema: "asset",
                table: "tblDeliveryRecordItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeliveryRecordItemCurrentStock",
                schema: "asset",
                table: "tblDeliveryRecordItems",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeliveryRecordItemReorderPoint",
                schema: "asset",
                table: "tblDeliveryRecordItems",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "SupplyStorageLocationId",
                schema: "asset",
                table: "tblDeliveryRecordItems",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "SupplyVendorId",
                schema: "asset",
                table: "tblDeliveryRecordItems",
                type: "bigint",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SupplyIARId",
                schema: "asset",
                table: "tblSupplyItems");

            migrationBuilder.DropColumn(
                name: "DeliveryRecordItemCode",
                schema: "asset",
                table: "tblDeliveryRecordItems");

            migrationBuilder.DropColumn(
                name: "DeliveryRecordItemCurrentStock",
                schema: "asset",
                table: "tblDeliveryRecordItems");

            migrationBuilder.DropColumn(
                name: "DeliveryRecordItemReorderPoint",
                schema: "asset",
                table: "tblDeliveryRecordItems");

            migrationBuilder.DropColumn(
                name: "SupplyStorageLocationId",
                schema: "asset",
                table: "tblDeliveryRecordItems");

            migrationBuilder.DropColumn(
                name: "SupplyVendorId",
                schema: "asset",
                table: "tblDeliveryRecordItems");
        }
    }
}
