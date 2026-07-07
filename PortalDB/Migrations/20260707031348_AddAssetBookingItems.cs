using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddAssetBookingItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblAssetBookingItems",
                schema: "asset",
                columns: table => new
                {
                    AssetBookingItemId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AssetBookingItemGroup = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    SupplyIARId = table.Column<long>(type: "bigint", nullable: true),
                    DeliveryRecordId = table.Column<long>(type: "bigint", nullable: true),
                    DeliveryRecordItemId = table.Column<long>(type: "bigint", nullable: true),
                    AssetBookingItemUnitSequence = table.Column<int>(type: "int", nullable: true),
                    PTACategoryId = table.Column<long>(type: "bigint", nullable: true),
                    AssetBookingItemCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssetBookingItemDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssetBookingItemSpecification = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplyUnitId = table.Column<long>(type: "bigint", nullable: true),
                    AssetBookingItemQuantity = table.Column<int>(type: "int", nullable: true),
                    AssetBookingItemUnitCost = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    AssetBookingItemReorderPoint = table.Column<int>(type: "int", nullable: true),
                    SupplyStorageLocationId = table.Column<long>(type: "bigint", nullable: true),
                    SupplyVendorId = table.Column<long>(type: "bigint", nullable: true),
                    AssetBookingItemDeliveryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AssetBookingItemSuggestedPropertyNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssetBookingItemStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    AssetBookingItemBookedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AssetBookingItemBookedBySystemUserId = table.Column<long>(type: "bigint", nullable: true),
                    FinalizedSupplyItemId = table.Column<long>(type: "bigint", nullable: true),
                    FinalizedPTAId = table.Column<long>(type: "bigint", nullable: true),
                    AssetBookingItemIsActive = table.Column<bool>(type: "bit", nullable: false),
                    AssetBookingItemIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    AssetBookingItemCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblAssetBookingItems", x => x.AssetBookingItemId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tblAssetBookingItems_SupplyIARId",
                schema: "asset",
                table: "tblAssetBookingItems",
                column: "SupplyIARId");

            migrationBuilder.CreateIndex(
                name: "IX_tblAssetBookingItems_DeliveryRecordItemId",
                schema: "asset",
                table: "tblAssetBookingItems",
                column: "DeliveryRecordItemId");

            migrationBuilder.CreateIndex(
                name: "IX_tblAssetBookingItems_Group_Status",
                schema: "asset",
                table: "tblAssetBookingItems",
                columns: new[] { "AssetBookingItemGroup", "AssetBookingItemStatus" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblAssetBookingItems",
                schema: "asset");
        }
    }
}
